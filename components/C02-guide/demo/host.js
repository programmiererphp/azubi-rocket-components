import'../dist/index.js';import'./vendor/journey-nav.js';import{content}from'../fixtures/content.js';
const guide=document.querySelector('azr-guide'),nav=document.querySelector('azr-journey-nav'),language=document.querySelector('#language'),log=document.querySelector('#log');
let journey={schemaVersion:1,location:null,checkedItems:[],finished:false},step=1;const available=[1,2,6],entries=[];
guide.content=content;guide.availableSteps=available;
function show(){guide.language=language.value;guide.journey=journey;guide.stage=({1:'orientation',2:'preparation',6:'start'})[step];nav.language=language.value;nav.state={currentStep:step,completedSteps:[...(journey.location?[1]:[]),...(journey.finished?[6]:[])],availableSteps:available};document.documentElement.lang=language.value;}
function record(e){entries.push({type:e.type,detail:e.detail});log.textContent=entries.slice(-20).map(x=>JSON.stringify(x)).join('\n');}
guide.addEventListener('azr:guide-change',e=>{journey=e.detail.journey;record(e);show();});
guide.addEventListener('azr:route-request',e=>{if(available.includes(e.detail.toStep)){step=e.detail.toStep;record(e);show();}});
nav.addEventListener('azr:navigate',e=>{step=e.detail.toStep;record(e);show();});language.addEventListener('change',show);
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(log.textContent);document.querySelector('#copy-status').textContent='Kopiert.';}catch{document.querySelector('#copy-status').textContent='Bitte Log markieren und kopieren.';}});show();

