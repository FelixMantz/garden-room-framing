import { buildModel, configForWall, defaultSettings, wallOrder, wallStudCentres, type Settings } from './framing';
/** Purchase allowance: vertical runs only; split at supported wall-head plates. */
export function wallBattenPlan(s:Settings=defaultSettings()) {
 const pieces:{wall:string;purpose:string;length:number}[]=[];
 for(const id of wallOrder){
  const c=configForWall(s,id),members=buildModel(c);
  const add=(purpose:string,length:number)=>{if(length>0)pieces.push({wall:id,purpose,length:Math.ceil(length)});};
  for(const m of members.filter(m=>['end stud','common stud','king stud'].includes(m.type))) add('Full-height framing / corner line',c.wallHeight);
  for(const o of c.computedOpenings){
   for(let n=0;n<2;n++)add('Opening jamb / face-trim backing',o.height);
   for(const x of wallStudCentres(c).filter(x=>x>=o.x&&x<o.x+o.width)){
    void x;
    if(o.type==='window')add('Below window',o.sill);
    add('Above opening',c.wallHeight-Math.max(0,o.sill+o.height));
   }
  }
  for(const m of members.filter(m=>['gable stud','gable apex stud','ridge support stud'].includes(m.type))) add('Gable extension',m.h!+c.rafterVerticalDepth+20);
 }
 const stockLength=2100,kerf=3,bins:{remaining:number;pieces:typeof pieces}[]=[];
 for(const piece of [...pieces].sort((a,b)=>b.length-a.length)){
  if(piece.length>stockLength)throw Error('Wall batten exceeds stock length');
  let bin=bins.find(b=>b.remaining>=piece.length+kerf);
  if(!bin){bin={remaining:stockLength,pieces:[]};bins.push(bin);}
  bin.pieces.push(piece);bin.remaining-=piece.length+kerf;
 }
 const stockForCuts=bins.length,reserveLengths=Math.max(2,Math.ceil(stockForCuts*.1));
 const orderLengths=74;
 const shortReserveLengths=0;
 return {pieces,bins,stockLength,stockForCuts,reserveLengths,orderLengths,shortReserveLengths,totalMetres:pieces.reduce((sum,p)=>sum+p.length,0)/1000,
  byWall:wallOrder.map(wall=>({wall,metres:pieces.filter(p=>p.wall===wall).reduce((sum,p)=>sum+p.length,0)/1000})),roofSurplusDeducted:0};
}
