# Azubi Rocket — modulare Neufassung v1

Referenz: AZR-SPEC-01. Ziel: internationale Bewerber, insbesondere Au-pairs in Deutschland und Bewerber im Ausland, verständlich von der Orientierung zu vollständigen Bewerbungsunterlagen, passenden Ausbildungsbetrieben und den nächsten Schritten bis zum Ausbildungsstart begleiten. Klare schrittweise Bedienung, vier Sprachen, beständige Daten und brauchbare Exporte sind wichtiger als viele Einstellungen.

Besonderheiten: zwei Standortpfade; durchgehende Sechs-Schritt-Navigation; CV und Anschreiben mit gemeinsamem Datenvertrag; bestehende umfangreiche FAQ und lokale Firmenkontakte; später Mini-CMS mit getrennten Inhalten/Layout/Design und XML-Schema. Keine garantierten Plätze/Aufenthaltstitel. Die bestehende App bleibt während der Entwicklung unverändert.

## Erste technische Lieferung D1 / C01
Ein tatsächlich benutzbarer, eigenständig getesteter Navigator, der auf Desktop und Mobile alle sechs beschrifteten Schritte zeigt, den aktuellen Schritt markiert, abgeschlossene Zustände darstellt und ausschließlich erlaubte Navigationsanfragen als versionierte Events ausgibt. Tastatur, deaktivierte/busy Zustände, alle vier Sprachen, Attribut-/Property-Änderungen, Mount/Unmount und erneuter Modulimport müssen funktionieren. Keine Persistenz-/Backend-/KI-Funktion in diesem Baustein; die isolierte Demo stellt einen klar gekennzeichneten Host bereit.

## Lieferungen
D1=C01 Navigation. D2=C02 Orientierung/Anleitung und Checklisten. D3=C03 CV mit funktionierenden PDF-/DOCX-Exporten. D4=C04 Firmenfinder. D5=C05 Anschreiben/E-Mail. D6=C06 vollständige Hilfe/FAQ. Danach dünne AI-Studio-Shell und reale Desktop-/Mobil-Stagingtests. C07–C11 einzeln danach. Je Lieferung ungefähr 1000–2000 geänderte Zeilen; zusammengehörige Funktionen dürfen Tests/Manifest/Demo umfassen. SPEC vor Code ändern, ROADMAP mit Nachweisen fortschreiben.

## Tests je Lieferung
1. Contract-, Eingabe-, Zustands-, Ereignis-, Fehler-, Leer-/Loadingtests mit synthetischen Daten. 2. Echtes Browser-Rendering 1440x900 und 390x844 sowie schmal 320px. 3. Tastatur/Fokus und keine Überläufe. 4. Alle de/en/fr/ru Texte, auch lange russische Labels. 5. Keine relevanten Konsolenfehler und keine unbeabsichtigten Netzaufrufe. 6. Eigenständige Demo importiert denselben gehashten dist-Build. 7. Öffentlicher GitHub-Download bytegenau; erst dann Integration. Nach jeder Delivery reale bereitgestellte Demo/App prüfen, bevor nächste Lieferung beginnt. Spätere Exporttests prüfen Öffnen, Unicode, Seitenumbrüche und Warnfreiheit. Spätere Rollen-/Persistenztests prüfen echten Zugriff statt nur UI-Sichtbarkeit.

## Bewusst später
Mini-CMS/Admin, echte Accounts/DB-Migration, KI, Bildbearbeitung, automatische Übersetzungen, weitere Sprachen und Communityfunktionen gehören nicht in D1. Bilder können zukünftige Module zeigen; unangeforderte Illustrationsdetails (z.B. Kostenplaner, zusätzliche Berufskategorien) sind keine neuen Funktionsanforderungen. Keine dekorativen Fake-Buttons.

## Deutschland/Datenschutz
Vor öffentlicher Endnutzer-Veröffentlichung Impressum, Datenschutzerklärung, konkrete Datenspeicherung und Verantwortliche in der Shell ergänzen; keine erfundenen Betreiberangaben. Bewerberdaten nicht in öffentliche Demos/Logs. Private Recovery bleibt getrennt von öffentlichen Komponenten. Aktuelle Rechtsangaben werden später quellenbasiert überprüft.
