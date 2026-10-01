import { canvas, type Fill } from './layout';
const escape=(s:string)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const colors:Record<string,string>={timber:'#e2c78e',corner:'#c6b2d8',lintel:'#b4d5df',masonry:'#d6a28b',floor:'#d7e3d6',tie:'#67a8ad',ridge:'#a68db7',plate:'#a7b5bd',outrigger:'#bca2cc'};
/** Same page primitives and annotation positions as the PDF, in millimetres. */
export function svgCanvas():ReturnType<typeof canvas>{
 const ops:string[]=[];
 const fill=(v:Fill)=>typeof v==='string'?colors[v]:'#fff';
 return {
  rect:(x,y,w,h,f=[255,255,255],_s=[],lw=.15)=>{ops.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill(f)}" stroke="black" stroke-width="${lw}"/>`);},
  polygon:(pts,f=[255,255,255],_s=[],lw=.15)=>{ops.push(`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${fill(f)}" stroke="black" stroke-width="${lw}"/>`);},
  line:(a,b,c,d,_s=[],lw=.15,dash=null)=>{ops.push(`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="black" stroke-width="${lw}" ${dash?`stroke-dasharray="${dash.join(' ')}"`:''}/>`);return ops.length;},
  text:(v,x,y,size=7,bold=false,align='left')=>{ops.push(`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size*25.4/72}" font-weight="${bold?700:400}" text-anchor="${align==='left'?'start':align==='right'?'end':'middle'}">${escape(v)}</text>`);},
  textVertical:(v,x,y,size=7,bold=false)=>{ops.push(`<text transform="translate(${x} ${y}) rotate(-90)" font-family="Arial,Helvetica,sans-serif" font-size="${size*25.4/72}" font-weight="${bold?700:400}" text-anchor="middle">${escape(v)}</text>`);},
  stream:()=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 210" role="img" aria-label="Technical framing drawing">${ops.join('')}</svg>`
 };
}
