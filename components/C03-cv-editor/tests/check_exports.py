from pathlib import Path
import sys,zipfile,json,xml.etree.ElementTree as ET
from pypdf import PdfReader
root=Path(sys.argv[1]);results=[]
def docx_text(path):
 with zipfile.ZipFile(path) as archive:
  assert archive.testzip() is None
  tree=ET.fromstring(archive.read('word/document.xml'))
  return '\n'.join(x.text or '' for x in tree.iter() if x.tag.endswith('}t')),archive.namelist()
for lang in ['de','en','fr','ru']:
 pdf=root/f'sample-{lang}.pdf';docx=root/f'sample-{lang}.docx'
 reader=PdfReader(pdf);text='\n'.join(p.extract_text() or '' for p in reader.pages)
 word,_=docx_text(docx)
 for expected in ['Zoë Мария','Musterfrau','München','B1/B2']:
  assert expected in text,(pdf.name,expected,text)
  assert expected in word,(docx.name,expected)
 for forbidden in ['Warnung','Warning','Предупреждение','Avertissement','undefined','NaN']:
  assert forbidden not in text and forbidden not in word,(lang,forbidden)
 results.append({'language':lang,'pdf_pages':len(reader.pages),'pdf_bytes':pdf.stat().st_size,'docx_bytes':docx.stat().st_size,'unicode':True})
reader=PdfReader(root/'long.pdf');text='\n'.join(p.extract_text() or '' for p in reader.pages)
assert len(reader.pages)>=2 and 'END_SENTINEL_2026' in text
long_word,_=docx_text(root/'long.docx');assert 'END_SENTINEL_2026' in long_word
photo=PdfReader(root/'photo.pdf');assert sum(len(p.images) for p in photo.pages)>=1
_,names=docx_text(root/'photo.docx');assert any(n.startswith('word/media/') for n in names)
out={'passed':True,'documents':results,'long_pdf_pages':len(reader.pages),'long_pdf_complete':True,'photo_pdf_and_docx':True}
(root.parent/'export-validation.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False))
