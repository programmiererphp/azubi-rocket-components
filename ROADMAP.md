# Roadmap

- [x] P0: Gesamtflow bestätigt, Korrektur vollständiger Navigation dokumentiert.
- [x] P0: C01–C11 modular geplant; Schnittstellen und Liefergrenzen festgelegt.
- [x] P0 D1: C01 implementieren, isoliert Desktop/Mobile testen, öffentliche Demo/Build verifizieren.
- [x] P0 D2: C02 Anleitung mit unveränderter Navigationsintegration.
- [ ] P0 D3: C03 CV samt gemeinsamem Unicode-Dokumentmodell und PDF/DOCX.
- [ ] P0 D4: C04 Bestandsfirmen-Suche mit ehrlichem Kontaktstatus.
- [ ] P0 D5: C05 Anschreiben, Kopieren, Mailto und Exporte.
- [ ] P0 D6: C06 FAQ; vollständige bestehende Inhalte übernehmen, veraltete Angaben prüfen.
- [ ] P0: Dünne AI-Studio-Shell aus gepinnten Builds; Staging-E2E und Regression.
- [ ] P1: Dokumentcheck, Quizzes, Stadtguide, Kontaktmodul einzeln.
- [ ] P1: Mini-CMS/XML/Admin und sichere Accounts/Serverdienste als getrennte Erweiterungen.
- [ ] P1: Fehlende historische Formantworten/Device-Daten übernehmen, sofern Zugriff vorliegt.
- [ ] P0 Release: Betreiber-/Rechtstexte, Kostenlimits für tatsächliche KI-Funktionen, Wiederherstellungs-/Rollbacktest, Freigabe für Cutover.

C01: 85/85 isolierte Chromium-Tests (1440x900, 390x844, 320x844); öffentlicher Build bytegenau anonym geprüft. Bereitgestellte Demo mit echtem Cloud-Browser geprüft: Schritte 5/6 funktionieren, sechs Labels sichtbar, keine eigenen Appfehler. Browser-Erweiterungsfehler chrome-extension:// sind separat und stammen nicht aus der App. Zusätzlich 85/85 Tests gegen die öffentliche Pages-URL bestanden (2026-10-21T15:03:34Z). Firefox/Safari und die spätere Hauptanwendung sind noch nicht geprüft.

C02: isoliert 26/26, öffentlich 26/26; Codecommit d83c829df74039812a87ecc9d8486666fb48ee84.
