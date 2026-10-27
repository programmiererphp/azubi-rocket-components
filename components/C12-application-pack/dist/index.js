// src/ui.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var copy = (value) => structuredClone(value);
var languages = ["de", "en", "fr", "ru"];
var emit = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { schemaVersion: 1, ...copy(detail) } }));
var theme = `
:host{display:block;color:var(--azr-text,#102352);font:15px/1.6 var(--azr-font,system-ui,sans-serif)}*{box-sizing:border-box}[hidden]{display:none!important}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(25px,4vw,34px);line-height:1.2;letter-spacing:-.04em}h2{font-size:21px;line-height:1.3}h3{font-size:17px}p{color:#50627f}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid #dce4ef;border-radius:15px;background:var(--azr-surface,#fff);padding:22px;min-width:0}.selected{border-color:#0878f9;background:#eef5ff}.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.between{justify-content:space-between}.muted{font-size:13px;color:#526782}.stack>*+*{margin-top:16px}button,input,textarea,select{font:inherit}button,.button{border:1px solid #bdcde1;background:#fff;color:#16335c;border-radius:9px;padding:10px 16px;min-height:44px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px}button.primary{background:var(--azr-accent,#0878f9);border-color:var(--azr-accent,#0878f9);color:white;font-weight:650}button:disabled{color:#63748c;background:#edf1f6;border-color:#dce3ed;cursor:default}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #125bca;outline-offset:3px}label{display:block;margin-bottom:12px}input:not([type=checkbox]):not([type=radio]),select,textarea{display:block;width:100%;padding:10px 12px;border:1px solid #bdcde1;border-radius:8px;background:white;color:#102352;min-height:44px}textarea{min-height:110px;resize:vertical}input[type=checkbox],input[type=radio]{width:20px;height:20px;accent-color:#0878f9;flex-shrink:0}.check{display:flex;gap:12px;align-items:flex-start;margin:0}.check input{margin-top:5px}.check span{min-width:0}.body{white-space:pre-wrap;overflow-wrap:anywhere}details{margin-top:12px}summary{cursor:pointer;color:#075bce;min-height:44px;padding:8px 0}.notice{padding:15px;border-radius:10px;background:#eef5ff;color:#244978}.error{background:#fff0ed;color:#9a3327}.success{background:#e7f7ef;color:#116b49}a{color:#075bce;overflow-wrap:anywhere}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.badge{display:inline-block;padding:3px 10px;border-radius:20px;background:#e8eef8;font-size:12px}.preview{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:24px;border:1px solid #dce4ef;box-shadow:0 4px 20px #10235208}.preview h2{border-bottom:2px solid #102352;padding-bottom:12px}.list{list-style:none;padding:0;margin:0}.list>li+li{margin-top:12px}progress{width:100%;height:8px;accent-color:#13996b}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:640px){.grid{grid-template-columns:1fr}.card{padding:17px}.preview{padding:17px}.actions>button{flex:1}.row>label{width:100%}}@media print{button,.actions{display:none}}
`;
var ElementBase = class extends HTMLElement {
  #controller;
  #lang = "de";
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  static get observedAttributes() {
    return ["language", "busy"];
  }
  get language() {
    return this.#lang;
  }
  set language(v) {
    if (!languages.includes(v)) throw new TypeError("Unsupported language");
    this.setAttribute("language", v);
  }
  get busy() {
    return this.hasAttribute("busy");
  }
  set busy(v) {
    if (typeof v !== "boolean") throw new TypeError("busy must be boolean");
    this.toggleAttribute("busy", v);
  }
  attributeChangedCallback(name, old, value) {
    if (old === value) return;
    if (name === "language") {
      if (!languages.includes(value ?? "de")) {
        emit(this, "azr:component-error", { code: "invalid-attribute", attribute: name });
        return;
      }
      this.#lang = value ?? "de";
    }
    this.render();
  }
  connectedCallback() {
    for (const k of this.upgradeProperties ?? []) {
      if (Object.hasOwn(this, k)) {
        const v = this[k];
        delete this[k];
        this[k] = v;
      }
    }
    this.#controller?.abort();
    this.#controller = new AbortController();
    for (const name of ["click", "change", "input", "keydown"]) this.shadowRoot.addEventListener(name, (e) => this.handle?.(e), { signal: this.#controller.signal });
    this.render();
  }
  disconnectedCallback() {
    this.#controller?.abort();
  }
  paint(html) {
    if (!this.isConnected) return;
    const opened = [...this.shadowRoot.querySelectorAll("details[open][data-key]")].map((n) => n.dataset.key);
    const a = this.shadowRoot.activeElement, key = a?.dataset.key;
    let selection;
    try {
      selection = [a.selectionStart, a.selectionEnd];
    } catch {
    }
    this.shadowRoot.innerHTML = `<style>${theme}</style>${html}`;
    for (const d of this.shadowRoot.querySelectorAll("details[data-key]")) d.open = opened.includes(d.dataset.key);
    if (key) {
      const b = [...this.shadowRoot.querySelectorAll("[data-key]")].find((n) => n.dataset.key === key);
      if (b && !b.disabled) {
        b.focus({ preventScroll: true });
        try {
          b.setSelectionRange(...selection);
        } catch {
        }
      }
    }
  }
};

// src/locales.js
var words = {
  de: { subject: "Betreff auf Deutsch", page: "Seite", title: "Deine Bewerbung fertig machen", intro: "F\xFCge deine Zeugnisse hinzu. Du bekommst deinen deutschen Lebenslauf, alle Nachweise als eine PDF und eine vorbereitete E-Mail.", company: "Ausgew\xE4hlte Firma", choose: "Firma ausw\xE4hlen", cv: "Lebenslauf erg\xE4nzen", letter: "Anschreiben erg\xE4nzen", missing: "Bitte zuerst erg\xE4nzen", certificates: "Zeugnisse und Sprachnachweise", upload: "PDFs oder Fotos hinzuf\xFCgen", fileHint: "PDF, JPG oder PNG. Bis zu 10 Dateien, je 10 MB, insgesamt 30 MB. Ordne sie so, wie der Betrieb sie lesen soll.", up: "Nach oben", down: "Nach unten", remove: "Entfernen", skip: "Ich habe noch keine Nachweise. Ich m\xF6chte zun\xE4chst nur meinen Lebenslauf senden.", skipHint: "Es wird keine leere Nachweisdatei erzeugt. Pr\xFCfe, welche Unterlagen der Betrieb verlangt.", recipient: "E-Mail der Firma", website: "Adresse auf der Firmenwebsite pr\xFCfen", addressCheck: "Ich habe die Empf\xE4ngeradresse auf der Firmenwebsite gepr\xFCft.", german: "Dein E-Mail-Text auf Deutsch", germanCheck: "Ich habe den deutschen Text und meine Angaben gepr\xFCft.", prepare: "Bewerbung vorbereiten", ready: "Deine Bewerbung ist vorbereitet", notSent: "Noch nicht versendet. \xD6ffne den Entwurf in deinem E-Mail-Programm, pr\xFCfe ihn und sende ihn dort selbst ab.", attachments: "Diese Dateien geh\xF6ren in deine E-Mail", download: "Herunterladen", pages: "Seiten", eml: "E-Mail mit PDF-Anh\xE4ngen herunterladen", emlHint: "Die .eml-Datei enth\xE4lt Text und PDFs. \xD6ffne sie in einem kompatiblen E-Mail-Programm als Entwurf. Falls dein Programm das nicht unterst\xFCtzt, nutze die Alternative unten.", share: "Mit PDFs an eine App \xFCbergeben", shareHint: "W\xE4hle dein E-Mail-Programm und pr\xFCfe Empf\xE4nger und Anh\xE4nge dort.", other: "Andere E-Mail-Option und Sicherung", mail: "E-Mail-Programm \xF6ffnen", mailHint: "Dieser Link \xF6ffnet Empf\xE4nger und Text. F\xFCge die oben heruntergeladenen PDFs selbst als Anh\xE4nge hinzu.", long: "Der Text ist zu lang f\xFCr den E-Mail-Link. Kopiere den vollst\xE4ndigen Text in deine E-Mail.", copy: "Deutschen Text kopieren", copied: "Text kopiert.", copyFailed: "Bitte den Text oben markieren und kopieren.", zip: "Alle Unterlagen als ZIP sichern", companies: "Firmenliste herunterladen", checks: "Erg\xE4nze die fehlenden Angaben und best\xE4tige beide Pr\xFCfpunkte.", loading: "Gespeicherte Nachweise werden geladen \u2026", stored: "Nachweise bleiben auf diesem Ger\xE4t gespeichert.", session: "Nachweise bleiben nur in diesem ge\xF6ffneten Tab. Nach Neuladen bitte erneut ausw\xE4hlen.", storeError: "Nachweise konnten nicht auf dem Ger\xE4t gespeichert werden. Lade dein fertiges Paket herunter.", working: "Die Dokumente werden erstellt \u2026", cvStage: "Deutscher Lebenslauf", certStage: "Nachweise zusammenf\xFCgen", packStage: "E-Mail und Download vorbereiten", error: "Die Bewerbung konnte nicht vorbereitet werden.", noService: "Die Dokumentverarbeitung ist gerade nicht verf\xFCgbar.", cancelled: "\xDCbergabe abgebrochen. Deine Downloads bleiben verf\xFCgbar.", shareFailed: "Die \xDCbergabe ist hier nicht m\xF6glich. Nutze die Downloads.", sizeHint: "Anhanggr\xF6\xDFe", sizeNote: "Pr\xFCfe die Dateigr\xF6\xDFen-Vorgaben der Stellenanzeige.", empty: "Noch keine Nachweise ausgew\xE4hlt.", reviewAgain: "Nach einer \xC4nderung bitte die Bewerbung erneut vorbereiten.", fileProblem: "Bitte diese Datei pr\xFCfen", countError: "H\xF6chstens 10 Dateien ausw\xE4hlen.", sizeError: "Eine Datei ist gr\xF6\xDFer als 10 MB.", totalError: "Die Dateien sind zusammen gr\xF6\xDFer als 30 MB.", invalidEmail: "Pr\xFCfe die E-Mail-Adresse der Firma.", badPdf: "Eine PDF ist besch\xE4digt oder nicht lesbar.", encrypted: "Die PDF ist passwortgesch\xFCtzt. Lade eine entsperrte Kopie oder gut lesbare Fotos hoch.", imageError: "Das Bild kann nicht verarbeitet werden. W\xE4hle JPG oder PNG mit h\xF6chstens 40 Megapixeln.", unsupported: "Dieses Dateiformat wird nicht unterst\xFCtzt. Nutze PDF, JPG oder PNG.", pageError: "Die Nachweise d\xFCrfen zusammen h\xF6chstens 100 Seiten haben.", formError: "Ein PDF-Formular konnte nicht \xFCbernommen werden. Speichere es als normale PDF oder lade Fotos hoch.", emptyFile: "Die Datei ist leer.", noFiles: "F\xFCge Nachweise hinzu oder w\xE4hle ausdr\xFCcklich, dass du noch keine hast." },
  en: { subject: "Subject in German", page: "page", title: "Finish your application", intro: "Add your certificates. You will receive your German CV, one combined certificate PDF and a prepared email.", company: "Selected company", choose: "Choose a company", cv: "Complete your CV", letter: "Complete the cover letter", missing: "Complete these first", certificates: "School and language certificates", upload: "Add PDFs or photos", fileHint: "PDF, JPG or PNG. Up to 10 files,10 MB each,30 MB altogether. Put them in the order the company should read.", up: "Move up", down: "Move down", remove: "Remove", skip: "I have no certificates yet. I want to send my CV first.", skipHint: "No empty certificate file is created. Check which documents the company requires.", recipient: "Company email", website: "Check the address on the company website", addressCheck: "I checked the recipient address on the company website.", german: "Your email text in German", germanCheck: "I reviewed the German text and my information.", prepare: "Prepare application", ready: "Your application is prepared", notSent: "Not sent yet. Open the draft in your email app, review it and send it yourself there.", attachments: "Attach these files to your email", download: "Download", pages: "pages", eml: "Download email with PDF attachments", emlHint: "The .eml file contains the text and PDFs. Open it as a draft in a compatible email app. If your app does not support it, use the alternative below.", share: "Hand off with PDFs to an app", shareHint: "Choose your email app, then check recipient and attachments there.", other: "Other email option and backup", mail: "Open email app", mailHint: "This link opens the recipient and text. Attach the PDFs downloaded above yourself.", long: "The text is too long for an email link. Copy the full text into your email.", copy: "Copy German text", copied: "Text copied.", copyFailed: "Select and copy the text above.", zip: "Save all documents as ZIP", companies: "Download company list", checks: "Complete the missing details and confirm both review points.", loading: "Loading saved certificates \u2026", stored: "Certificates stay saved on this device.", session: "Certificates stay only in this open tab. Select them again after reloading.", storeError: "Could not save certificates on this device. Download your finished package.", working: "Creating your documents \u2026", cvStage: "German CV", certStage: "Combining certificates", packStage: "Preparing email and downloads", error: "Could not prepare the application.", noService: "Document processing is currently unavailable.", cancelled: "Handoff cancelled. Your downloads are still available.", shareFailed: "Handoff is not available here. Use the downloads.", sizeHint: "Attachment size", sizeNote: "Check the file-size requirements in the vacancy notice.", empty: "No certificates selected yet.", reviewAgain: "After a change, prepare the application again.", fileProblem: "Check this file", countError: "Choose at most 10 files.", sizeError: "A file exceeds 10 MB.", totalError: "The files exceed 30 MB together.", invalidEmail: "Check the company email address.", badPdf: "A PDF is damaged or unreadable.", encrypted: "The PDF is password protected. Upload an unlocked copy or legible photos.", imageError: "Could not process the image. Choose JPG or PNG up to 40 megapixels.", unsupported: "Unsupported file format. Use PDF, JPG or PNG.", pageError: "Certificates may contain at most 100 pages in total.", formError: "Could not retain a PDF form. Save it as an ordinary PDF or upload photos.", emptyFile: "The file is empty.", noFiles: "Add certificates or explicitly choose that you have none yet." },
  fr: { subject: "Objet en allemand", page: "page", title: "Terminer ma candidature", intro: "Ajoute tes justificatifs. Tu obtiendras ton CV en allemand, tous tes certificats dans un seul PDF et un e-mail pr\xEAt \xE0 ouvrir.", company: "Entreprise choisie", choose: "Choisir une entreprise", cv: "Compl\xE9ter mon CV", letter: "Compl\xE9ter la lettre", missing: "\xC0 compl\xE9ter d\u2019abord", certificates: "Dipl\xF4mes et certificats de langue", upload: "Ajouter des PDF ou des photos", fileHint: "PDF, JPG ou PNG. Jusqu\u2019\xE010 fichiers,10 Mo chacun,30 Mo au total. Place-les dans l\u2019ordre de lecture souhait\xE9.", up: "Monter", down: "Descendre", remove: "Retirer", skip: "Je n\u2019ai pas encore de justificatifs. Je souhaite d\u2019abord envoyer mon CV seul.", skipHint: "Aucun faux PDF vide ne sera cr\xE9\xE9. V\xE9rifie les documents demand\xE9s par l\u2019entreprise.", recipient: "E-mail de l\u2019entreprise", website: "V\xE9rifier l\u2019adresse sur le site de l\u2019entreprise", addressCheck: "J\u2019ai v\xE9rifi\xE9 l\u2019adresse du destinataire sur le site de l\u2019entreprise.", german: "Ton e-mail en allemand", germanCheck: "J\u2019ai relu le texte allemand et v\xE9rifi\xE9 mes informations.", prepare: "Pr\xE9parer ma candidature", ready: "Ta candidature est pr\xE9par\xE9e", notSent: "Rien n\u2019est encore envoy\xE9. Ouvre le brouillon dans ton application e-mail, v\xE9rifie-le puis envoie-le toi-m\xEAme.", attachments: "Ces fichiers doivent accompagner ton e-mail", download: "T\xE9l\xE9charger", pages: "pages", eml: "T\xE9l\xE9charger l\u2019e-mail avec les PDF joints", emlHint: "Le fichier .eml contient le texte et les PDF. Ouvre-le comme brouillon dans une application e-mail compatible. Sinon, utilise l\u2019autre option ci-dessous.", share: "Transf\xE9rer avec les PDF \xE0 une application", shareHint: "Choisis ton application e-mail, puis v\xE9rifie le destinataire et les pi\xE8ces jointes.", other: "Autre option e-mail et sauvegarde", mail: "Ouvrir mon application e-mail", mailHint: "Ce lien ouvre le destinataire et le texte. Ajoute toi-m\xEAme les PDF t\xE9l\xE9charg\xE9s ci-dessus en pi\xE8ces jointes.", long: "Le texte est trop long pour le lien e-mail. Copie le texte complet dans ton e-mail.", copy: "Copier le texte allemand", copied: "Texte copi\xE9.", copyFailed: "S\xE9lectionne et copie le texte ci-dessus.", zip: "Sauvegarder tous les documents en ZIP", companies: "T\xE9l\xE9charger la liste des entreprises", checks: "Compl\xE8te les informations manquantes et confirme les deux points de v\xE9rification.", loading: "Chargement des justificatifs enregistr\xE9s \u2026", stored: "Les justificatifs restent enregistr\xE9s sur cet appareil.", session: "Les justificatifs restent seulement dans cet onglet ouvert. Apr\xE8s rechargement, s\xE9lectionne-les \xE0 nouveau.", storeError: "Impossible d\u2019enregistrer les justificatifs sur cet appareil. T\xE9l\xE9charge ton dossier termin\xE9.", working: "Cr\xE9ation des documents \u2026", cvStage: "CV en allemand", certStage: "Regroupement des justificatifs", packStage: "Pr\xE9paration de l\u2019e-mail et des fichiers", error: "Impossible de pr\xE9parer la candidature.", noService: "Le traitement des documents est indisponible pour le moment.", cancelled: "Transfert annul\xE9. Tes t\xE9l\xE9chargements restent disponibles.", shareFailed: "Le transfert est indisponible ici. Utilise les t\xE9l\xE9chargements.", sizeHint: "Taille des pi\xE8ces jointes", sizeNote: "V\xE9rifie la limite de taille indiqu\xE9e dans l\u2019offre.", empty: "Aucun justificatif s\xE9lectionn\xE9.", reviewAgain: "Apr\xE8s une modification, pr\xE9pare \xE0 nouveau la candidature.", fileProblem: "V\xE9rifie ce fichier", countError: "Choisis au maximum 10 fichiers.", sizeError: "Un fichier d\xE9passe 10 Mo.", totalError: "Les fichiers d\xE9passent 30 Mo au total.", invalidEmail: "V\xE9rifie l\u2019adresse e-mail de l\u2019entreprise.", badPdf: "Un PDF est endommag\xE9 ou illisible.", encrypted: "Le PDF est prot\xE9g\xE9 par un mot de passe. Ajoute une copie d\xE9verrouill\xE9e ou des photos lisibles.", imageError: "Impossible de traiter cette image. Choisis JPG ou PNG de 40 m\xE9gapixels au maximum.", unsupported: "Format non pris en charge. Utilise PDF, JPG ou PNG.", pageError: "Les justificatifs ne peuvent pas d\xE9passer 100 pages au total.", formError: "Impossible de conserver un formulaire PDF. Enregistre-le comme PDF normal ou ajoute des photos.", emptyFile: "Le fichier est vide.", noFiles: "Ajoute tes justificatifs ou indique explicitement que tu n\u2019en as pas encore." },
  ru: { subject: "\u0422\u0435\u043C\u0430 \u043D\u0430 \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u043C", page: "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430", title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043A \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435", intro: "\u0414\u043E\u0431\u0430\u0432\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B. \u0422\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u0448\u044C \u0440\u0435\u0437\u044E\u043C\u0435 \u043D\u0430 \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u043C, \u0432\u0441\u0435 \u0441\u043F\u0440\u0430\u0432\u043A\u0438 \u0432 \u043E\u0434\u043D\u043E\u043C PDF \u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E.", company: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F", choose: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044E", cv: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u0440\u0435\u0437\u044E\u043C\u0435", letter: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043F\u0438\u0441\u044C\u043C\u043E", missing: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0434\u043E\u043F\u043E\u043B\u043D\u0438", certificates: "\u0410\u0442\u0442\u0435\u0441\u0442\u0430\u0442\u044B \u0438 \u044F\u0437\u044B\u043A\u043E\u0432\u044B\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B", upload: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C PDF \u0438\u043B\u0438 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438", fileHint: "PDF, JPG \u0438\u043B\u0438 PNG. \u0414\u043E 10 \u0444\u0430\u0439\u043B\u043E\u0432 \u043F\u043E 10 \u041C\u0411, \u0432\u0441\u0435\u0433\u043E 30 \u041C\u0411. \u0420\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0438 \u0438\u0445 \u0432 \u043D\u0443\u0436\u043D\u043E\u043C \u043F\u043E\u0440\u044F\u0434\u043A\u0435.", up: "\u0412\u044B\u0448\u0435", down: "\u041D\u0438\u0436\u0435", remove: "\u0423\u0431\u0440\u0430\u0442\u044C", skip: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0445\u043E\u0447\u0443 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0435\u0437\u044E\u043C\u0435.", skipHint: "\u041F\u0443\u0441\u0442\u043E\u0439 PDF \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F. \u0423\u0442\u043E\u0447\u043D\u0438, \u043A\u0430\u043A\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F.", recipient: "\u041F\u043E\u0447\u0442\u0430 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", website: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0430\u0434\u0440\u0435\u0441 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", addressCheck: "\u042F \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u043B \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438.", german: "\u0422\u0435\u043A\u0441\u0442 \u043F\u0438\u0441\u044C\u043C\u0430 \u043D\u0430 \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u043C", germanCheck: "\u042F \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u043B \u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u0438 \u0441\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435.", prepare: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435", ready: "\u0417\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u043E", notSent: "\u0415\u0449\u0451 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E. \u041E\u0442\u043A\u0440\u043E\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0432 \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u043C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438, \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u044C \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E.", attachments: "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438 \u044D\u0442\u0438 \u0444\u0430\u0439\u043B\u044B \u043A \u043F\u0438\u0441\u044C\u043C\u0443", download: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C", pages: "\u0441\u0442\u0440\u0430\u043D\u0438\u0446", eml: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u043F\u0438\u0441\u044C\u043C\u043E \u0441 PDF-\u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F\u043C\u0438", emlHint: "\u0424\u0430\u0439\u043B .eml \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0442\u0435\u043A\u0441\u0442 \u0438 PDF. \u041E\u0442\u043A\u0440\u043E\u0439 \u0435\u0433\u043E \u043A\u0430\u043A \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0432 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0439 \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435. \u0418\u043D\u0430\u0447\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u043D\u0438\u0436\u0435.", share: "\u041F\u0435\u0440\u0435\u0434\u0430\u0442\u044C \u0441 PDF \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435", shareHint: "\u0412\u044B\u0431\u0435\u0440\u0438 \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F \u0438 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u044F.", other: "\u0414\u0440\u0443\u0433\u043E\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u043F\u043E\u0447\u0442\u044B \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435", mail: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435", mailHint: "\u0421\u0441\u044B\u043B\u043A\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F \u0438 \u0442\u0435\u043A\u0441\u0442. \u0421\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u0438 \u0441\u043A\u0430\u0447\u0430\u043D\u043D\u044B\u0435 \u0432\u044B\u0448\u0435 PDF.", long: "\u0422\u0435\u043A\u0441\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439 \u0434\u043B\u044F \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u0439 \u0441\u0441\u044B\u043B\u043A\u0438. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u043F\u043E\u043B\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432 \u043F\u0438\u0441\u044C\u043C\u043E.", copy: "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442", copied: "\u0422\u0435\u043A\u0441\u0442 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D.", copyFailed: "\u0412\u044B\u0434\u0435\u043B\u0438 \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432\u044B\u0448\u0435.", zip: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0432\u0441\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0432 ZIP", companies: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0439", checks: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438 \u043E\u0431\u0430 \u043F\u0443\u043D\u043A\u0442\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438.", loading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u2026", stored: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435.", session: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u044D\u0442\u043E\u0439 \u0432\u043A\u043B\u0430\u0434\u043A\u0435. \u041F\u043E\u0441\u043B\u0435 \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0432\u044B\u0431\u0435\u0440\u0438 \u0438\u0445 \u0441\u043D\u043E\u0432\u0430.", storeError: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043D\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435. \u0421\u043A\u0430\u0447\u0430\u0439 \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u043F\u0430\u043A\u0435\u0442.", working: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F \u2026", cvStage: "\u0420\u0435\u0437\u044E\u043C\u0435 \u043D\u0430 \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u043C", certStage: "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432", packStage: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043F\u0438\u0441\u044C\u043C\u0430 \u0438 \u0444\u0430\u0439\u043B\u043E\u0432", error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435.", noService: "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430.", cancelled: "\u041F\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u0430. \u0424\u0430\u0439\u043B\u044B \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B.", shareFailed: "\u041F\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0437\u0434\u0435\u0441\u044C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430. \u0421\u043A\u0430\u0447\u0430\u0439 \u0444\u0430\u0439\u043B\u044B.", sizeHint: "\u0420\u0430\u0437\u043C\u0435\u0440 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439", sizeNote: "\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435 \u0440\u0430\u0437\u043C\u0435\u0440\u0430 \u0432 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0438.", empty: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u044B.", reviewAgain: "\u041F\u043E\u0441\u043B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043D\u043E\u0432\u043E.", fileProblem: "\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u044D\u0442\u043E\u0442 \u0444\u0430\u0439\u043B", countError: "\u0412\u044B\u0431\u0435\u0440\u0438 \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 10 \u0444\u0430\u0439\u043B\u043E\u0432.", sizeError: "\u0424\u0430\u0439\u043B \u0431\u043E\u043B\u044C\u0448\u0435 10 \u041C\u0411.", totalError: "\u041E\u0431\u0449\u0438\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u043E\u0432 \u0431\u043E\u043B\u044C\u0448\u0435 30 \u041C\u0411.", invalidEmail: "\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u043F\u043E\u0447\u0442\u043E\u0432\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438.", badPdf: "PDF \u043F\u043E\u0432\u0440\u0435\u0436\u0434\u0451\u043D \u0438\u043B\u0438 \u043D\u0435 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F.", encrypted: "PDF \u0437\u0430\u0449\u0438\u0449\u0451\u043D \u043F\u0430\u0440\u043E\u043B\u0435\u043C. \u0414\u043E\u0431\u0430\u0432\u044C \u043A\u043E\u043F\u0438\u044E \u0431\u0435\u0437 \u043F\u0430\u0440\u043E\u043B\u044F \u0438\u043B\u0438 \u0447\u0438\u0442\u0430\u0435\u043C\u044B\u0435 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438.", imageError: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435. \u0412\u044B\u0431\u0435\u0440\u0438 JPG \u0438\u043B\u0438 PNG \u0434\u043E 40 \u043C\u0435\u0433\u0430\u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439.", unsupported: "\u041D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u043C\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 PDF, JPG \u0438\u043B\u0438 PNG.", pageError: "\u0412 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0445 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 100 \u0441\u0442\u0440\u0430\u043D\u0438\u0446.", formError: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C PDF-\u0444\u043E\u0440\u043C\u0443. \u0421\u043E\u0445\u0440\u0430\u043D\u0438 \u043E\u0431\u044B\u0447\u043D\u044B\u0439 PDF \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u044C \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438.", emptyFile: "\u0424\u0430\u0439\u043B \u043F\u0443\u0441\u0442\u043E\u0439.", noFiles: "\u0414\u043E\u0431\u0430\u0432\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438\u043B\u0438 \u044F\u0432\u043D\u043E \u0443\u043A\u0430\u0436\u0438, \u0447\u0442\u043E \u0438\u0445 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442." }
};

// src/index.js
var validEmail = (s) => typeof s === "string" && !/[\r\n\u0000-\u001f]/.test(s) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
function normalize(value) {
  if (!value || value.schemaVersion !== 1 || typeof value.cvReady !== "boolean" || !Array.isArray(value.missing) || value.missing.length > 20 || value.missing.some((x) => typeof x !== "string" || x.length > 300)) throw TypeError("Invalid application request");
  const result = copy(value);
  if (JSON.stringify(result).length > 4e6) throw TypeError("Application request too large");
  for (const key of ["applicantName", "senderEmail", "recipientEmail"]) if (typeof (result[key] ?? "") !== "string" || (result[key] ?? "").length > 1e3) throw TypeError("Invalid application field");
  if (!result.letter || typeof result.letter.subject !== "string" || typeof result.letter.body !== "string" || result.letter.subject.length > 1e3 || result.letter.body.length > 3e4) throw TypeError("Invalid application letter");
  if (result.company !== null && (!result.company || typeof result.company.id !== "string" || typeof result.company.name !== "string")) throw TypeError("Invalid selected company");
  if (!Array.isArray(result.companies) || result.companies.length > 5e3) throw TypeError("Invalid company list");
  return result;
}
var fileError = (files) => files.length > 10 ? "FILE_COUNT" : files.some((f) => !(f instanceof Blob) || !f.size) ? "EMPTY_FILE" : files.some((f) => f.size > 10 * 1024 * 1024) ? "FILE_SIZE" : files.reduce((n, f) => n + f.size, 0) > 30 * 1024 * 1024 ? "TOTAL_SIZE" : "";
function website(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}
var AzrApplicationPack = class extends ElementBase {
  #request = null;
  #signature = "";
  #services = null;
  #recipient = "";
  #files = [];
  #loaded = false;
  #storage = "session";
  #saveVersion = 0;
  #addressReviewed = false;
  #germanReviewed = false;
  #skip = false;
  #working = false;
  #result = null;
  #operation = 0;
  #progress = { stage: "cv", done: 0, total: 1 };
  #message = "";
  #error = "";
  #errorFile = -1;
  #urls = /* @__PURE__ */ new Map();
  upgradeProperties = ["request", "services", "language", "busy"];
  get request() {
    return copy(this.#request);
  }
  set request(value) {
    const next = normalize(value), signature = JSON.stringify(next);
    if (signature !== this.#signature) {
      const recipientChanged = this.#request?.company?.id !== next.company?.id || this.#request?.recipientEmail !== next.recipientEmail;
      this.#request = next;
      this.#signature = signature;
      if (recipientChanged) {
        this.#recipient = next.recipientEmail ?? "";
        this.#addressReviewed = false;
      }
      this.#germanReviewed = false;
      this.#invalidate();
    }
    this.render();
  }
  get services() {
    return this.#services;
  }
  set services(value) {
    if (value !== null && (!value || typeof value.prepareApplication !== "function" || ["loadFiles", "saveFiles"].some((k) => value[k] !== void 0 && typeof value[k] !== "function"))) throw TypeError("Invalid application services");
    this.#services = value;
    if (this.isConnected) this.#load();
    this.render();
  }
  get fileMetadata() {
    return this.#files.map((f) => ({ name: f.name ?? "Dokument", size: f.size, type: f.type }));
  }
  connectedCallback() {
    super.connectedCallback();
    this.#load();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#operation++;
    this.#working = false;
    this.#release();
  }
  #release() {
    for (const url of this.#urls.values()) URL.revokeObjectURL(url);
    this.#urls.clear();
  }
  #invalidate() {
    this.#operation++;
    this.#working = false;
    this.#release();
    this.#result = null;
    this.#message = "";
    this.#error = "";
    this.#errorFile = -1;
  }
  #url(blob) {
    if (!this.#urls.has(blob)) this.#urls.set(blob, URL.createObjectURL(blob));
    return this.#urls.get(blob);
  }
  #notify() {
    emit(this, "azr:application-change", { recipientEmail: this.#recipient, addressReviewed: this.#addressReviewed, germanReviewed: this.#germanReviewed, allowNoCertificates: this.#skip, files: this.fileMetadata });
  }
  async #load() {
    if (this.#loaded || !this.#services?.loadFiles) return;
    this.#loaded = true;
    this.#storage = "loading";
    this.render();
    try {
      const files = await this.#services.loadFiles();
      if (!Array.isArray(files) || fileError(files)) throw Error("STORAGE");
      if (!this.#files.length) this.#files = files.slice();
      this.#storage = "stored";
      this.#notify();
    } catch {
      this.#storage = "error";
    }
    this.render();
  }
  async #save() {
    const version = ++this.#saveVersion;
    if (!this.#services?.saveFiles) {
      this.#storage = "session";
      return;
    }
    try {
      await this.#services.saveFiles(this.#files.slice());
      if (version === this.#saveVersion) this.#storage = "stored";
    } catch {
      if (version === this.#saveVersion) this.#storage = "error";
    }
    if (version === this.#saveVersion) this.render();
  }
  #filesChanged(next) {
    const code = fileError(next);
    if (code) {
      this.#invalidate();
      this.#germanReviewed = false;
      this.#error = code;
      this.render();
      return;
    }
    this.#files = next;
    this.#skip = false;
    this.#germanReviewed = false;
    this.#invalidate();
    this.#notify();
    this.#save();
    this.render();
  }
  #ready() {
    const r = this.#request;
    return Boolean(r?.cvReady && !r.missing.length && r.company && r.letter.subject.trim() && r.letter.body.trim() && validEmail(this.#recipient) && this.#addressReviewed && this.#germanReviewed && (this.#files.length || this.#skip) && this.#services && !this.busy && !this.#working && this.#storage !== "loading");
  }
  #errorText() {
    const t = words[this.language];
    return t[{ FILE_COUNT: "countError", FILE_SIZE: "sizeError", TOTAL_SIZE: "totalError", EMPTY_FILE: "emptyFile", NO_CERTIFICATES: "noFiles", INVALID_EMAIL: "invalidEmail", CORRUPT_PDF: "badPdf", ENCRYPTED_PDF: "encrypted", IMAGE_PIXELS: "imageError", CORRUPT_IMAGE: "imageError", IMAGE_UNAVAILABLE: "imageError", UNSUPPORTED_FILE: "unsupported", PAGE_LIMIT: "pageError", PDF_FORM: "formError", PDF_DIMENSIONS: "badPdf" }[this.#error]] ?? t.error;
  }
  async #prepare() {
    if (!this.#ready()) return;
    const operation = ++this.#operation, r = copy(this.#request);
    this.#working = true;
    this.#progress = { stage: "cv", done: 0, total: 1 };
    this.#error = "";
    this.#errorFile = -1;
    this.#message = "";
    this.render();
    emit(this, "azr:application-status", { operation: "prepare", status: "pending" });
    try {
      const result = await this.#services.prepareApplication({ cvDocument: r.cvDocument, applicantName: r.applicantName, senderEmail: r.senderEmail, recipient: this.#recipient.trim(), subject: r.letter.subject, body: r.letter.body, files: this.#files.slice(), companies: r.companies, allowNoCertificates: this.#skip, onProgress: (progress) => {
        if (operation !== this.#operation) return;
        if (!["cv", "certificates", "package"].includes(progress.stage) || !Number.isFinite(progress.done) || !Number.isFinite(progress.total)) return;
        this.#progress = progress;
        this.render();
      } });
      if (operation !== this.#operation) return;
      if (!result || result.schemaVersion !== 1 || !Array.isArray(result.attachments) || result.attachments.length < 1 || result.attachments.length > 2 || result.attachments.some((f) => !(f.blob instanceof Blob) || !f.blob.size || !/^[-a-z0-9_]+\.pdf$/i.test(f.filename)) || ![result.email, result.archive, result.companyList].every((f) => f?.blob instanceof Blob && f.blob.size && typeof f.filename === "string") || !result.mailto?.href?.startsWith("mailto:")) throw Error("INVALID_RESULT");
      this.#result = result;
      emit(this, "azr:application-status", { operation: "prepare", status: "ready" });
    } catch (error) {
      if (operation !== this.#operation) return;
      this.#error = error.code ?? "PROCESSING";
      if (Number.isInteger(error.fileIndex)) this.#errorFile = error.fileIndex;
      emit(this, "azr:application-status", { operation: "prepare", status: "error", errorCode: this.#error });
    } finally {
      if (operation === this.#operation) {
        this.#working = false;
        this.render();
        if (this.#result && this.isConnected) {
          const ready = this.shadowRoot.querySelector("[data-ready]");
          ready?.focus();
          ready?.scrollIntoView({ block: "start" });
        }
      }
    }
  }
  async #copy() {
    try {
      await navigator.clipboard.writeText(this.#request.letter.body);
      this.#message = words[this.language].copied;
    } catch {
      this.#message = words[this.language].copyFailed;
    }
    this.render();
  }
  #shareFiles() {
    return this.#result?.attachments.map((a) => new File([a.blob], a.filename, { type: "application/pdf" })) ?? [];
  }
  #canShare() {
    try {
      const files = this.#shareFiles();
      return Boolean(files.length && navigator.canShare?.({ files }) && navigator.share);
    } catch {
      return false;
    }
  }
  async #share() {
    if (!this.#canShare()) return;
    try {
      await navigator.share({ files: this.#shareFiles(), title: this.#result.subject, text: this.#result.body });
      this.#message = words[this.language].notSent;
      emit(this, "azr:application-status", { operation: "share", status: "handed-off" });
    } catch (error) {
      this.#message = words[this.language][error.name === "AbortError" ? "cancelled" : "shareFailed"];
    }
    this.render();
  }
  handle(event) {
    const el = event.target.closest("input,button,a");
    if (!el) return;
    if (this.busy || this.#working) {
      if (el.matches("a")) event.preventDefault();
      return;
    }
    if (event.type === "input" && el.dataset.recipient !== void 0) {
      this.#recipient = el.value;
      this.#addressReviewed = false;
      this.#invalidate();
      this.#notify();
      this.render();
    }
    if (event.type === "change" && el.dataset.files !== void 0) {
      const selected = Array.from(el.files);
      el.value = "";
      this.#filesChanged([...this.#files, ...selected]);
    }
    if (event.type === "change" && el.dataset.skip !== void 0) {
      this.#skip = el.checked;
      this.#invalidate();
      this.#notify();
      this.render();
    }
    if (event.type === "change" && el.dataset.review) {
      if (el.dataset.review === "address") this.#addressReviewed = el.checked;
      else this.#germanReviewed = el.checked;
      this.#invalidate();
      this.#notify();
      this.render();
    }
    if (event.type !== "click") return;
    if (el.dataset.remove !== void 0) {
      const next = this.#files.slice();
      next.splice(Number(el.dataset.remove), 1);
      this.#filesChanged(next);
    }
    if (el.dataset.move !== void 0) {
      const from = Number(el.dataset.index), to = from + Number(el.dataset.move), next = this.#files.slice();
      if (to >= 0 && to < next.length) {
        [next[from], next[to]] = [next[to], next[from]];
        this.#filesChanged(next);
      }
    }
    if (el.dataset.prepare !== void 0) this.#prepare();
    if (el.dataset.copy !== void 0) this.#copy();
    if (el.dataset.share !== void 0) this.#share();
    if (el.dataset.output) emit(this, "azr:application-status", { operation: el.dataset.output, status: el.dataset.output === "mailto" ? "email-open-requested" : "download-requested" });
  }
  render() {
    const t = words[this.language], r = this.#request, locked = this.busy || this.#working, disabled = locked ? "disabled" : "", unit = { de: "MB", en: "MB", fr: "Mo", ru: "\u041C\u0411" }[this.language], size = (bytes) => bytes < 1048576 ? `${new Intl.NumberFormat(this.language, { maximumFractionDigits: 0 }).format(Math.max(1, Math.ceil(bytes / 1024)))} kB` : `${new Intl.NumberFormat(this.language, { maximumFractionDigits: 1 }).format(bytes / 1048576)} ${unit}`;
    const missing = r ? [...r.missing, ...!r.company ? [t.choose] : [], ...!r.letter.subject.trim() || !r.letter.body.trim() ? [t.letter] : []] : [t.cv, t.letter, t.choose];
    const site = website(r?.company?.website), result = this.#result, output = (file, label, kind, primary = false) => `<a class="button ${primary ? "primary" : ""}" data-output="${kind}" href="${esc(this.#url(file.blob))}" download="${esc(file.filename)}">${esc(label)}</a>`;
    const stages = { cv: t.cvStage, certificates: t.certStage, package: t.packStage };
    const pct = Math.round((this.#progress.stage === "cv" ? 0 : this.#progress.stage === "certificates" ? 30 : 80) + (this.#progress.stage === "cv" ? 25 : this.#progress.stage === "certificates" ? 45 : 20) * Math.max(0, Math.min(1, this.#progress.done / Math.max(1, this.#progress.total))));
    this.paint(`<style>:host{overflow-wrap:anywhere}.file{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border-bottom:1px solid #dce4ef;padding:12px 0}.file p{margin:0}.file .row{gap:5px}.file button{padding:7px 10px}.file.error{padding:12px;border-radius:9px}.checks{display:grid;gap:15px;margin-top:20px}.button.primary{background:var(--azr-accent,#0878f9);border-color:var(--azr-accent,#0878f9);color:white;font-weight:650}.attachment{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #dce4ef}.attachment div{min-width:0}.attachment p{margin:2px 0}textarea[readonly]{min-height:190px;max-height:320px}.result{margin-top:24px;border-color:#a9d8be}.company{padding:12px 16px;background:#eaf2ff;border-radius:10px}.status{min-height:22px}.loading{padding:18px;background:#edf5ff;border-radius:10px}@media(max-width:480px){.file{grid-template-columns:1fr}.file .row{justify-content:flex-end}.attachment{align-items:flex-start;flex-direction:column}.actions>.button{width:100%}}</style><section lang="${this.language}"><h1>${t.title}</h1><p>${t.intro}</p>
  ${missing.length ? `<aside class="notice" data-missing><strong>${t.missing}</strong><ul>${missing.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><div class="row"><a href="#/cv">${t.cv}</a><a href="#/companies">${t.choose}</a><a href="#/letter">${t.letter}</a></div></aside>` : ""}
  ${r?.company ? `<p class="company"><strong>${t.company}:</strong> ${esc(r.company.name)}</p>` : ""}
  <div class="card"><h2>${t.certificates}</h2><label>${t.upload}<input data-key="files" data-files type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" multiple ${disabled}></label><p class="muted">${t.fileHint}</p>
  ${this.#files.length ? `<ol class="list" data-file-list>${this.#files.map((f, i) => `<li class="file ${i === this.#errorFile ? "error" : ""}" data-file="${i}"><div><strong>${esc(f.name ?? "Dokument")}</strong><p class="muted">${size(f.size)}</p></div><div class="row"><button data-key="up-${i}" data-move="-1" data-index="${i}" aria-label="${t.up}: ${esc(f.name)}" ${i === 0 || locked ? "disabled" : ""}>\u2191</button><button data-key="down-${i}" data-move="1" data-index="${i}" aria-label="${t.down}: ${esc(f.name)}" ${i === this.#files.length - 1 || locked ? "disabled" : ""}>\u2193</button><button data-key="remove-${i}" data-remove="${i}" ${disabled}>${t.remove}</button></div></li>`).join("")}</ol>` : `<p>${t.empty}</p><label class="check"><input data-key="skip" data-skip type="checkbox" ${this.#skip ? "checked" : ""} ${disabled}><span>${t.skip}</span></label>${this.#skip ? `<p class="notice">${t.skipHint}</p>` : ""}`}
  <p class="muted status" data-storage>${t[this.#storage === "stored" ? "stored" : this.#storage === "loading" ? "loading" : this.#storage === "error" ? "storeError" : "session"]}</p></div>
  <div class="card" style="margin-top:18px"><label>${t.recipient}<input data-key="recipient" data-recipient type="email" autocomplete="off" value="${esc(this.#recipient)}" ${disabled}></label>${site ? `<p><a href="${esc(site)}" target="_blank" rel="noopener noreferrer">${t.website} \u2197</a></p>` : ""}
  <label>${t.subject}<input data-subject readonly lang="de" value="${esc(r?.letter.subject ?? "")}"></label><label>${t.german}<textarea data-key="german-text" data-german-text readonly lang="de">${esc(r?.letter.body ?? "")}</textarea></label><div class="checks"><label class="check"><input data-key="address-check" data-review="address" type="checkbox" ${this.#addressReviewed ? "checked" : ""} ${disabled}><span>${t.addressCheck}</span></label><label class="check"><input data-key="german-check" data-review="german" type="checkbox" ${this.#germanReviewed ? "checked" : ""} ${disabled}><span>${t.germanCheck}</span></label></div></div>
  ${this.#error ? `<p class="notice error" role="alert">${this.#errorText()}${this.#errorFile >= 0 && this.#files[this.#errorFile] ? ` ${t.fileProblem}: ${esc(this.#files[this.#errorFile].name)}` : ""}</p>` : ""}
  ${this.#working ? `<div class="loading" role="status"><strong>${t.working}</strong><p>${stages[this.#progress.stage]} \xB7 ${this.#progress.done} / ${this.#progress.total}</p><progress value="${pct}" max="100" aria-label="${t.working}"></progress></div>` : `<div class="actions" ${result ? "hidden" : ""}><button class="primary" data-key="prepare" data-prepare ${this.#ready() ? "" : "disabled"}>${t.prepare}</button></div>${!this.#ready() ? `<p class="muted">${this.#services ? t.checks : t.noService}</p>` : ""}`}
  ${result ? `<section class="card result" data-ready tabindex="-1" aria-label="${t.ready}"><h2>${t.ready}</h2><p class="notice success">${t.notSent}</p><p><strong>${esc(result.recipient)}</strong><br><span lang="de">${esc(result.subject)}</span></p><h3>${t.attachments}</h3>${result.attachments.map((a) => `<div class="attachment"><div><strong>${esc(a.filename)}</strong><p class="muted">${size(a.blob.size)}${a.pages ? ` \xB7 ${a.pages} ${a.pages === 1 ? t.page : t.pages}` : ""}</p></div>${output(a, t.download, a.kind)}</div>`).join("")}<p class="muted">${t.sizeHint}: ${size(result.totalAttachmentBytes)}. ${t.sizeNote}</p><div class="actions">${this.#canShare() ? `<button class="primary" data-share>${t.share}</button>` : output(result.email, t.eml, "email-draft", true)}</div><p class="muted">${this.#canShare() ? t.shareHint : t.emlHint}</p><details data-key="other"><summary>${t.other}</summary>${this.#canShare() ? output(result.email, t.eml, "email-draft") : ""}<p>${t.mailHint}</p><div class="actions"><a class="button" data-output="mailto" data-mailto href="${esc(result.mailto.href)}">${t.mail} \u2197</a><button data-copy>${t.copy}</button></div>${!result.mailto.bodyIncluded ? `<p class="notice">${t.long}</p>` : ""}<div class="actions">${output(result.archive, t.zip, "archive")}${output(result.companyList, t.companies, "companies")}</div></details></section>` : ""}
  ${this.#message ? `<p class="notice" role="status">${esc(this.#message)}</p>` : ""}</section>`);
  }
};
if (!customElements.get("azr-application-pack")) customElements.define("azr-application-pack", AzrApplicationPack);
export {
  AzrApplicationPack
};
