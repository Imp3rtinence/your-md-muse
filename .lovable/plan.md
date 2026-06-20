# Plan: App veröffentlichen & auf dem Handy installierbar machen

Ziel: Deine Testuser öffnen einen Link am Handy, tippen "Zum Home-Bildschirm" und haben die App als Icon — ohne App Store.

## 1. PWA-Basics (Manifest-only, kein Service Worker)

Wir bleiben bei der minimalen, sicheren Variante (kein Offline-Modus, kein SW im Lovable-Preview → keine Cache-Probleme).

- `public/manifest.webmanifest` anlegen mit:
  - `name`, `short_name`, `theme_color`, `background_color`
  - `display: "standalone"`, `start_url: "/"`, `scope: "/"`
  - Icons: 192×192 und 512×512 (plus `purpose: "maskable"` für Android)
- App-Icon generieren (zwei PNGs unter `public/icons/`)
- In `src/routes/__root.tsx` head-Tags ergänzen:
  - `<link rel="manifest" href="/manifest.webmanifest">`
  - `<meta name="theme-color">`
  - `<link rel="apple-touch-icon">` (180×180 für iOS)
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-title">`

## 2. Hydration-Fix für AdSense

Der `<ins class="adsbygoogle">` in `AdSlot.tsx` verursacht einen Hydration-Mismatch (AdSense mutiert das DOM vor React). Lösung: nur clientseitig rendern (mounted-Flag), damit der Server nichts ausliefert, was AdSense danach umschreibt.

## 3. SEO / Share-Metadaten prüfen

Vor dem Publish sicherstellen, dass `__root.tsx` korrekte `title`, `description`, `og:*` und `twitter:*` Tags hat — sonst sieht der WhatsApp-Link für Tester nicht gut aus.

## 4. Security-Scan + Publish

- `security--run_security_scan` laufen lassen
- Bei 0 kritischen Findings: `preview_ui--publish` → liefert `…lovable.app` URL
- Sichtbarkeit auf **public** stellen (`publish_settings--update_visibility`), sonst kommen Tester ohne Workspace-Zugang nicht rein

## 5. Anleitung für deine Tester (gibst du weiter)

**iPhone (Safari):**
1. Link öffnen in **Safari** (nicht Chrome/In-App-Browser!)
2. Teilen-Button → "Zum Home-Bildschirm"
3. App-Icon erscheint, startet ohne Browser-UI

**Android (Chrome):**
1. Link in Chrome öffnen
2. Menü (⋮) → "App installieren" / "Zum Startbildschirm"
3. Icon erscheint, App startet standalone

## 6. Optional später

- Eigene Domain (`app.deinedomain.de`) via Project Settings → Domains
- Echtes Offline/Service-Worker erst, wenn du es wirklich brauchst (separater Schritt, weil komplexer)

---

Soll ich loslegen? Ich brauche von dir nur:
- **App-Name** (z. B. "Aura") + **Short Name** (max. 12 Zeichen, fürs Icon-Label)
- **Theme-Farbe** (Hex, z. B. `#0F172A`) — falls du keine sagst, nehme ich deine bestehende Primary-Farbe
- Soll ich ein App-Icon **generieren** oder hast du ein Logo, das ich verwenden soll?
