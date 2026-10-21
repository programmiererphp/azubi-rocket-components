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
var labels = { de: ["Dein Ausbildungs-Check", "W\xE4hle einen Check", "Frage", "von", "Zur\xFCck", "Weiter", "Ergebnis ansehen", "Neu starten", "Dein Ergebnis", "Punkte", "W\xE4hle eine Antwort, um fortzufahren.", "Fragen werden geladen \u2026", "Keine Fragen vorhanden.", "Deutsch \u2013 \xDCbersetzung fehlt", "Dieser Check dient der Orientierung und entscheidet nicht \xFCber Ausbildungsplatz, Eignung oder Aufenthalt."], en: ["Your training check", "Choose a check", "Question", "of", "Back", "Next", "See result", "Restart", "Your result", "points", "Choose an answer to continue.", "Loading questions \u2026", "No questions available.", "German \u2013 translation unavailable", "This check is for orientation. It does not decide admission, suitability or residence."], fr: ["Ton bilan de formation", "Choisir un bilan", "Question", "sur", "Retour", "Continuer", "Voir le r\xE9sultat", "Recommencer", "Ton r\xE9sultat", "points", "Choisis une r\xE9ponse pour continuer.", "Chargement des questions \u2026", "Aucune question disponible.", "Allemand \u2013 traduction indisponible", "Ce bilan sert \xE0 t\u2019orienter et ne d\xE9cide ni admission, ni aptitude, ni droit de s\xE9jour."], ru: ["\u0422\u0432\u043E\u0439 \u043F\u043B\u0430\u043D \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438", "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043E\u043F\u0440\u043E\u0441", "\u0412\u043E\u043F\u0440\u043E\u0441", "\u0438\u0437", "\u041D\u0430\u0437\u0430\u0434", "\u0414\u0430\u043B\u0435\u0435", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442", "\u041D\u0430\u0447\u0430\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E", "\u0422\u0432\u043E\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442", "\u0431\u0430\u043B\u043B\u043E\u0432", "\u0412\u044B\u0431\u0435\u0440\u0438 \u043E\u0442\u0432\u0435\u0442 \u0434\u043B\u044F \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0435\u043D\u0438\u044F.", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u2026", "\u0412\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.", "\u041D\u0435\u043C\u0435\u0446\u043A\u0438\u0439 \u2014 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442", "\u041E\u043F\u0440\u043E\u0441 \u043F\u043E\u043C\u043E\u0433\u0430\u0435\u0442 \u0441\u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0438 \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442 \u0437\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u0435, \u043F\u0440\u0438\u0433\u043E\u0434\u043D\u043E\u0441\u0442\u044C \u0438\u043B\u0438 \u043F\u0440\u0430\u0432\u043E \u043D\u0430 \u043F\u0440\u0435\u0431\u044B\u0432\u0430\u043D\u0438\u0435."] };
var id = (v) => typeof v === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(v);
function text(v) {
  if (!v || typeof v.de !== "string" || !v.de.trim() || v.de.length > 1e4) throw TypeError("German text required");
  const out = {};
  for (const l of languages) {
    if (v[l] !== void 0 && (typeof v[l] !== "string" || v[l].length > 1e4)) throw TypeError("Invalid translated text");
    if (v[l]?.trim()) out[l] = v[l];
  }
  return out;
}
function quizzes(value) {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length > 20) throw TypeError("Invalid quizzes");
  const ids = /* @__PURE__ */ new Set();
  return value.map((q) => {
    if (!q || !id(q.id) || ids.has(q.id) || !Array.isArray(q.questions) || !q.questions.length || q.questions.length > 200) throw TypeError("Invalid quiz");
    ids.add(q.id);
    const questionIds = /* @__PURE__ */ new Set();
    const questions = q.questions.map((x) => {
      if (!x || !id(x.id) || questionIds.has(x.id) || !Array.isArray(x.options) || x.options.length < 2 || x.options.length > 8) throw TypeError("Invalid question");
      questionIds.add(x.id);
      const optionsIds = /* @__PURE__ */ new Set();
      return { id: x.id, text: text(x.text), options: x.options.map((o) => {
        if (!id(o.id) || optionsIds.has(o.id) || !Number.isFinite(o.points) || o.points < 0 || o.points > 1e3) throw TypeError("Invalid quiz option");
        optionsIds.add(o.id);
        return { id: o.id, text: text(o.text), points: o.points };
      }), ...x.explanation ? { explanation: text(x.explanation) } : {} };
    });
    if (!questions.some((x) => x.options.some((o) => o.points > 0))) throw TypeError("Positive quiz maximum required");
    if (!Array.isArray(q.results) || !q.results.length || q.results.length > 20) throw TypeError("Results required");
    const results = q.results.map((r) => {
      if (!Number.isFinite(r.minRatio) || !Number.isFinite(r.maxRatio) || r.minRatio < 0 || r.maxRatio > 1 || r.minRatio > r.maxRatio) throw TypeError("Invalid result interval");
      return { minRatio: r.minRatio, maxRatio: r.maxRatio, title: text(r.title), body: text(r.body) };
    });
    return { id: q.id, title: text(q.title), intro: text(q.intro), questions, results };
  });
}
var AzrQuiz = class extends ElementBase {
  #quizzes = null;
  #quizId = "";
  #state = null;
  upgradeProperties = ["quizzes", "quizId", "resultState", "language", "busy"];
  get quizzes() {
    return copy(this.#quizzes);
  }
  set quizzes(v) {
    const next = quizzes(v);
    if (this.#state && next?.some((q) => q.id === this.#state.quizId)) this.#validate(this.#state, next);
    this.#quizzes = next;
    if (!next?.some((q) => q.id === this.#quizId)) {
      this.#quizId = next?.[0]?.id ?? "";
      this.#state = null;
    }
    this.#ensure();
    this.render();
  }
  get quizId() {
    return this.#quizId;
  }
  set quizId(v) {
    if (typeof v !== "string" || v && !id(v)) throw TypeError("Invalid quiz ID");
    if (this.#quizzes && !this.#quizzes.some((q) => q.id === v)) throw TypeError("Unknown quiz");
    if (v !== this.#quizId) {
      this.#quizId = v;
      this.#state = null;
    }
    this.#ensure();
    this.render();
  }
  get resultState() {
    return copy(this.#state);
  }
  set resultState(v) {
    if (v === null) {
      this.#state = null;
      this.#ensure();
      this.render();
      return;
    }
    const next = this.#validate(v, this.#quizzes);
    this.#quizId = next.quizId;
    this.#state = next;
    this.render();
  }
  #quiz() {
    return this.#quizzes?.find((q) => q.id === this.#quizId);
  }
  #ensure() {
    if (!this.#state && this.#quiz()) this.#state = { quizId: this.#quizId, questionIndex: 0, answers: {} };
  }
  #validate(v, list) {
    const q = list?.find((q2) => q2.id === v?.quizId);
    if (!q || !Number.isInteger(v.questionIndex) || v.questionIndex < 0 || v.questionIndex > q.questions.length || !v.answers || typeof v.answers !== "object" || Array.isArray(v.answers)) throw TypeError("Invalid quiz state");
    const answers = {};
    for (const [k, a] of Object.entries(v.answers)) {
      const question = q.questions.find((x) => x.id === k);
      if (!question || !question.options.some((o) => o.id === a)) throw TypeError("Unknown answer");
      answers[k] = a;
    }
    if (v.questionIndex === q.questions.length && q.questions.some((x) => !answers[x.id])) throw TypeError("Incomplete result");
    return { quizId: q.id, questionIndex: v.questionIndex, answers };
  }
  #changed() {
    emit(this, "azr:quiz-change", { state: this.resultState });
    this.render();
  }
  #score() {
    const q = this.#quiz();
    const score = q.questions.reduce((n, x) => n + (x.options.find((o) => o.id === this.#state.answers[x.id])?.points ?? 0), 0), maxScore = q.questions.reduce((n, x) => n + Math.max(...x.options.map((o) => o.points)), 0);
    return { quizId: q.id, score, maxScore, ratio: score / maxScore };
  }
  handle(e) {
    if (this.busy) return;
    const t = e.target;
    if (e.type === "change" && t.dataset.quiz !== void 0) {
      this.quizId = t.value;
      this.#changed();
      return;
    }
    if (e.type === "change" && t.dataset.answer) {
      const q2 = this.#quiz(), x = q2?.questions[this.#state.questionIndex];
      if (!x?.options.some((o) => o.id === t.value)) return;
      this.#state.answers[x.id] = t.value;
      this.#changed();
      return;
    }
    if (e.type !== "click") return;
    const b = t.closest("button");
    if (!b || !this.#quiz()) return;
    const q = this.#quiz(), s = this.#state;
    if (b.dataset.previous !== void 0 && s.questionIndex > 0) {
      s.questionIndex--;
      this.#changed();
    }
    if (b.dataset.next !== void 0 && s.answers[q.questions[s.questionIndex]?.id]) {
      s.questionIndex++;
      this.#changed();
      if (s.questionIndex === q.questions.length) emit(this, "azr:quiz-result", this.#score());
      this.shadowRoot.querySelector("h2")?.focus({ preventScroll: true });
    }
    if (b.dataset.restart !== void 0) {
      this.#state = { quizId: this.#quizId, questionIndex: 0, answers: {} };
      this.#changed();
    }
  }
  render() {
    const t = labels[this.language], q = this.#quiz(), s = this.#state;
    let body = this.#quizzes === null ? `<p role="status" class="notice">${t[11]}</p>` : !q ? `<p class="notice">${t[12]}</p>` : "";
    if (q) {
      const done = s.questionIndex === q.questions.length;
      if (done) {
        const score = this.#score(), result = [...q.results].sort((a, b) => b.minRatio - a.minRatio).find((r) => score.ratio >= r.minRatio && score.ratio <= r.maxRatio);
        body = `<article class="card" data-result><h2 tabindex="-1">${t[8]}</h2><p style="font-size:32px;color:#075bce;font-weight:800">${score.score} / ${score.maxScore} ${t[9]}</p>${result ? `<h3>${esc(localeText(result.title, this.language))}</h3><p class="body">${esc(localeText(result.body, this.language))}</p>` : ""}<div class="actions"><button type="button" data-previous ${this.busy ? "disabled" : ""}>${t[4]}</button><button type="button" data-restart ${this.busy ? "disabled" : ""}>${t[7]}</button></div></article>`;
      } else {
        const x = q.questions[s.questionIndex], answer = s.answers[x.id], fallback = !x.text[this.language] || x.options.some((o) => !o.text[this.language]);
        body = `<article class="card"><p class="muted" role="status">${t[2]} ${s.questionIndex + 1} ${t[3]} ${q.questions.length}</p><progress max="${q.questions.length}" value="${Object.keys(s.answers).length}" aria-label="${t[2]}"></progress>${fallback && this.language !== "de" ? `<p class="badge">${t[13]}</p>` : ""}<h2 tabindex="-1">${esc(localeText(x.text, this.language))}</h2><fieldset ${this.busy ? "disabled" : ""}><legend class="sr-only">${esc(localeText(x.text, this.language))}</legend><div class="stack">${x.options.map((o) => `<label class="card check ${answer === o.id ? "selected" : ""}"><input type="radio" name="answer" data-answer="${x.id}" data-key="answer-${o.id}" value="${o.id}" ${answer === o.id ? "checked" : ""}><span>${esc(localeText(o.text, this.language))}</span></label>`).join("")}</div></fieldset>${answer && x.explanation ? `<p class="notice body" data-explanation>${esc(localeText(x.explanation, this.language))}</p>` : ""}<div class="actions"><button type="button" data-previous ${this.busy || s.questionIndex === 0 ? "disabled" : ""}>${t[4]}</button><button type="button" class="primary" data-next ${this.busy || !answer ? "disabled" : ""}>${s.questionIndex === q.questions.length - 1 ? t[6] : t[5]} \u2192</button></div>${!answer ? `<p class="muted">${t[10]}</p>` : ""}</article>`;
      }
    }
    this.paint(`<style>fieldset{padding:0;border:0;min-width:0;margin:20px 0}.check{cursor:pointer}h2,span{overflow-wrap:anywhere}</style><section lang="${this.language}"><h1>${q ? esc(localeText(q.title, this.language)) : t[0]}</h1><p>${q ? esc(localeText(q.intro, this.language)) : ""}</p>${(this.#quizzes?.length ?? 0) > 1 ? `<label>${t[1]}<select data-quiz data-key="quiz" ${this.busy ? "disabled" : ""}>${this.#quizzes.map((x) => `<option value="${x.id}" ${x.id === this.#quizId ? "selected" : ""}>${esc(localeText(x.title, this.language))}</option>`).join("")}</select></label>` : ""}${body}<p class="muted">${t[14]}</p></section>`);
  }
};
if (!customElements.get("azr-quiz")) customElements.define("azr-quiz", AzrQuiz);
export {
  AzrQuiz
};
