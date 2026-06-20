
# KI-Strategie für Komma

Ziel: Die App lernt aus dem Onboarding und dem Verhalten der Nutzer:innen, erzeugt automatisch passenden Content (Challenges), schlägt persönliche Aktionen vor und hält die Community sicher. Alle KI-Aufrufe laufen serverseitig über das Lovable AI Gateway (kein API-Key nötig). Standardmodell: `google/gemini-3-flash-preview` (schnell, günstig), für seltene anspruchsvolle Aufgaben `google/gemini-2.5-pro`.

## 1. Was die KI im Hintergrund lernt

Aus dem Onboarding-Quiz (Interessen + Kontext) und laufendem Verhalten (erstellte/abgeschlossene Challenges, Crews, Kategorien, Tageszeit, Likes) bauen wir ein **User-Profil-Vektor**:

- Interessen-Gewichte (Bewegung, Kreativität, Lernen, Soziales, Natur, …)
- Kontext (Schule, Sport, Nachbarschaft, Familie)
- Schwierigkeitslevel (anhand abgeschlossener Challenges)
- Aktivitätsmuster (wann macht die Person mit)

Speicherung: neue Tabelle `user_ai_profile` (jsonb `traits`, `embeddings vector(1536)`, `updated_at`). Re-Embedding nach jedem Onboarding-Update und alle ~20 Aktionen.

## 2. Sechs konkrete KI-Bausteine

### A. Onboarding-Auswertung (sofort nutzbar)
Nach dem Quiz ruft ein Server-Function `analyzeOnboarding` Gemini auf:
- Input: Interessen + Kontext + Alter (falls vorhanden)
- Output (strukturiert via `Output.object`): `summary`, `top_categories[]`, `suggested_challenges[3]`, `suggested_crew_kinds[]`
- Ergebnis wird in `user_ai_profile.traits` gespeichert und auf der Home-Seite als „Für dich gestartet" angezeigt.

### B. Automatischer Challenge-Generator (Content-Motor)
Cron-Job (pg_cron) ruft täglich `/api/public/cron/generate-challenges` auf:
- Erzeugt 5–10 neue öffentliche Challenges pro Kategorie, abgestimmt auf häufigste Interessen der aktiven Nutzer:innen
- KI liefert: Titel, Beschreibung, Kategorie, Dauer, Schwierigkeit, Beweis-Typ (Foto/Video/Text), Sicherheits-Check
- Markierung als `created_by_ai = true` (neue Spalte) → transparent für Nutzer:innen

### C. Personalisierte Vorschläge auf Home
Server-Function `recommendChallenges` (bei jedem Home-Load):
- Mischt: trendende Challenges + KI-Vorschläge auf Basis von Profil-Embedding
- Vector-Search via pgvector (Cosine-Similarity zwischen User- und Challenge-Embedding)
- Erklärung pro Karte: „weil du Kreativität magst"

### D. Smart-Create-Assistent
Im „Challenge erstellen"-Flow ein Button **„Mit KI ausarbeiten"**:
- Nutzer gibt Stichwort ein → KI schlägt Titel, Beschreibung, Hashtags, geeignete Crew vor
- Verbessert Qualität und Vollständigkeit selbst erstellter Challenges

### E. Auto-Moderation (Safety)
Vor jedem Insert in `challenges` und `direct_messages`:
- KI-Klassifikation (strukturiert: `safe`, `risky`, `block` + Begründung)
- `block` → Insert wird abgelehnt, Nutzer sieht freundliche Meldung
- `risky` → wird zur Sichtung gequeued (`moderation_queue` Tabelle)
- Besonders wichtig wegen junger Zielgruppe (Hilda!)

### F. Wöchentlicher KI-Coach
Sonntags eine personalisierte Push/E-Mail-Zusammenfassung pro User:
- „Diese Woche: 3 Challenges, +120 Aura, Liga aufgestiegen"
- KI-Vorschlag für nächste Woche („Probier mal etwas aus Kategorie Natur")
- Tonalität jugendlich, motivierend, kein Druck

## 3. Reihenfolge der Umsetzung (Phasen)

**Phase 1 — Onboarding nutzt KI (Baustein A)**
- Tabelle `user_ai_profile`
- Server-Function `analyzeOnboarding`
- Home-Sektion „Für dich gestartet"

**Phase 2 — Content-Motor (Baustein B)**
- Spalte `created_by_ai` auf `challenges`
- Cron-Endpoint `/api/public/cron/generate-challenges`
- pg_cron-Job (täglich 06:00)
- Admin-Übersicht „KI-Challenges der letzten 7 Tage"

**Phase 3 — Personalisierung & Smart-Create (C + D)**
- pgvector Extension + Embeddings (Tabelle `challenges.embedding`)
- `recommendChallenges` Server-Function
- „Mit KI ausarbeiten"-Button im Create-Flow

**Phase 4 — Sicherheit & Coach (E + F)**
- Moderations-Middleware bei Insert
- Wöchentlicher Coach-Job

## 4. Technische Details

- **Gateway**: `@ai-sdk/openai-compatible` → `https://ai.gateway.lovable.dev/v1`, Header `Lovable-API-Key: $LOVABLE_API_KEY`
- **Strukturierte Outputs**: `generateText({ output: Output.object({ schema: z... }) })`
- **Embeddings**: `google/gemini-embedding-001`, pgvector `vector(3072)` mit HNSW-Index
- **Server-Boundary**: alle Aufrufe in `createServerFn` (`src/lib/ai/*.functions.ts`) bzw. öffentlichen Routen unter `src/routes/api/public/cron/*` (HMAC-geschützt)
- **Cron**: pg_cron ruft die `project--<id>.lovable.app`-URL mit Secret-Header auf
- **Kosten**: Gemini-Flash ist günstig; Content-Generator läuft 1×/Tag, Moderation pro Insert (~ms-Latenz)

## 5. Was sich für die Nutzer:innen ändert

- Nach dem Quiz sofort 3 passende Vorschläge statt leerer Home
- Täglich neuer, abwechslungsreicher Content — auch wenn die Community klein ist
- „Mit KI ausarbeiten" hilft, gute Challenges zu formulieren
- Geschützter Raum durch automatische Moderation
- Wöchentlicher Rückblick motiviert zum Dranbleiben

## 6. Frage an dich

Soll ich mit **Phase 1 (Onboarding-Auswertung + erste KI-Vorschläge auf Home)** starten? Das ist der schnellste sichtbare Win und legt das Profil-Fundament für alles weitere.
