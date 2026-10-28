import { buildModel, configForWall, defaultSettings, wallOrder, type Settings, type WallId } from './framing';
import { claddingCorner } from './cladding';
import { gableRoofTop } from './sheathing';
import { roofOverhangs } from './roof-overhangs';
import { rafterTailCut } from './rafter-dimensions';

export const CLADDING_LAYOUT = { boardWidth:175, minLap:35, maxLap:40, bottom:-25, topAdjustment:0, buttGap:5, openingGap:5, topGap:3, stockLength:4800, kerf:3, endTrim:5, ordered:60 };
export type CladdingOptions = typeof CLADDING_LAYOUT;
export type CladdingPiece = {id:string;wall:WallId;course:number;x:number;end:number;bottom:number;top:number;length:number;points:number[][];notches:{x:number;end:number;bottom:number;top:number}[];bevel:boolean;stock?:number};
/** Same horizontal soffit datum as the eaves drawing, from sole underside. */
export function claddingEavesTop(s:Settings,o:CladdingOptions=CLADDING_LAYOUT){
 const p=s.roofPitch*Math.PI/180,{eavesTailRun}=roofOverhangs(s.gableOverhang,s.roofGableOverhang,s.studFace);
 return s.wallHeight-rafterTailCut(s.studDepth,s.roofPitch).plumbFace-(eavesTailRun+s.studDepth)*Math.tan(p)+s.studDepth/Math.cos(p)-9-o.topGap+o.topAdjustment;
}
export function claddingLayout(s:Settings=defaultSettings(),o:CladdingOptions=CLADDING_LAYOUT,jointFractions=[1/5,.45]){
 const errors:string[]=[];
 if(Object.values(o).some(v=>!Number.isFinite(v))||o.boardWidth<75||o.boardWidth>300||o.minLap<15||o.maxLap<o.minLap||o.maxLap>=o.boardWidth||o.buttGap<0||o.openingGap<0||o.bottom< -150||o.bottom>150||Math.abs(o.topAdjustment)>300) return {errors:['Check board width, overlap and setting-out inputs.'],walls:[],pieces:[],bins:[],gauge:0,lap:0,courses:0,eavesTop:0,totalMetres:0,spare:0,jointBackingMetres:0,options:o};
 const top=claddingEavesTop(s,o),height=top-o.bottom;
 const candidates=Array.from({length:100},(_,i)=>i+2).map(n=>({n,g:(height-o.boardWidth)/(n-1)})).filter(v=>v.g>=o.boardWidth-o.maxLap-1e-6&&v.g<=o.boardWidth-o.minLap+1e-6);
 // Staggered joint targets favour reusing short ends beside 3.25 m gable blanks.
 // Exact full-width top board when possible. Otherwise preserve minimum lap and rip thin top edge.
 const exact=candidates[0],gauge=exact?.g??o.boardWidth-o.minLap,courses=exact?.n??Math.ceil((height-o.boardWidth)/gauge)+1,lap=o.boardWidth-gauge;
 if(height<o.boardWidth||courses>60)errors.push('Measured cladding height is outside the supported setting-out range.');
 const m=claddingCorner(),pieces:CladdingPiece[]=[];
 const walls=wallOrder.map(id=>{
  const cfg=configForWall(s,id),a=(cfg.isSide?-cfg.cornerLap:0)+m.frontStart,b=(cfg.isSide?cfg.width+cfg.cornerLap:cfg.width)-m.frontStart;
  const peak=cfg.width/2,pitch=Math.tan(cfg.roofPitch*Math.PI/180);
  const roof=(x:number)=>gableRoofTop(cfg,x)-o.topGap+o.topAdjustment;
  const ceiling=(x:number)=>cfg.gable?roof(x):top;
  const max=cfg.gable?roof(peak):top,joints:number[]=[];
  const supports=[...new Set(buildModel(cfg).filter(v=>v.shape==='rect'&&['common stud','end stud','king stud'].includes(v.type)).map(v=>v.x!+v.w!/2))].sort((x,y)=>x-y);
  const openings=cfg.computedOpenings.map(v=>({x:v.x-o.openingGap,end:v.x+v.width+o.openingGap,bottom:v.sill-o.openingGap,top:v.sill+v.height+o.openingGap}));
  const courseCount=cfg.gable?Math.max(1,Math.ceil((max-o.bottom-o.boardWidth-1e-7)/gauge)+1):courses;
  for(let course=1,base=o.bottom;course<=courseCount;course++,base=o.bottom+(course-1)*gauge){
   const boardTop=base+o.boardWidth;
   const left=cfg.gable?Math.max(a,peak-(roof(peak)-base)/pitch):a,right=cfg.gable?Math.min(b,peak+(roof(peak)-base)/pitch):b;
   if(right-left<1)continue;
   let runs=[[left,right]];
   for(const v of openings.filter(v=>v.bottom<=base+1e-6&&v.top>=Math.min(boardTop,max)-1e-6))runs=runs.flatMap(([l,r])=>v.end<=l||v.x>=r?[[l,r]]:[[l,Math.min(r,v.x)],[Math.max(l,v.end),r]].filter(([x,y])=>y-x>1));
   for(const [l,r] of runs){
    let ranges=[[l,r]];
    if(r-l>o.stockLength-2*o.endTrim){
     const target=cfg.width*jointFractions[course%2?0:1];
     const support=supports.filter(x=>x-l>600&&r-x>600&&x-l<=o.stockLength-2*o.endTrim&&r-x<=o.stockLength-2*o.endTrim&&!openings.some(v=>v.x<x+50&&v.end>x-50&&v.bottom<boardTop&&v.top>base)).sort((x,y)=>Math.abs(x-target)-Math.abs(y-target))[0];
     if(support===undefined){errors.push(`${cfg.name} course ${course}: no supported joint fits the stock.`);continue;}
     ranges=[[l,support-o.buttGap/2],[support+o.buttGap/2,r]];joints.push(support);
    }
    for(const [x,end] of ranges){
     const cap=(u:number)=>Math.min(boardTop,ceiling(u));
     const roofCrossings=cfg.gable?[peak-(roof(peak)-boardTop)/pitch,peak,peak+(roof(peak)-boardTop)/pitch].filter(u=>u>x+1e-7&&u<end-1e-7).sort((a,b)=>b-a):[];
     const points=[[x,base],[end,base],[end,cap(end)],...roofCrossings.map(u=>[u,cap(u)]),[x,cap(x)]];
     const notches=openings.map(v=>({x:Math.max(x,v.x),end:Math.min(end,v.end),bottom:Math.max(base,v.bottom),top:Math.min(boardTop,v.top,max)})).filter(v=>v.end>v.x&&v.top>v.bottom);
     pieces.push({id:`${id==='rear'?'B':id[0].toUpperCase()}${String(course).padStart(2,'0')}-${pieces.filter(v=>v.wall===id&&v.course===course).length+1}`,wall:id,course,x,end,bottom:base,top:Math.max(...points.map(v=>v[1])),length:Math.ceil(end-x-1e-7),points,notches,bevel:points.slice(2).some(v=>v[1]<boardTop-1e-6)});
    }
   }
  }
  return {id,cfg,a,b,peak,max,joints:[...new Set(joints)].sort((x,y)=>x-y),pieces:pieces.filter(v=>v.wall===id)};
 });
 const bins:{remaining:number;pieces:CladdingPiece[]}[]=[];
 for(const piece of [...pieces].sort((a,b)=>b.length-a.length)){
  const needed=piece.length+o.kerf;
  let bin=bins.find(v=>v.remaining>=needed);
  if(!bin){bin={remaining:o.stockLength-2*o.endTrim,pieces:[]};bins.push(bin);}
  if(needed>bin.remaining)errors.push(`${piece.id} exceeds usable stock length.`);
  bin.pieces.push(piece);bin.remaining-=needed;piece.stock=bins.indexOf(bin)+1;
 }
 return {errors:[...new Set(errors)],walls,pieces,bins,gauge,lap,courses,eavesTop:top,totalMetres:pieces.reduce((n,v)=>n+v.length,0)/1000,spare:o.ordered-bins.length,jointBackingMetres:walls.reduce((n,w)=>n+w.joints.length*(top-o.bottom)/1000,0),options:o};
}
