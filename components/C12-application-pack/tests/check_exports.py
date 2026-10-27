from pathlib import Path
from email import policy
from email.parser import BytesParser
from zipfile import ZipFile
import sys,json,io
from pypdf import PdfReader
p=Path(sys.argv[1]); cv=(p/'cv.pdf').read_bytes(); cert=(p/'certificates.pdf').read_bytes()
reader=PdfReader(io.BytesIO(cv)); text='\n'.join(page.extract_text() or '' for page in reader.pages)
assert 'Lebenslauf' in text and 'Zoë' in text and 'Мария' in text
pages=PdfReader(io.BytesIO(cert)).pages
assert len(pages)==4
assert 'Sprachnachweis B1' in (pages[0].extract_text() or '')
assert 'Schulzeugnis 1' in (pages[1].extract_text() or '')
assert 'Schulzeugnis 2' in (pages[2].extract_text() or '')
assert pages[2].rotation==90
assert pages[3].get('/Resources').get('/XObject')
message=BytesParser(policy=policy.default).parsebytes((p/'application.eml').read_bytes())
assert str(message['To'])=='ausbildung@example.invalid'
assert str(message['Subject'])=='Bewerbung als Hotelfachfrau – München'
assert message['X-Unsent']=='1'
assert message.get_body(preferencelist=('plain',)).get_content().startswith('Sehr geehrte')
assert 'Zoë Мария' in message.get_body(preferencelist=('plain',)).get_content()
attachments=list(message.iter_attachments())
assert len(attachments)==2 and all(a.get_content_type()=='application/pdf' for a in attachments)
assert attachments[0].get_payload(decode=True)==cv
assert attachments[1].get_payload(decode=True)==cert
assert all(len(line)<=998 for line in (p/'application.eml').read_bytes().split(b'\r\n'))
with ZipFile(p/'application.zip') as z:
 names=z.namelist(); assert len(names)==5
 assert z.read(attachments[0].get_filename())==cv
 assert z.read(attachments[1].get_filename())==cert
 assert z.read('Bewerbung.eml')==(p/'application.eml').read_bytes()
 assert z.read('Firmenliste.csv')==(p/'companies.csv').read_bytes()
 assert 'Sehr geehrte' in z.read('Anschreiben.txt').decode()
csv=(p/'companies.csv').read_text(encoding='utf-8-sig')
assert 'Beispielhotel Musterstadt' in csv and 'Adresse abgeleitet' in csv
print(json.dumps({'passed':True,'cv_pages':len(reader.pages),'certificate_pages':len(pages),'mime_attachments':len(attachments),'zip_entries':len(names)}))
