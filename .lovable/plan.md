
# Komma KI-Ausbau — Gesamtplan

Phase 1 (Onboarding-Analyse) läuft. Hier alles weitere in Reihenfolge. Free Speech bleibt — Moderation nur als sanfter Hinweis, kein Blockieren.

---

## A. KI-Bots als echte Community-Mitglieder ⭐ Grundlage

KI-Challenges werden nicht von „System" gepostet, sondern von echten Bot-Profilen mit eigenem Charakter. So fühlt sich die App lebendig an — auch wenn noch wenig Leute da sind.

**Naming-Convention (verspielt, jugendlich, einprägsam):**
Doppelbuchstaben + Naturwesen / Alltagsding. Beispiele:
`Lumi`, `Nuvo`, `Pippa`, `Kuro`, `Mossi`, `Echo`, `Vesper`, `Onyx`, `Tilda`, `Fenn`, `Wilbur`, `Solé`, `Brix`, `Yuna`, `Rooki`

Jeder Bot bekommt:
- Username & Display-Name aus dem Pool (keine Nummer hinten dran)
- Eigenes Avatar-Emoji + Farbe
- Kurze Bio („Mag Sonnenuntergänge und mutige Ideen 🌅")
- **Eigene „Spezialität"** — z. B. Lumi macht Kreativ-Challenges, Brix Sport, Mossi Natur. Dadurch entstehen wiedererkennbare Persönlichkeiten.
- Auf dem Profil deutlich sichtbar: Badge **„🤖 Community-Bot"** + Hinweistext „Ich bin ein KI-Mitglied von Komma und helfe, Ideen zu streuen."
- In Feeds / Karten **kein** „Bot"-Label am Namen — nur das Avatar-Badge. Wer drauf klickt sieht die volle Info.

**Technisch:** neue Spalte `profiles.is_ai_bot boolean`, `profiles.bot_persona jsonb`. Bots werden per Migration gesät (8–12 Stück mit echten auth-Usern, damit FKs sauber bleiben).

---

## B. Content-Motor (täglich neue Challenges)

- `/api/public/cron/generate-challenges` (HMAC + apikey)
- `pg_cron` jeden Morgen 06:00
- Pro Tag 5–10 Challenges, ein zufälliger Bot ist `creator_id` — passend zu seiner Spezialität
- KI bekommt: häufigste Interessen aus user_ai_profile, Wochentag, Jahreszeit
- Spalte `challenges.created_by_ai = true` (für interne Statistik, optional sichtbar)
- Mini-Admin-Dashboard für dich: Anzahl heute / Woche, Toggle „pausieren"

---

## C. Smart-Create-Assistent

Im Create-Flow neuer Button **„✨ Mit KI ausarbeiten"**:
- User tippt Stichwort
- KI schlägt Titel, Beschreibung, Kategorie, Dauer, Beweistyp vor
- User kann übernehmen / ändern / verwerfen — nichts auto-gespeichert
- Zweiter Button **„✨ Verbessern"** auf vorhandenem Entwurf

---

## D. Hinweis-Moderation (kein Block, kein Queue)

Free Speech. Beim Erstellen einer Challenge / DM läuft ein leichter KI-Check im Hintergrund. Wenn potenziell heikel:
- **Sanfter Hinweis** als Toast / Banner: „Klingt nach einer mutigen Idee — bitte denk an deine Sicherheit. Trotzdem posten?"
- User entscheidet, nichts wird blockiert oder gequeued
- Reports bleiben das einzige harte Eingriffs-Mittel (durch dich/Moderator:innen)
- Trotzdem im Hintergrund Flag `challenges.ai_risk_level` für später, falls du doch mal filtern willst

---

## E. Personalisierung mit Embeddings

- `pgvector` aktivieren
- `challenges.embedding vector(3072)` + HNSW-Index
- `user_ai_profile.interest_embedding vector(3072)` (aus Onboarding-Antworten)
- Beim Embedding nach Insert: serverseitig Gemini-Embedding API
- Home: „Für dich" mixt Trending + Top-Vector-Match
- Challenge-Detail: „Ähnliche Challenges"
- Erklärungs-Chip: „passt zu Kreativität"

---

## F. Wöchentlicher KI-Coach (Sonntag)

- Pro User: kleine Wochen-Zusammenfassung als In-App-Karte auf Home
- „Diese Woche: 3 Challenges, +120 Aura, in Ember-Liga gehalten"
- KI-Vorschlag für nächste Woche („Probier mal etwas in der Natur")
- Tonalität: jugendlich, motivierend, kein Druck
- Cron Sonntag 18:00, schreibt in neue Tabelle `weekly_recaps`

---

## G. Kleinere KI-Bausteine (alle umgesetzt)

1. **KI-Crew-Buddy** — wer keine Crew hat, sieht „Diese öffentlichen Crews passen zu dir" (vector-Match auf Crew-Beschreibung)
2. **Beweis-Feedback** — nach Upload kommt von einem zufälligen Bot ein netter Kommentar („Cool, dass du draussen warst! 🌿")
3. **Auto-Tags für Challenges** — KI ergänzt Hashtags beim Erstellen (sichtbar bevor User speichert)
4. **Semantische Suche** — „Challenges für Regentage" sucht via Embedding, nicht nur Keyword
5. **Mehrsprachigkeit on the fly** — Challenge-Texte werden per KI in Sprache des Users übersetzt (gecached pro Sprache)
6. **Schwierigkeits-Schätzung** — KI labelt Challenges automatisch als „leicht / mittel / mutig"
7. **Personalisierte Badges** — KI erfindet wöchentlich seltene Badges aus echten Mustern („🌅 Frühaufsteher", „🧲 Crew-Builder") und vergibt sie
8. **Hero-Bild pro Challenge** — bei Bot-Challenges und optional bei User-Challenges generiert Nano Banana ein Cover-Bild
9. **„Erklär's mir"-Button** — auf jeder Challenge-Karte; KI erklärt nochmal kindgerecht
10. **Dynamisches Onboarding-Quiz** — statt fixer Fragen erzeugt KI Folgefrage je nach Antwort

---

## Tech-Backbone

- **Gateway:** Lovable AI Gateway (`createLovableAiGatewayProvider`)
- **Modelle:** `gemini-3-flash-preview` Default, `gemini-2.5-flash-image` für Cover, `gemini-embedding-001` für Vektoren, `gemini-2.5-pro` nur für seltene komplexe Tasks
- **Boundary:** alles in `createServerFn` (`src/lib/ai/*.functions.ts`) oder `src/routes/api/public/cron/*`
- **Cron:** `pg_cron` → stabile `project--<id>.lovable.app` URL, Auth via `apikey`-Header (Anon-Key)
- **DB-Erweiterungen:** `pgvector`, `pg_cron`, `pg_net`
- **Neue Tabellen:** `weekly_recaps`, `challenge_translations`, `moderation_flags` (nur als Hinweis-Log)
- **Neue Spalten:** `profiles.is_ai_bot`, `profiles.bot_persona`, `challenges.created_by_ai`, `challenges.embedding`, `challenges.ai_risk_level`, `challenges.difficulty`, `challenges.hero_image_url`, `challenges.tags`, `user_ai_profile.interest_embedding`

---

## Empfohlene Bau-Reihenfolge

1. **A. Bot-Profile + Naming + Migration mit 10 Bots** (Fundament)
2. **B. Content-Motor** (täglich neue Challenges von den Bots — sofort sichtbarer Effekt)
3. **C. Smart-Create + G3 Auto-Tags + G8 Hero-Bild** (Erstell-Erlebnis stark)
4. **E. Embeddings + G4 Semantische Suche + G1 Crew-Buddy** (Personalisierung — braucht etwas Content erstmal)
5. **G2 Beweis-Feedback + G9 Erklär's mir** (kleine Delights)
6. **D. Hinweis-Moderation** (sanfter Layer im Hintergrund)
7. **F. Wochen-Coach + G7 Personal. Badges** (Retention)
8. **G5 Mehrsprachigkeit + G6 Schwierigkeit + G10 Dynamisches Quiz** (Polish)

---

## Bestätigung

Wenn der Plan so passt, baue ich Schritt 1 (**A. Bot-Profile + Naming**) zuerst — also: DB-Felder, Migration mit ~10 Bot-Profilen, sichtbares „🤖 Community-Bot"-Badge auf deren Profilseite. Danach direkt weiter mit B.
