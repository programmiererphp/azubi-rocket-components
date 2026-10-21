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
var words = { de: ["Lokale Inhalte & Vorlagen", "Bearbeite deinen lokalen Portalentwurf. \xC4nderungen gelten auf diesem Ger\xE4t. Eine Ver\xF6ffentlichung f\xFCr alle Nutzer erfolgt \xFCber den gepr\xFCften Projekt-Deploy.", "Bereich", "Leitfaden", "FAQ", "Firmen", "Quiz", "Infoseiten", "Anschreiben-Vorlagen", "Design", "Layout", "\xC4nderungen pr\xFCfen", "\xDCbernahme vorbereiten \u2026", "Vorschau der gepr\xFCften \xC4nderungen", "Lokalen Entwurf \xFCbernehmen", "Vorherigen Stand wiederherstellen", "Aktive Konfiguration als XML", "XML oder Block laden", "XML-Schema herunterladen", "Datenschema herunterladen", "Die \xDCbernahme ersetzt die aktiven lokalen Werte.", "\xC4nderungen \xFCbernommen.", "Vorheriger Stand wiederhergestellt.", "Pr\xFCfung fehlgeschlagen:", "Validierungsservice noch nicht verbunden.", "Konfiguration wird geladen \u2026", "Vorlagensprache", "Betreff", "Text", "Akzentfarbe", "Fl\xE4chenfarbe", "Textfarbe", "Abst\xE4nde", "Normal", "Kompakt", "FAQ", "Firmen", "Quizfragen", "Infokarten", "Aktuell", "Vorschau", "Nicht \xFCbernommene \xC4nderungen bleiben im Editor erhalten.", "XML wurde exportiert."], en: ["Local content & templates", "Edit your local portal draft. Changes apply on this device. Publishing for everyone is a separate verified project deployment.", "Section", "Guide", "FAQ", "Companies", "Quiz", "Information pages", "Cover letter templates", "Design", "Layout", "Validate changes", "Preparing preview \u2026", "Validated change preview", "Apply local draft", "Restore previous version", "Active configuration as XML", "Load XML or block", "Download XML schema", "Download data schema", "Applying replaces the active local values.", "Changes applied.", "Previous version restored.", "Validation failed:", "Validation service is not connected yet.", "Loading configuration \u2026", "Template language", "Subject", "Text", "Accent colour", "Surface colour", "Text colour", "Spacing", "Comfortable", "Compact", "FAQ", "Companies", "Quiz questions", "Information cards", "Current", "Preview", "Unapplied changes stay in the editor.", "XML exported."], fr: ["Contenus et mod\xE8les locaux", "Modifie le brouillon local du portail. Les changements concernent cet appareil. La publication pour tous passe par un d\xE9ploiement v\xE9rifi\xE9.", "Rubrique", "Parcours", "FAQ", "Entreprises", "Bilan", "Pages d\u2019information", "Mod\xE8les de lettre", "Design", "Mise en page", "V\xE9rifier les changements", "Pr\xE9paration de l\u2019aper\xE7u \u2026", "Aper\xE7u des changements v\xE9rifi\xE9s", "Appliquer le brouillon local", "Restaurer la version pr\xE9c\xE9dente", "Configuration active en XML", "Charger un XML ou bloc", "T\xE9l\xE9charger le sch\xE9ma XML", "T\xE9l\xE9charger le sch\xE9ma de donn\xE9es", "L\u2019application remplace les valeurs locales actives.", "Changements appliqu\xE9s.", "Version pr\xE9c\xE9dente restaur\xE9e.", "\xC9chec de la v\xE9rification :", "Le service de validation n\u2019est pas encore connect\xE9.", "Chargement de la configuration \u2026", "Langue du mod\xE8le", "Objet", "Texte", "Couleur d\u2019accent", "Couleur des surfaces", "Couleur du texte", "Espacement", "Normal", "Compact", "FAQ", "Entreprises", "Questions du bilan", "Fiches d\u2019information", "Actuel", "Aper\xE7u", "Les changements non appliqu\xE9s restent dans l\u2019\xE9diteur.", "XML export\xE9."], ru: ["\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0442\u0435\u043A\u0441\u0442\u044B \u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u044B", "\u0418\u0437\u043C\u0435\u043D\u044F\u0439 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u043F\u043E\u0440\u0442\u0430\u043B\u0430. \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435. \u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u043C \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u043C \u0440\u0430\u0437\u0432\u0451\u0440\u0442\u044B\u0432\u0430\u043D\u0438\u0435\u043C.", "\u0420\u0430\u0437\u0434\u0435\u043B", "\u041F\u043B\u0430\u043D", "FAQ", "\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", "\u041E\u043F\u0440\u043E\u0441", "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B", "\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u043F\u0438\u0441\u0435\u043C", "\u0414\u0438\u0437\u0430\u0439\u043D", "\u041C\u0430\u043A\u0435\u0442", "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u2026", "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0445 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439", "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A", "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0443\u044E \u0432\u0435\u0440\u0441\u0438\u044E", "\u0410\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u0432 XML", "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C XML \u0438\u043B\u0438 \u0431\u043B\u043E\u043A", "\u0421\u043A\u0430\u0447\u0430\u0442\u044C XML-\u0441\u0445\u0435\u043C\u0443", "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0441\u0445\u0435\u043C\u0443 \u0434\u0430\u043D\u043D\u044B\u0445", "\u041F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u043C\u0435\u043D\u0438\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F.", "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u044B.", "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430.", "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438:", "\u0421\u0435\u0440\u0432\u0438\u0441 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D.", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438 \u2026", "\u042F\u0437\u044B\u043A \u0448\u0430\u0431\u043B\u043E\u043D\u0430", "\u0422\u0435\u043C\u0430", "\u0422\u0435\u043A\u0441\u0442", "\u0410\u043A\u0446\u0435\u043D\u0442\u043D\u044B\u0439 \u0446\u0432\u0435\u0442", "\u0426\u0432\u0435\u0442 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0435\u0439", "\u0426\u0432\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u0430", "\u041E\u0442\u0441\u0442\u0443\u043F\u044B", "\u041E\u0431\u044B\u0447\u043D\u044B\u0435", "\u041A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u044B\u0435", "FAQ", "\u041A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", "\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u043E\u043F\u0440\u043E\u0441\u0430", "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438", "\u0421\u0435\u0439\u0447\u0430\u0441", "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440", "\u041D\u0435\u043F\u0440\u0438\u043C\u0435\u043D\u0451\u043D\u043D\u044B\u0435 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435.", "XML \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D."] };

// src/schema-data.js
var schema = { "$schema": "https://json-schema.org/draft/2020-12/schema", "$id": "https://programmiererphp.github.io/azubi-rocket-components/services/content-schema/schema.json", "title": "Azubi Rocket editable portal configuration v1", "type": "object", "properties": { "schemaVersion": { "const": 1 }, "content": { "type": "object", "properties": { "guide": { "type": "object", "properties": { "schemaVersion": { "const": 1 }, "items": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "stage": { "enum": ["orientation", "preparation", "start"] }, "location": { "enum": ["all", "deutschland", "ausland"] }, "title": { "$ref": "#/$defs/LocalizedFull" }, "body": { "$ref": "#/$defs/LocalizedFull" } }, "required": ["id", "stage", "location", "title", "body"], "additionalProperties": false }, "maxItems": 200, "minItems": 0 } }, "required": ["schemaVersion", "items"], "additionalProperties": false }, "faq": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "category": { "type": "string", "maxLength": 100 }, "question": { "$ref": "#/$defs/Localized" }, "answer": { "$ref": "#/$defs/Localized" }, "sourceUrl": { "type": "string", "pattern": "^https://", "maxLength": 3e3 } }, "required": ["id", "category", "question", "answer"], "additionalProperties": false }, "maxItems": 2e3, "minItems": 0 }, "companies": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "name": { "type": "string", "maxLength": 1e3 }, "category": { "enum": ["hotel", "care", "educator", "sales"] }, "email": { "type": "string", "maxLength": 254 }, "emailStatus": { "enum": ["unknown", "legacy-literal", "legacy-inferred", "verified"] }, "website": { "type": "string", "maxLength": 3e3 }, "city": { "type": "string", "maxLength": 1e3 }, "postalCode": { "type": "string", "maxLength": 100 }, "address": { "type": "string", "maxLength": 1e3 }, "phone": { "type": "string", "maxLength": 100 } }, "required": ["id", "name", "category", "email", "emailStatus"], "additionalProperties": false }, "maxItems": 1e4, "minItems": 0 }, "quizzes": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "title": { "$ref": "#/$defs/Localized" }, "intro": { "$ref": "#/$defs/Localized" }, "questions": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "text": { "$ref": "#/$defs/Localized" }, "options": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "text": { "$ref": "#/$defs/Localized" }, "points": { "type": "number", "minimum": 0, "maximum": 1e3 } }, "required": ["id", "text", "points"], "additionalProperties": false }, "maxItems": 8, "minItems": 2 }, "explanation": { "$ref": "#/$defs/Localized" } }, "required": ["id", "text", "options"], "additionalProperties": false }, "maxItems": 200, "minItems": 1 }, "results": { "type": "array", "items": { "type": "object", "properties": { "minRatio": { "type": "number", "minimum": 0, "maximum": 1 }, "maxRatio": { "type": "number", "minimum": 0, "maximum": 1 }, "title": { "$ref": "#/$defs/Localized" }, "body": { "$ref": "#/$defs/Localized" } }, "required": ["minRatio", "maxRatio", "title", "body"], "additionalProperties": false }, "maxItems": 20, "minItems": 1 } }, "required": ["id", "title", "intro", "questions", "results"], "additionalProperties": false }, "maxItems": 20, "minItems": 0 }, "resources": { "type": "object", "additionalProperties": { "type": "object", "properties": { "title": { "$ref": "#/$defs/Localized" }, "intro": { "$ref": "#/$defs/Localized" }, "cards": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string", "pattern": "^[A-Za-z0-9-]{1,80}$" }, "category": { "type": "string", "maxLength": 100 }, "title": { "$ref": "#/$defs/Localized" }, "body": { "$ref": "#/$defs/Localized" }, "links": { "type": "array", "items": { "type": "object", "properties": { "label": { "$ref": "#/$defs/Localized" }, "url": { "type": "string", "pattern": "^https://", "maxLength": 3e3 } }, "required": ["label", "url"], "additionalProperties": false }, "maxItems": 30, "minItems": 0 } }, "required": ["id", "category", "title", "body", "links"], "additionalProperties": false }, "maxItems": 400, "minItems": 0 }, "categoryLabels": { "type": "object", "additionalProperties": { "$ref": "#/$defs/Localized" }, "maxProperties": 100 } }, "required": ["title", "intro", "cards"], "additionalProperties": false }, "maxProperties": 20 }, "letterTemplates": { "type": "object", "properties": { "de": { "type": "object", "properties": { "subject": { "type": "string", "maxLength": 1e3 }, "body": { "type": "string", "maxLength": 3e4 } }, "required": ["subject", "body"], "additionalProperties": false }, "en": { "type": "object", "properties": { "subject": { "type": "string", "maxLength": 1e3 }, "body": { "type": "string", "maxLength": 3e4 } }, "required": ["subject", "body"], "additionalProperties": false }, "fr": { "type": "object", "properties": { "subject": { "type": "string", "maxLength": 1e3 }, "body": { "type": "string", "maxLength": 3e4 } }, "required": ["subject", "body"], "additionalProperties": false }, "ru": { "type": "object", "properties": { "subject": { "type": "string", "maxLength": 1e3 }, "body": { "type": "string", "maxLength": 3e4 } }, "required": ["subject", "body"], "additionalProperties": false } }, "required": ["de", "en", "fr", "ru"], "additionalProperties": false } }, "required": ["guide", "faq", "companies", "quizzes", "resources", "letterTemplates"], "additionalProperties": false }, "design": { "type": "object", "properties": { "accent": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }, "surface": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }, "text": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" } }, "required": ["accent", "surface", "text"], "additionalProperties": false }, "layout": { "type": "object", "properties": { "density": { "enum": ["comfortable", "compact"] } }, "required": ["density"], "additionalProperties": false } }, "required": ["schemaVersion", "content", "design", "layout"], "additionalProperties": false, "$defs": { "Localized": { "type": "object", "required": ["de"], "properties": { "de": { "type": "string", "maxLength": 3e4, "minLength": 1, "pattern": "\\S" }, "en": { "type": "string", "maxLength": 3e4 }, "fr": { "type": "string", "maxLength": 3e4 }, "ru": { "type": "string", "maxLength": 3e4 } }, "additionalProperties": false }, "LocalizedFull": { "type": "object", "required": ["de", "en", "fr", "ru"], "properties": { "de": { "type": "string", "maxLength": 3e4, "minLength": 1, "pattern": "\\S" }, "en": { "type": "string", "maxLength": 3e4 }, "fr": { "type": "string", "maxLength": 3e4 }, "ru": { "type": "string", "maxLength": 3e4 } }, "additionalProperties": false } } };
var xsd = '<?xml version="1.0" encoding="UTF-8"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">\n <xs:annotation><xs:documentation>Azubi Rocket configuration v1. The JSON text in each section MUST additionally validate against schema.json. Content keys: guide,faq,companies,quizzes,resources,letterTemplates. Plain text only, no DTD or entities. Root azr-site is a complete snapshot; azr-block merges one area or one content key into the current snapshot before full validation.</xs:documentation></xs:annotation>\n <xs:element name="azr-site"><xs:complexType><xs:sequence><xs:element name="content" type="xs:string"/><xs:element name="design" type="xs:string"/><xs:element name="layout" type="xs:string"/></xs:sequence><xs:attribute name="schemaVersion" type="xs:positiveInteger" use="required" fixed="1"/></xs:complexType></xs:element>\n <xs:element name="azr-block"><xs:complexType mixed="true"><xs:attribute name="schemaVersion" type="xs:positiveInteger" use="required" fixed="1"/><xs:attribute name="area" use="required"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="content"/><xs:enumeration value="design"/><xs:enumeration value="layout"/></xs:restriction></xs:simpleType></xs:attribute><xs:attribute name="key"><xs:simpleType><xs:restriction base="xs:string"><xs:enumeration value="guide"/><xs:enumeration value="faq"/><xs:enumeration value="companies"/><xs:enumeration value="quizzes"/><xs:enumeration value="resources"/><xs:enumeration value="letterTemplates"/></xs:restriction></xs:simpleType></xs:attribute></xs:complexType></xs:element>\n</xs:schema>\n';

// src/schema.js
var clone = (v) => structuredClone(v);
var sections = ["guide", "faq", "companies", "quizzes", "resources", "letterTemplates"];
function check(rule, value, path = "$", depth = 0) {
  if (depth > 40) throw TypeError(path + ": nesting limit");
  if (rule.$ref) return check(schema.$defs[rule.$ref.split("/").at(-1)], value, path, depth + 1);
  if (rule.const !== void 0 && value !== rule.const) throw TypeError(path + ": unsupported version");
  if (rule.enum && !rule.enum.includes(value)) throw TypeError(path + ": unsupported value");
  if (rule.type) {
    const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    if (type !== rule.type) throw TypeError(path + ": expected " + rule.type);
    if (type === "object") {
      const keys = Object.keys(value);
      if (keys.length > (rule.maxProperties ?? 1e4)) throw TypeError(path + ": too many properties");
      for (const k of rule.required ?? []) if (!Object.hasOwn(value, k)) throw TypeError(path + "." + k + ": required");
      for (const [k, v] of Object.entries(value)) {
        if (["__proto__", "prototype", "constructor"].includes(k)) throw TypeError(path + ": forbidden property");
        const child = rule.properties?.[k] ?? rule.additionalProperties;
        if (child === false || child === void 0) throw TypeError(path + "." + k + ": unknown property");
        if (child !== true) check(child, v, path + "." + k, depth + 1);
      }
    }
    if (type === "array") {
      if (value.length > (rule.maxItems ?? 1e4) || value.length < (rule.minItems ?? 0)) throw TypeError(path + ": invalid item count");
      for (let i = 0; i < value.length; i++) check(rule.items, value[i], path + "[" + i + "]", depth + 1);
    }
    if (type === "string" && (value.length > (rule.maxLength ?? 1e5) || value.length < (rule.minLength ?? 0) || rule.pattern && !new RegExp(rule.pattern).test(value))) throw TypeError(path + ": invalid text");
    if (type === "number" && (!Number.isFinite(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) throw TypeError(path + ": invalid number");
  }
}
function unique(rows, path) {
  const seen = /* @__PURE__ */ new Set();
  for (const x of rows) {
    if (seen.has(x.id)) throw TypeError(path + ": duplicate ID");
    seen.add(x.id);
  }
}
function safeUrl(value, httpsOnly = false) {
  if (!value) return;
  const u = new URL(value);
  if (!(httpsOnly ? ["https:"] : ["https:", "http:"]).includes(u.protocol) || u.username || u.password) throw TypeError("Unsafe content URL");
}
function validateDocument(value) {
  check(schema, value);
  const out = clone(value), c = out.content;
  unique(c.guide.items, "guide");
  unique(c.faq, "faq");
  unique(c.companies, "companies");
  unique(c.quizzes, "quizzes");
  for (const x of c.faq) safeUrl(x.sourceUrl, true);
  for (const x of c.companies) {
    safeUrl(x.website);
    if (/[\r\n]/.test(x.email)) throw TypeError("Invalid company email");
  }
  for (const q of c.quizzes) {
    unique(q.questions, "questions");
    for (const question of q.questions) unique(question.options, "options");
    if (!q.questions.some((x) => x.options.some((o) => o.points > 0))) throw TypeError("Quiz maximum is zero");
    for (const r of q.results) if (r.minRatio > r.maxRatio) throw TypeError("Invalid result range");
  }
  for (const resource of Object.values(c.resources)) {
    unique(resource.cards, "resources");
    for (const card of resource.cards) for (const link of card.links) safeUrl(link.url, true);
  }
  for (const text of Object.values(c.letterTemplates).flatMap((t) => [t.subject, t.body])) for (const m of text.matchAll(/\{([^{}]*)\}/g)) if (!["profession", "company", "start", "profile", "name", "phone", "email"].includes(m[1])) throw TypeError("Unknown letter placeholder");
  return out;
}
function envelope(v) {
  if (!v || v.schemaVersion !== 1 || !v.content || !v.design || !v.layout) throw TypeError("Invalid portal document");
  return clone(v);
}
function serializeXml(value) {
  const v = envelope(value), doc = document.implementation.createDocument("", "azr-site");
  doc.documentElement.setAttribute("schemaVersion", "1");
  for (const area of ["content", "design", "layout"]) {
    const node = doc.createElement(area);
    node.textContent = JSON.stringify(v[area], null, 2);
    doc.documentElement.append(node);
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(doc);
}
function parseXml(text, current) {
  if (typeof text !== "string" || text.length > 5 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(text)) throw TypeError("XML size or DTD/entity not allowed");
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw TypeError("Invalid XML");
  const root = doc.documentElement;
  if (root.namespaceURI || root.getAttribute("schemaVersion") !== "1") throw TypeError("Unsupported XML schema version");
  if (doc.createTreeWalker(doc, NodeFilter.SHOW_PROCESSING_INSTRUCTION).nextNode()) throw TypeError("XML processing instructions not allowed");
  const payload = (node) => {
    if (node.children.length) throw TypeError("Only JSON text is allowed inside XML sections");
    return JSON.parse(node.textContent);
  };
  const attrs = (allowed) => {
    if ([...root.attributes].some((a) => !allowed.includes(a.name))) throw TypeError("Unknown XML attribute");
  };
  if (root.tagName === "azr-site") {
    attrs(["schemaVersion"]);
    const children = [...root.children];
    if ([...root.childNodes].some((n) => [3, 4].includes(n.nodeType) && n.textContent.trim())) throw TypeError("Unexpected XML text");
    if (children.length !== 3 || children.map((n) => n.tagName).join(",") !== "content,design,layout" || children.some((n) => n.attributes.length)) throw TypeError("Invalid XML sections");
    return { schemaVersion: 1, ...Object.fromEntries(children.map((n) => [n.tagName, payload(n)])) };
  }
  if (root.tagName === "azr-block") {
    attrs(["schemaVersion", "area", "key"]);
    const area = root.getAttribute("area"), key = root.getAttribute("key");
    if (!["content", "design", "layout"].includes(area) || key && (area !== "content" || !sections.includes(key))) throw TypeError("Invalid XML block target");
    const next = envelope(current), value = payload(root);
    if (key) next.content[key] = value;
    else next[area] = value;
    return next;
  }
  throw TypeError("Unknown XML root");
}

// src/index.js
var targets = ["content:guide", "content:faq", "content:companies", "content:quizzes", "content:resources", "content:letterTemplates", "design", "layout"];
var AzrContentAdmin = class extends ElementBase {
  #document = null;
  #services = null;
  #target = "content:letterTemplates";
  #templateLang = "de";
  #drafts = /* @__PURE__ */ new Map();
  #pending = null;
  #undo = null;
  #working = false;
  #revision = 0;
  #message = "";
  #error = false;
  #urls = /* @__PURE__ */ new Map();
  upgradeProperties = ["document", "services", "language", "busy"];
  get document() {
    return copy(this.#document);
  }
  set document(v) {
    const next = v === null ? null : validateDocument(v);
    if (JSON.stringify(next) !== JSON.stringify(this.#document)) {
      this.#document = next;
      this.#drafts.clear();
      this.#pending = null;
      this.#undo = null;
      this.#revision++;
      this.#working = false;
    }
    this.render();
  }
  get services() {
    return this.#services;
  }
  set services(v) {
    if (v !== null && (!v || typeof v.validateDocument !== "function")) throw TypeError("Invalid content validator");
    this.#services = v;
    this.render();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#revision++;
    this.#working = false;
    for (const [url, timer] of this.#urls) {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    this.#urls.clear();
  }
  #section(target = this.#target) {
    const [area, key] = target.split(":");
    return key ? this.#document.content[key] : this.#document[area];
  }
  #text(target = this.#target) {
    return this.#drafts.get(target) ?? JSON.stringify(this.#section(target), null, 2);
  }
  #edit(text, target = this.#target) {
    this.#drafts.set(target, text);
    this.#pending = null;
    this.#revision++;
    this.#message = "";
    this.#error = false;
    this.render();
  }
  #candidate() {
    const next = this.document;
    for (const [target, text] of this.#drafts) {
      const [area, key] = target.split(":"), value = JSON.parse(text);
      if (key) next.content[key] = value;
      else next[area] = value;
    }
    return next;
  }
  async #validate(candidate) {
    if (!this.#services || this.busy || this.#working) return;
    const revision = ++this.#revision;
    this.#working = true;
    this.#message = "";
    this.#pending = null;
    this.render();
    emit(this, "azr:content-status", { operation: "validate", status: "pending" });
    try {
      const next = validateDocument(await this.#services.validateDocument(candidate));
      if (revision !== this.#revision) return;
      this.#pending = next;
      emit(this, "azr:content-status", { operation: "validate", status: "ready" });
    } catch (e) {
      if (revision !== this.#revision) return;
      this.#message = words[this.language][23] + " " + String(e.message);
      this.#error = true;
      emit(this, "azr:content-status", { operation: "validate", status: "error" });
    } finally {
      if (revision === this.#revision) {
        this.#working = false;
        this.render();
      }
    }
  }
  #failure(e) {
    this.#pending = null;
    this.#message = words[this.language][23] + " " + String(e.message);
    this.#error = true;
    this.render();
  }
  #download(data, type, filename) {
    const url = URL.createObjectURL(new Blob([data], { type })), a = document.createElement("a");
    a.href = url;
    a.download = filename;
    this.shadowRoot.append(a);
    a.click();
    a.remove();
    this.#urls.set(url, setTimeout(() => {
      URL.revokeObjectURL(url);
      this.#urls.delete(url);
    }, 3e4));
  }
  #apply() {
    if (!this.#pending || !this.#services || this.#working || this.busy) return;
    this.#undo = this.document;
    this.#document = this.#pending;
    this.#pending = null;
    this.#drafts.clear();
    this.#message = words[this.language][21];
    this.#error = false;
    emit(this, "azr:content-apply", { document: this.document });
    this.render();
  }
  #rollback() {
    if (!this.#undo || this.#working || this.busy) return;
    this.#document = this.#undo;
    this.#undo = null;
    this.#pending = null;
    this.#drafts.clear();
    this.#revision++;
    this.#message = words[this.language][22];
    this.#error = false;
    emit(this, "azr:content-rollback", { document: this.document });
    this.render();
  }
  async handle(e) {
    const t = e.target;
    if (e.type === "click" && t.closest("[data-schema]")) {
      const type = t.closest("[data-schema]").dataset.schema;
      this.#download(type === "xml" ? xsd : JSON.stringify(schema, null, 2), type === "xml" ? "application/xml" : "application/json", type === "xml" ? "azubi-rocket-schema.xsd" : "azubi-rocket-schema.json");
      return;
    }
    if (this.busy || this.#working || !this.#document) return;
    if (e.type === "change" && t.dataset.target !== void 0) {
      this.#target = t.value;
      this.render();
      return;
    }
    if (e.type === "change" && t.dataset.templateLang !== void 0) {
      this.#templateLang = t.value;
      this.render();
      return;
    }
    if (e.type === "input" && t.dataset.raw !== void 0) {
      this.#edit(t.value);
      return;
    }
    if (e.type === "input" && t.dataset.template) {
      const current = JSON.parse(this.#text());
      current[this.#templateLang][t.dataset.template] = t.value;
      this.#edit(JSON.stringify(current, null, 2));
      return;
    }
    if (e.type === "input" && t.dataset.color) {
      const current = JSON.parse(this.#text("design"));
      current[t.dataset.color] = t.value;
      this.#edit(JSON.stringify(current, null, 2), "design");
      return;
    }
    if (e.type === "change" && t.dataset.density !== void 0) {
      this.#edit(JSON.stringify({ density: t.value }), "layout");
      return;
    }
    if (e.type === "change" && t.matches("input[type=file]")) {
      const file = t.files[0];
      if (!file) return;
      try {
        if (file.size > 5 * 1024 * 1024) throw Error("Maximum 5 MiB");
        const revision = ++this.#revision;
        const text = await file.text();
        if (revision !== this.#revision) return;
        const candidate = parseXml(text, this.#document);
        await this.#validate(candidate);
      } catch (error) {
        this.#failure(error);
      } finally {
        t.value = "";
      }
      return;
    }
    if (e.type !== "click") return;
    const button = t.closest("button");
    if (!button) return;
    if (button.dataset.validate !== void 0) {
      try {
        await this.#validate(this.#candidate());
      } catch (error) {
        this.#failure(error);
      }
    }
    if (button.dataset.apply !== void 0) this.#apply();
    if (button.dataset.rollback !== void 0) this.#rollback();
    if (button.dataset.export !== void 0) {
      this.#download(serializeXml(this.#document), "application/xml", "azubi-rocket-inhalte.xml");
      this.#message = words[this.language][42];
      this.#error = false;
      emit(this, "azr:content-status", { operation: "export-xml", status: "success" });
      this.render();
    }
  }
  #counts(v) {
    return [v.content.faq.length, v.content.companies.length, v.content.quizzes.reduce((n, q) => n + q.questions.length, 0), Object.values(v.content.resources).reduce((n, r) => n + r.cards.length, 0)];
  }
  render() {
    const t = words[this.language], disabled = this.busy || this.#working ? "disabled" : "";
    let editor = "";
    if (this.#document) {
      const raw = this.#text();
      if (this.#target === "content:letterTemplates") {
        const templates = JSON.parse(raw), current = templates[this.#templateLang];
        editor = `<label>${t[26]}<select data-template-lang data-key="template-lang" ${disabled}>${["de", "en", "fr", "ru"].map((l) => `<option ${l === this.#templateLang ? "selected" : ""}>${l}</option>`).join("")}</select></label><label>${t[27]}<input data-key="template-subject" data-template="subject" value="${esc(current.subject)}" maxlength="1000" ${disabled}></label><label>${t[28]}<textarea data-key="template-body" data-template="body" maxlength="30000" ${disabled}>${esc(current.body)}</textarea></label><p class="muted">{profession}, {company}, {start}, {profile}, {name}, {phone}, {email}</p>`;
      } else if (this.#target === "design") {
        const value = JSON.parse(raw);
        editor = `<div class="grid">${["accent", "surface", "text"].map((k, i) => `<label>${t[29 + i]}<input type="color" data-key="color-${k}" data-color="${k}" value="${value[k]}" ${disabled}></label>`).join("")}</div>`;
      } else if (this.#target === "layout") {
        const value = JSON.parse(raw);
        editor = `<label>${t[32]}<select data-density ${disabled}><option value="comfortable" ${value.density === "comfortable" ? "selected" : ""}>${t[33]}</option><option value="compact" ${value.density === "compact" ? "selected" : ""}>${t[34]}</option></select></label>`;
      } else editor = `<label>JSON<textarea data-key="raw" data-raw spellcheck="false" maxlength="5242880" ${disabled}>${esc(raw)}</textarea></label>`;
    }
    this.paint(`<style>textarea{min-height:340px;font:13px/1.6 ui-monospace,monospace}input[type=color]{height:52px;max-width:150px}.xml-file input{margin-top:10px}.preview-counts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.preview-counts p{margin:0}h1,h2{overflow-wrap:anywhere}</style><section lang="${this.language}"><h1>${t[0]}</h1><p>${t[1]}</p>${!this.#document ? `<p class="notice" role="status">${t[25]}</p>` : `<div class="card"><label>${t[2]}<select data-key="target" data-target ${disabled}>${targets.map((v, i) => `<option value="${v}" ${v === this.#target ? "selected" : ""}>${t[3 + i]}</option>`).join("")}</select></label>${editor}<div class="actions"><button type="button" class="primary" data-key="validate" data-validate ${disabled || !this.#services ? "disabled" : ""}>${this.#working ? t[12] : t[11]}</button>${this.#undo ? `<button type="button" data-rollback ${disabled}>${t[15]}</button>` : ""}</div>${this.#drafts.size ? `<p class="muted">${t[41]}</p>` : ""}</div>${this.#pending ? `<div class="notice" data-preview><h2>${t[13]}</h2><p>${t[20]}</p><div class="preview-counts">${this.#counts(this.#document).map((n, i) => `<p>${t[35 + i]}: ${n} \u2192 ${this.#counts(this.#pending)[i]}</p>`).join("")}</div><button type="button" class="primary" data-apply style="margin-top:15px" ${disabled || !this.#services ? "disabled" : ""}>${t[14]}</button></div>` : ""}${!this.#services ? `<p class="notice">${t[24]}</p>` : ""}<div class="card" style="margin-top:20px"><div class="actions" style="margin-top:0"><button type="button" data-export ${disabled}>${t[16]} \u2193</button></div><label class="xml-file" style="margin-top:20px">${t[17]}<input type="file" accept="application/xml,text/xml,.xml" ${disabled || !this.#services ? "disabled" : ""}></label></div>`}<div class="actions"><button type="button" data-schema="xml">${t[18]} \u2193</button><button type="button" data-schema="json">${t[19]} \u2193</button></div>${this.#working ? `<p class="notice" role="status">${t[12]}</p>` : ""}${this.#message ? `<p class="notice ${this.#error ? "error" : "success"}" role="${this.#error ? "alert" : "status"}">${esc(this.#message)}</p>` : ""}</section>`);
  }
};
if (!customElements.get("azr-content-admin")) customElements.define("azr-content-admin", AzrContentAdmin);
export {
  AzrContentAdmin
};
