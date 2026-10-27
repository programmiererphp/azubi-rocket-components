"""Anonymous HTTPS proof executed by GitHub Actions, no auth header/cookies/netrc."""
from pathlib import Path
import json,hashlib,urllib.request,datetime,subprocess
repo='programmiererphp/azubi-rocket-components';commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
for manifest_path in Path('components').glob('*/manifest.json'):
 m=json.loads(manifest_path.read_text());folder=manifest_path.parent;digest=m['entrypoints']['sha256'];evidence=folder/'evidence';proof=evidence/'public-download.json'
 if proof.exists() and json.loads(proof.read_text()).get('sha256')==digest:continue
 reports=[]
 for name in ['test-results.json','published-test-results.json']:
  p=evidence/name
  if p.exists():reports.append(json.loads(p.read_text()))
 if len(reports)!=2 or not all(r.get('passed') and r.get('artifact_sha256')==digest for r in reports):continue
 raw=f'https://raw.githubusercontent.com/{repo}/{commit}/{folder}/dist/index.js';pages=f'https://programmiererphp.github.io/azubi-rocket-components/{folder}/dist/index.js';checks=[]
 opener=urllib.request.build_opener(urllib.request.HTTPSHandler())
 for url in [raw,pages]:
  with opener.open(url,timeout=30) as response:
   data=response.read();assert response.status==200;assert hashlib.sha256(data).hexdigest()==digest;checks.append({'url':url,'status':response.status,'bytes':len(data),'sha256':digest})
 proof.write_text(json.dumps({'url':raw,'reachable_anonymously':True,'http_status':200,'sha256':digest,'bytes':len(data),'commit_sha':commit,'recorded_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'GitHub Actions Python HTTPS GET without Authorization/cookies, default TLS verification; exact raw and Pages hashes; separate fresh-Chromium published browser tests','checks':checks},indent=2)+'\n');print(m['component_id']+' anonymous exact artifact verified')

# The application component's new standalone service has its own receipt.
folder=Path('services/application-files');manifest=folder/'manifest.json'
if manifest.exists():
 m=json.loads(manifest.read_text());digest=m['sha256'];evidence=folder/'evidence';proof=evidence/'public-download.json'
 component=Path('components/C12-application-pack');component_manifest=json.loads((component/'manifest.json').read_text())
 reports=[component/'evidence'/name for name in ['test-results.json','published-test-results.json']]
 passed=all(p.exists() and json.loads(p.read_text()).get('passed') and json.loads(p.read_text()).get('artifact_sha256')==component_manifest['entrypoints']['sha256'] for p in reports)
 pinned=any(s['id']=='application-files' and s['sha256']==digest for s in component_manifest['services'])
 if passed and pinned and not(proof.exists() and json.loads(proof.read_text()).get('sha256')==digest):
  checks=[];opener=urllib.request.build_opener(urllib.request.HTTPSHandler())
  for url in [f'https://raw.githubusercontent.com/{repo}/{commit}/{folder}/dist/index.js',f'https://programmiererphp.github.io/azubi-rocket-components/{folder}/dist/index.js',f'https://programmiererphp.github.io/azubi-rocket-components/{component}/demo/vendor/application-files.js']:
   with opener.open(url,timeout=30) as response:
    data=response.read();assert response.status==200;assert hashlib.sha256(data).hexdigest()==digest;checks.append({'url':url,'status':200,'bytes':len(data),'sha256':digest})
  evidence.mkdir(exist_ok=True)
  proof.write_text(json.dumps({'reachable_anonymously':True,'sha256':digest,'commit_sha':commit,'recorded_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Anonymous default-TLS HTTPS without Authorization/cookies, exact source, Pages and demo service bytes','checks':checks},indent=2)+'\n')
  print('application-files anonymous exact artifact verified')

