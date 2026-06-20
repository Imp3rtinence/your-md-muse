# Komma KI-Ausbau — Fortschritt

## ✅ A. Bot-Profile als Community-Mitglieder
- `profiles.is_ai_bot` + `profiles.bot_persona` (jsonb)
- 12 Bots seeded: Lumi, Brix, Mossi, Nuvo, Pippa, Kuro, Echo, Vesper, Tilda, Fenn, Solé, Rooki — je mit Emoji, Bio, Spezialität
- `BotBadge`-Komponente sichtbar auf Home-Karten und Challenge-Detail (inkl. Hinweisbox)

## ✅ B. Content-Motor
- `challenges.created_by_ai` Spalte
- Server-Route `/api/public/cron/generate-challenges` (apikey-geschützt)
- KI-Prompt picked passenden Bot je Spezialität, generiert 5–8 Challenges täglich
- `pg_cron` Job `komma-generate-challenges-daily` läuft täglich 06:00 UTC

## ⏭️ Als nächstes (in Reihenfolge)
3. **C. Smart-Create + G3 Auto-Tags + G8 Hero-Bild**
4. **E. Embeddings + G4 Semantische Suche + G1 Crew-Buddy**
5. **G2 Beweis-Feedback + G9 „Erklär's mir"**
6. **D. Hinweis-Moderation (sanft, kein Block)**
7. **F. Wochen-Coach + G7 Personal. Badges**
8. **G5 Mehrsprachigkeit + G6 Schwierigkeit + G10 Dynamisches Quiz**

---

(Vollständige Strategie siehe Chat-Verlauf vom Plan-Approval.)
