# Laktoseintoleranz – Website

Semesterprojekt Biologie, Klasse 11.

## Was liegt wo?

- `public/index.html` – die komplette Website
- `netlify/functions/rekord.mjs` – kleiner Server für den Website-Rekord im Karten-Quiz
- `netlify.toml` – sagt Netlify, wo die Website und der Server liegen
- `package.json` – nötige Bibliothek für den Server (Netlify Blobs)

## Website ändern

Neue Version von `index.html` im Ordner `public` auf GitHub hochladen
(„Add file“ → „Upload files“ im Ordner `public`). Netlify veröffentlicht sie danach automatisch.

## Website-Rekord zurücksetzen

Bei Netlify unter „Blobs“ im Speicher `karten-quiz` den Eintrag `rekord` löschen.
