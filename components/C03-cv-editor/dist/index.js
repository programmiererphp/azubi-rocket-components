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
  de: { title: "Dein Lebenslauf", intro: "Trage deine Angaben ein. Die Vorschau und beide Downloads verwenden dieselben Daten.", personal: "Pers\xF6nlich", education: "Bildung", experience: "Erfahrung", firstName: "Vorname", lastName: "Nachname", email: "E-Mail", phone: "Telefon", address: "Stra\xDFe und Hausnummer", postalCode: "Postleitzahl", city: "Wohnort", country: "Land", birthDate: "Geburtsdatum (freiwillig)", nationality: "Nationalit\xE4t (freiwillig)", profile: "Kurzprofil", more: "Weitere Angaben (freiwillig)", photo: "Foto (JPEG/PNG, freiwillig)", removePhoto: "Foto entfernen", period: "Zeitraum", institution: "Schule / Betrieb / Organisation", description: "Abschluss / Aufgaben / Details", add: "Eintrag hinzuf\xFCgen", remove: "Entfernen", empty: "Noch keine Eintr\xE4ge. Du kannst diesen Bereich auch leer lassen.", skills: "Kenntnisse und F\xE4higkeiten", languageLevel: "Deutschkenntnisse", preview: "Lebenslauf-Vorschau", cv: "Lebenslauf", download: "Herunterladen", wait: "Dokument wird erstellt \u2026", success: "Dokument heruntergeladen.", failure: "Export fehlgeschlagen. Bitte erneut versuchen.", noService: "Der Dokumentexport ist hier noch nicht verbunden.", photoError: "Bitte ein lesbares JPEG/PNG bis 5 MB ausw\xE4hlen.", photoLoading: "Foto wird lokal verarbeitet \u2026", optional: "Optional", choose: "Bitte ausw\xE4hlen" },
  en: { title: "Your CV", intro: "Enter your details. The preview and both downloads use the same information.", personal: "Personal", education: "Education", experience: "Experience", firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone", address: "Street and number", postalCode: "Postal code", city: "City", country: "Country", birthDate: "Date of birth (optional)", nationality: "Nationality (optional)", profile: "Profile", more: "Additional details (optional)", photo: "Photo (JPEG/PNG, optional)", removePhoto: "Remove photo", period: "Period", institution: "School / company / organisation", description: "Qualification / tasks / details", add: "Add entry", remove: "Remove", empty: "No entries yet. You may also leave this section empty.", skills: "Skills", languageLevel: "German level", preview: "CV preview", cv: "Curriculum vitae", download: "Download", wait: "Creating document \u2026", success: "Document downloaded.", failure: "Export failed. Please try again.", noService: "The document exporter is not connected here yet.", photoError: "Choose a readable JPEG/PNG up to 5 MB.", photoLoading: "Processing photo locally \u2026", optional: "Optional", choose: "Please choose" },
  fr: { title: "Ton CV", intro: "Saisis tes informations. L\u2019aper\xE7u et les deux t\xE9l\xE9chargements utilisent les m\xEAmes donn\xE9es.", personal: "Identit\xE9", education: "\xC9tudes", experience: "Exp\xE9rience", firstName: "Pr\xE9nom", lastName: "Nom", email: "E-mail", phone: "T\xE9l\xE9phone", address: "Rue et num\xE9ro", postalCode: "Code postal", city: "Ville", country: "Pays", birthDate: "Date de naissance (facultatif)", nationality: "Nationalit\xE9 (facultatif)", profile: "Profil", more: "Autres informations (facultatif)", photo: "Photo (JPEG/PNG, facultatif)", removePhoto: "Retirer la photo", period: "P\xE9riode", institution: "\xC9cole / entreprise / organisation", description: "Dipl\xF4me / t\xE2ches / d\xE9tails", add: "Ajouter une entr\xE9e", remove: "Retirer", empty: "Aucune entr\xE9e. Tu peux aussi laisser cette partie vide.", skills: "Comp\xE9tences", languageLevel: "Niveau d\u2019allemand", preview: "Aper\xE7u du CV", cv: "Curriculum vit\xE6", download: "T\xE9l\xE9charger", wait: "Cr\xE9ation du document \u2026", success: "Document t\xE9l\xE9charg\xE9.", failure: "\xC9chec de l\u2019export. R\xE9essaie.", noService: "Le service d\u2019export n\u2019est pas encore connect\xE9 ici.", photoError: "Choisis une image JPEG/PNG lisible de 5 Mo maximum.", photoLoading: "Traitement local de la photo \u2026", optional: "Facultatif", choose: "Choisir" },
  ru: { title: "\u0422\u0432\u043E\u0451 \u0440\u0435\u0437\u044E\u043C\u0435", intro: "\u0412\u043D\u0435\u0441\u0438 \u0441\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435. \u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0438 \u043E\u0431\u0430 \u0444\u0430\u0439\u043B\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442 \u043E\u0434\u043D\u0438 \u0438 \u0442\u0435 \u0436\u0435 \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u044F.", personal: "\u041B\u0438\u0447\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435", education: "\u041E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435", experience: "\u041E\u043F\u044B\u0442", firstName: "\u0418\u043C\u044F", lastName: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F", email: "\u042D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u0430\u044F \u043F\u043E\u0447\u0442\u0430", phone: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", address: "\u0423\u043B\u0438\u0446\u0430 \u0438 \u0434\u043E\u043C", postalCode: "\u041F\u043E\u0447\u0442\u043E\u0432\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441", city: "\u0413\u043E\u0440\u043E\u0434", country: "\u0421\u0442\u0440\u0430\u043D\u0430", birthDate: "\u0414\u0430\u0442\u0430 \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", nationality: "\u0413\u0440\u0430\u0436\u0434\u0430\u043D\u0441\u0442\u0432\u043E (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", profile: "\u041A\u0440\u0430\u0442\u043A\u043E \u043E \u0441\u0435\u0431\u0435", more: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", photo: "\u0424\u043E\u0442\u043E (JPEG/PNG, \u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", removePhoto: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u043E\u0442\u043E", period: "\u041F\u0435\u0440\u0438\u043E\u0434", institution: "\u0428\u043A\u043E\u043B\u0430 / \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F / \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", description: "\u041A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F / \u0437\u0430\u0434\u0430\u0447\u0438 / \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438", add: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C", remove: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", empty: "\u0417\u0430\u043F\u0438\u0441\u0435\u0439 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442. \u042D\u0442\u043E\u0442 \u0440\u0430\u0437\u0434\u0435\u043B \u043C\u043E\u0436\u043D\u043E \u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C.", skills: "\u041D\u0430\u0432\u044B\u043A\u0438 \u0438 \u0443\u043C\u0435\u043D\u0438\u044F", languageLevel: "\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u043D\u0435\u043C\u0435\u0446\u043A\u043E\u0433\u043E", preview: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0440\u0435\u0437\u044E\u043C\u0435", cv: "\u0420\u0435\u0437\u044E\u043C\u0435", download: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C", wait: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u2026", success: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441\u043A\u0430\u0447\u0430\u043D.", failure: "\u041E\u0448\u0438\u0431\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.", noService: "\u0421\u0435\u0440\u0432\u0438\u0441 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D.", photoError: "\u0412\u044B\u0431\u0435\u0440\u0438 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0435 \u0444\u043E\u0442\u043E JPEG/PNG \u0440\u0430\u0437\u043C\u0435\u0440\u043E\u043C \u0434\u043E 5 \u041C\u0411.", photoLoading: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0444\u043E\u0442\u043E \u2026", optional: "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E", choose: "\u0412\u044B\u0431\u0435\u0440\u0438" }
};

// src/index.js
var personalKeys = ["firstName", "lastName", "email", "phone", "address", "postalCode", "city", "country", "birthDate", "nationality"];
function normalizeCV(value) {
  if (!value || value.schemaVersion !== 1 || typeof value.personal !== "object" || !value.personal) throw new TypeError("Invalid CV");
  const data = { schemaVersion: 1, personal: {} };
  for (const key of personalKeys) {
    const v = value.personal[key] ?? "";
    if (typeof v !== "string" || v.length > 4e3) throw new TypeError("Invalid personal field");
    data.personal[key] = v;
  }
  for (const key of ["profile", "skills", "languageLevel"]) {
    const v = value[key] ?? "";
    if (typeof v !== "string" || v.length > 12e3) throw new TypeError("Invalid CV text");
    data[key] = v;
  }
  for (const key of ["education", "experience"]) {
    const rows = value[key] ?? [];
    if (!Array.isArray(rows) || rows.length > 30) throw new TypeError("Invalid CV rows");
    const ids = /* @__PURE__ */ new Set();
    data[key] = rows.map((row) => {
      if (!row || typeof row.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id)) throw new TypeError("Invalid CV row id");
      ids.add(row.id);
      const result = { id: row.id };
      for (const k of ["period", "institution", "description"]) {
        const v = row[k] ?? "";
        if (typeof v !== "string" || v.length > 12e3) throw new TypeError("Invalid CV row text");
        result[k] = v;
      }
      return result;
    });
  }
  data.photo = value.photo ?? null;
  if (data.photo !== null && (typeof data.photo !== "string" || data.photo.length > 2e6 || !/^data:image\/(png|jpeg);base64,[a-zA-Z0-9+/=]+$/.test(data.photo))) throw new TypeError("Invalid photo");
  return data;
}
var empty = () => normalizeCV({ schemaVersion: 1, personal: {} });
function cvDocument(data, language) {
  const t = words[language], p = data.personal;
  return { title: [p.firstName, p.lastName].filter(Boolean).join(" "), subtitle: t.cv, photo: data.photo, contact: [p.address, [p.postalCode, p.city].filter(Boolean).join(" "), p.country, p.email, p.phone, ...["birthDate", "nationality"].filter((k) => p[k]).map((k) => t[k].replace(/\s*\([^)]*\)/g, "") + ": " + p[k])].filter(Boolean).join(" \xB7 "), sections: [{ heading: t.profile, body: data.profile }, ...["education", "experience"].map((key) => ({ heading: t[key], body: data[key].map((row) => [`${row.period}  ${row.institution}`.trim(), row.description].filter(Boolean).join("\n")).filter(Boolean).join("\n\n") })), { heading: t.skills, body: [data.skills, data.languageLevel ? t.languageLevel + ": " + data.languageLevel : ""].filter(Boolean).join("\n") }] };
}
var AzrCVEditor = class extends ElementBase {
  #data = empty();
  #services = null;
  #tab = "personal";
  #preview = false;
  #exporting = false;
  #photoBusy = false;
  #message = "";
  #error = false;
  #operation = 0;
  #urls = /* @__PURE__ */ new Map();
  upgradeProperties = ["cvData", "services", "language", "busy"];
  get cvData() {
    return copy(this.#data);
  }
  set cvData(v) {
    this.#data = normalizeCV(v);
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
    for (const [url, timer] of this.#urls) {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    this.#urls.clear();
    this.#exporting = false;
  }
  #changed() {
    emit(this, "azr:cv-change", { cvData: this.cvData });
    this.render();
  }
  #field(key, value, attrs = "", dataset = "") {
    const t = words[this.language];
    return `<label>${esc(t[key])}<input data-key="${dataset || key}" ${dataset ? dataset : `data-personal="${key}"`} value="${esc(value)}" ${attrs}></label>`;
  }
  async #photo(file) {
    const t = words[this.language];
    if (!file) return;
    this.#photoBusy = true;
    this.#message = "";
    this.render();
    try {
      if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error(t.photoError);
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 320 / bitmap.width, 400 / bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      this.#data.photo = canvas.toDataURL("image/jpeg", 0.86);
      this.#changed();
    } catch {
      this.#message = t.photoError;
      this.#error = true;
    } finally {
      this.#photoBusy = false;
      this.render();
    }
  }
  async #export(format) {
    if (this.busy || this.#exporting || !this.#services) return;
    const form = this.shadowRoot.querySelector("form");
    if (!this.#data.personal.firstName.trim() || !this.#data.personal.lastName.trim()) {
      this.#tab = "personal";
      this.render();
      this.shadowRoot.querySelector("form").reportValidity();
      return;
    }
    if (this.#data.personal.email && !/^[^\s@]+@[^\s@]+$/.test(this.#data.personal.email)) {
      this.#tab = "personal";
      this.render();
      this.shadowRoot.querySelector("[data-personal=email]").reportValidity();
      return;
    }
    if (form && !form.reportValidity()) return;
    const t = words[this.language], actionId = crypto.randomUUID(), operation = ++this.#operation;
    this.#exporting = true;
    this.#message = t.wait;
    this.#error = false;
    this.render();
    emit(this, "azr:export-status", { actionId, format, status: "pending" });
    try {
      const result = await this.#services.exportDocument({ format, document: cvDocument(this.#data, this.language), language: this.language, filename: `${t.cv}_${this.#data.personal.firstName}_${this.#data.personal.lastName}` });
      if (operation !== this.#operation) return;
      if (!result?.blob || typeof result.blob.arrayBuffer !== "function" || typeof result.filename !== "string") throw new TypeError("Invalid export response");
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
    } catch (error) {
      if (operation !== this.#operation) return;
      this.#message = t.failure + " " + error.message;
      this.#error = true;
      emit(this, "azr:export-status", { actionId, format, status: "error", message: String(error.message) });
    } finally {
      if (operation === this.#operation) {
        this.#exporting = false;
        this.render();
      }
    }
  }
  handle(event) {
    const target = event.target.closest("input,textarea,select,button");
    if (!target) return;
    const locked = this.busy || this.#exporting || this.#photoBusy;
    if (event.type === "click" && target.dataset.tab) {
      this.#tab = target.dataset.tab;
      this.render();
      return;
    }
    if (locked) return;
    if (event.type === "input" && target.dataset.personal) {
      this.#data.personal[target.dataset.personal] = target.value;
      this.#changed();
    }
    if ((event.type === "input" || event.type === "change") && target.dataset.field) {
      this.#data[target.dataset.field] = target.value;
      this.#changed();
    }
    if (event.type === "input" && target.dataset.row) {
      const row = this.#data[this.#tab].find((r) => r.id === target.dataset.row);
      if (row) {
        row[target.dataset.rowField] = target.value;
        this.#changed();
      }
    }
    if (event.type === "change" && target.type === "file") this.#photo(target.files[0]);
    if (event.type === "click" && target.dataset.add) {
      if (this.#data[this.#tab].length < 30) {
        this.#data[this.#tab].push({ id: "row-" + crypto.randomUUID(), period: "", institution: "", description: "" });
        this.#changed();
      }
    }
    if (event.type === "click" && target.dataset.remove) {
      this.#data[this.#tab] = this.#data[this.#tab].filter((r) => r.id !== target.dataset.remove);
      this.#changed();
    }
    if (event.type === "click" && target.dataset.removePhoto !== void 0) {
      this.#data.photo = null;
      this.#changed();
    }
    if (event.type === "click" && target.dataset.preview !== void 0) {
      this.#preview = !this.#preview;
      this.render();
    }
    if (event.type === "click" && target.dataset.export) this.#export(target.dataset.export);
  }
  render() {
    const t = words[this.language], p = this.#data.personal, locked = this.busy || this.#exporting || this.#photoBusy, model = cvDocument(this.#data, this.language);
    let form = "";
    if (this.#tab === "personal") form = `<div class="grid">${["firstName", "lastName"].map((k) => this.#field(k, p[k], 'required maxlength="120" autocomplete="' + (k === "firstName" ? "given-name" : "family-name") + '"')).join("")}${this.#field("email", p.email, 'type="email" autocomplete="email"')}${this.#field("phone", p.phone, 'type="tel" autocomplete="tel"')}${this.#field("city", p.city, 'autocomplete="address-level2"')}${this.#field("country", p.country, 'autocomplete="country-name"')}</div>${this.#field("address", p.address, 'autocomplete="street-address"')}${this.#field("postalCode", p.postalCode, 'autocomplete="postal-code"')}<label>${t.profile}<textarea data-key="profile" data-field="profile" maxlength="12000">${esc(this.#data.profile)}</textarea></label><details data-key="more"><summary>${t.more}</summary><div class="grid">${this.#field("birthDate", p.birthDate)}${this.#field("nationality", p.nationality)}</div><label>${t.photo}<input data-key="photo-file" type="file" accept="image/jpeg,image/png"></label>${this.#data.photo ? `<img src="${this.#data.photo}" alt="" style="max-width:85px;max-height:110px"><button type="button" data-remove-photo>${t.removePhoto}</button>` : ""}</details>`;
    else {
      form = `${this.#data[this.#tab].length ? "" : `<p class="muted">${t.empty}</p>`}<div class="stack">${this.#data[this.#tab].map((r, i) => `<section class="card"><h3>${t[this.#tab]} ${i + 1}</h3>${["period", "institution", "description"].map((k) => `<label>${t[k]}${k === "description" ? `<textarea data-key="${r.id}-${k}" data-row="${r.id}" data-row-field="${k}" maxlength="12000">${esc(r[k])}</textarea>` : `<input data-key="${r.id}-${k}" data-row="${r.id}" data-row-field="${k}" value="${esc(r[k])}" maxlength="12000">`}</label>`).join("")}<button type="button" data-remove="${r.id}">${t.remove}</button></section>`).join("")}</div><div class="actions"><button type="button" data-add="true" ${this.#data[this.#tab].length >= 30 ? "disabled" : ""}>\uFF0B ${t.add}</button></div>`;
      if (this.#tab === "experience") form += `<label style="margin-top:20px">${t.skills}<textarea data-key="skills" data-field="skills" maxlength="12000">${esc(this.#data.skills)}</textarea></label><label>${t.languageLevel}<select data-key="languageLevel" data-field="languageLevel"><option value="">${t.choose}</option>${[.../* @__PURE__ */ new Set(["A1", "A2", "B1", "B2", "C1", "C2", ...this.#data.languageLevel ? [this.#data.languageLevel] : []])].map((level) => `<option value="${esc(level)}" ${this.#data.languageLevel === level ? "selected" : ""}>${esc(level)}</option>`).join("")}</select></label>`;
    }
    this.paint(`<style>fieldset{border:0;margin:0;padding:0;min-width:0}.cv-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.95fr);gap:22px}.preview-panel{align-self:start;position:sticky;top:16px}.preview-toggle{display:none}.cv-photo{float:right;max-width:75px;max-height:90px;margin:0 0 12px 15px}@media(max-width:800px){.cv-grid{grid-template-columns:1fr}.preview-panel{position:static}.preview-toggle{display:flex;width:100%;margin-bottom:14px}.preview-content[data-open=false]{display:none}}</style><section lang="${this.language}"><h1>${t.title}</h1><p>${t.intro}</p><div class="cv-grid"><div><nav class="row" aria-label="${t.title}" style="margin-bottom:20px">${["personal", "education", "experience"].map((key) => `<button type="button" data-key="tab-${key}" data-tab="${key}" aria-pressed="${this.#tab === key}" class="${this.#tab === key ? "primary" : ""}" ${locked ? "disabled" : ""}>${t[key]}</button>`).join("")}</nav><form><fieldset ${locked ? "disabled" : ""}>${form}</fieldset></form></div><aside class="card preview-panel"><button type="button" class="preview-toggle" data-preview aria-expanded="${this.#preview}" aria-controls="cv-preview">${t.preview}</button><div id="cv-preview" class="preview-content" data-open="${this.#preview}"><div class="preview">${model.photo ? `<img class="cv-photo" src="${model.photo}" alt="">` : ""}<h2>${esc(model.title || t.cv)}</h2><p class="muted">${esc(model.subtitle)}</p><p class="muted body">${esc(model.contact)}</p>${model.sections.filter((s) => s.body.trim()).map((s) => `<h3>${esc(s.heading)}</h3><div class="body">${esc(s.body)}</div>`).join("")}</div></div><div class="actions">${["pdf", "docx"].map((format) => `<button type="button" class="${format === "pdf" ? "primary" : ""}" data-key="export-${format}" data-export="${format}" ${locked || !this.#services ? "disabled" : ""}>${format.toUpperCase()} \u2193</button>`).join("")}</div>${!this.#services ? `<p class="notice">${t.noService}</p>` : ""}${this.#photoBusy ? `<p role="status">${t.photoLoading}</p>` : ""}${this.#message ? `<p class="notice ${this.#error ? "error" : "success"}" role="${this.#error ? "alert" : "status"}">${esc(this.#message)}</p>` : ""}</aside></div></section>`);
  }
};
if (!customElements.get("azr-cv-editor")) customElements.define("azr-cv-editor", AzrCVEditor);
export {
  AzrCVEditor,
  cvDocument,
  normalizeCV
};
