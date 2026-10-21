from pathlib import Path
from pypdf import PdfReader
import zipfile,sys,json,xml.etree.ElementTree as ET
r=Path(sys.argv[1]);results=[]
def word(p):
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  return '\n'.join(x.text or '' for x in ET.fromstring(z.read('word/document.xml')).iter() if x.tag.endswith('}t'))
for lang in ['de','en','fr','ru']:
 reader=PdfReader(r/f'sample-{lang}.pdf');text='\n'.join(p.extract_text() or '' for p in reader.pages);w=word(r/f'sample-{lang}.docx')
 for t in ['Zoë Мария Musterfrau','München','опыт и обучение','Hotelfachperson','Andere Firma']:assert t in text and t in w,(lang,t)
 for t in ['undefined','NaN','Warnung']:assert t not in text+w
 results.append({'language':lang,'pdf_pages':len(reader.pages),'unicode':True})
reader=PdfReader(r/'long.pdf');assert len(reader.pages)>=2
assert 'END_LETTER_2026' in '\n'.join(p.extract_text() or '' for p in reader.pages)
assert 'END_LETTER_2026' in word(r/'long.docx')
out={'passed':True,'documents':results,'long_pdf_pages':len(reader.pages),'complete':True};(r.parent/'export-validation.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out))
