# Roadmap

- [x] P0: Gesamtflow bestätigt, Korrektur vollständiger Navigation dokumentiert.
- [x] P0: C01–C11 modular geplant; Schnittstellen und Liefergrenzen festgelegt.
- [x] P0 D1: C01 implementieren, isoliert Desktop/Mobile testen, öffentliche Demo/Build verifizieren.
- [x] P0 D2: C02 Anleitung mit unveränderter Navigationsintegration.
- [x] P0 D3: C03 CV samt gemeinsamem Unicode-Dokumentmodell und PDF/DOCX.
- [x] P0 D4: C04 Bestandsfirmen-Suche mit ehrlichem Kontaktstatus.
- [x] P0 D5: C05 Anschreiben, Kopieren, Mailto und Exporte.
- [x] P0 D6: C06 FAQ; vollständige bestehende Inhalte übernehmen, veraltete Angaben prüfen.
- [ ] P0: Dünne AI-Studio-Shell aus gepinnten Builds; Staging-E2E und Regression.
- [ ] P1: Dokumentcheck, Quizzes, Stadtguide, Kontaktmodul einzeln.
- [ ] P1: Mini-CMS/XML/Admin und sichere Accounts/Serverdienste als getrennte Erweiterungen.
- [ ] P1: Fehlende historische Formantworten/Device-Daten übernehmen, sofern Zugriff vorliegt.
- [ ] P0 Release: Betreiber-/Rechtstexte, Kostenlimits für tatsächliche KI-Funktionen, Wiederherstellungs-/Rollbacktest, Freigabe für Cutover.

C01: 85/85 isolierte Chromium-Tests (1440x900, 390x844, 320x844); öffentlicher Build bytegenau anonym geprüft. Bereitgestellte Demo mit echtem Cloud-Browser geprüft: Schritte 5/6 funktionieren, sechs Labels sichtbar, keine eigenen Appfehler. Browser-Erweiterungsfehler chrome-extension:// sind separat und stammen nicht aus der App. Zusätzlich 85/85 Tests gegen die öffentliche Pages-URL bestanden (2026-10-21T15:03:34Z). Firefox/Safari und die spätere Hauptanwendung sind noch nicht geprüft.

C02: isoliert 26/26, öffentlich 26/26; Codecommit d83c829df74039812a87ecc9d8486666fb48ee84.

C03: isoliert 33/33, öffentlich 33/33; Codecommit 28baed1c7ca9bbba4b85eeedd82e5abb61899ecb.

C04: isoliert 26/26, öffentlich 26/26; Codecommit 005ed694dfb15e4f7380ebb953ad6cbf19e860ac.

C05: isoliert 33/33, öffentlich 33/33; Codecommit b6f25f1b632da8c10822c0a7e67890b08f379493.

C06: isoliert 23/23, öffentlich 23/23; Codecommit 76d31d0f26df76899999e761e88870793ce020e5.

C06 v0.1.1: 23 isolated + 23 public tests, anonymous proof SHA 2acd394cea793abe780f98a002ab038e86db08c3.

C07 v0.1.0: 23 isolated + 23 public tests, anonymous proof SHA 2acd394cea793abe780f98a002ab038e86db08c3.

C08 v0.1.0: 24 isolated + 24 public tests, anonymous proof SHA 14abab681270e7858adc177afdc0bc84e8f47293.

C09 v0.1.0: 22 isolated + 22 public tests, anonymous proof SHA 694201d3caa0f8f6ba8a52d9050cb8f603113363.

C10 v0.1.0: 24 isolated + 24 public tests, anonymous proof SHA b5dbacc6982648035895ed68ba03b4133dae91fe.

C11 v0.1.0: 28 isolated + 28 public tests, anonymous proof SHA 21d58d69bc37f81145fcdaf8eb2466f9ff1558a2.
