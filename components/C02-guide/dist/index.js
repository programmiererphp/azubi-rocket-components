// src/ui.js
var esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var copy = (value) => structuredClone(value);
var localeText = (value, lang) => typeof value === "string" ? value : value?.[lang] ?? value?.de ?? "";
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
    const opened = [...this.shadowRoot.querySelectorAll("details[open][data-key]")].map((e) => e.dataset.key);
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
  de: { orientation: "Dein Weg zur Ausbildung", intro: "W\xE4hle zuerst, wo du gerade lebst. Wir begleiten dich von der Vorbereitung bis zum Start.", germany: "Ich bin in Deutschland", abroad: "Ich bin im Ausland", germanyHint: "Du suchst einen Ausbildungsplatz und planst die n\xE4chsten Schritte vor Ort.", abroadHint: "Du bereitest deine Bewerbung und die sp\xE4tere Einreise vor.", choose: "Bitte w\xE4hle deinen Standort.", begin: "Anleitung starten", preparation: "Deine Vorbereitung", preparationIntro: "Pr\xFCfe deine Unterlagen und hake ab, was du schon erledigt hast.", start: "Gespr\xE4ch, Vertrag und Start", startIntro: "Nach der Bewerbung: Bereite die n\xE4chsten Schritte sorgf\xE4ltig vor.", details: "Hinweise anzeigen", done: "erledigt", finish: "Checkliste abschlie\xDFen", finished: "Deine Start-Checkliste ist abgeschlossen.", cv: "Lebenslauf erstellen", companies: "Firmen finden", letter: "Anschreiben vorbereiten", loading: "Anleitung wird geladen \u2026", empty: "F\xFCr diese Ansicht sind noch keine Inhalte hinterlegt.", error: "Die Anleitung konnte nicht geladen werden.", busy: "Bitte warten \u2026", location: "Dein Standort" },
  en: { orientation: "Your path to vocational training", intro: "First choose where you currently live. We guide you from preparation to your first day.", germany: "I am in Germany", abroad: "I am abroad", germanyHint: "You are looking for training and planning your next steps locally.", abroadHint: "You are preparing your application and later entry to Germany.", choose: "Please choose your location.", begin: "Start the guide", preparation: "Your preparation", preparationIntro: "Check your documents and tick off what you have already done.", start: "Interview, contract and starting", startIntro: "After applying: prepare your next steps carefully.", details: "Show guidance", done: "completed", finish: "Complete checklist", finished: "Your starting checklist is complete.", cv: "Create CV", companies: "Find companies", letter: "Prepare cover letter", loading: "Loading guide \u2026", empty: "No content has been added to this view yet.", error: "The guide could not be loaded.", busy: "Please wait \u2026", location: "Your location" },
  fr: { orientation: "Ton parcours vers la formation", intro: "Choisis d\u2019abord ton lieu de r\xE9sidence. Nous t\u2019accompagnons de la pr\xE9paration au premier jour.", germany: "Je suis en Allemagne", abroad: "Je suis \xE0 l\u2019\xE9tranger", germanyHint: "Tu cherches une formation et pr\xE9pares tes prochaines \xE9tapes sur place.", abroadHint: "Tu pr\xE9pares ta candidature et ton arriv\xE9e en Allemagne.", choose: "Choisis ton lieu de r\xE9sidence.", begin: "Commencer le guide", preparation: "Ta pr\xE9paration", preparationIntro: "V\xE9rifie tes documents et coche ce que tu as d\xE9j\xE0 fait.", start: "Entretien, contrat et d\xE9but", startIntro: "Apr\xE8s ta candidature : pr\xE9pare soigneusement les prochaines \xE9tapes.", details: "Afficher les conseils", done: "termin\xE9es", finish: "Terminer la liste", finished: "Ta liste de pr\xE9paration au d\xE9but est termin\xE9e.", cv: "Cr\xE9er le CV", companies: "Trouver des entreprises", letter: "Pr\xE9parer la lettre", loading: "Chargement du guide \u2026", empty: "Aucun contenu pour cette vue pour le moment.", error: "Le guide n\u2019a pas pu \xEAtre charg\xE9.", busy: "Patiente un instant \u2026", location: "Ton lieu de r\xE9sidence" },
  ru: { orientation: "\u0422\u0432\u043E\u0439 \u043F\u0443\u0442\u044C \u043A \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044E", intro: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u044B\u0431\u0435\u0440\u0438, \u0433\u0434\u0435 \u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441 \u0436\u0438\u0432\u0451\u0448\u044C. \u041C\u044B \u043F\u043E\u043C\u043E\u0436\u0435\u043C \u043F\u0440\u043E\u0439\u0442\u0438 \u043F\u0443\u0442\u044C \u043E\u0442 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u0434\u043E \u043D\u0430\u0447\u0430\u043B\u0430 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F.", germany: "\u042F \u0432 \u0413\u0435\u0440\u043C\u0430\u043D\u0438\u0438", abroad: "\u042F \u0437\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0435\u0439", germanyHint: "\u0422\u044B \u0438\u0449\u0435\u0448\u044C \u043C\u0435\u0441\u0442\u043E \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F \u0438 \u043F\u043B\u0430\u043D\u0438\u0440\u0443\u0435\u0448\u044C \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435.", abroadHint: "\u0422\u044B \u0433\u043E\u0442\u043E\u0432\u0438\u0448\u044C \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0432\u044A\u0435\u0437\u0434 \u0432 \u0413\u0435\u0440\u043C\u0430\u043D\u0438\u044E.", choose: "\u0412\u044B\u0431\u0435\u0440\u0438, \u0433\u0434\u0435 \u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u0430\u0445\u043E\u0434\u0438\u0448\u044C\u0441\u044F.", begin: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044E", preparation: "\u0422\u0432\u043E\u044F \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430", preparationIntro: "\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u043E\u0442\u043C\u0435\u0442\u044C \u0442\u043E, \u0447\u0442\u043E \u0443\u0436\u0435 \u0433\u043E\u0442\u043E\u0432\u043E.", start: "\u0421\u043E\u0431\u0435\u0441\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435, \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0438 \u043D\u0430\u0447\u0430\u043B\u043E", startIntro: "\u041F\u043E\u0441\u043B\u0435 \u043F\u043E\u0434\u0430\u0447\u0438 \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u0438\u044F \u0432\u043D\u0438\u043C\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438.", details: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438", done: "\u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E", finish: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A", finished: "\u0422\u0432\u043E\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u043A \u043D\u0430\u0447\u0430\u043B\u0443 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D.", cv: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0440\u0435\u0437\u044E\u043C\u0435", companies: "\u041D\u0430\u0439\u0442\u0438 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438", letter: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u0438\u0441\u044C\u043C\u043E", loading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0438 \u2026", empty: "\u0414\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0440\u0430\u0437\u0434\u0435\u043B\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432.", error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u044E.", busy: "\u041F\u043E\u0434\u043E\u0436\u0434\u0438 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u2026", location: "\u0422\u0432\u043E\u0451 \u043C\u0435\u0441\u0442\u043E\u043D\u0430\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435" }
};

// src/index.js
var stages = ["orientation", "preparation", "start"];
var locations = [null, "deutschland", "ausland"];
function journey(value) {
  if (!value || value.schemaVersion !== 1 || !locations.includes(value.location) || typeof value.finished !== "boolean" || !Array.isArray(value.checkedItems) || value.checkedItems.length > 1e3 || !value.checkedItems.every((x) => typeof x === "string" && /^[a-z0-9-]{1,80}$/.test(x)) || new Set(value.checkedItems).size !== value.checkedItems.length) throw new TypeError("Invalid guide journey");
  return copy(value);
}
function content(value) {
  if (value === null) return null;
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.items) || value.items.length > 200) throw new TypeError("Invalid content");
  const ids = /* @__PURE__ */ new Set();
  for (const item of value.items) {
    if (!item || typeof item.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(item.id) || ids.has(item.id) || !stages.includes(item.stage) || !["all", "deutschland", "ausland"].includes(item.location)) throw new TypeError("Invalid guide item");
    ids.add(item.id);
    for (const field of ["title", "body"]) if (!item[field] || !languages.every((lang) => typeof item[field][lang] === "string")) throw new TypeError("Guide translations required");
  }
  return copy(value);
}
var AzrGuide = class extends ElementBase {
  #journey = { schemaVersion: 1, location: null, checkedItems: [], finished: false };
  #content = null;
  #stage = "orientation";
  #available = [1, 2, 3, 4, 5, 6];
  #error = null;
  #compact = false;
  #showShortcuts = true;
  #links = {};
  upgradeProperties = ["journey", "content", "availableSteps", "language", "busy", "error", "compact", "showShortcuts", "guidanceLinks"];
  static get observedAttributes() {
    return [...super.observedAttributes, "stage"];
  }
  get guidanceLinks() {
    return copy(this.#links);
  }
  set guidanceLinks(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 200) throw TypeError("Invalid guide links");
    for (const links of Object.values(value)) {
      if (!Array.isArray(links) || links.length > 10 || links.some((l) => !l || typeof l.href !== "string" || !/^https:\/\/[^\s]+$|^#\/[a-z-]+$/.test(l.href) || !l.label || !languages.every((lang) => typeof l.label[lang] === "string"))) throw TypeError("Invalid guide links");
    }
    this.#links = copy(value);
    this.render();
  }
  get compact() {
    return this.#compact;
  }
  set compact(value) {
    if (typeof value !== "boolean") throw TypeError("compact must be boolean");
    this.#compact = value;
    this.render();
  }
  get showShortcuts() {
    return this.#showShortcuts;
  }
  set showShortcuts(value) {
    if (typeof value !== "boolean") throw TypeError("showShortcuts must be boolean");
    this.#showShortcuts = value;
    this.render();
  }
  get journey() {
    return copy(this.#journey);
  }
  set journey(v) {
    this.#journey = journey(v);
    this.render();
  }
  get content() {
    return copy(this.#content);
  }
  set content(v) {
    this.#content = content(v);
    this.render();
  }
  get availableSteps() {
    return [...this.#available];
  }
  set availableSteps(v) {
    if (!Array.isArray(v) || !v.every((n) => Number.isInteger(n) && n >= 1 && n <= 6) || new Set(v).size !== v.length) throw new TypeError("Invalid steps");
    this.#available = [...v];
    this.render();
  }
  get stage() {
    return this.#stage;
  }
  set stage(v) {
    if (!stages.includes(v)) throw new TypeError("Invalid stage");
    this.setAttribute("stage", v);
  }
  get error() {
    return this.#error;
  }
  set error(v) {
    if (v !== null && typeof v !== "string") throw new TypeError("error must be string or null");
    this.#error = v;
    this.render();
  }
  attributeChangedCallback(n, o, v) {
    if (n === "stage") {
      if (!stages.includes(v ?? "orientation")) {
        emit(this, "azr:guide-error", { code: "invalid-attribute", attribute: n });
        return;
      }
      this.#stage = v ?? "orientation";
      this.render();
    } else if (n === "language" && !languages.includes(v ?? "de")) emit(this, "azr:guide-error", { code: "invalid-attribute", attribute: n });
    else super.attributeChangedCallback(n, o, v);
  }
  #visible() {
    return this.#content?.items.filter((x) => x.stage === this.#stage && (x.location === "all" || x.location === this.#journey.location)) ?? [];
  }
  #change(next, reason) {
    emit(this, "azr:guide-change", { journey: next, reason });
    this.render();
  }
  handle(e) {
    if (this.busy) return;
    const target = e.target.closest("button,input");
    if (!target) return;
    if (e.type === "click" && target.dataset.location) {
      this.#change({ ...this.journey, location: target.dataset.location, finished: false }, "location");
    }
    if (e.type === "change" && target.dataset.check) {
      const checked = new Set(this.#journey.checkedItems);
      target.checked ? checked.add(target.dataset.check) : checked.delete(target.dataset.check);
      this.#change({ ...this.journey, checkedItems: [...checked], finished: false }, "check");
    }
    if (e.type === "click" && target.dataset.route) {
      const n = Number(target.dataset.route);
      if (!target.disabled && this.#available.includes(n)) emit(this, "azr:route-request", { toStep: n });
    }
    if (e.type === "click" && target.dataset.finish !== void 0) {
      const items = this.#visible();
      if (this.#stage === "start" && items.length && this.#journey.location && items.every((x) => this.#journey.checkedItems.includes(x.id))) this.#change({ ...this.journey, finished: true }, "finish");
    }
  }
  render() {
    const t = words[this.language], items = this.#visible(), checked = items.filter((x) => this.#journey.checkedItems.includes(x.id)).length;
    const disabled = this.busy ? "disabled" : "";
    if (this.#error) {
      this.paint(`<div role="alert" class="notice error">${t.error}<p class="body">${esc(this.#error)}</p></div>`);
      return;
    }
    if (this.#content === null) {
      this.paint(`<p role="status" class="notice">${t.loading}</p>`);
      return;
    }
    let body = `<h1>${t[this.#stage]}</h1><p>${this.#stage === "orientation" ? t.intro : t[this.#stage + "Intro"]}</p>`;
    if (this.#stage === "orientation") body += `<div class="grid">${[["deutschland", "germany", "\u{1F1E9}\u{1F1EA}"], ["ausland", "abroad", "\u{1F30D}"]].map(([value, key, icon]) => `<button type="button" class="card ${this.#journey.location === value ? "selected" : ""}" style="display:block;text-align:left" data-key="${value}" data-location="${value}" aria-pressed="${this.#journey.location === value}" ${disabled}><span style="font-size:30px" aria-hidden="true">${icon}</span><h2>${t[key]}</h2><p>${t[key + "Hint"]}</p></button>`).join("")}</div><p class="muted" role="status">${this.#journey.location ? t.location + ": " + t[this.#journey.location === "deutschland" ? "germany" : "abroad"] : t.choose}</p><div class="actions"><button type="button" class="primary" data-key="begin" data-route="2" ${this.busy || !this.#journey.location || !this.#available.includes(2) ? "disabled" : ""}>${t.begin} \u2192</button></div>`;
    if (this.#stage !== "orientation") body += !items.length ? `<p class="notice" role="status">${t.empty}</p>` : `<p class="muted" role="status">${checked} / ${items.length} ${t.done}</p><progress aria-label="${t.done}" max="${items.length}" value="${checked}"></progress><ul class="list stack">${items.map((item) => `<li class="card"><label class="check"><input type="checkbox" data-key="${item.id}" data-check="${item.id}" ${this.#journey.checkedItems.includes(item.id) ? "checked" : ""} ${disabled}><span><strong>${esc(localeText(item.title, this.language))}</strong></span></label><details data-key="guidance-${item.id}"><summary>${t.details}</summary><div class="body">${esc(localeText(item.body, this.language))}</div>${this.#links[item.id]?.length ? `<div class="actions">${this.#links[item.id].map((link) => `<a class="button" href="${esc(link.href)}" ${link.href.startsWith("https:") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(localeText(link.label, this.language))}${link.href.startsWith("https:") ? " \u2197" : " \u2192"}</a>`).join("")}</div>` : ""}</details></li>`).join("")}</ul>`;
    if (this.#stage === "preparation" && this.#showShortcuts) body += `<div class="actions">${[[3, "cv"], [4, "companies"], [5, "letter"]].map(([n, key]) => `<button type="button" class="${n === 3 ? "primary" : ""}" data-key="route-${n}" data-route="${n}" ${this.busy || !this.#available.includes(n) ? "disabled" : ""}>${t[key]} \u2192</button>`).join("")}</div>`;
    if (this.#stage === "start" && items.length) body += this.#journey.finished && checked === items.length && this.#journey.location ? `<p class="notice success" role="status">${t.finished}</p>` : `<div class="actions"><button type="button" class="primary" data-key="finish" data-finish ${this.busy || !this.#journey.location || checked !== items.length ? "disabled" : ""}>${t.finish}</button></div>`;
    this.paint(`<style>.compact-orientation .grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.compact-orientation [data-location]{padding:12px}.compact-orientation>p{font-size:14px;line-height:1.45;margin-bottom:16px}.compact-orientation [data-location] [aria-hidden]{display:none}.compact-orientation [data-location] h2{font-size:18px;line-height:1.3;margin:0 0 8px}.compact-orientation [data-location] p{font-size:13px;line-height:1.45;margin:0}.compact-orientation h1{font-size:26px}</style><section class="${this.#compact && this.#stage === "orientation" ? "compact-orientation" : ""}" lang="${this.language}" aria-busy="${this.busy}">${this.busy ? `<p class="notice" role="status">${t.busy}</p>` : ""}${body}</section>`);
  }
};
if (!customElements.get("azr-guide")) customElements.define("azr-guide", AzrGuide);
export {
  AzrGuide
};
