export function buildPdf(streams:string[]){
  const objects:(string|null)[]=[null,null,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"],refs:number[]=[];
  streams.forEach(stream=>{const contentRef=objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);const pageRef=objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentRef} 0 R >>`);refs.push(pageRef);});
  objects[0]="<< /Type /Catalog /Pages 2 0 R >>";objects[1]=`<< /Type /Pages /Count ${refs.length} /Kids [${refs.map(r=>r+" 0 R").join(" ")}] >>`;
  let pdf="%PDF-1.4\n%FRAMING-PDF\n";const offsets=[0];objects.forEach((obj,i)=>{offsets[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objects.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

