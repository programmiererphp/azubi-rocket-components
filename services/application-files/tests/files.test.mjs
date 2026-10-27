import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument,PDFName,StandardFonts} from 'pdf-lib';
import {mergeCertificates,validateFiles,companyCsv,emailDraft,mailtoFor,prepareApplication} from '../src/index.js';

const blob=b=>new Blob([b],{type:'application/pdf'});
async function pdf(count=1){const d=await PDFDocument.create();for(let i=0;i<count;i++)d.addPage();return blob(await d.save());}
const code=expected=>error=>error.code===expected;

test('File count, empty file, individual size and aggregate size are enforced',()=>{
 assert.throws(()=>validateFiles(Array(11).fill(blob('x'))),code('FILE_COUNT'));
 assert.throws(()=>validateFiles([blob('')]),code('EMPTY_FILE'));
 assert.throws(()=>validateFiles([blob(new Uint8Array(10*1048576+1))]),code('FILE_SIZE'));
 assert.throws(()=>validateFiles(Array(4).fill(blob(new Uint8Array(8*1048576)))),code('TOTAL_SIZE'));
});
test('Real PDF page budget, dimensions and corrupt input reject with file index',async()=>{
 await assert.rejects(mergeCertificates([await pdf(100),await pdf()]),e=>e.code==='PAGE_LIMIT'&&e.fileIndex===1);
 const d=await PDFDocument.create();d.addPage([15000,200]);
 await assert.rejects(mergeCertificates([blob(await d.save())]),code('PDF_DIMENSIONS'));
 await assert.rejects(mergeCertificates([blob('%PDF-broken')]),e=>e.code==='CORRUPT_PDF'&&e.fileIndex===0);
 await assert.rejects(mergeCertificates([blob('unknown')]),code('UNSUPPORTED_FILE'));
});
test('Image dimensions are checked before any decoder is called',async()=>{
 const bytes=new Uint8Array(24);bytes.set([137,80,78,71,13,10,26,10]);const view=new DataView(bytes.buffer);view.setUint32(16,10000);view.setUint32(20,10000);
 await assert.rejects(mergeCertificates([blob(bytes)]),code('IMAGE_PIXELS'));
});
test('PDF form appearance is flattened; active page annotations and document scripts are absent',async()=>{
 const d=await PDFDocument.create(),page=d.addPage([500,600]),font=await d.embedFont(StandardFonts.Helvetica);
 const field=d.getForm().createTextField('school');field.setText('Synthetic certificate B1');field.addToPage(page,{x:30,y:450,width:350,height:30});d.getForm().updateFieldAppearances(font);
 d.addJavaScript('synthetic','app.alert("test")');
 const result=await mergeCertificates([blob(await d.save())]);assert.equal(result.pages,1);
 const parsed=await PDFDocument.load(await result.blob.arrayBuffer());assert.equal(parsed.getForm().getFields().length,0);
 assert.equal(parsed.getPages()[0].node.has(PDFName.of('Annots')),false);
 assert.equal(parsed.catalog.has(PDFName.of('Names')),false);
 assert.ok(parsed.getPages()[0].node.Resources().get(PDFName.of('XObject')));
});
test('CSV quotes separators and formula-like fields, omits inferred addresses and unsafe websites',async()=>{
 const result=await companyCsv([{name:' =HYPERLINK("x")',city:'Town;West',postalCode:'00123',category:'hotel',email:'guess@example.invalid',emailStatus:'legacy-inferred',website:'javascript:alert(1)'},{name:'Synthetic',city:'Musterstadt',category:'care',email:'info@example.invalid',emailStatus:'legacy-recorded',website:'https://example.invalid/jobs'}]).text();
 assert.match(result,/"' =HYPERLINK\(""x""\)"/);assert.match(result,/"Town;West"/);assert.match(result,/"00123"/);
 assert.doesNotMatch(result,/guess@example.invalid|javascript:/);assert.match(result,/info@example.invalid/);assert.match(result,/Aktualität/);
});
test('MIME rejects recipient, subject and attachment header injection',async()=>{
 const base={recipient:'team@example.invalid',subject:'Bewerbung',body:'Sehr geehrte Damen und Herren,',attachments:[{filename:'Lebenslauf.pdf',blob:await pdf()}]};
 await assert.rejects(emailDraft({...base,recipient:'team@example.invalid\r\nBcc: other@example.invalid'}),code('INVALID_EMAIL'));
 await assert.rejects(emailDraft({...base,subject:'Bewerbung\r\nBcc: other@example.invalid'}),code('INVALID_SUBJECT'));
 await assert.rejects(emailDraft({...base,attachments:[{...base.attachments[0],filename:'bad"\r\n.pdf'}]}),code('INVALID_ATTACHMENTS'));
 const text=await(await emailDraft({...base,subject:'Bewerbung für Ausbildung — Zoë Мария'.repeat(8)})).text();
 assert.ok(text.split('\r\n').every(line=>line.length<=998));assert.match(text,/X-Unsent: 1/);assert.match(text,/Content-Disposition: attachment/);
});
test('Long mailto leaves subject and requires complete body copy; never pretends attachments',()=>{
 const m=mailtoFor('team@example.invalid','Bewerbung','Ä'.repeat(2000));assert.equal(m.bodyIncluded,false);const url=new URL(m.href);assert.equal(url.searchParams.has('body'),false);assert.equal(url.searchParams.has('attach'),false);
 assert.equal(mailtoFor('team@example.invalid','Bewerbung','Zeile 1\nZeile 2').bodyIncluded,true);
});
test('Certificate omission is explicit, exports only a real CV and reports actual pages',async()=>{
 const cv=await pdf(2),base={cvDocument:{},applicantName:'Fara Test',senderEmail:'fara@example.invalid',recipient:'team@example.invalid',subject:'Bewerbung um eine Ausbildung',body:'Sehr geehrte Damen und Herren,',files:[],companies:[],exportCv:async()=>({blob:cv})};
 await assert.rejects(prepareApplication(base),code('NO_CERTIFICATES'));
 const result=await prepareApplication({...base,allowNoCertificates:true});assert.equal(result.attachments.length,1);assert.equal(result.attachments[0].pages,2);assert.equal(result.certificates,null);assert.ok(result.archive.blob.size);
 await assert.rejects(prepareApplication({...base,allowNoCertificates:true,exportCv:async()=>({blob:blob('not PDF')})}),code('CV_EXPORT'));
});
