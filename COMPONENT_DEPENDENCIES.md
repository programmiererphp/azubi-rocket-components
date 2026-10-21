# Abhängigkeiten

shell -> C01..C11 und injizierte Adapter. Komponenten dürfen nur eigene reine Hilfsfunktionen und ausdrücklich deklarierte Bibliotheken importieren; keine Cxx->Cyy-, Cxx->Shell- oder globalen State-Importe. C01 benötigt keine Bibliothek und keinen Server. C03/C05 verwenden denselben versionierten Dokumentvertrag über einen Adapter, ohne sich gegenseitig zu importieren. C06 wird als Drawer oder Seite von der Shell komponiert. CSS-Variablen/parts statt Eingriffen ins Shadow DOM.
