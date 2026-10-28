// src/ui.js
var esc = (value2) => String(value2 ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var copy = (value2) => structuredClone(value2);
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
  attributeChangedCallback(name, old, value2) {
    if (old === value2) return;
    if (name === "language") {
      if (!languages.includes(value2 ?? "de")) {
        emit(this, "azr:component-error", { code: "invalid-attribute", attribute: name });
        return;
      }
      this.#lang = value2 ?? "de";
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
var statusIds = ["aupair", "abroad", "fsj", "language", "trainee"];
var words = { de: ["Deine Frage stellen", "Bereite deine Frage vor. Im n\xE4chsten Schritt pr\xFCfst du sie in Google Forms und sendest sie dort selbst ab.", "Dein Name (freiwillig)", "Deine E-Mail-Adresse", "WhatsApp (freiwillig)", "Aktueller Status", "Bitte ausw\xE4hlen", "Deine Frage / Dein Problem", "Ich stimme zu, dass meine Frage anonymisiert in die FAQ aufgenommen werden darf.", "\xDCbergabe vorbereiten", "Vorbef\xFCllung wird vorbereitet \u2026", "In Google Forms pr\xFCfen und absenden", "Deine Frage wurde noch nicht abgesendet. Erst beim \xD6ffnen des Links werden deine Angaben an Google Forms \xFCbergeben.", "Der Text ist zu lang f\xFCr die Vorbef\xFCllung. Kopiere ihn und f\xFCge ihn im Originalformular ein.", "Frage kopieren", "Frage kopiert.", "Kopieren nicht verf\xFCgbar. Bitte Text manuell kopieren.", "Die Formular\xFCbergabe ist noch nicht verbunden.", "\xDCbergabe fehlgeschlagen. Bitte erneut versuchen.", ["Au-pair in Deutschland", "Bewerber aus dem Ausland", "FSJ / BFD", "Sprachsch\xFCler", "Azubi"]], en: ["Ask your question", "Prepare your question, then review it in Google Forms and submit it there yourself.", "Your name (optional)", "Your email address", "WhatsApp (optional)", "Current status", "Please choose", "Your question / problem", "I agree that my question may be added anonymously to the FAQ.", "Prepare handoff", "Preparing prefill \u2026", "Review and submit in Google Forms", "Your question has not been sent yet. Opening the link transfers your information to Google Forms.", "The text is too long for prefill. Copy it and paste it into the original form.", "Copy question", "Question copied.", "Copy unavailable. Select and copy the text manually.", "The form handoff is not connected yet.", "Handoff failed. Please try again.", ["Au pair in Germany", "Applicant abroad", "Voluntary service FSJ / BFD", "Language student", "Trainee"]], fr: ["Poser ta question", "Pr\xE9pare ta question, puis v\xE9rifie-la dans Google Forms et envoie-la toi-m\xEAme.", "Ton nom (facultatif)", "Ton adresse e-mail", "WhatsApp (facultatif)", "Situation actuelle", "Choisir", "Ta question / ton probl\xE8me", "J\u2019accepte que ma question soit ajout\xE9e anonymement \xE0 la FAQ.", "Pr\xE9parer le transfert", "Pr\xE9paration \u2026", "V\xE9rifier et envoyer dans Google Forms", "Ta question n\u2019a pas encore \xE9t\xE9 envoy\xE9e. Ouvrir le lien transmet tes informations \xE0 Google Forms.", "Le texte est trop long pour le pr\xE9remplissage. Copie-le et colle-le dans le formulaire original.", "Copier la question", "Question copi\xE9e.", "Copie indisponible. S\xE9lectionne et copie le texte manuellement.", "Le transfert au formulaire n\u2019est pas encore connect\xE9.", "\xC9chec du transfert. R\xE9essaie.", ["Au pair en Allemagne", "Candidat \xE0 l\u2019\xE9tranger", "Service volontaire FSJ / BFD", "\xC9l\xE8ve en cours de langue", "Apprenti"]], ru: ["\u0417\u0430\u0434\u0430\u0442\u044C \u0432\u043E\u043F\u0440\u043E\u0441", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C \u0432\u043E\u043F\u0440\u043E\u0441, \u0437\u0430\u0442\u0435\u043C \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0435\u0433\u043E \u0432 Google Forms \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u044C \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E.", "\u0418\u043C\u044F (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", "\u0422\u0432\u043E\u0439 \u0430\u0434\u0440\u0435\u0441 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u043F\u043E\u0447\u0442\u044B", "WhatsApp (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0441\u0442\u0430\u0442\u0443\u0441", "\u0412\u044B\u0431\u0435\u0440\u0438", "\u0422\u0432\u043E\u0439 \u0432\u043E\u043F\u0440\u043E\u0441 / \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430", "\u042F \u0441\u043E\u0433\u043B\u0430\u0441\u0435\u043D \u0441 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435\u043C \u043C\u043E\u0435\u0433\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u0430 \u0432 FAQ \u0432 \u0430\u043D\u043E\u043D\u0438\u043C\u043D\u043E\u043C \u0432\u0438\u0434\u0435.", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0445\u043E\u0434", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u2026", "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0432 Google Forms", "\u0412\u043E\u043F\u0440\u043E\u0441 \u0435\u0449\u0451 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D. \u041F\u0440\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0438 \u0441\u0441\u044B\u043B\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u0431\u0443\u0434\u0443\u0442 \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u044B \u0432 Google Forms.", "\u0422\u0435\u043A\u0441\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439 \u0434\u043B\u044F \u043F\u0440\u0435\u0434\u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F. \u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0435\u0433\u043E \u0432 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u0443\u044E \u0444\u043E\u0440\u043C\u0443.", "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432\u043E\u043F\u0440\u043E\u0441", "\u0412\u043E\u043F\u0440\u043E\u0441 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D.", "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E. \u0412\u044B\u0434\u0435\u043B\u0438 \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432\u0440\u0443\u0447\u043D\u0443\u044E.", "\u041F\u0435\u0440\u0435\u0445\u043E\u0434 \u043A \u0444\u043E\u0440\u043C\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D.", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u043F\u0435\u0440\u0435\u0445\u043E\u0434. \u041F\u043E\u0432\u0442\u043E\u0440\u0438 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.", ["Au pair \u0432 \u0413\u0435\u0440\u043C\u0430\u043D\u0438\u0438", "\u041A\u0430\u043D\u0434\u0438\u0434\u0430\u0442 \u0437\u0430 \u0440\u0443\u0431\u0435\u0436\u043E\u043C", "\u0414\u043E\u0431\u0440\u043E\u0432\u043E\u043B\u044C\u043D\u0430\u044F \u0441\u043B\u0443\u0436\u0431\u0430 FSJ / BFD", "\u042F\u0437\u044B\u043A\u043E\u0432\u043E\u0439 \u043A\u0443\u0440\u0441", "\u041E\u0431\u0443\u0447\u0430\u044E\u0449\u0438\u0439\u0441\u044F \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u0438"]] };
function value(v) {
  if (!v || v.schemaVersion !== 1 || typeof (v.consent ?? false) !== "boolean") throw TypeError("Invalid question");
  const out = { schemaVersion: 1, consent: v.consent ?? false };
  for (const [k, max] of Object.entries({ name: 200, email: 254, whatsapp: 100, status: 20, question: 4e3 })) {
    if (typeof (v[k] ?? "") !== "string" || (v[k] ?? "").length > max) throw TypeError("Invalid question field");
    out[k] = v[k] ?? "";
  }
  if (out.status && !statusIds.includes(out.status)) throw TypeError("Unknown status");
  if (/[\r\n]/.test(out.email)) throw TypeError("Invalid email");
  return out;
}
var AzrQuestionForm = class extends ElementBase {
  #value = value({ schemaVersion: 1 });
  #services = null;
  #handoff = null;
  #preparing = false;
  #operation = 0;
  #message = "";
  #error = false;
  upgradeProperties = ["value", "services", "language", "busy"];
  get value() {
    return copy(this.#value);
  }
  set value(v) {
    const next = value(v);
    if (JSON.stringify(next) !== JSON.stringify(this.#value)) {
      this.#value = next;
      this.#operation++;
      this.#preparing = false;
      this.#handoff = null;
    }
    this.render();
  }
  get services() {
    return this.#services;
  }
  set services(v) {
    if (v !== null && (!v || typeof v.prepareQuestion !== "function")) throw TypeError("Invalid question gateway");
    this.#services = v;
    this.render();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#operation++;
    this.#preparing = false;
    this.#handoff = null;
  }
  #complete() {
    return Boolean(this.#value.email.trim() && this.#value.question.trim() && this.#value.status && this.#value.consent);
  }
  #changed(structural = true) {
    this.#operation++;
    this.#handoff = null;
    this.#message = "";
    this.#error = false;
    emit(this, "azr:question-change", { value: this.value });
    if (structural) this.render();
    else {
      const root = this.shadowRoot;
      root.querySelector("[data-prepare]").disabled = !this.#services || !this.#complete();
      root.querySelector("[data-copy]").disabled = !this.#value.question;
      root.querySelector("[data-handoff]")?.closest(".notice")?.remove();
      for (const notice of root.querySelectorAll(".notice[role=alert],.notice[role=status]")) notice.remove();
    }
  }
  async #prepare() {
    if (this.busy || this.#preparing || !this.#services || !this.#complete() || !this.shadowRoot.querySelector("form").reportValidity()) return;
    const operation = ++this.#operation, actionId = crypto.randomUUID();
    this.#preparing = true;
    this.#handoff = null;
    this.#message = "";
    this.render();
    emit(this, "azr:question-handoff", { actionId, status: "pending" });
    try {
      const result = await this.#services.prepareQuestion(this.value);
      if (operation !== this.#operation) return;
      const url = new URL(result?.url);
      if (url.protocol !== "https:" || url.hostname !== "docs.google.com" || url.username || url.password || !/^\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/.test(url.pathname) || typeof result.prefilled !== "boolean") throw Error("Invalid Google Forms handoff");
      this.#handoff = { url: url.href, prefilled: result.prefilled };
      emit(this, "azr:question-handoff", { actionId, status: "ready" });
    } catch (e) {
      if (operation !== this.#operation) return;
      this.#message = words[this.language][18] + " " + String(e.message);
      this.#error = true;
      emit(this, "azr:question-handoff", { actionId, status: "error" });
    } finally {
      if (operation === this.#operation) {
        this.#preparing = false;
        this.render();
      }
    }
  }
  async #copy() {
    const t = words[this.language];
    try {
      const text = [this.#value.name, this.#value.email, this.#value.whatsapp, t[19][statusIds.indexOf(this.#value.status)], this.#value.question].filter(Boolean).join("\n\n");
      await navigator.clipboard.writeText(text);
      this.#message = t[15];
      this.#error = false;
    } catch {
      this.#message = t[16];
      this.#error = true;
    }
    this.render();
  }
  handle(e) {
    if (this.busy || this.#preparing) return;
    const t = e.target;
    if (e.type === "input" && t.dataset.field) {
      this.#value[t.dataset.field] = t.value;
      this.#changed(false);
    }
    if (e.type === "change" && t.dataset.field === "status") {
      this.#value.status = t.value;
      this.#changed();
    }
    if (e.type === "change" && t.dataset.consent !== void 0) {
      this.#value.consent = t.checked;
      this.#changed();
    }
    if (e.type === "click") {
      if (t.closest("[data-prepare]")) this.#prepare();
      if (t.closest("[data-copy]")) this.#copy();
    }
  }
  render() {
    const t = words[this.language], locked = this.busy || this.#preparing, disabled = locked ? "disabled" : "";
    const input = (key, label, max, type = "text", required = "") => `<label>${label}<input type="${type}" ${type === "email" ? 'inputmode="email" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="email"' : ""} data-key="${key}" data-field="${key}" maxlength="${max}" value="${esc(this.#value[key])}" ${required}></label>`;
    this.paint(`<style>input,textarea,select{font-size:16px}</style><section lang="${this.language}"><h1>${t[0]}</h1><p>${t[1]}</p><form class="card"><fieldset ${disabled} style="border:0;padding:0;margin:0;min-width:0"><div class="grid">${input("name", t[2], 200)}${input("email", t[3], 254, "email", "required")}</div><div class="grid">${input("whatsapp", t[4], 100, "tel")}<label>${t[5]}<select data-key="status" data-field="status" required><option value="">${t[6]}</option>${statusIds.map((id, i) => `<option value="${id}" ${this.#value.status === id ? "selected" : ""}>${t[19][i]}</option>`).join("")}</select></label></div><label>${t[7]}<textarea data-key="question" data-field="question" maxlength="4000" required style="min-height:180px">${esc(this.#value.question)}</textarea></label><label class="check"><input type="checkbox" data-key="consent" data-consent ${this.#value.consent ? "checked" : ""} required><span>${t[8]}</span></label><div class="actions"><button type="button" class="primary" data-key="prepare" data-prepare ${locked || !this.#services || !this.#complete() ? "disabled" : ""}>${this.#preparing ? t[10] : t[9]}</button><button type="button" data-copy ${locked || !this.#value.question ? "disabled" : ""}>${t[14]}</button></div></fieldset></form>${!this.#services ? `<p class="notice">${t[17]}</p>` : ""}${this.#preparing ? `<p role="status" class="notice">${t[10]}</p>` : ""}${this.#handoff ? `<div class="notice" role="status"><p>${t[12]}</p>${!this.#handoff.prefilled ? `<p>${t[13]}</p>` : ""}<a class="button" data-handoff href="${esc(this.#handoff.url)}" target="_blank" rel="noopener noreferrer">${t[11]} \u2197</a></div>` : ""}${this.#message ? `<p class="notice ${this.#error ? "error" : "success"}" role="${this.#error ? "alert" : "status"}">${esc(this.#message)}</p>` : ""}</section>`);
    this.shadowRoot.querySelector("form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.#prepare();
    });
  }
};
if (!customElements.get("azr-question-form")) customElements.define("azr-question-form", AzrQuestionForm);
export {
  AzrQuestionForm
};
