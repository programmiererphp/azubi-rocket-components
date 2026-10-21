# C01 · Schrittnavigation v0.1.0

Eigenständiges natives Web Component mit Shadow DOM. Sechs beschriftete Schritte sind immer sichtbar: Orientierung, Vorbereitung, Lebenslauf, Firmen, Anschreiben und Start. Desktop: sechs Spalten; bis 640px: zwei Reihen mit je drei Schritten. Keine Laufzeitabhängigkeiten, Datenablage, KI oder Backendaufrufe.

```html
<script type="module" src="./dist/index.js"></script>
<azr-journey-nav language="de" current-step="1"></azr-journey-nav>
```

Der Host setzt komplexe Daten über `element.state = {currentStep:5, completedSteps:[1,2,3,4], availableSteps:[1,2,3,4,5,6]}`. Zahlen sind 1..6, Arrays enthalten eindeutige Werte und der aktuelle Schritt muss verfügbar sein. Ungültige Zustände werfen TypeError ohne Zustandsänderung. Ein- und Ausgaben werden kopiert. Übersetzungen stehen separat in `src/locales.js` und werden deterministisch in das eigenständige ESM gebündelt.

`language` akzeptiert de/en/fr/ru; `busy` ist eine Boolean-Property bzw. ein Anwesenheitsattribut (auch `busy="false"` bedeutet true). Attribute sind Eingabekanäle, kein Zustandsabzug; bei Hoststeuerung stets dieselbe Property benutzen. Ungültige Attribute bleiben im DOM, ändern aber den letzten gültigen Zustand nicht und senden `azr:navigation-error`. Das Entfernen von language setzt de, von current-step setzt 1, sofern verfügbar.

`azr:navigate` enthält `{schemaVersion:1,fromStep,toStep,via}`. `via` ist step, keyboard, previous oder next. Events sind bubbles+composed. Der Host entscheidet über den Wechsel und setzt anschließend state. Aktueller/unverfügbarer Schritt und busy senden keine Navigation. Anklicken eines späteren Schrittes markiert vorherige Aufgaben nicht automatisch als erledigt.

Tastatur: Tab/Shift+Tab erreichen alle verfügbaren Schritte und Aktionen; Pfeile links/rechts sowie Home/End bewegen den Fokus innerhalb der Schritte, Enter/Leertaste fragen Navigation an. Der aktuelle Schritt trägt aria-current=step. Fokus bleibt bei Hostaktualisierungen erhalten, solange der fokussierte Button verfügbar ist. Getrennte Instanzen teilen keinen Zustand; Entfernen räumt Listener auf, erneutes Einfügen dupliziert sie nicht.

Demo: `demo/index.html`, über einen HTTP-Server öffnen. Der Demo-Host übernimmt Navigation und bietet Sprachwechsel, Wartezustand, eingeschränkte Schritte, Reset und kopierbares Debug-Log. Diese Teststeuerung ist kein Bestandteil der späteren Nutzeroberfläche. Alle Beispiele sind synthetisch. Designreferenz: AZR-MASTER-FLOW-03.

Build: `npm run build`. Tests: nach Installation der in package.json gepinnten Playwright-Version und eines passenden Chromium `npm test`. Alternativ PLAYWRIGHT_MODULE auf ein vorhandenes Playwright index.mjs setzen und bei Bedarf PLAYWRIGHT_EXECUTABLE_PATH. Tests starten ihren eigenen lokalen HTTP-Server und prüfen denselben dist-Build wie die Demo. Testevidenz enthält echte Browseraufnahmen; keine erzeugten Mockups.

Styling über CSS-Variablen und `::part(navigation)` laut manifest.json. Keine komponentenübergreifenden Imports. Rechte siehe /RIGHTS.md. Noch keine Einbindung in die produktive App.
