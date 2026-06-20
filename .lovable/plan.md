# Komma KI-Ausbau — Fortschritt

## ✅ Fertig
- **A. Bot-Profile** — 12 Bots mit Namen/Emoji/Bio/Spezialität, sichtbares 🤖-Badge in Feeds und Detail
- **B. Content-Motor** — täglicher pg_cron-Job 06:00 generiert 5–8 Challenges via Bots, jeweils mit Embedding
- **C. Smart-Create** — „✨ Mit KI ausarbeiten" + „Verbessern" im Create-Flow
- **D. Sanfter Moderation-Hinweis** — KI-Risiko-Check beim Posten, fragt nur freundlich nach (kein Block)
- **E. Embeddings + Semantische Suche** — pgvector, `match_challenges`/`match_crews`-RPCs
  - Ähnliche Challenges auf Detailseite
  - Freie Such-Box auf Home
  - Crew-Buddy auf Crews-Seite („Passt zu dir")
- **F. Wöchentlicher KI-Coach** — `weekly_recaps` Tabelle, pg_cron Sonntag 18:00, Karte auf Home
- **G2. Beweis-Feedback** — Bots kommentieren neue Submissions
- **G3. Auto-Tags** — Smart-Create schlägt Hashtags vor
- **G6. Schwierigkeit** — leicht/mittel/mutig im Smart-Create
- **G8. Hero-Bilder** — Nano-Banana Coverbilder optional bei Create
- **G9. Erklär's mir** — Button auf jeder Challenge-Karte

## 🟡 Noch offen (kleinere Polish-Features)
- **G5 Mehrsprachigkeit** — Übersetzen-Button + Cache-Tabelle
- **G7 Personalisierte Badges** — KI erfindet seltene Badges aus Mustern
- **G10 Dynamisches Onboarding-Quiz** — KI-Folgefragen statt fixer Liste

## 🛠 Tech-Backbone
- Lovable AI Gateway (`gemini-3-flash-preview` Default, `gemini-2.5-flash-image`, `text-embedding-3-small@1536`)
- pgvector + HNSW Index
- pg_cron-Jobs: `komma-generate-challenges-daily`, `komma-weekly-coach`
- Server-Routes geschützt via Supabase Anon-apikey Header
