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

// src/index.js
var words = { de: ["Dokumente & Anlagen", "PDF, JPEG oder PNG: bis10 Dateien, je10 MiB, zusammen30 MiB. Deine Dateien bleiben in diesem Browser und werden beim Verlassen dieser Seite freigegeben.", "Dateien ausw\xE4hlen", "Datei pr\xFCfen", "Bild als JPEG aufbereiten", "Entfernen", "Pr\xFCfung l\xE4uft \u2026", "Noch keine Datei ausgew\xE4hlt.", "Der lokale Dokumentenservice ist noch nicht verbunden.", "Seiten", "Pixel", "Original", "Ergebnis", "JPEG herunterladen", "Pr\xFCfe selbst: alle Seiten vorhanden, gut lesbar, erforderliche \xDCbersetzungen beigef\xFCgt. Die technische Pr\xFCfung best\xE4tigt keine Echtheit oder inhaltliche Vollst\xE4ndigkeit.", "Dateigrenze \xFCberschritten oder leerer Dateisatz.", "Pr\xFCfung fehlgeschlagen", "JPEG wird auf maximal1800 Pixel verkleinert. Es kann gr\xF6\xDFer als das Original sein; pr\xFCfe Lesbarkeit und Dateigr\xF6\xDFe."], en: ["Documents & attachments", "PDF, JPEG or PNG: up to10 files,10 MiB each,30 MiB total. Files stay in this browser and are released when you leave this page.", "Choose files", "Inspect file", "Prepare image as JPEG", "Remove", "Processing \u2026", "No file selected yet.", "The local document service is not connected yet.", "pages", "pixels", "Original", "Result", "Download JPEG", "Check yourself: all pages present, legible, required translations attached. Technical inspection does not confirm authenticity or content completeness.", "File limit exceeded or empty file set.", "Processing failed", "JPEG is scaled to at most1800 pixels. It may be larger than the original; check legibility and file size."], fr: ["Documents et pi\xE8ces jointes", "PDF, JPEG ou PNG :10 fichiers maximum,10 Mio chacun,30 Mio au total. Les fichiers restent dans ce navigateur et sont lib\xE9r\xE9s en quittant cette page.", "Choisir des fichiers", "V\xE9rifier le fichier", "Pr\xE9parer l\u2019image en JPEG", "Retirer", "Traitement \u2026", "Aucun fichier s\xE9lectionn\xE9.", "Le service local n\u2019est pas encore connect\xE9.", "pages", "pixels", "Original", "R\xE9sultat", "T\xE9l\xE9charger le JPEG", "V\xE9rifie : toutes les pages pr\xE9sentes et lisibles, traductions n\xE9cessaires jointes. La v\xE9rification technique ne confirme ni authenticit\xE9 ni contenu complet.", "Limite d\xE9pass\xE9e ou s\xE9lection vide.", "\xC9chec du traitement", "Le JPEG est r\xE9duit \xE01800 pixels maximum. Il peut \xEAtre plus lourd que l\u2019original : v\xE9rifie lisibilit\xE9 et taille."], ru: ["\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", "PDF, JPEG \u0438\u043B\u0438 PNG: \u0434\u043E10 \u0444\u0430\u0439\u043B\u043E\u0432, \u043F\u043E10 \u041C\u0438\u0411, \u0441\u0443\u043C\u043C\u0430\u0440\u043D\u043E30 \u041C\u0438\u0411. \u0424\u0430\u0439\u043B\u044B \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u0438 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0430\u044E\u0442\u0441\u044F \u043F\u0440\u0438 \u0443\u0445\u043E\u0434\u0435 \u0441\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B.", "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B\u044B", "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0444\u0430\u0439\u043B", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 JPEG", "\u0423\u0431\u0440\u0430\u0442\u044C", "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u2026", "\u0424\u0430\u0439\u043B\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u044B.", "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0435\u0440\u0432\u0438\u0441 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D.", "\u0441\u0442\u0440\u0430\u043D\u0438\u0446", "\u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439", "\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B", "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442", "\u0421\u043A\u0430\u0447\u0430\u0442\u044C JPEG", "\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E: \u0432\u0441\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \u043D\u0430 \u043C\u0435\u0441\u0442\u0435 \u0438 \u0447\u0438\u0442\u0430\u0435\u043C\u044B, \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u0435 \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u044B \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u044B. \u0422\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u0442 \u043F\u043E\u0434\u043B\u0438\u043D\u043D\u043E\u0441\u0442\u044C \u0438 \u043F\u043E\u043B\u043D\u043E\u0442\u0443 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u043D\u0438\u044F.", "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0444\u0430\u0439\u043B\u043E\u0432 \u0438\u043B\u0438 \u043F\u0443\u0441\u0442\u043E\u0439 \u043D\u0430\u0431\u043E\u0440.", "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438", "JPEG \u0443\u043C\u0435\u043D\u044C\u0448\u0430\u0435\u0442\u0441\u044F \u0434\u043E1800 \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439. \u041E\u043D \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u0430: \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u0438 \u0440\u0430\u0437\u043C\u0435\u0440."] };
var size = (n) => new Intl.NumberFormat("de", { maximumFractionDigits: 1 }).format(n / 1024) + " KiB";
var AzrDocumentCheck = class extends ElementBase {
  #records = [];
  #services = null;
  #working = "";
  #operation = 0;
  #error = "";
  upgradeProperties = ["services", "language", "busy"];
  get services() {
    return this.#services;
  }
  set services(v) {
    if (v !== null && (!v || typeof v.processDocument !== "function")) throw TypeError("Invalid document service");
    this.#services = v;
    this.render();
  }
  #metadata() {
    return this.#records.map(({ id, file, result }) => ({ id, name: file.name, size: file.size, type: file.type, ...result ? { kind: result.kind, pages: result.pages, width: result.width, height: result.height, outputSize: result.outputSize, outputWidth: result.outputWidth, outputHeight: result.outputHeight } : {} }));
  }
  #changed() {
    emit(this, "azr:documents-change", { documents: this.#metadata() });
  }
  #release(r) {
    if (r.preview) URL.revokeObjectURL(r.preview);
    if (r.output) URL.revokeObjectURL(r.output);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#operation++;
    for (const r of this.#records) this.#release(r);
    this.#records = [];
    this.#working = "";
  }
  async #process(r, operation) {
    if (this.busy || this.#working || !this.#services) return;
    const token = ++this.#operation, actionId = crypto.randomUUID();
    this.#working = r.id;
    r.error = "";
    this.render();
    emit(this, "azr:document-status", { actionId, filename: r.file.name, operation, status: "pending" });
    try {
      const result = await this.#services.processDocument({ file: r.file, operation });
      if (token !== this.#operation) return;
      if (!result || !["pdf", "image"].includes(result.kind) || !Number.isFinite(result.size) || result.size !== r.file.size || result.kind === "pdf" && (!Number.isInteger(result.pages) || result.pages < 1) || result.kind === "image" && (!Number.isInteger(result.width) || result.width < 1 || !Number.isInteger(result.height) || result.height < 1)) throw Error("Invalid inspection result");
      if (operation === "optimize-image" && (!(result.blob instanceof Blob) || result.blob.type !== "image/jpeg" || !Number.isInteger(result.outputWidth) || !Number.isInteger(result.outputHeight))) throw Error("Invalid optimized image");
      if (r.output) URL.revokeObjectURL(r.output);
      r.output = result.blob ? URL.createObjectURL(result.blob) : null;
      r.result = { ...result };
      delete r.result.blob;
      if (result.kind === "image" && !r.preview) r.preview = URL.createObjectURL(r.file);
      emit(this, "azr:document-status", { actionId, filename: r.file.name, operation, status: "success", result: r.result });
      this.#changed();
    } catch (e) {
      if (token !== this.#operation) return;
      r.error = String(e.message);
      emit(this, "azr:document-status", { actionId, filename: r.file.name, operation, status: "error", message: r.error });
    } finally {
      if (token === this.#operation) {
        this.#working = "";
        this.render();
      }
    }
  }
  handle(e) {
    const t = e.target;
    if (this.busy || this.#working) return;
    if (e.type === "change" && t.matches("input[type=file]")) {
      const incoming = [...t.files];
      if (!incoming.length) return;
      const total = [...this.#records.map((r) => r.file), ...incoming];
      if (total.length > 10 || total.some((f) => !f.size || f.size > 10 * 1024 * 1024) || total.reduce((n, f) => n + f.size, 0) > 30 * 1024 * 1024) {
        this.#error = words[this.language][15];
        this.render();
        return;
      }
      this.#error = "";
      for (const file of incoming) this.#records.push({ id: crypto.randomUUID(), file, result: null, preview: null, output: null, error: "" });
      this.#changed();
      this.render();
    }
    if (e.type === "click") {
      const button = t.closest("button");
      if (!button) return;
      const r = this.#records.find((r2) => r2.id === button.dataset.id);
      if (!r) return;
      if (button.dataset.remove !== void 0) {
        this.#release(r);
        this.#records = this.#records.filter((x) => x !== r);
        this.#changed();
        this.render();
      }
      if (button.dataset.operation) this.#process(r, button.dataset.operation);
    }
  }
  render() {
    const t = words[this.language], locked = this.busy || Boolean(this.#working);
    this.paint(`<style>.doc-preview{display:block;max-width:100%;max-height:260px;object-fit:contain;border:1px solid #dce4ef;margin:14px 0;background:white}h2{overflow-wrap:anywhere}.file-label input{margin-top:10px}</style><section lang="${this.language}"><h1>${t[0]}</h1><p>${t[1]}</p><div class="card"><label class="file-label">${t[2]}<input data-key="files" type="file" multiple accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" ${locked ? "disabled" : ""}></label><p class="muted">${t[17]}</p></div>${!this.#services ? `<p class="notice">${t[8]}</p>` : ""}${this.#error ? `<p role="alert" class="notice error">${esc(this.#error)}</p>` : ""}<div class="stack" style="margin-top:18px">${!this.#records.length ? `<p class="notice">${t[7]}</p>` : this.#records.map((r) => `<article class="card" data-record="${r.id}"><h2>${esc(r.file.name)}</h2><p>${t[11]}: ${size(r.file.size)}${r.result?.pages ? " \xB7 " + r.result.pages + " " + t[9] : ""}${r.result?.width ? " \xB7 " + r.result.width + "\xD7" + r.result.height + " " + t[10] : ""}</p>${r.preview ? `<img class="doc-preview" src="${r.preview}" alt="${esc(r.file.name)}">` : ""}${r.output ? `<p>${t[12]}: ${size(r.result.outputSize)} \xB7 ${r.result.outputWidth}\xD7${r.result.outputHeight} ${t[10]}</p><a class="button" href="${r.output}" download="${esc(r.file.name.replace(/\.[^.]+$/, "") + ".jpg")}">${t[13]} \u2193</a>` : ""}<div class="actions"><button type="button" data-key="inspect-${r.id}" data-id="${r.id}" data-operation="inspect" ${locked || !this.#services ? "disabled" : ""}>${t[3]}</button><button type="button" data-id="${r.id}" data-operation="optimize-image" ${locked || !this.#services || r.result?.kind === "pdf" ? "disabled" : ""}>${t[4]}</button><button type="button" data-id="${r.id}" data-remove ${locked ? "disabled" : ""}>${t[5]}</button></div>${this.#working === r.id ? `<p class="notice" role="status">${t[6]}</p>` : ""}${r.error ? `<p role="alert" class="notice error">${t[16]}: ${esc(r.error)}</p>` : ""}</article>`).join("")}</div><p class="notice">${t[14]}</p></section>`);
  }
};
if (!customElements.get("azr-document-check")) customElements.define("azr-document-check", AzrDocumentCheck);
export {
  AzrDocumentCheck
};
