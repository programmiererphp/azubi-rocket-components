import { LOCALES } from '../dist/index.js';
const nav = document.querySelector('azr-journey-nav');
const language = document.querySelector('#language');
const busy = document.querySelector('#busy');
const restricted = document.querySelector('#restricted');
const log = document.querySelector('#log');
const entries = [];
let state = { currentStep: 1, completedSteps: [], availableSteps: [1, 2, 3, 4, 5, 6] };

function show() {
  nav.state = state;
  nav.language = language.value;
  nav.busy = busy.checked;
  document.querySelector('#screen-title').textContent = LOCALES[language.value].steps[state.currentStep - 1];
  document.documentElement.lang = language.value;
}
nav.addEventListener('azr:navigate', event => {
  entries.push(event.detail);
  if (entries.length > 50) entries.shift();
  log.textContent = entries.map(item => JSON.stringify(item)).join('\n');
  // The host accepts the request; clicking ahead does not mark earlier tasks completed.
  state = { ...state, currentStep: event.detail.toStep };
  show();
});
language.addEventListener('change', show);
busy.addEventListener('change', show);
restricted.addEventListener('change', () => {
  state = { ...state, currentStep: restricted.checked && state.currentStep > 3 ? 3 : state.currentStep,
    availableSteps: restricted.checked ? [1, 2, 3] : [1, 2, 3, 4, 5, 6] };
  show();
});
document.querySelector('#reset').addEventListener('click', () => {
  state = { currentStep: 1, completedSteps: [], availableSteps: [1, 2, 3, 4, 5, 6] };
  language.value = 'de'; busy.checked = false; restricted.checked = false;
  entries.length = 0; log.textContent = 'Noch keine Navigation.';
  document.querySelector('#copy-status').textContent = ''; show();
});
document.querySelector('#copy').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(log.textContent);
    status.textContent = 'Kopiert.';
  } catch {
    status.textContent = 'Kopieren nicht verfügbar. Bitte Log markieren und kopieren.';
  }
});
show();
