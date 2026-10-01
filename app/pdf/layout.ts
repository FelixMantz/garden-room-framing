import { textWidth } from "../pdf-font-widths";
export const clean=(s:string)=>String(s).replace(/×/g,"x").replace(/·/g,"-").replace(/[–—]/g,"-").replace(/[^ -~]/g,"");
const esc=(s:string)=>clean(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");

export type Material = "timber"|"corner"|"lintel"|"masonry"|"floor"|"tie"|"ridge"|"plate"|"outrigger";
export type Fill = Material | number[];
const patterns:Record<Material,number>={timber:1,corner:2,lintel:3,masonry:4,floor:5,tie:6,ridge:7,plate:8,outrigger:9};
export function canvas(){
  const PT=72/25.4,PAGE_H=595.28,ops:string[]=[];
  const num=(v:number)=>Number(v.toFixed(3)),rgb=(_c:number[])=>"0 0 0",x=(v:number)=>num(v*PT),y=(v:number)=>num(PAGE_H-v*PT);
  const shape=(path:string,bounds:number[],fill:Fill,stroke:number[],lineWidth:number)=>{
    const pattern=typeof fill === "string" ? patterns[fill] : undefined;
    ops.push(`q 1 1 1 rg ${path} f Q`);
    if(pattern){
      ops.push(`q ${path} W n 0 0 0 RG ${x(.10)} w`);
      const [l,t,r,b]=bounds;
      const line=(a:number,c:number,d:number,e:number)=>ops.push(`${x(a)} ${y(c)} m ${x(d)} ${y(e)} l S`);
      const gap=pattern===6?1.4:pattern===3?1.3:pattern===8?3:2;
      if([1,2,3,6,7,8,9].includes(pattern))for(let k=l-(b-t);k<r+(b-t);k+=gap){
        if(pattern!==9)line(k,b,k+b-t,t);
        if(pattern===2||pattern===7||pattern===9)line(k,t,k+b-t,b);
      }
      if(pattern===5)for(let yy=t+1;yy<b;yy+=2)for(let xx=l+1;xx<r;xx+=2)ops.push(`0 0 0 rg ${x(xx)} ${y(yy)} ${x(.22)} ${x(.22)} re f`);
      if(pattern===4)for(let k=l-(b-t);k<r+(b-t);k+=3.2)line(k,b,k+b-t,t);
      ops.push('Q');
    }
    if(lineWidth>0)ops.push(`q 0 0 0 RG ${x(lineWidth)} w ${path} S Q`);
  };
  return {
    rect:(rx:number,ry:number,rw:number,rh:number,fill:Fill=[255,255,255],stroke=[60,60,60],lineWidth=.15)=>shape(`${x(rx)} ${num(PAGE_H-(ry+rh)*PT)} ${x(rw)} ${x(rh)} re`,[rx,ry,rx+rw,ry+rh],fill,stroke,lineWidth),
    polygon:(points:number[][],fill:Fill=[255,255,255],stroke=[60,60,60],lineWidth=.15)=>shape(`${points.map((p,i)=>`${x(p[0])} ${y(p[1])} ${i?'l':'m'}`).join(' ')} h`,[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))],fill,stroke,lineWidth),
    line:(x1:number,y1:number,x2:number,y2:number,stroke=[55,55,55],lineWidth=.15,dash:number[]|null=null)=>ops.push(`q ${rgb(stroke)} RG ${num(lineWidth*PT)} w ${dash?`[${dash.map(d=>x(d)).join(" ")}] 0 d`:""} ${x(x1)} ${y(y1)} m ${x(x2)} ${y(y2)} l S Q`),
    text:(value:string,tx:number,ty:number,size=7,bold=false,align:"left"|"center"|"right"="left",color=[25,25,25])=>{const valueClean=esc(value),estimated=textWidth(clean(value),size,bold);let xp=x(tx);if(align==="center")xp-=estimated/2;if(align==="right")xp-=estimated;ops.push(`BT /${bold?"F2":"F1"} ${num(size)} Tf ${rgb(color)} rg 1 0 0 1 ${num(xp)} ${y(ty)} Tm (${valueClean}) Tj ET`);},
    textVertical:(value:string,tx:number,ty:number,size=7,bold=false,color=[25,25,25])=>{const valueClean=esc(value),estimated=textWidth(clean(value),size,bold);ops.push(`BT /${bold?"F2":"F1"} ${num(size)} Tf ${rgb(color)} rg 0 1 -1 0 ${x(tx)} ${num(y(ty)-estimated/2)} Tm (${valueClean}) Tj ET`);},
    stream:()=>ops.join("\n")
  };
}

export const fmt=(n:number)=>String(Number(n.toFixed(1)));
export const BRICK_DATUM_DASH=[2.5,1,.3,1];
export function wrapText(value:string,widthMm:number,size:number){
  const lines:string[]=[];let line="";
  for(const word of clean(value).split(/\s+/)){
    const next=line?line+" "+word:word;
    if(line&&textWidth(next,size)>widthMm*72/25.4){lines.push(line);line=word;}else line=next;
  }
  if(line)lines.push(line);return lines;
}
export function dimension(c:ReturnType<typeof canvas>,a:number[],b:number[],label:string,vertical=false){
  c.line(a[0],a[1],b[0],b[1],[24,107,120],.18);
  for(const p of [a,b])c.line(p[0]-1,p[1]+1,p[0]+1,p[1]-1,[24,107,120],.18);
  c.text(label,vertical?a[0]+2:(a[0]+b[0])/2,vertical?(a[1]+b[1])/2:a[1]-1.5,6.5,true,vertical?"left":"center",[24,107,120]);
}
export function hTechnical(c:ReturnType<typeof canvas>,x1:number,x2:number,featureY:number,dimY:number,label:string,size=5.7,witnessDash:number[]|null=null){
  const start=featureY+Math.sign(dimY-featureY)*Math.min(.7,Math.abs(dimY-featureY)/2);
  c.line(x1,start,x1,dimY,[0,0,0],.10,witnessDash);c.line(x2,start,x2,dimY,[0,0,0],.10,witnessDash);
  c.line(x1,dimY,x2,dimY,[0,0,0],.13);
  for(const x of [x1,x2])c.line(x-1,dimY+1,x+1,dimY-1,[0,0,0],.13);
  const labelWidth=textWidth(clean(label),size,true)*25.4/72;
  c.rect((x1+x2-labelWidth)/2-.5,dimY-1.2-size*.36,labelWidth+1,size*.45,[255,255,255],[255,255,255],0);
  c.text(label,(x1+x2)/2,dimY-1.2,size,true,"center",[0,0,0]);
}
export function vTechnical(c:ReturnType<typeof canvas>,y1:number,y2:number,featureX:number,dimX:number,label:string,size=5.7,labelSide:"left"|"right"="right"){
  const start=featureX+Math.sign(dimX-featureX)*Math.min(.7,Math.abs(dimX-featureX)/2);
  c.line(start,y1,dimX,y1,[0,0,0],.10);c.line(start,y2,dimX,y2,[0,0,0],.10);
  c.line(dimX,y1,dimX,y2,[0,0,0],.13);
  for(const y of [y1,y2])c.line(dimX-1,y+1,dimX+1,y-1,[0,0,0],.13);
  const tx=dimX+(labelSide==="right"?1.5:-1.5),labelWidth=textWidth(clean(label),size,true)*25.4/72;
  c.rect(tx-size*.36,(y1+y2-labelWidth)/2-.5,size*.45,labelWidth+1,[255,255,255],[255,255,255],0);
  c.textVertical(label,tx,(y1+y2)/2,size,true,[0,0,0]);
}
