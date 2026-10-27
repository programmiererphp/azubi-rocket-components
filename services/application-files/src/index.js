import{PDFDocument,PDFName}from'pdf-lib';
import JSZip from'jszip';

const MiB=1024*1024;
export const limits=Object.freeze({files:10,fileBytes:10*MiB,totalBytes:30*MiB,pages:100,pixels:40000000});
function fail(code){const error=new Error(code);error.code=code;throw error;}
const text=(v,max=30000)=>{if(typeof v!=='string'||v.length>max)fail('INVALID_DATA');return v;};
const cleanName=value=>String(value).normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,65)||'Bewerbung';
const email=value=>{const v=text(value,254).trim();if(/[\r\n\u0000-\u001f\u007f]/.test(v)||!/^[-a-z0-9.!#$%&'*+/=?^_`{|}~]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i.test(v))fail('INVALID_EMAIL');return v;};
function imageSize(b){
 if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b.length>=24){const v=new DataView(b.buffer,b.byteOffset,b.byteLength);return[v.getUint32(16),v.getUint32(20),'png'];}
 if(b[0]===255&&b[1]===216&&b[2]===255){for(let i=2;i+8<b.length;){if(b[i]!==255)break;const marker=b[i+1];if(marker===216||marker===217){i+=2;continue;}const n=(b[i+2]<<8)|b[i+3];if(n<2||i+2+n>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return[(b[i+7]<<8)|b[i+8],(b[i+5]<<8)|b[i+6],'jpeg'];i+=2+n;}}
 fail('UNSUPPORTED_FILE');
}
export function validateFiles(files){
 if(!Array.isArray(files)||files.length>limits.files)fail('FILE_COUNT');
 let total=0;for(const f of files){if(!(f instanceof Blob)||!f.size)fail('EMPTY_FILE');if(f.size>limits.fileBytes)fail('FILE_SIZE');total+=f.size;}if(total>limits.totalBytes)fail('TOTAL_SIZE');
 return files;
}
export async function mergeCertificates(files,{onProgress=()=>{}}={}){
 validateFiles(files);if(!files.length)fail('NO_CERTIFICATES');const output=await PDFDocument.create();let count=0;
 for(let i=0;i<files.length;i++){try{
  const file=files[i],bytes=new Uint8Array(await file.arrayBuffer());onProgress({stage:'certificates',done:i,total:files.length});
  if(String.fromCharCode(...bytes.slice(0,5))==='%PDF-'){
   let source;try{source=await PDFDocument.load(bytes,{updateMetadata:false});}catch(e){fail(/encrypt/i.test(String(e.message))?'ENCRYPTED_PDF':'CORRUPT_PDF');}
   if(source.isEncrypted)fail('ENCRYPTED_PDF');
   const n=source.getPageCount();if(!n)fail('CORRUPT_PDF');if(count+n>limits.pages)fail('PAGE_LIMIT');
   try{const form=source.getForm();if(form.getFields().length)form.flatten();}catch{fail('PDF_FORM');}
   for(const page of source.getPages()){
    const {width,height}=page.getSize();if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>14400||height>14400)fail('PDF_DIMENSIONS');
    page.node.delete(PDFName.of('AA'));page.node.delete(PDFName.of('Annots'));
   }
   const copied=await output.copyPages(source,source.getPageIndices());copied.forEach(page=>output.addPage(page));count+=n;
  }else{
   const [w,h]=imageSize(bytes);if(!w||!h||w*h>limits.pixels)fail('IMAGE_PIXELS');if(count+1>limits.pages)fail('PAGE_LIMIT');
   let bitmap;try{bitmap=await createImageBitmap(file);}catch{fail('CORRUPT_IMAGE');}
   let encoded;try{
    if(bitmap.width*bitmap.height>limits.pixels)fail('IMAGE_PIXELS');
    const scale=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d');if(!context)fail('IMAGE_UNAVAILABLE');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    encoded=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.90));if(!encoded)fail('CORRUPT_IMAGE');
   }finally{bitmap.close();}
   const image=await output.embedJpg(await encoded.arrayBuffer()),landscape=w>h,page=output.addPage(landscape?[841.89,595.28]:[595.28,841.89]);const size=page.getSize(),scale=Math.min((size.width-48)/image.width,(size.height-48)/image.height);page.drawImage(image,{x:(size.width-image.width*scale)/2,y:(size.height-image.height*scale)/2,width:image.width*scale,height:image.height*scale});count++;
  }
 }catch(error){error.fileIndex=i;throw error;}
 }
 output.setTitle('Zeugnisse und Nachweise');output.setCreator('Azubi Rocket');const blob=new Blob([await output.save()],{type:'application/pdf'});onProgress({stage:'certificates',done:files.length,total:files.length});return{blob,pages:count,sourceFiles:files.length};
}
function csvCell(value){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return'"'+s.replace(/"/g,'""')+'"';}
export function companyCsv(companies){
 if(!Array.isArray(companies)||companies.length>5000)fail('INVALID_COMPANIES');
 const labels={hotel:'Hotel und Gastronomie',care:'Pflege und Gesundheit',educator:'Erziehung und Kita',sales:'Verkauf und Einzelhandel'};
 const rows=[['Firma','Ort','PLZ','Berufsbereich','E-Mail (bitte prüfen)','Website','Kontaktstatus']];
 for(const c of companies){if(!c||typeof c.name!=='string')fail('INVALID_COMPANIES');let website='';try{const u=new URL(c.website);if(u.protocol==='https:'&&!u.username&&!u.password)website=u.href;}catch{}
  rows.push([c.name,c.city,c.postalCode,labels[c.category]??c.category,c.emailStatus==='legacy-inferred'?'':c.email,website,c.emailStatus==='legacy-inferred'?'Adresse abgeleitet – Website prüfen':'Bestandskontakt – Aktualität und freie Plätze prüfen']);}
 return new Blob(['\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});
}
function base64(bytes){let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);}
const folded=bytes=>base64(bytes).match(/.{1,76}/g)?.join('\r\n')??'';
function headerWord(value){const out=[];let part='';for(const char of value){if(new TextEncoder().encode(part+char).length>42){out.push('=?UTF-8?B?'+base64(new TextEncoder().encode(part))+'?=');part='';}part+=char;}if(part)out.push('=?UTF-8?B?'+base64(new TextEncoder().encode(part))+'?=');return out.join('\r\n ');}
export async function emailDraft({recipient,subject,body,attachments,senderEmail=''}){
 recipient=email(recipient);subject=text(subject,1000);body=text(body);if(/[\r\n\u0000-\u001f\u007f]/.test(subject))fail('INVALID_SUBJECT');if(!subject.trim()||!body.trim())fail('EMPTY_LETTER');if(senderEmail)email(senderEmail);
 if(!Array.isArray(attachments)||attachments.length<1||attachments.length>2)fail('INVALID_ATTACHMENTS');
 const boundary='azr_'+crypto.randomUUID().replace(/-/g,'');const lines=['To: '+recipient,...(senderEmail?['From: '+senderEmail]:[]),'Subject: '+headerWord(subject),'Date: '+new Date().toUTCString(),'X-Unsent: 1','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',folded(new TextEncoder().encode(body.replace(/\r?\n/g,'\r\n')))];
 for(const file of attachments){if(!(file.blob instanceof Blob)||file.blob.type!=='application/pdf'||!/^[-a-z0-9_]+\.pdf$/i.test(file.filename))fail('INVALID_ATTACHMENTS');lines.push('--'+boundary,'Content-Type: application/pdf; name="'+file.filename+'"','Content-Disposition: attachment; filename="'+file.filename+'"','Content-Transfer-Encoding: base64','',folded(new Uint8Array(await file.blob.arrayBuffer())));}
 lines.push('--'+boundary+'--','');return new Blob([lines.join('\r\n')],{type:'message/rfc822'});
}
export function mailtoFor(recipient,subject,body){
 recipient=email(recipient);subject=text(subject,1000);body=text(body);if(/[\r\n\u0000-\u001f]/.test(subject))fail('INVALID_SUBJECT');const start='mailto:'+encodeURIComponent(recipient)+'?subject='+encodeURIComponent(subject),full=start+'&body='+encodeURIComponent(body.replace(/\r?\n/g,'\r\n'));return{href:full.length<=1800?full:start,bodyIncluded:full.length<=1800};
}
export async function prepareApplication({cvDocument,applicantName,senderEmail,recipient,subject,body,files=[],companies=[],allowNoCertificates=false,exportCv,onProgress=()=>{}}){
 recipient=email(recipient);if(typeof exportCv!=='function'||!cvDocument||!applicantName?.trim())fail('INVALID_DATA');validateFiles(files);if(!files.length&&!allowNoCertificates)fail('NO_CERTIFICATES');
 const suffix=cleanName(applicantName);onProgress({stage:'cv',done:0,total:1});const cv=await exportCv({format:'pdf',document:cvDocument,language:'de',filename:'Lebenslauf_'+suffix});if(!(cv?.blob instanceof Blob)||cv.blob.type!=='application/pdf')fail('CV_EXPORT');
 let cvPages;try{const parsed=await PDFDocument.load(await cv.blob.arrayBuffer());cvPages=parsed.getPageCount();if(!cvPages)fail('CV_EXPORT');}catch{fail('CV_EXPORT');}
 const attachments=[{kind:'cv',filename:'Lebenslauf_'+suffix+'.pdf',blob:cv.blob,pages:cvPages}];onProgress({stage:'cv',done:1,total:1});let certificates=null;
 if(files.length){certificates=await mergeCertificates(files,{onProgress});attachments.push({kind:'certificates',filename:'Nachweise_'+suffix+'.pdf',blob:certificates.blob,pages:certificates.pages});}
 onProgress({stage:'package',done:0,total:1});const draft=await emailDraft({recipient,subject,body,attachments,senderEmail});const list=companyCsv(companies),zip=new JSZip();for(const a of attachments)zip.file(a.filename,await a.blob.arrayBuffer());zip.file('Bewerbung.eml',await draft.arrayBuffer());zip.file('Anschreiben.txt','Betreff: '+subject+'\r\n\r\n'+body);zip.file('Firmenliste.csv',await list.arrayBuffer());
 const archive=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});onProgress({stage:'package',done:1,total:1});return{schemaVersion:1,attachments,certificates,email:{blob:draft,filename:'Bewerbung_'+suffix+'.eml'},companyList:{blob:list,filename:'Firmenliste.csv'},archive:{blob:archive,filename:'Bewerbung_'+suffix+'.zip'},mailto:mailtoFor(recipient,subject,body),recipient,subject,body,totalAttachmentBytes:attachments.reduce((n,a)=>n+a.blob.size,0)};
}
