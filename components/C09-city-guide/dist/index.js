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

// src/index.js
var labels = { de: ["Informationen & Anlaufstellen", "Suchen", "Alle Themen", "Treffer", "Keine passenden Informationen.", "Informationen werden geladen \u2026", "Deutsch \u2013 \xDCbersetzung fehlt", "Filter zur\xFCcksetzen"], en: ["Information & resources", "Search", "All topics", "results", "No matching information.", "Loading information \u2026", "German \u2013 translation unavailable", "Reset filters"], fr: ["Informations et ressources", "Rechercher", "Tous les th\xE8mes", "r\xE9sultats", "Aucune information correspondante.", "Chargement \u2026", "Allemand \u2013 traduction indisponible", "R\xE9initialiser les filtres"], ru: ["\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0438 \u043F\u043E\u043B\u0435\u0437\u043D\u044B\u0435 \u0430\u0434\u0440\u0435\u0441\u0430", "\u041F\u043E\u0438\u0441\u043A", "\u0412\u0441\u0435 \u0442\u0435\u043C\u044B", "\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432", "\u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0439 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043D\u0435\u0442.", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u2026", "\u041D\u0435\u043C\u0435\u0446\u043A\u0438\u0439 \u2014 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442", "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B"] };
function localized(v) {
  if (!v || typeof v.de !== "string" || !v.de.trim()) throw TypeError("German content required");
  const out = {};
  for (const l of languages) {
    if (v[l] !== void 0 && (typeof v[l] !== "string" || v[l].length > 3e4)) throw TypeError("Invalid translated content");
    if (v[l]?.trim()) out[l] = v[l];
  }
  return out;
}
function content(v) {
  if (v === null) return null;
  if (!v || !Array.isArray(v.cards) || v.cards.length > 400) throw TypeError("Invalid resources");
  const ids = /* @__PURE__ */ new Set(), out = { title: localized(v.title), intro: localized(v.intro), cards: [], categoryLabels: {} };
  for (const [k, value] of Object.entries(v.categoryLabels ?? {})) {
    if (k.length > 100) throw TypeError("Invalid category");
    Object.defineProperty(out.categoryLabels, k, { value: localized(value), enumerable: true, writable: true, configurable: true });
  }
  out.cards = v.cards.map((c) => {
    if (!c || typeof c.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(c.id) || ids.has(c.id) || typeof c.category !== "string" || c.category.length > 100 || !Array.isArray(c.links) || c.links.length > 30) throw TypeError("Invalid resource card");
    ids.add(c.id);
    return { id: c.id, category: c.category, title: localized(c.title), body: localized(c.body), links: c.links.map((link) => {
      const url = new URL(link.url);
      if (url.protocol !== "https:" || url.username || url.password) throw TypeError("Invalid resource URL");
      return { label: localized(link.label), url: url.href };
    }) };
  });
  return out;
}
var fold = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/ß/g, "ss");
var AzrCityGuide = class extends ElementBase {
  #content = null;
  #filters = { query: "", category: "all" };
  #error = "";
  upgradeProperties = ["content", "filters", "error", "mode", "language", "busy"];
  static get observedAttributes() {
    return [...super.observedAttributes, "mode"];
  }
  get content() {
    return copy(this.#content);
  }
  set content(v) {
    this.#content = content(v);
    this.render();
  }
  get filters() {
    return copy(this.#filters);
  }
  set filters(v) {
    if (!v || typeof v.query !== "string" || v.query.length > 500 || typeof v.category !== "string" || v.category.length > 100) throw TypeError("Invalid filters");
    this.#filters = { query: v.query, category: v.category };
    this.render();
  }
  get error() {
    return this.#error;
  }
  set error(v) {
    if (typeof v !== "string") throw TypeError("Invalid error");
    this.#error = v;
    this.render();
  }
  get mode() {
    return this.getAttribute("mode") ?? "city";
  }
  set mode(v) {
    if (!["city", "professions", "about"].includes(v)) throw TypeError("Invalid mode");
    this.setAttribute("mode", v);
  }
  #changed() {
    emit(this, "azr:resource-filter-change", { filters: this.filters });
    this.render();
  }
  handle(e) {
    if (this.busy) return;
    const t = e.target;
    if (e.type === "input" && t.dataset.query !== void 0) {
      this.#filters.query = t.value;
      this.#changed();
    }
    if (e.type === "change" && t.dataset.category !== void 0) {
      this.#filters.category = t.value;
      this.#changed();
    }
    if (e.type === "click" && t.closest("[data-reset]")) {
      this.#filters = { query: "", category: "all" };
      this.#changed();
    }
  }
  render() {
    const t = labels[this.language], data = this.#content, categories = [...new Set(data?.cards.map((c) => c.category) ?? [])], query = fold(this.#filters.query.trim()), cards = data?.cards.filter((c) => (this.#filters.category === "all" || c.category === this.#filters.category) && fold(localeText(c.title, this.language) + " " + localeText(c.body, this.language)).includes(query)) ?? [];
    const categoryLabel = (c) => localeText(data?.categoryLabels[c], this.language) || c;
    this.paint(`<style>.resource-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.resource-grid article{display:flex;flex-direction:column}.resource-grid .actions{margin-top:auto;padding-top:16px}h1,h2{overflow-wrap:anywhere}.resource-links{display:flex;gap:10px;flex-wrap:wrap}article .body{flex:1}@media(max-width:720px){.resource-grid{grid-template-columns:1fr}}</style><section lang="${this.language}"><h1>${data ? esc(localeText(data.title, this.language)) : t[0]}</h1>${data ? `<p class="body">${esc(localeText(data.intro, this.language))}</p>` : ""}<div class="card"><div class="grid"><label>${t[1]}<input type="search" data-key="query" data-query maxlength="500" value="${esc(this.#filters.query)}" ${this.busy ? "disabled" : ""}></label><label>${t[2]}<select data-key="category" data-category ${this.busy ? "disabled" : ""}><option value="all">${t[2]}</option>${categories.map((c) => `<option value="${esc(c)}" ${this.#filters.category === c ? "selected" : ""}>${esc(categoryLabel(c))}</option>`).join("")}${this.#filters.category !== "all" && !categories.includes(this.#filters.category) ? `<option selected value="${esc(this.#filters.category)}">${esc(this.#filters.category)}</option>` : ""}</select></label></div>${this.#filters.query || this.#filters.category !== "all" ? `<button data-reset type="button" ${this.busy ? "disabled" : ""}>${t[7]}</button>` : ""}</div>${this.#error ? `<p class="notice error" role="alert">${esc(this.#error)}</p>` : data === null || this.busy ? `<p class="notice" role="status">${t[5]}</p>` : `<p class="muted" role="status">${cards.length} ${t[3]}</p><div class="resource-grid">${cards.map((c) => `<article class="card" data-resource="${c.id}"><p class="badge">${esc(categoryLabel(c.category))}</p><h2>${esc(localeText(c.title, this.language))}</h2>${this.language !== "de" && (!c.title[this.language] || !c.body[this.language]) ? `<p class="muted">${t[6]}</p>` : ""}<p class="body" lang="${c.body[this.language] ? this.language : "de"}">${esc(localeText(c.body, this.language))}</p><div class="actions resource-links">${c.links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(localeText(link.label, this.language))} \u2197</a>`).join("")}</div></article>`).join("")}</div>${!cards.length ? `<p class="notice">${t[4]}</p>` : ""}`}</section>`);
  }
};
if (!customElements.get("azr-city-guide")) customElements.define("azr-city-guide", AzrCityGuide);
export {
  AzrCityGuide
};
