import { buildModel, configForWall, defaultSettings, wallOrder, type Settings, type WallConfig, type WallId } from './framing';
export const OSB_STOCK={width:1220,height:2440,thickness:11,quantity:26,gap:3,kerf:3,bottom:3};
export type OsbPanel={id:string,wall:WallId,x:number,y:number,w:number,h:number,points:number[][],gable:boolean,bridge?:boolean,sheet?:number,source?:string};
type Scrap={w:number,h:number,sheet:number,source:string,x:number,y:number,rotated:boolean};
export type OsbNestPiece={panel:string,sheet:number,x:number,y:number,w:number,h:number,rotated:boolean};
/** Finished outline / apertures in panel coordinates, from its flat base-left. */
export function osbFinishedProfile(panel:OsbPanel,cfg:WallConfig){
 const points=panel.points.map(([x,y])=>[x-panel.x,y-panel.y]);
 const cutouts=cfg.computedOpenings.filter(o=>o.type==='window').map(o=>{
  const x=Math.max(panel.x,o.x)-panel.x,y=Math.max(panel.y,o.sill)-panel.y;
  return {x,y,w:Math.min(panel.x+panel.w,o.x+o.width)-panel.x-x,h:Math.min(panel.y+panel.h,o.sill+o.height)-panel.y-y};
 }).filter(o=>o.w>0&&o.h>0);
 const sideHeights=[0,panel.w].map(x=>Math.max(...points.filter(q=>Math.abs(q[0]-x)<.001).map(q=>q[1])));
 return {points,cutouts,sideHeights};
}
// Round panel boundaries inward to whole millimetres; preserve at least 3 mm clearance.
const cutStart=(n:number)=>Math.ceil(n-1e-8),cutEnd=(n:number)=>Math.floor(n+1e-8);
// Eaves stop in lower plate; side-wall sheets bridge the wall / gable junction.
export function wallOsbTop(cfg:WallConfig){return cfg.isSide?gableJointAxis(cfg)-1.5:cfg.wallHeight-cfg.studFace-cfg.studFace/3;}
export function gableJointAxis(cfg:WallConfig){return Math.max(cfg.parsedNogginRows[0],Math.ceil(gableRoofTop(cfg,cfg.width/2)-2440+1.5));}
// Continue each roof slope without flattening the final diagonal.
// Ridge board ends flush with the gable-end rafters; gable OSB needs no ridge notch.
export function gableRoofTop(cfg:WallConfig,x:number){const center=cfg.width/2,half=cfg.ridgeWidth/2;return cfg.wallHeight+cfg.gableRise+cfg.rafterSeatLift+cfg.rafterVerticalDepth/2-(Math.abs(x-center)-half)*Math.tan(cfg.roofPitch*Math.PI/180)-3;}
function grid(cfg:WallConfig){return [...new Set(buildModel(cfg).filter(m=>m.shape==='rect'&&['common stud','end stud','king stud','cripple stud'].includes(m.type)).map(m=>m.x!+m.w!/2))].sort((a,b)=>a-b);}
function splitRun(a:number,b:number,candidates:number[]){const out=[a];let left=a;while(b-left>OSB_STOCK.width){const next=candidates.filter(x=>x>left+100&&x<=left+OSB_STOCK.width).at(-1);if(next===undefined)throw Error('OSB edge needs an additional supporting stud.');out.push(next);left=next;}out.push(b);return out;}
export function sheathingPlan(s:Settings=defaultSettings()){
 const panels:OsbPanel[]=[],scraps:Scrap[]=[],cuts:{panel:string,sheet:number,w:number,h:number,source:string}[]=[],nests:OsbNestPiece[]=[];
 const configs=wallOrder.map(id=>configForWall(s,id));
 for(const cfg of configs){
  const a=cfg.isSide?-cfg.cornerLap+OSB_STOCK.gap:-OSB_STOCK.thickness,b=cfg.isSide?cfg.width+cfg.cornerLap-OSB_STOCK.gap:cfg.width+OSB_STOCK.thickness;
  const bottom=OSB_STOCK.bottom,top=cutEnd(wallOsbTop(cfg)),door=cfg.computedOpenings.find(o=>o.type==='door');
  const addRun=(start:number,end:number,bounds?:number[])=>{const xs=bounds||splitRun(start,end,grid(cfg));for(let i=0;i<xs.length-1;i++){const x=cutStart(xs[i]+(i?1.5:0)),right=cutEnd(xs[i+1]-(i<xs.length-2?1.5:0));panels.push({id:`${(cfg.id==='rear'?'B':cfg.id[0].toUpperCase())}${panels.filter(p=>p.wall===cfg.id&&!p.gable).length+1}`,wall:cfg.id,x,y:bottom,w:right-x,h:top-bottom,points:[[x,bottom],[right,bottom],[right,top],[x,top]],gable:false});}};
  if(door){addRun(a,door.x);addRun(door.x+door.width,b);const bottom=cutStart(door.sill+door.height); // Lintel and plates back these short joints continuously.
   const spans=Math.ceil(door.width/OSB_STOCK.width);for(let i=0;i<spans;i++){const x=cutStart(door.x+i*door.width/spans+(i?1.5:OSB_STOCK.gap)),right=cutEnd(door.x+(i+1)*door.width/spans-(i<spans-1?1.5:OSB_STOCK.gap));panels.push({id:`FH${i+1}`,wall:cfg.id,x,y:bottom,w:right-x,h:top-bottom,points:[[x,bottom],[right,bottom],[right,top],[x,top]],gable:false});}
  }else if(cfg.isSide){const g=buildModel(cfg).filter(m=>m.type==='gable stud'||m.type==='ridge support stud').map(m=>m.x!+m.w!/2).sort((a,b)=>a-b),first=g[0];const bounds=[a,first];let prev=first;while(b-prev>OSB_STOCK.width){const next=g.filter(x=>x>prev&&x<=prev+OSB_STOCK.width).at(-1)!;bounds.push(next);prev=next;}bounds.push(b);addRun(a,b,bounds);
  }else{addRun(a,b);}
  if(cfg.gable){const base=cutStart(gableJointAxis(cfg)+1.5);
   const lower=panels.filter(p=>p.wall===cfg.id&&!p.gable);
   lower.forEach((p,i)=>{p.id=`${cfg.id[0].toUpperCase()}B${i+1}`;const x=p.x,right=p.x+p.w,peak=cfg.width/2;
    const pts=[[x,base],[right,base],[right,cutEnd(gableRoofTop(cfg,right))],...(x<peak&&right>peak?[[peak,cutEnd(gableRoofTop(cfg,peak))]]:[]),[x,cutEnd(gableRoofTop(cfg,x))]];
    panels.push({id:`${cfg.id[0].toUpperCase()}U${i+1}`,wall:cfg.id,x,y:base,w:p.w,h:Math.max(...pts.map(p=>p[1]))-base,points:pts,gable:true,bridge:true});
   });
  }
 }
 let sheetCount=0;
 function allocate(p:OsbPanel){
  let best:{index:number,rotated:boolean,score:number}|undefined;
  for(let i=0;i<scraps.length;i++)for(const rotated of [false,true]){const w=rotated?p.h:p.w,h=rotated?p.w:p.h,t=scraps[i];if(w<=t.w+.001&&h<=t.h+.001){const score=t.w*t.h-p.w*p.h;if(!best||score<best.score)best={index:i,rotated,score};}}
  if(!best){if(p.w>1220||p.h>2440)throw Error('OSB blank exceeds ordered sheet size.');scraps.push({w:1220,h:2440,sheet:++sheetCount,source:'new sheet',x:0,y:0,rotated:false});best={index:scraps.length-1,rotated:false,score:0};}
  const t=scraps.splice(best.index,1)[0],w=best.rotated?p.h:p.w,h=best.rotated?p.w:p.h;p.sheet=t.sheet;p.source=t.source+(best.rotated?' (rotate)':'');cuts.push({panel:p.id,sheet:t.sheet,w:p.w,h:p.h,source:p.source});
  const rotated=t.rotated!==best.rotated;
  nests.push({panel:p.id,sheet:t.sheet,x:t.x,y:t.y,w:t.rotated?h:w,h:t.rotated?w:h,rotated});
  const at=(u:number,v:number)=>({x:t.x+(t.rotated?v:u),y:t.y+(t.rotated?u:v)});
  if(t.w-w>3)scraps.push({w:t.w-w-3,h:t.h,sheet:t.sheet,source:`${p.id} side offcut`,...at(w+3,0),rotated:t.rotated});
  if(t.h-h>3)scraps.push({w,h:t.h-h-3,sheet:t.sheet,source:`${p.id} top offcut`,...at(0,h+3),rotated:t.rotated});
  if(!p.gable||p.bridge){const cfg=configs.find(c=>c.id===p.wall)!;for(const o of cfg.computedOpenings.filter(o=>o.type==='window')){const left=Math.max(p.x,o.x)+3,bottom=Math.max(p.y,o.sill)+3,width=Math.min(p.x+p.w,o.x+o.width)-left-3,height=Math.min(p.y+p.h,o.sill+o.height)-bottom-3;if(width>0&&height>0){const u=left-p.x,v=bottom-p.y;scraps.push({w:width,h:height,sheet:t.sheet,source:`${p.id} window cut-out`,x:t.x+(rotated?v:u),y:t.y+(rotated?u:v),rotated});}}}
 }
 // Allocate bridging blanks with wall blanks; narrow panels share the remaining widths.
 const mains=panels.filter(p=>(!p.gable||p.bridge)&&!p.id.startsWith('FH')).sort((a,b)=>b.w-a.w||b.h-a.h);
 for(const p of mains)allocate(p);
 for(const p of panels.filter(p=>p.gable&&!p.bridge).sort((a,b)=>b.h-a.h||b.w-a.w))allocate(p);
 for(const p of panels.filter(p=>p.id.startsWith('FH')))allocate(p);
 return {panels,configs,cuts,sheetCount,scraps,nests};
}

