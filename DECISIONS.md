# Entscheidungen

2026-10-21: Nutzer bestätigt den Masterflow und fordert die vollständige, geführte Schrittanzeige in allen Teilansichten, ausdrücklich auch ab Schritt 5. Er bittet um möglichst selbstständige Fortsetzung. Keine erneute pauschale Designfreigabe einholen; diese konkrete Korrektur ist verbindlich.

Eine zentrale native C01-Komponente hält alle sechs Schritte sichtbar, Desktop sechs Spalten, mobil zwei Zeilen. Route/Entwurfsdaten gehören der Shell. Die Detailgrafiken konkretisieren den freigegebenen Stil; Verträge/SPEC bestimmen Zahlen, Zustände und Umfang. Adminansichten verwenden eigene Navigation. Bestand, ursprüngliche Produktion und Serverdaten bleiben geschützt; öffentliche Demos enthalten nur neu geschriebene Logik und synthetische Fixtures.

Öffentliche Komponenten sind zur Nutzung durch die App des Repositoryinhabers vorgesehen. Es wird keine zusätzliche Dritt-Lizenz gewährt; die Rechteentscheidung bleibt beim Repositoryinhaber. Keine fremden Fonts/Medien oder Legacy-Bundles öffentlich kopieren.

- C01 v0.1.0: eigener deterministischer ESM-Build, 11.642 Bytes; keine Laufzeitabhängigkeit. Browser plugin not available; lokaler Chromium-Download lieferte ungültiges ZIP. Isolierte Playwright-Prüfung deshalb in GitHub Actions mit echtem Chromium, keine simulierten Testresultate. Öffentliche GitHub-Pages-Demo im Cloud-Browser zusätzlich geprüft.
