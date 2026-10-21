# DocumentExporter v0.1.0

Reiner, hostseitig injizierter Dokumentdienst für CV und Anschreiben; keine Web Component und keine Netzaufrufe. `exportDocument({format,document:{title,subtitle,contact,sections:[{heading,body}],photo},filename})` liefert Promise `{blob,filename}`. PDF bettet DejaVu Sans ein, bricht lange Zeilen um und erzeugt weitere A4-Seiten. DOCX enthält echte editierbare Absätze und optionale Bilder. Kein Warnfooter, keine Lizenztexte im Bewerbungsdokument. Alle Lizenzhinweise liegen beim Softwarepaket.

Der ESM-Build enthält pdf-lib (MIT), @pdf-lib/fontkit (MIT), docx (MIT) und DejaVu Sans (Bitstream Vera-Lizenz; DejaVu-Änderungen gemeinfrei). Siehe THIRD_PARTY_NOTICES.txt und FONT-LICENSE.txt. Eigener Adaptercode fällt unter die Rechte des Repositoryinhabers. Generierte Fremdbibliotheks-Bundles/Schriftdaten sind von der ungefähren Quellzeilen-Liefergrenze ausgenommen; eigener Adaptercode bleibt klein.

Build: npm install --ignore-scripts, npm run build. Paketversionen sind gepinnt. Vollständige Export-/Unicode-/Mehrseitentests laufen im eigenständigen C03-Demo-Browser und werden bei C05 regressiert. MIME/Datei-/Zeichensatzfehler müssen als Fehler zurückgegeben werden; es gibt keine stillen Ersatz-PDFs.
