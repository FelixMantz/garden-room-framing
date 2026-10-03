import { roofOverhangs } from './roof-overhangs';
import { configForWall, type Settings } from './framing';

export function roofModel(settings: Settings) {
  const cfg = configForWall(settings, 'front');
  const centres = settings.rafterCentres ?? 400;
  const count = settings.tieCount ?? 3;
  const every = settings.tieEvery ?? 3;
  const width = settings.tieWidth ?? 75, depth = settings.tieDepth ?? 75;
  const length = cfg.frameLength, span = cfg.frameDepth, middle = length / 2;
  const offset = (width + settings.studFace) / 2;
  const overhang = cfg.gableOverhang;
  const gableOverhang = settings.roofGableOverhang ?? 250;
  const outerRafterHalf = settings.studFace / 2;
  const {fasciaThickness,eavesTailRun,flyRafterProjection,outriggerRun}=roofOverhangs(overhang,gableOverhang,settings.studFace);
  const outriggerRuns = gableOverhang > 0 && outriggerRun > 0 ? [
    {side:'left' as const,start:-outriggerRun,end:0},
    {side:'right' as const,start:length,end:length+outriggerRun},
  ] : [];
  const plates = [
    {name:'Front top plate',x:settings.cornerLap,y:0,w:length-2*settings.cornerLap,h:settings.studDepth},
    {name:'Rear top plate',x:settings.cornerLap,y:span-settings.studDepth,w:length-2*settings.cornerLap,h:settings.studDepth},
    {name:'Left gable top plate',x:0,y:0,w:settings.studDepth,h:span-0},
    {name:'Right gable top plate',x:length-settings.studDepth,y:0,w:settings.studDepth,h:span-0},
  ];
  const errors: string[] = [];
  if(!Number.isFinite(gableOverhang)||gableOverhang<0||gableOverhang>1500) errors.push('Gable overhang must be between 0 and 1,500 mm.');
  if(gableOverhang>0&&outriggerRun<=0) errors.push('Gable overhang to outer fascia must exceed the fascia thickness plus the fly-rafter width.');
  if(!Number.isFinite(eavesTailRun)||eavesTailRun<0) errors.push('Eaves overhang to outer fascia must be at least 22 mm.');
  if (!Number.isFinite(centres) || centres < settings.studFace || centres > 2000) errors.push('Rafter centres must be at least the rafter thickness and no more than 2,000 mm.');
  if (!Number.isInteger(count) || count < 1 || count > 21) errors.push('Choose 1–21 tie beams.');
  if (!Number.isInteger(every) || every < 1 || every > 20) errors.push('Tie spacing must be 1–20 rafter bays.');
  if (![width, depth].every(v => Number.isFinite(v) && v > 0 && v <= 500)) errors.push('Tie sections must be between 1 and 500 mm.');
  if (![length,span].every(v=>Number.isFinite(v)&&v>200&&v<50000)) errors.push('Check the building dimensions.');
  if (errors.length) return { cfg, length, span, middle, centres, count, every, width, depth, offset, overhang, gableOverhang, fasciaThickness, eavesTailRun, flyRafterProjection, outerRafterHalf, outriggerRuns, plates, rafters: [] as number[], ties: [] as number[], errors };
  const first = settings.studFace / 2, last = length - first;
  const ties = Array.from({length:count},(_,i)=>middle+(i-(count-1)/2)*every*centres);
  // Keep ties centred; all common rafter pairs sit on their right-hand faces.
  const origin = ties[0] + offset;
  const rafters: number[] = [];
  const start = Math.ceil((first-origin)/centres), end = Math.floor((last-origin)/centres);
  for(let n=start;n<=end;n++) rafters.push(origin+n*centres);
  // Add gable pairs; avoid overlapping a common pair with the end pair.
  const regular = rafters.filter(x => x-first >= settings.studFace && last-x >= settings.studFace);
  rafters.splice(0,rafters.length,first,...regular.sort((a,b)=>a-b),last);
  if (ties.some(x=>x-width/2<0 || x+width/2>length || !rafters.some(r=>Math.abs(r-x-offset)<.001))) errors.push('This tie count and spacing will not fit beside the rafter grid. Reduce the count or spacing.');
  if (ties.some(t=>rafters.some(r=>Math.abs(r-t)<offset-.001))) errors.push('A tie overlaps another rafter. Increase rafter centres or reduce tie width.');
  if (width>every*centres) errors.push('Tie beams overlap at this spacing.');
  return { cfg, length, span, middle, centres, count, every, width, depth, offset, overhang, gableOverhang, fasciaThickness, eavesTailRun, flyRafterProjection, outerRafterHalf, outriggerRuns, plates, rafters, ties, errors };

}

/** Square-edge OSB: 1,200 mm ridge row, then a 3 mm expansion joint. */
export function roofDeckNoggins(settings:Settings){
 const r=roofModel(settings),cos=Math.cos(settings.roofPitch*Math.PI/180);
 const rowWidth=1200,jointGap=3,fromRidgeSlope=rowWidth+jointGap/2;
 const ridgeFront=(r.span-settings.ridgeWidth)/2;
 const frontY=ridgeFront-fromRidgeSlope*cos;
 const deckSlope=(ridgeFront+r.eavesTailRun)/cos;
 const centres=r.gableOverhang>0?[-r.flyRafterProjection,...r.rafters,r.length+r.flyRafterProjection]:r.rafters;
 const blocks:{x:number;y:number;length:number;planWidth:number}[]=[];
 if(!r.errors.length&&deckSlope>rowWidth+jointGap&&frontY>-r.eavesTailRun){
  for(const y of [frontY,r.span-frontY])for(let i=1;i<centres.length;i++){
   const x=centres[i-1]+settings.studFace/2,length=centres[i]-centres[i-1]-settings.studFace;
   if(length>0)blocks.push({x,y,length,planWidth:settings.studFace*cos});
  }
 }
 return {blocks,rowWidth,jointGap,fromRidgeSlope,fromRidgeHorizontal:fromRidgeSlope*cos,frontY,rearY:r.span-frontY,deckSlope};
}

/** Roof-only members; four gable rafters and all plates belong to wall schedules. */
export function roofCutSchedule(settings:Settings){
 const r=roofModel(settings),length=Number((((r.span-settings.ridgeWidth)/2+r.eavesTailRun)/Math.cos(settings.roofPitch*Math.PI/180)).toFixed(1));
 const section=`${settings.studFace} x ${settings.studDepth}`;
 const nogginGroups=new Map<number,number>();
 roofDeckNoggins(settings).blocks.forEach(b=>{const l=Number(b.length.toFixed(1));nogginGroups.set(l,(nogginGroups.get(l)||0)+1);});
 return [
  {type:'Field common rafters',qty:(r.rafters.length-2)*2,section,length,cut:'20 mm tail face + horizontal soffit cut; birdsmouth'},
  ...(r.gableOverhang>0?[{type:'Outer fly rafters',qty:4,section,length:Number(((r.span/2+r.eavesTailRun)/Math.cos(settings.roofPitch*Math.PI/180)).toFixed(1)),cut:'20 mm tail face + horizontal soffit cut; no seat'}]:[]),
  {type:'Tie beams',qty:r.count,section:`${r.width} x ${r.depth}`,length:r.span,cut:tieEndClearance(settings).projection>.01?'Chamfer both top corners; see detail':'Square ends; no chamfer required'},
  {type:'Ridge beam',qty:1,section:`${settings.ridgeWidth} x ${settings.ridgeDepth}`,length:r.length,cut:'Square ends; between gable outer faces'},
  ...(r.outriggerRuns.length?[{type:'Gable outriggers',qty:r.outriggerRuns.length*4,section,length:r.outriggerRuns[0].end-r.outriggerRuns[0].start,cut:'Square ends; clear run outside wall'}]:[]),
  ...[...nogginGroups].sort((a,b)=>b[0]-a[0]).map(([length,qty])=>({type:'OSB seam noggins',qty,section,length,cut:'Square ends; top flush with roof deck plane'})),
 ];
}

/** Agreed top-corner chamfers follow the rafter upper plane, leaving the underside flat. */
export function tieEndClearance(settings:Settings){
 const pitch=settings.roofPitch*Math.PI/180;
 const rafterTopAtWall=settings.studDepth/Math.cos(pitch)-settings.studDepth*Math.tan(pitch);
 const projection=Math.max(0,settings.tieDepth-rafterTopAtWall);
 return {rafterTopAtWall,projection,run:projection/Math.tan(pitch),remainingDepth:Math.min(settings.tieDepth,rafterTopAtWall)};
}
