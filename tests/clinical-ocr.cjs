// Real OCR/PDF smoke checks use local assets and fictional text; no network or personal CVs.
/* eslint-disable @typescript-eslint/no-require-imports -- Node fixture generation and existing packages. */
const assert=require('node:assert/strict');const path=require('node:path');const fs=require('node:fs');
(async()=>{
 const sharp=require('sharp');
 const image=await sharp(Buffer.from('<svg width="1200" height="240"><rect width="100%" height="100%" fill="white"/><text x="35" y="155" font-family="sans-serif" font-size="85" fill="black">EXAMPLE TEST CV</text></svg>')).png().toBuffer();
 fs.writeFileSync('/tmp/emcrown-clinical-cv.png',image);
 const {createWorker}=require('tesseract.js');
 const worker=await createWorker('eng',1,{langPath:path.resolve('public/ocr'),cacheMethod:'none',gzip:true,errorHandler:()=>undefined});
 try { const result=await worker.recognize(image);assert.match(result.data.text,/EXAMPLE\s+TEST\s+CV/i); } finally {await worker.terminate();}
 const body='BT /F1 24 Tf 50 700 Td (Example Test CV) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(body)} >>\nstream\n${body}\nendstream`];
 let source='%PDF-1.4\n';const positions=[0];
 objects.forEach((object,index)=>{positions.push(Buffer.byteLength(source));source+=`${index+1} 0 obj\n${object}\nendobj\n`;});
 const xref=Buffer.byteLength(source);source+=`xref\n0 6\n0000000000 65535 f \n${positions.slice(1).map(position=>String(position).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 fs.writeFileSync('/tmp/emcrown-clinical-cv.pdf',source);
 const pdf=await import('pdfjs-dist/legacy/build/pdf.mjs');
 const loader=pdf.getDocument({data:new Uint8Array(Buffer.from(source)),disableFontFace:true,useSystemFonts:true,useWasm:false});
 try {const doc=await loader.promise;assert.equal(doc.numPages,1);const text=(await(await doc.getPage(1)).getTextContent()).items.map(item=>item.str||'').join(' ');assert.match(text,/Example Test CV/);} finally {await loader.destroy();}
 console.log('Clinical OCR/PDF passed: real Tesseract recognition using same-origin model assets and real PDF.js text extraction.');
})().catch(error=>{console.error(error);process.exitCode=1;});
