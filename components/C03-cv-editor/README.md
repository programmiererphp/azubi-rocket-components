# C03 cv-editor v0.1.0

Native `<azr-cv-editor>`, Shadow DOM, eigenständiger ESM-Build. Vertrag und Ereignisse: manifest.json. Umfang und Akzeptanz: /deliveries/D3-C03.md. Demo: demo/index.html. Rechte: RIGHTS.md. Keine privaten Originaldaten.

Build: npm install --ignore-scripts, dann npm run build. Tests: npm test mit installiertem Playwright-Chromium; alternativ PLAYWRIGHT_MODULE und PLAYWRIGHT_EXECUTABLE_PATH auf vorhandene Testwerkzeuge setzen. Tests arbeiten ohne App-Shell und ausschließlich mit synthetischen Daten.

## Applicant outcome update
Optional documentLanguage:de/en/fr/ru/null (defaultnull follows UI). Separate output/preview headings from UI; free applicant text is never translated automatically. German level is also accessible from Personal.
