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
