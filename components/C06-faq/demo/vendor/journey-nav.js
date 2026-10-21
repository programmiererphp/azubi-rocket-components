// Azubi Rocket C01 v0.1.0 — deterministic standalone ESM
export const LOCALES = Object.freeze({
  de: {
    title: 'Dein Weg zur Ausbildung', nav: 'Deine sechs Schritte',
    steps: ['Orientierung', 'Vorbereitung', 'Lebenslauf', 'Firmen', 'Anschreiben', 'Start'],
    current: 'Aktueller Schritt', done: 'Erledigt', unavailable: 'Noch nicht verfügbar',
    previous: 'Zurück', next: 'Weiter', completed: 'von 6 Schritten erledigt', busy: 'Bitte warten',
  },
  en: {
    title: 'Your path to vocational training', nav: 'Your six steps',
    steps: ['Orientation', 'Preparation', 'CV', 'Companies', 'Cover letter', 'Start'],
    current: 'Current step', done: 'Completed', unavailable: 'Not available yet',
    previous: 'Back', next: 'Next', completed: 'of 6 steps completed', busy: 'Please wait',
  },
  fr: {
    title: 'Ton parcours vers la formation', nav: 'Tes six étapes',
    steps: ['Orientation', 'Préparation', 'CV', 'Entreprises', 'Lettre', 'Début'],
    current: 'Étape actuelle', done: 'Terminée', unavailable: 'Pas encore disponible',
    previous: 'Retour', next: 'Suivant', completed: 'étapes sur 6 terminées', busy: 'Patiente un instant',
  },
  ru: {
    title: 'Твой путь к профессиональному обучению', nav: 'Твои шесть шагов',
    steps: ['Ориентация', 'Подготовка', 'Резюме', 'Компании', 'Письмо', 'Начало'],
    current: 'Текущий шаг', done: 'Завершён', unavailable: 'Пока недоступен',
    previous: 'Назад', next: 'Далее', completed: 'из 6 шагов завершено', busy: 'Подожди немного',
  },
});


export const STEP_IDS = Object.freeze(['orientation', 'preparation', 'cv', 'companies', 'letter', 'start']);
const ALL_STEPS = Object.freeze([1, 2, 3, 4, 5, 6]);
const isStep = n => Number.isInteger(n) && n >= 1 && n <= 6;

function validateState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('state must be an object');
  }
  const { currentStep, completedSteps, availableSteps } = value;
  if (!isStep(currentStep)) throw new TypeError('currentStep must be an integer from 1 to 6');
  for (const [name, list] of Object.entries({ completedSteps, availableSteps })) {
    if (!Array.isArray(list) || !list.every(isStep) || new Set(list).size !== list.length) {
      throw new TypeError(`${name} must contain unique step numbers from 1 to 6`);
    }
  }
  if (!availableSteps.includes(currentStep)) throw new TypeError('currentStep must be available');
  return { currentStep, completedSteps: [...completedSteps], availableSteps: [...availableSteps] };
}

const styles = `
  :host { display:block; color:var(--azr-text,#102352); font-family:var(--azr-font,system-ui,sans-serif); }
  *, *::before, *::after { box-sizing:border-box; }
  nav { border:1px solid var(--azr-border,#dce4ef); border-radius:20px; background:var(--azr-surface,#fff); padding:24px; }
  header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }
  h2 { margin:0; font-size:clamp(17px,2vw,22px); line-height:1.3; letter-spacing:-.03em; }
  .count { color:#4b617e; font-size:13px; white-space:nowrap; }
  ol { list-style:none; padding:0; margin:0; display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
  li { min-width:0; }
  button { font:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  .step { position:relative; width:100%; min-height:106px; border:1px solid transparent; border-radius:13px; background:transparent; color:#52627e; padding:12px 5px; display:flex; flex-direction:column; align-items:center; gap:11px; }
  .step:hover:not(:disabled) { background:#f0f6ff; }
  .step[aria-current] { border-color:#b4d1ff; background:#eef5ff; color:#075bce; font-weight:700; }
  .number { width:32px; height:32px; flex-shrink:0; border-radius:50%; background:#e7edf5; color:#50617b; display:grid; place-items:center; font-weight:700; font-size:14px; }
  [aria-current] .number { background:var(--azr-accent,#0878f9); color:white; box-shadow:0 0 0 5px #dcecff; }
  .done .number { background:#dff6ec; color:#127950; }
  .label { max-width:100%; font-size:13px; line-height:1.4; overflow-wrap:anywhere; text-align:center; }
  button:disabled { cursor:default; }
  .step:disabled { color:#66758c; }
  .step:disabled .number { background:#edf0f5; color:#66758c; box-shadow:none; }
  button:focus-visible { outline:3px solid #125bca; outline-offset:3px; }
  .track { height:5px; border-radius:4px; background:#edf1f7; margin:20px 0; overflow:hidden; }
  .fill { height:100%; background:#13996b; border-radius:inherit; }
  footer { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .action { min-height:44px; border:1px solid #cbd8e9; border-radius:10px; background:white; color:#16335c; padding:10px 18px; font-size:14px; font-weight:650; }
  .next { border-color:var(--azr-accent,#0878f9); background:var(--azr-accent,#0878f9); color:white; }
  .action:disabled { background:#edf1f6; border-color:#dce3ed; color:#65758c; }
  .status { font-size:13px; color:#4b617e; }
  @media(max-width:640px) {
    nav { padding:17px 12px; border-radius:16px; }
    header { display:block; margin-bottom:14px; }
    .count { display:block; margin-top:7px; white-space:normal; }
    ol { grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
    .step { min-height:91px; padding:11px 4px; gap:9px; }
    .label { font-size:12px; }
    .track { margin:16px 0; }
    .action { padding:10px 15px; }
  }
  @media(prefers-reduced-motion:no-preference) { .fill { transition:width .2s ease; } }
`;

export class AzrJourneyNav extends HTMLElement {
  static get observedAttributes() { return ['current-step', 'language', 'busy']; }
  #state = { currentStep: 1, completedSteps: [], availableSteps: [...ALL_STEPS] };
  #language = 'de';
  #busy = false;
  #controller;

  constructor() { super(); this.attachShadow({ mode: 'open' }); }

  connectedCallback() {
    // Respect a property assigned by a host before this module was imported.
    for (const key of ['state', 'language', 'busy']) {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const value = this[key]; delete this[key]; this[key] = value;
      }
    }
    this.#controller?.abort();
    this.#controller = new AbortController();
    this.shadowRoot.addEventListener('click', this.#onClick, { signal: this.#controller.signal });
    this.shadowRoot.addEventListener('keydown', this.#onKey, { signal: this.#controller.signal });
    this.#render();
  }

  disconnectedCallback() { this.#controller?.abort(); this.#controller = undefined; }

  get state() { return validateState(this.#state); }
  set state(value) { this.#state = validateState(value); this.#render(); }
  get language() { return this.#language; }
  set language(value) {
    if (!Object.hasOwn(LOCALES, value)) throw new TypeError('language must be de, en, fr or ru');
    this.setAttribute('language', value);
  }
  get busy() { return this.#busy; }
  set busy(value) {
    if (typeof value !== 'boolean') throw new TypeError('busy must be boolean');
    this.toggleAttribute('busy', value);
  }

  attributeChangedCallback(name, oldValue, value) {
    if (oldValue === value) return;
    let valid = true;
    if (name === 'current-step') {
      const n = value === null ? 1 : /^[1-6]$/.test(value) ? Number(value) : NaN;
      valid = isStep(n) && this.#state.availableSteps.includes(n);
      if (valid) this.#state = { ...this.#state, currentStep: n };
    } else if (name === 'language') {
      valid = Object.hasOwn(LOCALES, value ?? 'de');
      if (valid) this.#language = value ?? 'de';
    } else if (name === 'busy') this.#busy = value !== null;
    if (!valid) {
      this.dispatchEvent(new CustomEvent('azr:navigation-error', {
        bubbles: true, composed: true,
        detail: { schemaVersion: 1, code: 'invalid-attribute', attribute: name },
      }));
    }
    this.#render();
  }

  #request(toStep, via) {
    if (this.#busy || !isStep(toStep) || toStep === this.#state.currentStep ||
        !this.#state.availableSteps.includes(toStep)) return;
    this.dispatchEvent(new CustomEvent('azr:navigate', {
      bubbles: true, composed: true,
      detail: { schemaVersion: 1, fromStep: this.#state.currentStep, toStep, via },
    }));
  }

  #onClick = event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action) {
      this.#request(this.#state.currentStep + (action === 'next' ? 1 : -1), action);
    } else if (button.dataset.step) {
      this.#request(Number(button.dataset.step), event.detail === 0 ? 'keyboard' : 'step');
    }
  };

  #onKey = event => {
    if (!event.target.matches('.step') || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...this.shadowRoot.querySelectorAll('.step:not(:disabled)')];
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(event.target);
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
      (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
  };

  #render() {
    if (!this.isConnected) return;
    const focusKey = this.shadowRoot.activeElement?.dataset.focus;
    const t = LOCALES[this.#language];
    const { currentStep, completedSteps, availableSteps } = this.#state;
    const disabled = n => this.#busy || !availableSteps.includes(n);
    const steps = ALL_STEPS.map((n, i) => {
      const current = n === currentStep, done = completedSteps.includes(n);
      const description = current ? t.current : !availableSteps.includes(n) ? t.unavailable : done ? t.done : '';
      return `<li><button type="button" class="step ${done ? 'done' : ''}"
        data-step="${n}" data-focus="step-${n}" data-step-id="${STEP_IDS[i]}"
        ${current ? 'aria-current="step"' : ''} ${disabled(n) ? 'disabled' : ''}
        aria-label="${n}. ${t.steps[i]}${description ? '. ' + description : ''}">
        <span class="number" aria-hidden="true">${done && !current ? '✓' : n}</span>
        <span class="label">${t.steps[i]}</span></button></li>`;
    }).join('');
    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <nav part="navigation" lang="${this.#language}" aria-label="${t.nav}" aria-busy="${this.#busy}">
        <header><h2>${t.title}</h2><span class="count" aria-live="polite">${completedSteps.length} ${t.completed}</span></header>
        <ol>${steps}</ol>
        <div class="track" aria-hidden="true"><div class="fill" style="width:${completedSteps.length / 6 * 100}%"></div></div>
        <footer><button type="button" class="action" data-action="previous" data-focus="previous"
          ${currentStep === 1 || disabled(currentStep - 1) ? 'disabled' : ''}>← ${t.previous}</button>
          <span class="status" role="status">${this.#busy ? t.busy : currentStep + ' / 6'}</span>
          <button type="button" class="action next" data-action="next" data-focus="next"
          ${currentStep === 6 || disabled(currentStep + 1) ? 'disabled' : ''}>${t.next} →</button></footer>
      </nav>`;
    if (focusKey) {
      const target = [...this.shadowRoot.querySelectorAll('button')].find(b => b.dataset.focus === focusKey);
      if (target && !target.disabled) target.focus();
    }
  }
}

if (!customElements.get('azr-journey-nav')) customElements.define('azr-journey-nav', AzrJourneyNav);
