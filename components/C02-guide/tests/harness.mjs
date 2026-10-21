import assert from 'node:assert/strict';
import{createServer}from'node:http';import{readFile,writeFile,mkdir}from'node:fs/promises';import{resolve,extname,sep}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{createHash}from'node:crypto';
export {assert};
export async function suite(url,checks){
 const root=resolve(fileURLToPath(new URL('../',url))),evidence=resolve(root,'evidence');await mkdir(evidence,{recursive:true});
 const pw=process.env.PLAYWRIGHT_MODULE?await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href):await import('playwright');
 const configuredProxy=process.env.REMOTE_BASE_URL&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY||process.env.https_proxy||process.env.http_proxy);
 const proxyURL=configuredProxy?new URL(configuredProxy):null;
 const proxy=proxyURL?{server:proxyURL.origin,...(proxyURL.username?{username:decodeURIComponent(proxyURL.username),password:decodeURIComponent(proxyURL.password)}:{})}:undefined;
 const browser=await pw.chromium.launch({headless:true,...(proxy?{proxy}:{}),...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}: {})});
 const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}const data=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.ttf':'font/ttf','.wasm':'application/wasm'})[extname(path)]??'application/octet-stream');res.end(data);}catch{res.writeHead(404).end('Not found');}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=process.env.REMOTE_BASE_URL||`http://127.0.0.1:${server.address().port}/`;const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[],failed=[],requests=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));page.on('request',r=>requests.push(r.url()));
 const test=async(name,fn)=>{try{await fn();results.push({name,passed:true});}catch(e){results.push({name,passed:false,error:e.message});throw e;}};
 let failure;const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
 try{await page.goto(new URL('demo/index.html',base).href);await page.waitForFunction(tag=>customElements.get(tag),manifest.custom_element);
 await test('Identity, meaningful component and exact artifact hash',async()=>{assert.match(await page.title(),/Azubi Rocket/);assert.ok(await page.locator(manifest.custom_element).evaluate(el=>el.shadowRoot.textContent.trim().length>50));const r=await page.request.get(new URL('dist/index.js',base).href);assert.equal(r.status(),200);assert.equal(createHash('sha256').update(await r.body()).digest('hex'),manifest.entrypoints.sha256);assert.equal(await page.locator('vite-error-overlay').count(),0);});
 await checks({page,test,assert,base,root,browser,manifest});
 await test('Healthy app console and network',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.ok(requests.every(u=>new URL(u).origin===new URL(base).origin||u.startsWith('blob:')||u.startsWith('data:')));});
 }catch(e){failure=e;}
 finally{const report={component:manifest.component_id,version:manifest.version,artifact_sha256:manifest.entrypoints.sha256,passed:!failure,url:new URL('demo/index.html',base).href,recorded_at_utc:new Date().toISOString(),browser:await browser.version(),browser_plugin:'not available',fallback_reason:'Browser plugin not available; isolated regular Playwright',test_count:results.length,passed_count:results.filter(r=>r.passed).length,results,console_errors:errors,failed_requests:failed,viewports:[{width:1440,height:900},{width:390,height:844},{width:320,height:844}]};await writeFile(resolve(evidence,process.env.REMOTE_BASE_URL?'published-test-results.json':'test-results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();server.close();console.log(JSON.stringify({id:manifest.component_id,passed:!failure,tests:results.length,error:failure?.message}));}
 if(failure)throw failure;
}
export async function screenshotChecks({page,test,root,manifest},setup=async()=>{}){
 for(const w of [1440,390,320]){await page.setViewportSize({width:w,height:w===1440?900:844});for(const lang of ['de','en','fr','ru']){await test(`${w}px ${lang} renders without horizontal overflow`,async()=>{await page.selectOption('#language',lang);await setup(lang);const component=page.locator(manifest.custom_element);assert.ok(await component.isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(await component.evaluate(el=>el.shadowRoot.querySelector('script,iframe')),null);});}if(w!==320){await page.selectOption('#language','de');await setup('de');await page.screenshot({path:resolve(root,'evidence',w===1440?'desktop.png':'mobile.png'),fullPage:false});}}
}
