// src/ui.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var copy = (value) => structuredClone(value);
var languages = ["de", "en", "fr", "ru"];
var emit = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { schemaVersion: 1, ...copy(detail) } }));
var theme = `
:host{display:block;color:var(--azr-text,#102352);font:15px/1.6 var(--azr-font,system-ui,sans-serif)}*{box-sizing:border-box}h1,h2,h3,p{margin-top:0}h1{font-size:clamp(25px,4vw,34px);line-height:1.2;letter-spacing:-.04em}h2{font-size:21px;line-height:1.3}h3{font-size:17px}p{color:#50627f}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{border:1px solid #dce4ef;border-radius:15px;background:var(--azr-surface,#fff);padding:22px;min-width:0}.selected{border-color:#0878f9;background:#eef5ff}.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.between{justify-content:space-between}.muted{font-size:13px;color:#526782}.stack>*+*{margin-top:16px}button,input,textarea,select{font:inherit}button,.button{border:1px solid #bdcde1;background:#fff;color:#16335c;border-radius:9px;padding:10px 16px;min-height:44px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:8px}button.primary{background:var(--azr-accent,#0878f9);border-color:var(--azr-accent,#0878f9);color:white;font-weight:650}button:disabled{color:#63748c;background:#edf1f6;border-color:#dce3ed;cursor:default}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid #125bca;outline-offset:3px}label{display:block;margin-bottom:12px}input:not([type=checkbox]):not([type=radio]),select,textarea{display:block;width:100%;padding:10px 12px;border:1px solid #bdcde1;border-radius:8px;background:white;color:#102352;min-height:44px}textarea{min-height:110px;resize:vertical}input[type=checkbox],input[type=radio]{width:20px;height:20px;accent-color:#0878f9;flex-shrink:0}.check{display:flex;gap:12px;align-items:flex-start;margin:0}.check input{margin-top:5px}.check span{min-width:0}.body{white-space:pre-wrap;overflow-wrap:anywhere}details{margin-top:12px}summary{cursor:pointer;color:#075bce;min-height:44px;padding:8px 0}.notice{padding:15px;border-radius:10px;background:#eef5ff;color:#244978}.error{background:#fff0ed;color:#9a3327}.success{background:#e7f7ef;color:#116b49}a{color:#075bce;overflow-wrap:anywhere}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.badge{display:inline-block;padding:3px 10px;border-radius:20px;background:#e8eef8;font-size:12px}.preview{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:24px;border:1px solid #dce4ef;box-shadow:0 4px 20px #10235208}.preview h2{border-bottom:2px solid #102352;padding-bottom:12px}.list{list-style:none;padding:0;margin:0}.list>li+li{margin-top:12px}progress{width:100%;height:8px;accent-color:#13996b}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:640px){.grid{grid-template-columns:1fr}.card{padding:17px}.preview{padding:17px}.actions>button{flex:1}.row>label{width:100%}}@media print{button,.actions{display:none}}
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
  de: { title: "Anschreiben vorbereiten", intro: "\xDCbernimm deine Daten, passe den Text an und bereite deine Bewerbung vor.", profession: "Ausbildungsberuf", startingDate: "Gew\xFCnschter Beginn (freiwillig)", senderName: "Dein vollst\xE4ndiger Name", recipientName: "Firma / Empf\xE4nger", recipientEmail: "Empf\xE4nger-E-Mail", subject: "Betreff", body: "Dein Anschreiben", template: "Vorlage einsetzen", undo: "Vorherigen Text wiederherstellen", copy: "Text kopieren", copied: "Text kopiert.", copyError: "Kopieren nicht verf\xFCgbar. Bitte Text markieren und manuell kopieren.", inserted: "Vorlage eingef\xFCgt. Pr\xFCfe und erg\xE4nze deinen Text.", mail: "E-Mail-Programm \xF6ffnen", mailHint: "F\xFCge Lebenslauf und Nachweise im E-Mail-Programm als Dateien hinzu.", mailLong: "Bei langem Text werden nur Empf\xE4nger und Betreff \xFCbergeben. Kopiere den Text bitte selbst in die E-Mail.", check: "Empf\xE4nger- oder Absenderdaten wurden ge\xE4ndert. Pr\xFCfe den vorhandenen Brieftext.", inferred: "Die alte E-Mail war automatisch abgeleitet. Trage erst nach Pr\xFCfung die richtige Empf\xE4ngeradresse ein.", preview: "Anschreiben-Vorschau", empty: "Hier erscheint dein Anschreiben.", noService: "Der Dokumentexport ist hier noch nicht verbunden.", wait: "Dokument wird erstellt \u2026", success: "Dokument heruntergeladen.", failure: "Export fehlgeschlagen. Bitte erneut versuchen.", application: "Bewerbung", startTemplate: "ab {date}", startFallback: "zum n\xE4chstm\xF6glichen Zeitpunkt", companyFallback: "Ihnen", genericProfile: "Ich m\xF6chte den Beruf gr\xFCndlich erlernen und mich engagiert in Ihr Team einbringen.", subjectTemplate: "Bewerbung um einen Ausbildungsplatz als {profession}", bodyTemplate: "Sehr geehrte Damen und Herren,\n\nich m\xF6chte {start} eine Ausbildung als {profession} bei {company} beginnen.\n\n{profile}\n\nIm Anhang sende ich Ihnen meinen Lebenslauf. \xDCber eine Einladung zu einem pers\xF6nlichen Gespr\xE4ch freue ich mich.\n\nMit freundlichen Gr\xFC\xDFen\n{name}\n{phone}\n{email}" },
  en: { title: "Prepare your cover letter", intro: "Use your information, edit the text and prepare your application.", profession: "Training occupation", startingDate: "Desired start (optional)", senderName: "Your full name", recipientName: "Company / recipient", recipientEmail: "Recipient email", subject: "Subject", body: "Your cover letter", template: "Use template", undo: "Restore previous text", copy: "Copy text", copied: "Text copied.", copyError: "Copying is unavailable. Select and copy the text manually.", inserted: "Template inserted. Check and complete your text.", mail: "Open email application", mailHint: "Attach your CV and supporting documents in your email application.", mailLong: "For long text only recipient and subject are transferred. Copy the text into the email yourself.", check: "Recipient or sender details changed. Review your existing letter.", inferred: "The old email was automatically inferred. Enter the correct recipient address only after checking it.", preview: "Cover letter preview", empty: "Your cover letter will appear here.", noService: "The document exporter is not connected here yet.", wait: "Creating document \u2026", success: "Document downloaded.", failure: "Export failed. Please try again.", application: "Application", startTemplate: "from {date}", startFallback: "as soon as possible", companyFallback: "your company", genericProfile: "I would like to learn this occupation thoroughly and contribute actively to your team.", subjectTemplate: "Application for vocational training as {profession}", bodyTemplate: "Dear Sir or Madam,\n\nI would like to start vocational training as {profession} with {company} {start}.\n\n{profile}\n\nPlease find my CV attached. I would be pleased to attend an interview.\n\nYours faithfully,\n{name}\n{phone}\n{email}" },
  fr: { title: "Pr\xE9parer ta lettre de candidature", intro: "Reprends tes informations, adapte le texte et pr\xE9pare ta candidature.", profession: "M\xE9tier de formation", startingDate: "D\xE9but souhait\xE9 (facultatif)", senderName: "Ton nom complet", recipientName: "Entreprise / destinataire", recipientEmail: "E-mail du destinataire", subject: "Objet", body: "Ta lettre de candidature", template: "Utiliser le mod\xE8le", undo: "R\xE9tablir le texte pr\xE9c\xE9dent", copy: "Copier le texte", copied: "Texte copi\xE9.", copyError: "Copie indisponible. S\xE9lectionne et copie le texte manuellement.", inserted: "Mod\xE8le ins\xE9r\xE9. V\xE9rifie et compl\xE8te ton texte.", mail: "Ouvrir la messagerie", mailHint: "Ajoute le CV et les justificatifs en pi\xE8ces jointes dans ta messagerie.", mailLong: "Pour un texte long, seuls le destinataire et l\u2019objet sont transmis. Copie toi-m\xEAme le texte dans l\u2019e-mail.", check: "Les coordonn\xE9es ont chang\xE9. V\xE9rifie le texte d\xE9j\xE0 r\xE9dig\xE9.", inferred: "L\u2019ancienne adresse a \xE9t\xE9 d\xE9duite automatiquement. Saisis la bonne adresse apr\xE8s v\xE9rification.", preview: "Aper\xE7u de la lettre", empty: "Ta lettre appara\xEEtra ici.", noService: "Le service d\u2019export n\u2019est pas encore connect\xE9 ici.", wait: "Cr\xE9ation du document \u2026", success: "Document t\xE9l\xE9charg\xE9.", failure: "\xC9chec de l\u2019export. R\xE9essaie.", application: "Candidature", startTemplate: "\xE0 partir de {date}", startFallback: "d\xE8s que possible", companyFallback: "votre entreprise", genericProfile: "Je souhaite apprendre ce m\xE9tier de mani\xE8re approfondie et m\u2019investir dans votre \xE9quipe.", subjectTemplate: "Candidature \xE0 une formation de {profession}", bodyTemplate: "Madame, Monsieur,\n\nJe souhaite commencer une formation de {profession} au sein de {company} {start}.\n\n{profile}\n\nVous trouverez mon CV en pi\xE8ce jointe. Je vous remercie de l\u2019attention port\xE9e \xE0 ma candidature et reste disponible pour un entretien.\n\nCordialement,\n{name}\n{phone}\n{email}" },
  ru: { title: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0441\u043E\u043F\u0440\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E", intro: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0441\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435, \u043E\u0442\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439 \u0442\u0435\u043A\u0441\u0442 \u0438 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435.", profession: "\u041F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u044F \u0434\u043B\u044F \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F", startingDate: "\u0416\u0435\u043B\u0430\u0435\u043C\u043E\u0435 \u043D\u0430\u0447\u0430\u043B\u043E (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", senderName: "\u0422\u0432\u043E\u0451 \u043F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F", recipientName: "\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u044F / \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C", recipientEmail: "\u041F\u043E\u0447\u0442\u0430 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F", subject: "\u0422\u0435\u043C\u0430", body: "\u0422\u0432\u043E\u0451 \u0441\u043E\u043F\u0440\u043E\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E", template: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D", undo: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u0442\u0435\u043A\u0441\u0442", copy: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442", copied: "\u0422\u0435\u043A\u0441\u0442 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D.", copyError: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E. \u0412\u044B\u0434\u0435\u043B\u0438 \u0442\u0435\u043A\u0441\u0442 \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0432\u0440\u0443\u0447\u043D\u0443\u044E.", inserted: "\u0428\u0430\u0431\u043B\u043E\u043D \u0432\u0441\u0442\u0430\u0432\u043B\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0438 \u0434\u043E\u043F\u043E\u043B\u043D\u0438 \u0442\u0435\u043A\u0441\u0442.", mail: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0447\u0442\u043E\u0432\u0443\u044E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443", mailHint: "\u041F\u0440\u0438\u043B\u043E\u0436\u0438 \u0440\u0435\u0437\u044E\u043C\u0435 \u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u044E\u0449\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0432 \u043F\u043E\u0447\u0442\u043E\u0432\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435.", mailLong: "\u0414\u043B\u0438\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438: \u043E\u0442\u043A\u0440\u043E\u044E\u0442\u0441\u044F \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C \u0438 \u0442\u0435\u043C\u0430. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432 \u043F\u0438\u0441\u044C\u043C\u043E \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E.", check: "\u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F \u0438\u043B\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u0438\u0437\u043C\u0435\u043D\u0438\u043B\u0438\u0441\u044C. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0443\u0436\u0435 \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442.", inferred: "\u0421\u0442\u0430\u0440\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0431\u044B\u043B \u0432\u044B\u0432\u0435\u0434\u0435\u043D \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438. \u0412\u043D\u0435\u0441\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0443\u044E \u043F\u043E\u0447\u0442\u0443 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438.", preview: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043F\u0438\u0441\u044C\u043C\u0430", empty: "\u0417\u0434\u0435\u0441\u044C \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0442\u0432\u043E\u0451 \u043F\u0438\u0441\u044C\u043C\u043E.", noService: "\u0421\u0435\u0440\u0432\u0438\u0441 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D.", wait: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u2026", success: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441\u043A\u0430\u0447\u0430\u043D.", failure: "\u041E\u0448\u0438\u0431\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.", application: "\u0417\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435", startTemplate: "\u0441 {date}", startFallback: "\u043F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u0439 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438", companyFallback: "\u0432\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", genericProfile: "\u042F \u0445\u043E\u0447\u0443 \u043E\u0441\u043D\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043E\u0441\u0432\u043E\u0438\u0442\u044C \u044D\u0442\u0443 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u044E \u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E \u0443\u0447\u0430\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0432 \u0440\u0430\u0431\u043E\u0442\u0435 \u0432\u0430\u0448\u0435\u0439 \u043A\u043E\u043C\u0430\u043D\u0434\u044B.", subjectTemplate: "\u0417\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u043E \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u0438 {profession}", bodyTemplate: "\u0423\u0432\u0430\u0436\u0430\u0435\u043C\u044B\u0435 \u0434\u0430\u043C\u044B \u0438 \u0433\u043E\u0441\u043F\u043E\u0434\u0430!\n\n\u042F \u0445\u043E\u0447\u0443 \u043D\u0430\u0447\u0430\u0442\u044C \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435 \u043F\u043E \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u0438 {profession} \u0432 {company} {start}.\n\n{profile}\n\n\u041F\u0440\u0438\u043B\u0430\u0433\u0430\u044E \u0441\u0432\u043E\u0451 \u0440\u0435\u0437\u044E\u043C\u0435. \u0411\u0443\u0434\u0443 \u0436\u0434\u0430\u0442\u044C \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u0441\u043E\u0431\u0435\u0441\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435.\n\n\u0421 \u0443\u0432\u0430\u0436\u0435\u043D\u0438\u0435\u043C,\n{name}\n{phone}\n{email}" }
};

// src/index.js
var fields = ["profession", "startingDate", "senderName", "recipientName", "recipientEmail", "subject", "body"];
var placeholders = ["profession", "company", "start", "profile", "name", "phone", "email"];
function normalize(v) {
  if (!v || v.schemaVersion !== 1) throw new TypeError("Invalid letter");
  const out = { schemaVersion: 1 };
  for (const key of fields) {
    const text = v[key] ?? "";
    if (typeof text !== "string" || text.length > (key === "body" ? 3e4 : 1e3)) throw new TypeError("Invalid letter field");
    out[key] = text;
  }
  if (/[\r\n]/.test(out.recipientEmail)) throw new TypeError("Invalid recipient");
  return out;
}
function templates(value) {
  if (value === null) return null;
  const result = {};
  for (const lang of languages) {
    if (!value?.[lang]) throw new TypeError("Template translations required");
    result[lang] = {};
    for (const key of ["subject", "body"]) {
      const text = value[lang][key];
      if (typeof text !== "string" || text.length > 3e4) throw new TypeError("Invalid template");
      for (const match of text.matchAll(/\{([^{}]*)\}/g)) if (!placeholders.includes(match[1])) throw new TypeError("Unknown template placeholder");
      result[lang][key] = text;
    }
  }
  return result;
}
var fill = (text, values) => text.replace(/\{([^{}]*)\}/g, (_, key) => values[key] ?? "").replace(/\n{3,}/g, "\n\n").trim();
var AzrLetterEditor = class extends ElementBase {
  #documentLanguage = null;
  #recipientControlled = false;
  #presentation = "full";
  #professions = [];
  #data = normalize({ schemaVersion: 1 });
  #cv = null;
  #company = null;
  #templates = null;
  #services = null;
  #undo = null;
  #review = false;
  #message = "";
  #error = false;
  #exporting = false;
  #preview = false;
  #operation = 0;
  #urls = /* @__PURE__ */ new Map();
  upgradeProperties = ["letterData", "cvData", "company", "templates", "services", "language", "busy", "documentLanguage", "recipientControlled", "presentation", "professions"];
  get documentLanguage() {
    return this.#documentLanguage ?? this.language;
  }
  set documentLanguage(v) {
    if (v !== null && !Object.hasOwn(words, v)) throw new TypeError("Invalid document language");
    this.#documentLanguage = v;
    this.render();
  }
  get recipientControlled() {
    return this.#recipientControlled;
  }
  set recipientControlled(v) {
    if (typeof v !== "boolean") throw new TypeError("recipientControlled must be boolean");
    this.#recipientControlled = v;
    this.render();
  }
  get presentation() {
    return this.#presentation;
  }
  set presentation(v) {
    if (!["full", "editor"].includes(v)) throw new TypeError("Invalid presentation");
    this.#presentation = v;
    this.render();
  }
  get professions() {
    return copy(this.#professions);
  }
  set professions(v) {
    if (!Array.isArray(v) || v.length > 100 || v.some((x) => !x || typeof x.value !== "string" || typeof x.label !== "string" || x.value.length > 200 || x.label.length > 200)) throw new TypeError("Invalid professions");
    this.#professions = copy(v);
    this.render();
  }
  get letterData() {
    return copy(this.#data);
  }
  set letterData(v) {
    const next = normalize(v);
    if (JSON.stringify(next) !== JSON.stringify(this.#data)) {
      this.#data = next;
      this.#undo = null;
    }
    this.render();
  }
  get cvData() {
    return copy(this.#cv);
  }
  set cvData(v) {
    if (v !== null && (!v || v.schemaVersion !== 1 || !v.personal)) throw new TypeError("Invalid CV input");
    const before = this.#cvName();
    if (v) {
      const out = { schemaVersion: 1, personal: {}, profile: v.profile ?? "" };
      for (const key of ["firstName", "lastName", "email", "phone", "address", "postalCode", "city", "country"]) {
        if (typeof (v.personal[key] ?? "") !== "string") throw new TypeError("Invalid CV field");
        out.personal[key] = v.personal[key] ?? "";
      }
      if (typeof out.profile !== "string" || out.profile.length > 12e3) throw new TypeError("Invalid CV profile");
      this.#cv = out;
    } else this.#cv = null;
    if (before && before !== this.#cvName() && this.#data.body) this.#review = true;
    this.render();
  }
  get company() {
    return copy(this.#company);
  }
  set company(v) {
    if (v === null) {
      this.#company = null;
      this.render();
      return;
    }
    if (!v || typeof v.id !== "string" || typeof v.name !== "string") throw new TypeError("Invalid company");
    const next = { id: v.id, name: v.name };
    for (const key of ["email", "emailStatus", "city", "postalCode", "address"]) {
      if (typeof (v[key] ?? "") !== "string") throw new TypeError("Invalid company field");
      next[key] = v[key] ?? "";
    }
    if (/[\r\n]/.test(next.email)) throw new TypeError("Invalid company email");
    if (this.#company?.id !== next.id) {
      if (!this.#recipientControlled) {
        this.#data.recipientName = next.name;
        this.#data.recipientEmail = next.emailStatus === "legacy-inferred" ? "" : next.email;
      }
      this.#review = Boolean(this.#data.body) && !this.#recipientControlled;
    }
    this.#company = next;
    this.render();
  }
  get templates() {
    return copy(this.#templates);
  }
  set templates(v) {
    this.#templates = templates(v);
    this.render();
  }
  get services() {
    return this.#services;
  }
  set services(v) {
    if (v !== null && (!v || typeof v.exportDocument !== "function")) throw new TypeError("Invalid export service");
    this.#services = v;
    this.render();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#operation++;
    this.#exporting = false;
    for (const [url, timer] of this.#urls) {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    this.#urls.clear();
  }
  #cvName() {
    return [this.#cv?.personal.firstName, this.#cv?.personal.lastName].filter(Boolean).join(" ");
  }
  #sender() {
    return this.#data.senderName.trim() || this.#cvName();
  }
  #ready() {
    return Boolean(this.#sender() && this.#data.profession.trim() && this.#data.subject.trim() && this.#data.body.trim());
  }
  #notify() {
    emit(this, "azr:letter-change", { letterData: this.letterData });
    this.render();
  }
  #apply() {
    if (!this.#sender() || !this.#data.profession.trim()) {
      this.shadowRoot.querySelector("[data-field=profession]")?.reportValidity();
      this.shadowRoot.querySelector("[data-field=senderName]")?.reportValidity();
      return;
    }
    const t = words[this.documentLanguage], template = this.#templates?.[this.documentLanguage] ?? { subject: t.subjectTemplate, body: t.bodyTemplate }, p = this.#cv?.personal ?? {};
    const values = { profession: this.#data.profession, company: this.#data.recipientName || t.companyFallback, start: this.#data.startingDate ? fill(t.startTemplate, { date: this.#data.startingDate }) : t.startFallback, profile: this.#cv?.profile?.trim() || t.genericProfile, name: this.#sender(), phone: p.phone ?? "", email: p.email ?? "" };
    this.#undo = { subject: this.#data.subject, body: this.#data.body };
    this.#data.subject = fill(template.subject, values);
    this.#data.body = fill(template.body, values);
    this.#review = false;
    this.#message = words[this.language].inserted;
    this.#error = false;
    this.#notify();
  }
  #mail() {
    if (!this.#ready() || !this.#data.recipientEmail || /[\r\n]/.test(this.#data.recipientEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.#data.recipientEmail)) return { href: "", long: false };
    const prefix = "mailto:" + encodeURIComponent(this.#data.recipientEmail) + "?subject=" + encodeURIComponent(this.#data.subject), full = prefix + "&body=" + encodeURIComponent(this.#data.body);
    return { href: full.length <= 1800 ? full : prefix, long: full.length > 1800 };
  }
  #document() {
    const p = this.#cv?.personal ?? {};
    return { title: this.#sender(), subtitle: this.#data.subject, contact: [p.address, [p.postalCode, p.city].filter(Boolean).join(" "), p.country, p.email, p.phone].filter(Boolean).join(" \xB7 "), sections: [{ heading: "", body: [this.#data.recipientName, this.#company?.address, [this.#company?.postalCode, this.#company?.city].filter(Boolean).join(" ")].filter(Boolean).join("\n") }, { heading: "", body: [p.city, new Intl.DateTimeFormat(this.documentLanguage, { dateStyle: "long", timeZone: "Europe/Berlin" }).format(/* @__PURE__ */ new Date())].filter(Boolean).join(", ") }, { heading: "", body: this.#data.body }] };
  }
  async #copy() {
    try {
      await navigator.clipboard.writeText(this.#data.body);
      this.#message = words[this.language].copied;
      this.#error = false;
      emit(this, "azr:copy-status", { status: "success" });
    } catch {
      this.#message = words[this.language].copyError;
      this.#error = true;
      emit(this, "azr:copy-status", { status: "error" });
    }
    this.render();
  }
  async #export(format) {
    if (this.busy || this.#exporting || !this.#services || !this.#ready()) return;
    if (!this.shadowRoot.querySelector("form").reportValidity()) return;
    const operation = ++this.#operation, actionId = crypto.randomUUID(), t = words[this.language];
    this.#exporting = true;
    this.#message = t.wait;
    this.#error = false;
    this.render();
    emit(this, "azr:export-status", { actionId, format, status: "pending" });
    try {
      const result = await this.#services.exportDocument({ format, document: this.#document(), language: this.documentLanguage, filename: words[this.documentLanguage].application + "_" + this.#sender() });
      if (operation !== this.#operation) return;
      if (!result?.blob || typeof result.blob.arrayBuffer !== "function" || typeof result.filename !== "string") throw new TypeError("Invalid export result");
      const url = URL.createObjectURL(result.blob), a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      this.shadowRoot.append(a);
      a.click();
      a.remove();
      this.#urls.set(url, setTimeout(() => {
        URL.revokeObjectURL(url);
        this.#urls.delete(url);
      }, 3e4));
      this.#message = t.success;
      emit(this, "azr:export-status", { actionId, format, status: "success" });
    } catch (e) {
      if (operation !== this.#operation) return;
      this.#message = t.failure + " " + e.message;
      this.#error = true;
      emit(this, "azr:export-status", { actionId, format, status: "error", message: String(e.message) });
    } finally {
      if (operation === this.#operation) {
        this.#exporting = false;
        this.render();
      }
    }
  }
  handle(e) {
    const target = e.target.closest("input,textarea,button");
    if (!target || this.busy || this.#exporting) return;
    if (e.type === "input" && target.dataset.field) {
      this.#data[target.dataset.field] = target.value;
      this.#message = "";
      this.#error = false;
      this.#notify();
    }
    if (e.type !== "click") return;
    if (target.dataset.template !== void 0) this.#apply();
    if (target.dataset.undo !== void 0 && this.#undo) {
      Object.assign(this.#data, this.#undo);
      this.#undo = null;
      this.#review = true;
      this.#notify();
    }
    if (target.dataset.copyText !== void 0 && this.#data.body) this.#copy();
    if (target.dataset.preview !== void 0) {
      this.#preview = !this.#preview;
      this.render();
    }
    if (target.dataset.export) this.#export(target.dataset.export);
  }
  render() {
    const t = words[this.language], locked = this.busy || this.#exporting, disabled = locked ? "disabled" : "", mail = this.#mail();
    const input = (key, extra = "") => `<label>${t[key]}<input data-key="${key}" data-field="${key}" value="${esc(this.#data[key])}" maxlength="1000" ${key === "profession" && this.#professions.length ? 'list="occupation-suggestions"' : ""} ${extra}></label>`;
    this.paint(`<style>.letter-grid{display:grid;grid-template-columns:${this.#presentation === "editor" ? "minmax(0,1fr)" : "minmax(0,1.1fr) minmax(0,.9fr)"};gap:22px}fieldset{padding:0;border:0;margin:0;min-width:0}.preview-toggle{display:none}.letter-preview[hidden]{display:none}.letter-preview{align-self:start;position:sticky;top:16px}@media(max-width:800px){.letter-grid{grid-template-columns:1fr}.letter-preview{position:static}.preview-toggle{display:flex;width:100%;margin-bottom:12px}.preview-content[data-open=false]{display:none}}</style><section lang="${this.language}"><h1>${t.title}</h1><p>${t.intro}</p>${this.#documentLanguage && this.#documentLanguage !== this.language ? `<p class="notice" data-document-language>${{ de: "Die Bewerbung wird auf Deutsch vorbereitet. Pr\xFCfe deine eigenen Texte.", en: "Your application template is in German. Review your own text before sending.", fr: "Le mod\xE8le de candidature est en allemand. Relis tes propres textes avant l\u2019envoi.", ru: "\u0428\u0430\u0431\u043B\u043E\u043D \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u044F \u2014 \u043D\u0430 \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u043C. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u0435\u0440\u0435\u0434 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u043E\u0439." }[this.language]}</p>` : ""}${this.#review ? `<p class="notice">${t.check}</p>` : ""}<div class="letter-grid"><div><form><fieldset ${disabled}><div class="grid">${input("profession", "required")}<datalist id="occupation-suggestions">${this.#professions.map((x) => `<option value="${esc(x.value)}">${esc(x.label)}</option>`).join("")}</datalist>${input("startingDate")}</div>${!this.#cvName() ? input("senderName", "required") : ""}<div class="grid">${input("recipientName")}${input("recipientEmail", 'type="email"')}</div>${this.#company?.emailStatus === "legacy-inferred" ? `<p class="notice">${t.inferred}</p>` : ""}<div class="actions" style="margin-bottom:18px"><button type="button" class="primary" data-key="template" data-template ${!this.#sender() || !this.#data.profession.trim() ? "disabled" : ""}>${t.template}</button>${this.#undo ? `<button type="button" data-undo>${t.undo}</button>` : ""}</div>${input("subject", "required")}<label>${t.body}<textarea data-key="body" data-field="body" style="min-height:320px" maxlength="30000" required>${esc(this.#data.body)}</textarea></label></fieldset></form>${this.#presentation === "editor" && this.#message ? `<p class="notice ${this.#error ? "error" : "success"}" role="${this.#error ? "alert" : "status"}">${esc(this.#message)}</p>` : ""}</div><aside class="card letter-preview" ${this.#presentation === "editor" ? "hidden" : ""}><button type="button" class="preview-toggle" data-preview aria-controls="letter-preview" aria-expanded="${this.#preview}">${t.preview}</button><div id="letter-preview" class="preview-content" data-open="${this.#preview}"><div class="preview"><h2>${esc(this.#data.subject || t.application)}</h2><p>${esc(this.#data.recipientName)}</p><div class="body">${esc(this.#data.body || t.empty)}</div></div></div><div class="actions"><button type="button" data-copy-text ${locked || !this.#data.body ? "disabled" : ""}>${t.copy}</button>${["pdf", "docx"].map((f) => `<button type="button" data-key="export-${f}" data-export="${f}" ${locked || !this.#services || !this.#ready() ? "disabled" : ""}>${f.toUpperCase()} \u2193</button>`).join("")}</div><div class="actions">${mail.href && !locked ? `<a class="button primary" data-mailto href="${esc(mail.href)}">${t.mail} \u2197</a>` : `<button type="button" disabled>${t.mail}</button>`}</div><p class="muted">${t.mailHint}</p>${mail.long ? `<p class="notice" data-mail-long>${t.mailLong}</p>` : ""}${!this.#services ? `<p class="notice">${t.noService}</p>` : ""}${this.#message ? `<p class="notice ${this.#error ? "error" : "success"}" role="${this.#error ? "alert" : "status"}">${esc(this.#message)}</p>` : ""}</aside></div></section>`);
  }
};
if (!customElements.get("azr-letter-editor")) customElements.define("azr-letter-editor", AzrLetterEditor);
export {
  AzrLetterEditor
};
