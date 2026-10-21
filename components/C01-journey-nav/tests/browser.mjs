import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';

// Browser plugin not available in the authoring environment; regular Playwright is used.
const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = modulePath ? await import(pathToFileURL(modulePath).href) : await import('playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const evidence = resolve(root, 'evidence');
await mkdir(evidence, { recursive: true });
const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = resolve(root, '.' + pathname);
  if (!target.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
  try {
    const body = await readFile(target);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' })[extname(target)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = process.env.REMOTE_BASE_URL || `http://127.0.0.1:${server.address().port}/`;
const demo = new URL('demo/index.html', base).href;
const browser = await chromium.launch({ headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [], failedRequests = [], results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', msg => { if (['error', 'warning'].includes(msg.type())) errors.push(msg.text()); });
page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
const test = async (name, fn) => {
  try { await fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); throw error; }
};
const state = async (currentStep = 1, completedSteps = [], availableSteps = [1,2,3,4,5,6]) => {
  await page.locator('azr-journey-nav').evaluate((el, value) => { el.state = value; }, { currentStep, completedSteps, availableSteps });
};
const inspect = () => page.locator('azr-journey-nav').evaluate(el => ({
  state: el.state, current: el.shadowRoot.querySelector('[aria-current]')?.dataset.step,
  labels: [...el.shadowRoot.querySelectorAll('.label')].map(n => n.textContent),
  boxes: [...el.shadowRoot.querySelectorAll('.step')].map(n => {
    const r = n.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height };
  }),
}));
let failure;
try {
  await page.goto(demo);
  await page.waitForFunction(() => customElements.get('azr-journey-nav'));
  await test('Page identity, meaningful content and no error overlay', async () => {
    assert.equal(page.url(), demo); assert.match(await page.title(), /Azubi Rocket/);
    assert.match(await page.locator('h1').innerText(), /Sechs Schritte/);
    assert.equal(await page.locator('vite-error-overlay, nextjs-portal').count(), 0);
  });
  await test('Same deterministic dist bytes as manifest; package budget', async () => {
    const manifest = JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
    const artifact = await readFile(resolve(root,'dist/index.js'));
    assert.equal(createHash('sha256').update(artifact).digest('hex'),manifest.entrypoints.sha256);
    assert.ok(artifact.length <= manifest.runtime_budget.esm_max_bytes);
    const response = await page.request.get(new URL('dist/index.js',base).href);
    assert.equal(response.status(),200);
    assert.equal(createHash('sha256').update(await response.body()).digest('hex'),manifest.entrypoints.sha256);
  });
  for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:844}]) {
    await page.setViewportSize(viewport);
    for (const locale of ['de','en','fr','ru']) {
      await page.selectOption('#language',locale);
      for (let n=1;n<=6;n++) {
        await test(`${viewport.width}px / ${locale} / step ${n}: six visible labels, active state and no overflow`, async () => {
          await state(n, Array.from({length:n-1},(_,i)=>i+1));
          const view=await inspect(); assert.equal(view.labels.length,6); assert.equal(view.current,String(n));
          assert.ok(view.labels.every(s=>s.length>0));
          assert.ok(view.boxes.every(r=>r.width>40 && r.height>=44 && r.x>=0 && r.x+r.width<=viewport.width));
          if(viewport.width<=640){ assert.equal(view.boxes[0].y,view.boxes[2].y);assert.ok(view.boxes[3].y>view.boxes[0].y);assert.equal(view.boxes[3].y,view.boxes[5].y); }
          else assert.ok(view.boxes.every(r=>r.y===view.boxes[0].y));
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
        });
      }
    }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.selectOption('#language','de'); await state(5,[1,2,3,4]);
  await page.screenshot({path:resolve(evidence,'desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:resolve(evidence,'mobile.png'),fullPage:false});
  const nav=page.locator('azr-journey-nav');
  await test('Mouse step 5 → 6 updates real host screen; exact versioned event', async()=>{
    await nav.locator('[data-step="6"]').click();
    assert.equal(await page.locator('#screen-title').innerText(),'Start');
    assert.match(await page.locator('#log').innerText(),/"fromStep":5,"toStep":6,"via":"step"/);
  });
  await test('Previous and Next use adjacent steps and boundary buttons disable',async()=>{
    assert.equal(await nav.locator('[data-action="next"]').isDisabled(),true);
    await nav.locator('[data-action="previous"]').click();assert.equal((await inspect()).current,'5');
    await nav.locator('[data-action="next"]').click();assert.equal((await inspect()).current,'6');
    await page.click('#reset');assert.equal(await nav.locator('[data-action="previous"]').isDisabled(),true);
  });
  await test('Keyboard arrows/Home/End, Enter and Space navigate; focus survives host updates',async()=>{
    await nav.locator('[data-step="1"]').focus();await page.keyboard.press('ArrowRight');
    assert.equal(await nav.locator('[data-step="2"]').evaluate(el=>el===el.getRootNode().activeElement),true);
    await page.keyboard.press('Enter');assert.equal((await inspect()).current,'2');
    assert.equal(await nav.locator('[data-step="2"]').evaluate(el=>el===el.getRootNode().activeElement),true);
    await page.keyboard.press('End');await page.keyboard.press('Space');assert.equal((await inspect()).current,'6');
    await page.keyboard.press('Home');await page.keyboard.press('Enter');assert.equal((await inspect()).current,'1');
    assert.match(await page.locator('#log').innerText(),/"via":"keyboard"/);
  });
  await test('All six steps remain visible when unavailable; restricted and busy block navigation',async()=>{
    await page.check('#restricted'); assert.equal((await inspect()).labels.length,6);
    assert.equal(await nav.locator('.step:disabled').count(),3);
    await nav.locator('[data-step="3"]').click();assert.equal((await inspect()).current,'3');
    assert.equal(await nav.locator('[data-action="next"]').isDisabled(),true);
    await page.check('#busy');assert.equal(await nav.locator('.step:disabled').count(),6);
    const before=await page.locator('#log').innerText();
    await nav.locator('[data-step="1"]').evaluate(el=>el.click());assert.equal(await page.locator('#log').innerText(),before);
    await page.click('#reset');
  });
  await test('Current step emits nothing; state is controlled until host accepts',async()=>{
    const result=await page.evaluate(()=>{
      const el=document.createElement('azr-journey-nav');document.body.append(el);const events=[];
      el.addEventListener('azr:navigate',e=>events.push({detail:e.detail,bubbles:e.bubbles,composed:e.composed}));
      el.shadowRoot.querySelector('[data-step="1"]').click();
      el.shadowRoot.querySelector('[data-step="5"]').click();const current=el.state.currentStep;el.remove();return {events,current};
    });
    assert.equal(result.current,1);assert.deepEqual(result.events,[{detail:{schemaVersion:1,fromStep:1,toStep:5,via:'keyboard'},bubbles:true,composed:true}]);
  });
  await test('Invalid input properties are rejected atomically, with defensive copies',async()=>{
    const result=await nav.evaluate(el=>{
      const input={currentStep:2,completedSteps:[1],availableSteps:[1,2,3]};el.state=input;input.completedSteps.push(2);
      const output=el.state;output.availableSteps.length=0;
      let throws=0;for(const v of [null,[],{currentStep:7,completedSteps:[],availableSteps:[1]},
        {currentStep:2,completedSteps:[1,1],availableSteps:[1,2]},
        {currentStep:2,completedSteps:[],availableSteps:[1]},
        {currentStep:2,completedSteps:['1'],availableSteps:[1,2]}]){try{el.state=v;}catch(e){if(e instanceof TypeError)throws++;}}
      for(const [name,value]of [['language','xx'],['busy','false']]){try{el[name]=value;}catch(e){if(e instanceof TypeError)throws++;}}
      return {throws,state:el.state};
    });
    assert.equal(result.throws,8);assert.deepEqual(result.state,{currentStep:2,completedSteps:[1],availableSteps:[1,2,3]});
  });
  await test('Attributes update valid state, invalid values retain prior state and emit errors',async()=>{
    const result=await nav.evaluate(el=>{
      const errors=[];el.addEventListener('azr:navigation-error',e=>errors.push({detail:e.detail,bubbles:e.bubbles,composed:e.composed}),{once:false});
      el.setAttribute('current-step','3');el.setAttribute('current-step','9');el.setAttribute('language','ru');el.setAttribute('language','xx');
      el.setAttribute('busy','false');const busy=el.busy;el.removeAttribute('busy');
      const result={state:el.state,language:el.language,busy,notBusy:el.busy,errors};
      el.removeAttribute('current-step');el.removeAttribute('language');return result;
    });
    assert.equal(result.state.currentStep,3);assert.equal(result.language,'ru');assert.equal(result.busy,true);assert.equal(result.notBusy,false);
    assert.deepEqual(result.errors.map(e=>e.detail.attribute),['current-step','language']);assert.ok(result.errors.every(e=>e.bubbles&&e.composed));
  });
  await test('Repeated mount/unmount has one listener; instances have independent state',async()=>{
    const result=await page.evaluate(()=>{
      const a=document.createElement('azr-journey-nav'),b=document.createElement('azr-journey-nav');document.body.append(a,b);
      let count=0;a.addEventListener('azr:navigate',()=>count++);
      for(let i=0;i<4;i++){a.remove();document.body.append(a);}a.state={currentStep:4,completedSteps:[],availableSteps:[1,2,3,4,5,6]};
      a.shadowRoot.querySelector('[data-step="6"]').click();a.remove();a.shadowRoot.querySelector('[data-step="6"]').click();
      const result={count,other:b.state.currentStep};b.remove();return result;
    });assert.deepEqual(result,{count:1,other:1});
  });
  await test('Duplicate module import does not redefine custom element; pre-upgrade property retained',async()=>{
    const result=await page.evaluate(async()=>{
      const first=customElements.get('azr-journey-nav');await import('../dist/index.js?duplicate-test');
      return first===customElements.get('azr-journey-nav');
    });assert.equal(result,true);
    const fresh=await context.newPage();await fresh.goto(new URL('demo/index.html',base).href.replace('demo/index.html','fixtures/upgrade.html'));
    await fresh.waitForFunction(()=>document.querySelector('azr-journey-nav')?.state?.currentStep===5);
    assert.equal(await fresh.locator('azr-journey-nav [aria-current]').getAttribute('data-step'),'5');await fresh.close();
  });
  await test('Demo copy log and reset controls work',async()=>{
    await page.click('#reset');await nav.locator('[data-step="2"]').click();
    await page.click('#copy');await page.waitForFunction(()=>document.querySelector('#copy-status').textContent.length>0);
    assert.match(await page.locator('#copy-status').innerText(),/Kopiert|Kopieren nicht verfügbar/);
    await page.click('#reset');assert.equal((await inspect()).current,'1');assert.equal(await page.locator('#log').innerText(),'Noch keine Navigation.');
  });
  await test('No external service requests, failed requests or relevant browser errors',async()=>{
    assert.deepEqual(failedRequests,[]);assert.deepEqual(errors,[]);
  });
} catch(error){failure=error;}
finally {
  const report={component:'C01',version:'0.1.0',passed:!failure,recorded_at_utc:new Date().toISOString(),url:demo,
    browser:'Chromium / Playwright',browser_plugin:'not available',fallback_reason:'Browser plugin not available',
    viewports:[{width:1440,height:900},{width:390,height:844},{width:320,height:844}],
    test_count:results.length,passed_count:results.filter(r=>r.passed).length,results,console_errors:errors,failed_requests:failedRequests,
    limitations:['Standalone C01 only; full application shell not implemented','Chromium only; Firefox and Safari untested']};
  await writeFile(resolve(evidence,process.env.REMOTE_BASE_URL?'published-test-results.json':'test-results.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();server.close();console.log(JSON.stringify({passed:!failure,tests:results.length,error:failure?.message}));
}
if(failure)throw failure;
