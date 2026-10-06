import { buildModel, configForWall, defaultSettings, wallOrder, type Settings, type WallConfig, type WallId } from './framing';
export const OSB_STOCK={width:1220,height:2440,thickness:11,quantity:26,gap:3,kerf:3,bottom:3};
export type OsbPanel={id:string,wall:WallId,x:number,y:number,w:number,h:number,points:number[][],gable:boolean,sheet?:number,source?:string};
type Scrap={w:number,h:number,sheet:number,source:string};
// Eaves: 2/3 up LOWER plate. Gables: joint centred on UPPER plate.
export function wallOsbTop(cfg:WallConfig){return cfg.isSide?cfg.wallHeight-cfg.studFace/2-1.5:cfg.wallHeight-cfg.studFace-cfg.studFace/3;}
export function gableRoofTop(cfg:WallConfig,x:number){const center=cfg.width/2,half=cfg.ridgeWidth/2;return cfg.wallHeight+cfg.gableRise+cfg.rafterSeatLift+cfg.rafterVerticalDepth/2-Math.max(0,Math.abs(x-center)-half)*Math.tan(cfg.roofPitch*Math.PI/180)-3;}
function grid(cfg:WallConfig){return [...new Set(buildModel(cfg).filter(m=>m.shape==='rect'&&['common stud','end stud','king stud','cripple stud'].includes(m.type)).map(m=>m.x!+m.w!/2))].sort((a,b)=>a-b);}
function splitRun(a:number,b:number,candidates:number[]){const out=[a];let left=a;while(b-left>OSB_STOCK.width){const next=candidates.filter(x=>x>left+100&&x<=left+OSB_STOCK.width).at(-1);if(next===undefined)throw Error('OSB edge needs an additional supporting stud.');out.push(next);left=next;}out.push(b);return out;}
export function sheathingPlan(s:Settings=defaultSettings()){
 const panels:OsbPanel[]=[],scraps:Scrap[]=[],cuts:{panel:string,sheet:number,w:number,h:number,source:string}[]=[];
 const configs=wallOrder.map(id=>configForWall(s,id));
 for(const cfg of configs){
  const a=cfg.isSide?-cfg.cornerLap+OSB_STOCK.gap:-OSB_STOCK.thickness,b=cfg.isSide?cfg.width+cfg.cornerLap-OSB_STOCK.gap:cfg.width+OSB_STOCK.thickness;
  const bottom=OSB_STOCK.bottom,top=wallOsbTop(cfg),door=cfg.computedOpenings.find(o=>o.type==='door');
  const addRun=(start:number,end:number,bounds?:number[])=>{const xs=bounds||splitRun(start,end,grid(cfg));for(let i=0;i<xs.length-1;i++){const x=xs[i]+(i?1.5:0),right=xs[i+1]-(i<xs.length-2?1.5:0);panels.push({id:`${(cfg.id==='rear'?'B':cfg.id[0].toUpperCase())}${panels.filter(p=>p.wall===cfg.id&&!p.gable).length+1}`,wall:cfg.id,x,y:bottom,w:right-x,h:top-bottom,points:[[x,bottom],[right,bottom],[right,top],[x,top]],gable:false});}};
  if(door){addRun(a,door.x);addRun(door.x+door.width,b);const bottom=door.sill+door.height; // Lintel and plates back these short joints continuously.
   const spans=Math.ceil(door.width/OSB_STOCK.width);for(let i=0;i<spans;i++){const x=door.x+i*door.width/spans+(i?1.5:0),right=door.x+(i+1)*door.width/spans-(i<spans-1?1.5:0);panels.push({id:`FH${i+1}`,wall:cfg.id,x,y:bottom,w:right-x,h:top-bottom,points:[[x,bottom],[right,bottom],[right,top],[x,top]],gable:false});}
  }else if(cfg.isSide){const g=buildModel(cfg).filter(m=>m.type==='gable stud'||m.type==='ridge support stud').map(m=>m.x!+m.w!/2).sort((a,b)=>a-b),first=g[0];const bounds=[a,first];let prev=first;while(b-prev>OSB_STOCK.width){const next=g.filter(x=>x>prev&&x<=prev+OSB_STOCK.width).at(-1)!;bounds.push(next);prev=next;}bounds.push(b);addRun(a,b,bounds);
  }else{addRun(a,b);}
  if(cfg.gable){const base=cfg.wallHeight-cfg.studFace/2+1.5;const xs=[a,...buildModel(cfg).filter(m=>m.type==='gable stud'||m.type==='ridge support stud').map(m=>m.x!+m.w!/2).filter(x=>x>0&&x<cfg.width),b]; // Common and gable grids coincide.
   const unique=[...new Set(xs)].sort((x,y)=>x-y);for(let i=0;i<unique.length-1;i++){const x=unique[i]+(i?1.5:0),right=unique[i+1]-(i<unique.length-2?1.5:0),peak=cfg.width/2;const pts=[[x,base],[right,base],[right,gableRoofTop(cfg,right)],...(x<peak&&right>peak?[[peak,gableRoofTop(cfg,peak)]]:[]),[x,gableRoofTop(cfg,x)]];panels.push({id:`${(cfg.id==='rear'?'B':cfg.id[0].toUpperCase())}G${i+1}`,wall:cfg.id,x,y:base,w:right-x,h:Math.max(...pts.map(p=>p[1]))-base,points:pts,gable:true});}
  }
 }
 let sheetCount=0;
 function allocate(p:OsbPanel){
  let best:{index:number,rotated:boolean,score:number}|undefined;
  for(let i=0;i<scraps.length;i++)for(const rotated of [false,true]){const w=rotated?p.h:p.w,h=rotated?p.w:p.h,t=scraps[i];if(w<=t.w+.001&&h<=t.h+.001){const score=t.w*t.h-p.w*p.h;if(!best||score<best.score)best={index:i,rotated,score};}}
  if(!best){if(p.w>1220||p.h>2440)throw Error('OSB blank exceeds ordered sheet size.');scraps.push({w:1220,h:2440,sheet:++sheetCount,source:'new sheet'});best={index:scraps.length-1,rotated:false,score:0};}
  const t=scraps.splice(best.index,1)[0],w=best.rotated?p.h:p.w,h=best.rotated?p.w:p.h;p.sheet=t.sheet;p.source=t.source+(best.rotated?' (rotate)':'');cuts.push({panel:p.id,sheet:t.sheet,w:p.w,h:p.h,source:p.source});
  if(t.w-w>3)scraps.push({w:t.w-w-3,h:t.h,sheet:t.sheet,source:`${p.id} side offcut`});
  if(t.h-h>3)scraps.push({w,h:t.h-h-3,sheet:t.sheet,source:`${p.id} top offcut`});
  if(!p.gable){const cfg=configs.find(c=>c.id===p.wall)!;for(const o of cfg.computedOpenings.filter(o=>o.type==='window')){const width=Math.min(p.x+p.w,o.x+o.width)-Math.max(p.x,o.x)-6;const height=Math.min(p.y+p.h,o.sill+o.height)-Math.max(p.y,o.sill)-6;if(width>0&&height>0)scraps.push({w:width,h:height,sheet:t.sheet,source:`${p.id} window cut-out`});}}
 }
 // Tall blanks first; narrow tails share remaining sheet width. Only gables / headers use recovered openings.
 const mains=panels.filter(p=>!p.gable&&!p.id.startsWith('FH')).sort((a,b)=>b.w-a.w||b.h-a.h);
 for(const p of mains)allocate(p);
 for(const p of panels.filter(p=>p.gable).sort((a,b)=>b.h-a.h||b.w-a.w))allocate(p);
 for(const p of panels.filter(p=>p.id.startsWith('FH')))allocate(p);
 return {panels,configs,cuts,sheetCount,scraps};
}
