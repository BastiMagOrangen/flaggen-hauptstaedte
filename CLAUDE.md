# Flaggen & Hauptstädte

Offlinefähige PWA zum Lernen von Flaggen und Hauptstädten (Deutsch). Next.js 16 mit statischem Export, shadcn/ui, Tailwind 4, TypeScript. Deployt auf GitHub Pages.

## Befehle

- `npm run dev` – Entwicklung
- `npm test` – Vitest (Quiz-Logik in `lib/quiz.test.ts`)
- `npm run lint`, `npm run build` – Build schreibt nach `out/`
- `python tools/build_data.py` – erzeugt `data/countries.json` und `public/flags/*.png` neu (braucht Netz: mledoze/countries, Wikidata, flagcdn)
- `node tools/make_icons.mjs` – erzeugt die App-Icons

Nach Codeänderungen immer `npm test`, `npm run lint` und `npm run build` laufen lassen.

## Aufbau

- `lib/quiz.ts` – reine Logik: Kartenpool, gewichtete Fragenauswahl (Leitner-Boxen), Antwortoptionen, Fortschritt (`mastery`), Import-Validierung. Neue Logik gehört hierher und bekommt einen Test.
- `app/page.tsx` – gesamte UI (Startscreen und Quiz). Zustand in `localStorage` (Key `flag-learn-v1`), die Seite rendert erst nach dem Mounten.
- `public/sw.js` – Service Worker, network-first, cacht beim Installieren alle Flaggen (`public/flags/list.json`).
- `data/countries.json` – generiert, nicht von Hand ändern. Gebiete ohne Hauptstadt haben `capital: null` und kommen nur in Flaggen-Fragen vor.

## Stolperfallen

- **Base-Path:** GitHub Pages liegt unter `/<repo>`. Der Build liest `NEXT_PUBLIC_BASE_PATH` (setzt der Workflow selbst). Lokal bauen ohne Variable. In Git Bash `MSYS_NO_PATHCONV=1` voranstellen, sonst wird `/name` zu einem Windows-Pfad.
- **Lockfile:** `@emnapi/core` und `@emnapi/runtime` stehen absichtlich als devDependencies. Ohne sie scheitert `npm ci` in der Linux-CI, weil das unter Windows erzeugte Lockfile sie auslässt. Nach Dependency-Änderungen prüft nur der CI-Lauf das wirklich.
- **npm audit:** Funde an `braces` haben keinen Patch (alle Versionen betroffen). `shadcn` liegt deshalb in den devDependencies, `npm audit --omit=dev` ist sauber. Kein `--force`.
- **Next 16:** APIs können von älterem Wissen abweichen, relevante Doku liegt in `node_modules/next/dist/docs/`. `next dev` legt `AGENTS.md` neu an, die wir nicht im Repo haben wollen.
- **Test im Browser:** `npm run build`, dann `npx serve out -l 4173`. Der Service Worker läuft nur im Produktionsbuild.

## Version

Quelle ist `version` in `package.json`, `next.config.ts` bettet sie beim Build ein, die Startseite zeigt sie im Footer. Hochzählen mit `npm version <patch|minor|major> --no-git-tag-version` (ohne Flag würde npm selbst committen und taggen), vor einem Release.

## Deploy

Push auf `main` löst `.github/workflows/deploy.yml` aus (Tests, Build, Pages). Seite: https://bastimagorangen.github.io/flaggen-hauptstaedte/

## Konventionen

- Oberfläche auf Deutsch, Code, Bezeichner und Kommentare auf Englisch.
- Bewusste Abkürzungen mit bekannter Grenze bekommen einen `shortcut:`-Kommentar.
- Keine neuen Dependencies für wenige Zeilen Code.
