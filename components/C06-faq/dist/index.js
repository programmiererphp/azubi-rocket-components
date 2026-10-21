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
var labels = { de: ["Fragen & Antworten", "Suche in Fragen und Antworten", "Alle Themen", "Treffer", "Noch keine passenden Antworten.", "Fragen werden geladen \u2026", "Quelle \xF6ffnen", "Schlie\xDFen", "Deutsch \u2013 \xDCbersetzung fehlt", "Filter zur\xFCcksetzen"], en: ["Questions & answers", "Search questions and answers", "All topics", "results", "No matching answers.", "Loading questions \u2026", "Open source", "Close", "German \u2013 translation unavailable", "Reset filters"], fr: ["Questions et r\xE9ponses", "Rechercher dans les questions et r\xE9ponses", "Tous les th\xE8mes", "r\xE9sultats", "Aucune r\xE9ponse correspondante.", "Chargement des questions \u2026", "Ouvrir la source", "Fermer", "Allemand \u2013 traduction indisponible", "R\xE9initialiser les filtres"], ru: ["\u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0438 \u043E\u0442\u0432\u0435\u0442\u044B", "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C \u0438 \u043E\u0442\u0432\u0435\u0442\u0430\u043C", "\u0412\u0441\u0435 \u0442\u0435\u043C\u044B", "\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432", "\u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u2026", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", "\u041D\u0435\u043C\u0435\u0446\u043A\u0438\u0439 \u2014 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442", "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B"] };
var fold = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/ß/g, "ss");
function localized(v) {
  if (!v || typeof v !== "object" || typeof v.de !== "string" || !v.de.trim()) throw TypeError("German content required");
  const out = {};
  for (const lang of languages) {
    if (v[lang] !== void 0 && (typeof v[lang] !== "string" || v[lang].length > 3e4)) throw TypeError("Invalid translation");
    if (v[lang]?.trim()) out[lang] = v[lang];
  }
  return out;
}
function items(v) {
  if (v === null) return null;
  if (!Array.isArray(v) || v.length > 2e3) throw TypeError("Invalid FAQ items");
  const ids = /* @__PURE__ */ new Set();
  return v.map((x) => {
    if (!x || typeof x.id !== "string" || !x.id || ids.has(x.id) || typeof x.category !== "string" || x.category.length > 100) throw TypeError("Invalid FAQ identity");
    ids.add(x.id);
    const out = { id: x.id, category: x.category, question: localized(x.question), answer: localized(x.answer) };
    if (x.sourceUrl) {
      const url = new URL(x.sourceUrl);
      if (url.protocol !== "https:" || url.username || url.password) throw TypeError("Invalid source URL");
      out.sourceUrl = url.href;
    }
    return out;
  });
}
function filters(v) {
  if (!v || typeof v.query !== "string" || v.query.length > 500 || typeof v.category !== "string" || v.category.length > 100) throw TypeError("Invalid FAQ filter");
  return { query: v.query, category: v.category };
}
var AzrFaq = class extends ElementBase {
  #items = null;
  #filters = { query: "", category: "all" };
  #error = "";
  #open = false;
  #returnFocus = null;
  upgradeProperties = ["items", "filters", "open", "error", "language", "busy", "presentation"];
  static get observedAttributes() {
    return [...super.observedAttributes, "presentation"];
  }
  get items() {
    return copy(this.#items);
  }
  set items(v) {
    this.#items = items(v);
    this.render();
  }
  get filters() {
    return copy(this.#filters);
  }
  set filters(v) {
    this.#filters = filters(v);
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
  get presentation() {
    return this.getAttribute("presentation") ?? "page";
  }
  set presentation(v) {
    if (!["page", "drawer"].includes(v)) throw TypeError("Invalid presentation");
    this.setAttribute("presentation", v);
  }
  get open() {
    return this.#open;
  }
  set open(v) {
    if (typeof v !== "boolean") throw TypeError("Invalid open state");
    if (v && !this.#open) this.#returnFocus = document.activeElement;
    this.#open = v;
    this.render();
    if (!v) this.#restoreFocus();
  }
  #restoreFocus() {
    const target = this.#returnFocus;
    this.#returnFocus = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#restoreFocus();
  }
  #close() {
    this.#open = false;
    this.render();
    this.#restoreFocus();
    emit(this, "azr:faq-close", {});
  }
  handle(e) {
    if (e.type === "keydown" && e.key === "Escape" && this.presentation === "drawer") {
      e.preventDefault();
      this.#close();
      return;
    }
    if (e.type === "keydown" && e.key === "Tab" && this.presentation === "drawer") {
      const nodes = [...this.shadowRoot.querySelectorAll("button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href]")].filter((n) => n.getClientRects().length);
      const active = this.shadowRoot.activeElement;
      if (nodes.length && e.shiftKey && active === nodes[0]) {
        e.preventDefault();
        nodes.at(-1).focus();
      } else if (nodes.length && !e.shiftKey && active === nodes.at(-1)) {
        e.preventDefault();
        nodes[0].focus();
      }
      return;
    }
    if (e.type === "click" && (e.target.closest("[data-close]") || e.target.tagName === "DIALOG")) {
      this.#close();
      return;
    }
    if (this.busy) return;
    const t = e.target;
    if (e.type === "input" && t.dataset.query !== void 0) {
      this.#filters.query = t.value;
      emit(this, "azr:faq-filter-change", { filters: this.filters });
      this.render();
    }
    if (e.type === "change" && t.dataset.category !== void 0) {
      this.#filters.category = t.value;
      emit(this, "azr:faq-filter-change", { filters: this.filters });
      this.render();
    }
    if (e.type === "click" && t.closest("[data-reset]")) {
      this.#filters = { query: "", category: "all" };
      emit(this, "azr:faq-filter-change", { filters: this.filters });
      this.render();
    }
  }
  render() {
    const t = labels[this.language], modal = this.presentation === "drawer";
    if (modal && !this.#open) {
      this.paint("");
      return;
    }
    const previousKey = this.shadowRoot.activeElement?.dataset.key;
    const query = fold(this.#filters.query.trim()), matches = (this.#items ?? []).filter((x) => (this.#filters.category === "all" || x.category === this.#filters.category) && fold(localeText(x.question, this.language) + " " + localeText(x.answer, this.language)).includes(query)), categories = [...new Set((this.#items ?? []).map((x) => x.category))];
    const content = `<section lang="${this.language}" aria-labelledby="faq-title"><div class="row between"><h1 id="faq-title">${t[0]}</h1>${modal ? `<button type="button" data-close data-key="close" aria-label="${t[7]}">\xD7</button>` : ""}</div><div class="grid"><label>${t[1]}<input type="search" data-query data-key="query" maxlength="500" value="${esc(this.#filters.query)}" ${this.busy ? "disabled" : ""}></label><label>${t[2]}<select data-category data-key="category" ${this.busy ? "disabled" : ""}><option value="all">${t[2]}</option>${categories.map((c) => `<option value="${esc(c)}" ${this.#filters.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}${!categories.includes(this.#filters.category) && this.#filters.category !== "all" ? `<option value="${esc(this.#filters.category)}" selected>${esc(this.#filters.category)}</option>` : ""}</select></label></div>${this.#filters.query || this.#filters.category !== "all" ? `<button type="button" data-reset ${this.busy ? "disabled" : ""}>${t[9]}</button>` : ""}${this.#error ? `<p class="notice error" role="alert">${esc(this.#error)}</p>` : this.#items === null || this.busy ? `<p class="notice" role="status">${t[5]}</p>` : `<p class="muted" role="status">${matches.length} ${t[3]}</p>${matches.length ? matches.map((x) => {
      const fallback = !x.question[this.language] || !x.answer[this.language];
      return `<details class="card" data-key="faq-${esc(x.id)}"><summary>${esc(localeText(x.question, this.language))}</summary>${fallback && this.language !== "de" ? `<p class="badge">${t[8]}</p>` : ""}<p class="body" lang="${x.answer[this.language] ? this.language : "de"}">${esc(localeText(x.answer, this.language))}</p>${x.sourceUrl ? `<a href="${esc(x.sourceUrl)}" target="_blank" rel="noopener noreferrer">${t[6]} \u2197</a>` : ""}</details>`;
    }).join("") : `<p class="notice">${t[4]}</p>`}`}</section>`;
    this.paint(`<style>dialog{border:0;padding:24px;color:inherit;background:#f8faff;width:min(680px,100vw);max-width:100vw;max-height:100dvh;height:100dvh;margin:0 0 0 auto;overflow:auto;box-shadow:-10px 0 80px #10235233}dialog::backdrop{background:#10235266}summary{font-weight:650;overflow-wrap:anywhere}details.card{padding:12px 20px}h1{margin:0 0 18px}section{min-width:0}@media(max-width:640px){dialog{padding:18px}}</style>${modal ? `<dialog aria-labelledby="faq-title">${content}</dialog>` : content}`);
    if (modal) {
      const dialog = this.shadowRoot.querySelector("dialog");
      if (dialog) {
        dialog.addEventListener("cancel", (e) => {
          e.preventDefault();
          this.#close();
        }, { once: true });
        dialog.showModal();
        const target = this.shadowRoot.querySelector(`[data-key="${["query", "category", "close"].includes(previousKey) ? previousKey : "query"}"]`);
        target?.focus({ preventScroll: true });
      }
    }
  }
};
if (!customElements.get("azr-faq")) customElements.define("azr-faq", AzrFaq);
export {
  AzrFaq
};
