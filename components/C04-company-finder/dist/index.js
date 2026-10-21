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
  de: { title: "Passende Ausbildungsbetriebe finden", intro: "Suche in den Bestandskontakten. Ob aktuell Pl\xE4tze frei sind, pr\xFCfst du auf der Website des Betriebs.", category: "Berufsbereich", query: "Ort, Postleitzahl oder Firmenname", all: "Alle Bereiche", hotel: "Hotel und Gastronomie", care: "Pflege und Gesundheit", educator: "Erziehung und Kita", sales: "Verkauf und Einzelhandel", search: "Suchen", reset: "Zur\xFCcksetzen", results: "Treffer", shown: "angezeigt", more: "Mehr anzeigen", website: "Website pr\xFCfen", select: "Kontakt ausw\xE4hlen", contact: "Kontaktinformationen", inferred: "Diese alte E-Mail-Adresse wurde automatisch abgeleitet. Pr\xFCfe die richtige Adresse auf der Website.", unverified: "Bestandskontakt \xB7 nicht aktuell gepr\xFCft", verified: "Kontakt gepr\xFCft", selected: "Ausgew\xE4hlt", empty: "Keine passenden Kontakte. Versuche einen anderen Ort oder Berufsbereich.", loading: "Firmenkontakte werden geladen \u2026", error: "Firmenkontakte konnten nicht geladen werden.", busy: "Bitte warten \u2026" },
  en: { title: "Find suitable training companies", intro: "Search the existing contacts. Check the company website for current training vacancies.", category: "Occupation area", query: "City, postal code or company name", all: "All areas", hotel: "Hotels and catering", care: "Care and health", educator: "Childcare and education", sales: "Sales and retail", search: "Search", reset: "Reset", results: "results", shown: "shown", more: "Show more", website: "Check website", select: "Select contact", contact: "Contact details", inferred: "This old email address was automatically inferred. Check the correct address on the website.", unverified: "Existing contact \xB7 not recently checked", verified: "Contact checked", selected: "Selected", empty: "No matching contacts. Try another city or occupation area.", loading: "Loading company contacts \u2026", error: "Company contacts could not be loaded.", busy: "Please wait \u2026" },
  fr: { title: "Trouver des entreprises formatrices", intro: "Recherche dans les contacts existants. V\xE9rifie les places actuellement propos\xE9es sur le site de l\u2019entreprise.", category: "Domaine professionnel", query: "Ville, code postal ou entreprise", all: "Tous les domaines", hotel: "H\xF4tellerie et restauration", care: "Soins et sant\xE9", educator: "\xC9ducation et petite enfance", sales: "Vente et commerce", search: "Rechercher", reset: "R\xE9initialiser", results: "r\xE9sultats", shown: "affich\xE9s", more: "Afficher plus", website: "V\xE9rifier le site", select: "Choisir ce contact", contact: "Coordonn\xE9es", inferred: "Cette ancienne adresse e-mail a \xE9t\xE9 d\xE9duite automatiquement. V\xE9rifie la bonne adresse sur le site.", unverified: "Contact existant \xB7 pas v\xE9rifi\xE9 r\xE9cemment", verified: "Contact v\xE9rifi\xE9", selected: "S\xE9lectionn\xE9", empty: "Aucun contact correspondant. Essaie une autre ville ou un autre domaine.", loading: "Chargement des contacts \u2026", error: "Impossible de charger les contacts.", busy: "Patiente un instant \u2026" },
  ru: { title: "\u041D\u0430\u0439\u0442\u0438 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438 \u0434\u043B\u044F \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F", intro: "\u0418\u0449\u0438 \u0441\u0440\u0435\u0434\u0438 \u0438\u043C\u0435\u044E\u0449\u0438\u0445\u0441\u044F \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432. \u0410\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0435 \u043C\u0435\u0441\u0442\u0430 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0439 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438.", category: "\u041F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C", query: "\u0413\u043E\u0440\u043E\u0434, \u0438\u043D\u0434\u0435\u043A\u0441 \u0438\u043B\u0438 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F", all: "\u0412\u0441\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438", hotel: "\u0413\u043E\u0441\u0442\u0438\u043D\u0438\u0446\u044B \u0438 \u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435 \u043F\u0438\u0442\u0430\u043D\u0438\u0435", care: "\u0423\u0445\u043E\u0434 \u0438 \u0437\u0434\u0440\u0430\u0432\u043E\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435", educator: "\u0412\u043E\u0441\u043F\u0438\u0442\u0430\u043D\u0438\u0435 \u0438 \u0434\u0435\u0442\u0441\u043A\u0438\u0435 \u0441\u0430\u0434\u044B", sales: "\u041F\u0440\u043E\u0434\u0430\u0436\u0438 \u0438 \u0440\u043E\u0437\u043D\u0438\u0447\u043D\u0430\u044F \u0442\u043E\u0440\u0433\u043E\u0432\u043B\u044F", search: "\u0418\u0441\u043A\u0430\u0442\u044C", reset: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C", results: "\u043D\u0430\u0439\u0434\u0435\u043D\u043E", shown: "\u043F\u043E\u043A\u0430\u0437\u0430\u043D\u043E", more: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0435\u0449\u0451", website: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0430\u0439\u0442", select: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442", contact: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435", inferred: "\u042D\u0442\u043E\u0442 \u0441\u0442\u0430\u0440\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u0447\u0442\u044B \u0431\u044B\u043B \u0432\u044B\u0432\u0435\u0434\u0435\u043D \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0438.", unverified: "\u0421\u0442\u0430\u0440\u044B\u0439 \u043A\u043E\u043D\u0442\u0430\u043A\u0442 \xB7 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u0430", verified: "\u041A\u043E\u043D\u0442\u0430\u043A\u0442 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D", selected: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E", empty: "\u041F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432 \u043D\u0435\u0442. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0434\u0440\u0443\u0433\u043E\u0439 \u0433\u043E\u0440\u043E\u0434 \u0438\u043B\u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u044C.", loading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432 \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0439 \u2026", error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u0439.", busy: "\u041F\u043E\u0434\u043E\u0436\u0434\u0438 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u2026" }
};

// src/index.js
var categories = ["hotel", "care", "educator", "sales"];
var statuses = ["unknown", "legacy-literal", "legacy-inferred", "verified"];
function url(value) {
  if (!value) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value)) throw new TypeError("Unsupported website protocol");
  const u = new URL(/^https?:\/\//i.test(value) ? value : "https://" + value);
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password) throw new TypeError("Invalid company website");
  return u.href;
}
function companies(value) {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > 5e3) throw new TypeError("Invalid companies");
  const ids = /* @__PURE__ */ new Set();
  return value.map((row) => {
    if (!row || typeof row.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id) || !categories.includes(row.category) || !statuses.includes(row.emailStatus ?? "unknown")) throw new TypeError("Invalid company");
    ids.add(row.id);
    const result = { id: row.id, category: row.category, emailStatus: row.emailStatus ?? "unknown" };
    for (const key of ["name", "city", "postalCode", "address", "website", "email", "phone"]) {
      const v = row[key] ?? "";
      if (typeof v !== "string" || v.length > 2e3) throw new TypeError("Invalid company text");
      result[key] = v;
    }
    if (!result.name.trim()) throw new TypeError("Company name required");
    if (/[\r\n]/.test(result.email)) throw new TypeError("Invalid company email");
    if (result.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new TypeError("Invalid company email");
    result.website = url(result.website);
    return result;
  });
}
function filters(value) {
  if (!value || !["all", ...categories].includes(value.category) || typeof value.query !== "string" || value.query.length > 200) throw new TypeError("Invalid company filters");
  return { category: value.category, query: value.query };
}
var norm = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("de").replace(/ß/g, "ss").replace(/ae/g, "a").replace(/oe/g, "o").replace(/ue/g, "u").trim();
var AzrCompanyFinder = class extends ElementBase {
  #companies = null;
  #filters = { category: "all", query: "" };
  #draft = { category: "all", query: "" };
  #limit = 10;
  #error = null;
  #selected = "";
  upgradeProperties = ["companies", "filters", "error", "language", "busy"];
  get companies() {
    return copy(this.#companies);
  }
  set companies(v) {
    this.#companies = companies(v);
    this.#limit = 10;
    this.render();
  }
  get filters() {
    return copy(this.#filters);
  }
  set filters(v) {
    this.#filters = filters(v);
    this.#draft = copy(this.#filters);
    this.#limit = 10;
    this.render();
  }
  get error() {
    return this.#error;
  }
  set error(v) {
    if (v !== null && typeof v !== "string") throw new TypeError("Invalid error");
    this.#error = v;
    this.render();
  }
  #results() {
    const query = norm(this.#filters.query);
    return (this.#companies ?? []).filter((row) => (this.#filters.category === "all" || row.category === this.#filters.category) && (!query || [row.name, row.city, row.postalCode, row.address].some((value) => norm(value).includes(query))));
  }
  #apply() {
    this.#filters = copy(this.#draft);
    this.#limit = 10;
    emit(this, "azr:filters-change", { filters: this.filters });
    this.render();
  }
  handle(e) {
    if (this.busy) return;
    const target = e.target.closest("input,select,button");
    if (!target) return;
    if (e.type === "input" && target.dataset.query !== void 0) this.#draft.query = target.value;
    if (e.type === "change" && target.dataset.category !== void 0) this.#draft.category = target.value;
    if (e.type === "keydown" && e.key === "Enter" && target.tagName === "INPUT") {
      e.preventDefault();
      this.#apply();
    }
    if (e.type !== "click") return;
    if (target.dataset.search !== void 0) this.#apply();
    if (target.dataset.reset !== void 0) {
      this.#draft = { category: "all", query: "" };
      this.#apply();
    }
    if (target.dataset.more !== void 0) {
      this.#limit += 10;
      this.render();
    }
    if (target.dataset.select) {
      const company = this.#companies?.find((row) => row.id === target.dataset.select);
      if (company) {
        this.#selected = company.name;
        emit(this, "azr:company-selected", { company: copy(company) });
        this.render();
      }
    }
  }
  render() {
    const t = words[this.language], list = this.#results(), visible = list.slice(0, this.#limit);
    let body = `<h1>${t.title}</h1><p>${t.intro}</p>`;
    if (this.#error) {
      this.paint(body + `<p role="alert" class="notice error">${t.error}<span class="body"> ${esc(this.#error)}</span></p>`);
      return;
    }
    if (this.#companies === null) {
      this.paint(body + `<p role="status" class="notice">${t.loading}</p>`);
      return;
    }
    body += `<div class="card"><div class="grid"><label>${t.category}<select data-key="category" data-category ${this.busy ? "disabled" : ""}><option value="all">${t.all}</option>${categories.map((c) => `<option value="${c}" ${this.#draft.category === c ? "selected" : ""}>${t[c]}</option>`).join("")}</select></label><label>${t.query}<input data-key="query" data-query value="${esc(this.#draft.query)}" maxlength="200" ${this.busy ? "disabled" : ""}></label></div><div class="row"><button type="button" class="primary" data-key="search" data-search ${this.busy ? "disabled" : ""}>${t.search}</button><button type="button" data-key="reset" data-reset ${this.busy ? "disabled" : ""}>${t.reset}</button>${this.busy ? `<span role="status">${t.busy}</span>` : ""}</div></div><p class="muted" role="status" data-result-count>${list.length} ${t.results} \xB7 ${visible.length} ${t.shown}</p>${this.#selected ? `<p class="notice success" role="status" data-selected>${t.selected}: ${esc(this.#selected)}</p>` : ""}`;
    body += !list.length ? `<p class="notice" data-empty>${t.empty}</p>` : `<ul class="list">${visible.map((row) => `<li class="card" data-company="${row.id}"><div class="row between"><div><h2>${esc(row.name)}</h2><p>${esc([row.postalCode, row.city].filter(Boolean).join(" "))}</p><span class="badge">${t[row.category]}</span> <span class="muted">${row.emailStatus === "verified" ? t.verified : t.unverified}</span></div><button type="button" data-key="select-${row.id}" data-select="${row.id}" ${this.busy ? "disabled" : ""}>${t.select} \u2192</button></div><details data-key="contact-${row.id}"><summary>${t.contact}</summary>${row.address ? `<p>${esc(row.address)}</p>` : ""}${row.emailStatus === "legacy-inferred" ? `<p class="notice">${t.inferred}</p><p>${esc(row.email)}</p>` : row.email ? `<p><a href="mailto:${esc(encodeURIComponent(row.email))}">${esc(row.email)}</a></p>` : ""}${row.phone ? `<p>${esc(row.phone)}</p>` : ""}</details>${row.website ? `<a class="button" href="${esc(row.website)}" target="_blank" rel="noopener noreferrer" style="margin-top:12px">${t.website} \u2197</a>` : ""}</li>`).join("")}</ul>`;
    if (visible.length < list.length) body += `<div class="actions"><button type="button" data-key="more" data-more ${this.busy ? "disabled" : ""}>${t.more} (${list.length - visible.length})</button></div>`;
    this.paint(`<section lang="${this.language}" aria-busy="${this.busy}">${body}</section>`);
  }
};
if (!customElements.get("azr-company-finder")) customElements.define("azr-company-finder", AzrCompanyFinder);
export {
  AzrCompanyFinder
};
