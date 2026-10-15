# Flaggen & Hauptstädte

PWA zum Lernen von Flaggen und Hauptstädten (Next.js, shadcn/ui, statischer Export für GitHub Pages).

- `npm run dev` – Entwicklung
- `npm test` – Tests der Quiz-Logik
- `python tools/build_data.py` – Länderdaten und Flaggen neu erzeugen (braucht Netz)
- `node tools/make_icons.mjs` – App-Icons neu erzeugen
- Deploy: Push auf `main`, in den Repo-Einstellungen unter Pages die Quelle "GitHub Actions" wählen.

Daten: [mledoze/countries](https://github.com/mledoze/countries) (ODbL), Wikidata, flagcdn.com.
