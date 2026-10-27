# C02 guide v0.1.0

Native `<azr-guide>`, Shadow DOM, eigenständiger ESM-Build. Vertrag und Ereignisse: manifest.json. Umfang und Akzeptanz: /deliveries/D2-C02.md. Demo: demo/index.html. Rechte: RIGHTS.md. Keine privaten Originaldaten.

Build: npm install --ignore-scripts, dann npm run build. Tests: npm test mit installiertem Playwright-Chromium; alternativ PLAYWRIGHT_MODULE und PLAYWRIGHT_EXECUTABLE_PATH auf vorhandene Testwerkzeuge setzen. Tests arbeiten ohne App-Shell und ausschließlich mit synthetischen Daten.


Optional `compact=true` keeps both location choices together on narrow screens. `showShortcuts=false` lets a host supply a single next action.
