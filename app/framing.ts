import { roofOverhangs, ROOF_FASCIA_THICKNESS } from './roof-overhangs';
export type WallId = "front" | "rear" | "left" | "right";
export type Opening = { type: "window" | "door"; x: number; width: number; height: number; level: number; note?: string };
export type FloorLayer = { name: string; thickness: number };
export type Wall = { name: string; gable: boolean; studOffset:number; openings: Opening[] };
export type Settings = {
  roofGableOverhang:number; rafterCentres:number; tieCount:number; tieEvery:number; tieWidth:number; tieDepth:number;
  internalLength:number; internalDepth:number; brickInternalLength:number; brickInternalDepth:number; brickThickness:number;
  cornerLap:number; cornerType:"california"; wallHeight:number; studFace:number; studDepth:number;
  studCentres:number; topPlates:2; headerDepth:number; roofPitch:number; gableOverhang:number; ridgeWidth:number; ridgeDepth:number;
  dwarfEnabled:true; brickCourses:number; brickHeight:number;
  courseHeight:number; baseAllowance:number; layers:FloorLayer[]; walls:Record<WallId,Wall>;
};
export type WallConfig = Settings & Wall & {
  id:WallId; isSide:boolean; width:number; upperStart:number; upperEnd:number; gableRise:number;
  frameLength:number; frameDepth:number; brickLength:number; brickDepth:number;
  brickStart:number; brickEnd:number; brickBody:number; masonryHeight:number; frameBase:number; ffl:number;
  plates:number; parsedNogginRows:number[]; computedOpenings:(Opening & {id:number;sill:number;levelAboveFfl:number})[];
  minX:number; maxX:number; maxY:number; ridgeBottom:number; ridgeTop:number; rafterVerticalDepth:number; rafterSeatLift:number; eavesTailRun:number;
};
export type Member = {
  shape:"rect"|"slope"; type:string; x?:number; y?:number; w?:number; h?:number;
  x1?:number; y1?:number; x2?:number; y2?:number; thickness?:number; length?:number;
  topLeft?:number; topRight?:number; plumbEnds?:boolean; seatAt?:"start"|"end"; seatRun?:number; bearingX?:number; bearingY?:number; note:string; qty:number; corner?:boolean;
};

export const wallOrder:WallId[]=["front","rear","left","right"];
const modulo=(value:number,base:number)=>((value%base)+base)%base;

export function defaultSettings():Settings {
  return {
    roofGableOverhang:250, rafterCentres:400, tieCount:3, tieEvery:3, tieWidth:75, tieDepth:75,
    internalLength:5000, internalDepth:3010, brickInternalLength:5005, brickInternalDepth:3015, brickThickness:95,
    cornerLap:95, cornerType:"california", wallHeight:2077, studFace:45, studDepth:95,
    studCentres:400, topPlates:2, headerDepth:95, roofPitch:25, gableOverhang:250, ridgeWidth:45, ridgeDepth:145,
    dwarfEnabled:true, brickCourses:4, brickHeight:60, courseHeight:70,
    baseAllowance:0,
    layers:[{name:"PIR insulation",thickness:100},{name:"P5 floor deck",thickness:22},{name:"Reclaimed parquet",thickness:15}],
    walls:{
      front:{name:"Front wall",gable:false,studOffset:45,openings:[
        {type:"window",x:528,width:1010,height:1040,level:757},
        {type:"door",x:1962,width:1265,height:2080,level:-45,note:"Measured French-door pair approximately 1165 × 1980 mm; 40 mm hardwood lining and cill; cill top flush with FFL; 5 mm operating and frame-fitting margins; one 70 mm brick threshold course is laid across the doorway, leaving 22 mm to the structural opening base at +92 mm above slab; final structural opening 1265 × 2080 mm."},
        {type:"window",x:3652,width:1010,height:1040,level:757},
      ]},
      rear:{name:"Rear wall",gable:false,studOffset:45,openings:[]},
      left:{name:"Left gable wall",gable:true,studOffset:305,openings:[
        {type:"window",x:528,width:710,height:1040,level:757},
        {type:"window",x:1772,width:710,height:1040,level:757},
      ]},
      right:{name:"Right gable wall",gable:true,studOffset:305,openings:[]},
    },
  };
}

export function configForWall(settings:Settings,id:WallId):WallConfig {
  const wall={...settings.walls[id],studOffset:Number(settings.walls[id].studOffset)||0};
  const isSide=id==="left"||id==="right";
  const frameLength=settings.internalLength+2*settings.studDepth;
  const frameDepth=settings.internalDepth+2*settings.studDepth;
  const brickLength=settings.brickInternalLength+2*settings.brickThickness;
  const brickDepth=settings.brickInternalDepth+2*settings.brickThickness;
  const ridgeWidth=Number(settings.ridgeWidth ?? 45);
  const ridgeDepth=Number(settings.ridgeDepth ?? 145);
  const gableOverhang=Number(settings.gableOverhang ?? 250);
  const {eavesTailRun}=roofOverhangs(gableOverhang,settings.roofGableOverhang,settings.studFace);
  const width=isSide?frameDepth-2*settings.cornerLap:frameLength;
  // Gable grids are phased from the ridge centreline so a full-height common
  // stud sits directly below the ridge support, regardless of wall width.
  if(wall.gable)wall.studOffset=modulo(width/2,settings.studCentres);
  const upperStart=isSide?-settings.cornerLap:settings.cornerLap;
  const upperEnd=isSide?width+settings.cornerLap:width-settings.cornerLap;
  const brickBody=isSide?brickDepth:brickLength;
  const brickStart=(width-brickBody)/2;
  const pitchRadians=settings.roofPitch*Math.PI/180;
  // The rafter terminates at the ridge face, not its centreline.
  const gableRise=wall.gable?Math.tan(pitchRadians)*((frameDepth-ridgeWidth)/2):0;
  const rafterVerticalDepth=settings.studDepth/Math.cos(pitchRadians);
  const rafterSeatLift=rafterVerticalDepth/2-settings.studDepth*Math.tan(pitchRadians);
  const ridgeBottom=settings.wallHeight+gableRise+rafterSeatLift-rafterVerticalDepth/2;
  const ridgeTop=ridgeBottom+ridgeDepth;
  const masonryHeight=settings.brickCourses*settings.courseHeight;
  const frameBase=masonryHeight;
  const ffl=settings.layers.reduce((sum,l)=>sum+(Number(l.thickness)||0),0);
  const plates=settings.studFace*settings.topPlates;
  const computedOpenings=wall.openings.map((o,i)=>{
    const sill=o.type==="window"?o.level:ffl-frameBase+o.level;
    return {...o,id:i+1,sill,levelAboveFfl:sill+frameBase-ffl};
  }).sort((a,b)=>a.x-b.x);
  return {...settings,...wall,id,isSide,width,upperStart,upperEnd,gableRise,frameLength,frameDepth,brickLength,brickDepth,gableOverhang,ridgeWidth,ridgeDepth,brickStart,brickEnd:brickStart+brickBody,
    brickBody,masonryHeight,frameBase,ffl,plates,computedOpenings,ridgeBottom,ridgeTop,rafterVerticalDepth,rafterSeatLift,eavesTailRun,
    parsedNogginRows:[1200],
    minX:Math.min(0,upperStart-(wall.gable?gableOverhang:0),brickStart),maxX:Math.max(width,upperEnd+(wall.gable?gableOverhang:0),brickStart+brickBody),maxY:wall.gable?Math.max(ridgeTop,settings.wallHeight+gableRise+rafterSeatLift+rafterVerticalDepth/2):settings.wallHeight};
}

export function doorLintelToLowerTopPlate(cfg:WallConfig,opening:WallConfig["computedOpenings"][number]){
  return cfg.wallHeight-cfg.plates-(opening.sill+opening.height);
}

export function studGridCentres(width:number,centres:number,offset:number,edgeClear:number){
  if(!Number.isFinite(width)||width<=0||width>50000||!Number.isFinite(centres)||centres<25||centres>2000)return [];
  const origin=modulo(Number(offset)||0,centres),positions:number[]=[];
  for(let x=origin;x<width;x+=centres)if(x>edgeClear&&x<width-edgeClear)positions.push(x);
  return positions;
}

export function slopePolygon(m:Member):number[][] {
  const dx=m.x2!-m.x1!,dy=m.y2!-m.y1!,len=Math.hypot(dx,dy),half=(m.thickness||0)/2;
  const verticalHalf=half*len/Math.max(.001,Math.abs(dx));
  if(m.bearingX!==undefined&&m.bearingY!==undefined){
    const bx=m.bearingX,by=m.bearingY,run=m.seatRun||0;
    if(dy>0)return [[m.x1!,m.y1!+verticalHalf],[m.x2!,m.y2!+verticalHalf],[m.x2!,m.y2!-verticalHalf],[bx+run,by],[bx,by],[bx,by-run*Math.abs(dy/dx)],[m.x1!,m.y1!-verticalHalf]];
    return [[m.x1!,m.y1!+verticalHalf],[m.x2!,m.y2!+verticalHalf],[m.x2!,m.y2!-verticalHalf],[bx,by-run*Math.abs(dy/dx)],[bx,by],[bx-run,by],[m.x1!,m.y1!-verticalHalf]];
  }
  if(m.seatAt==="start")return [[m.x1!,m.y1!+verticalHalf],[m.x2!,m.y2!+verticalHalf],[m.x2!,m.y2!-verticalHalf],[m.x1!+(m.seatRun||0),m.y1!],[m.x1!,m.y1!]];
  if(m.seatAt==="end")return [[m.x1!,m.y1!+verticalHalf],[m.x2!,m.y2!+verticalHalf],[m.x2!,m.y2!],[m.x2!-(m.seatRun||0),m.y2!],[m.x1!,m.y1!-verticalHalf]];
  if(m.plumbEnds)return [[m.x1!,m.y1!+verticalHalf],[m.x2!,m.y2!+verticalHalf],[m.x2!,m.y2!-verticalHalf],[m.x1!,m.y1!-verticalHalf]];
  return [[m.x1!-dy/len*half,m.y1!+dx/len*half],[m.x2!-dy/len*half,m.y2!+dx/len*half],[m.x2!+dy/len*half,m.y2!-dx/len*half],[m.x1!+dy/len*half,m.y1!-dx/len*half]];
}

export function validate(cfg:WallConfig):string[] {
  const errors:string[]=[];
  const dimensions=[cfg.width,cfg.wallHeight,cfg.studFace,cfg.studDepth,cfg.studCentres,cfg.roofPitch,cfg.frameBase,cfg.ffl,cfg.headerDepth,cfg.cornerLap,cfg.gableOverhang];
  if(dimensions.some(v=>!Number.isFinite(v)))return [`${cfg.name}: dimensions must be finite numbers.`];
  if(cfg.width>50000||cfg.wallHeight>10000||cfg.studDepth<=0||cfg.headerDepth<=0||cfg.cornerLap<0)errors.push(`${cfg.name}: check the framing dimensions.`);
  if(cfg.roofPitch<=0||cfg.roofPitch>=60)errors.push(`${cfg.name}: roof pitch must be greater than 0 and less than 60 degrees.`);
  if(cfg.topPlates!==2)errors.push(`${cfg.name}: the specification requires two top plates.`);
  if(!Number.isInteger(cfg.brickCourses)||cfg.brickCourses<0||cfg.brickCourses>50||cfg.courseHeight<=0||cfg.brickHeight<=0||cfg.brickHeight>cfg.courseHeight||cfg.baseAllowance<0)errors.push(`${cfg.name}: check brick courses, mortar and sole support.`);
  if(cfg.width<600||cfg.wallHeight<600||cfg.studFace<25||cfg.studCentres<=cfg.studFace||cfg.studCentres>2000) errors.push(`${cfg.name}: check wall and stud dimensions.`);
  if(cfg.gable&&(cfg.ridgeWidth<=0||cfg.ridgeDepth<=0||cfg.ridgeWidth>=cfg.width/2||!Number.isFinite(cfg.ridgeDepth)||!Number.isFinite(cfg.ridgeWidth))) errors.push(`${cfg.name}: check ridge beam dimensions.`);
  if(cfg.gable&&cfg.ridgeWidth<cfg.studFace)errors.push(`${cfg.name}: ridge width must be at least ${cfg.studFace} mm to clear the square ridge support and apex studs.`);
  if(cfg.gable&&(cfg.gableOverhang<ROOF_FASCIA_THICKNESS||cfg.gableOverhang>1500)) errors.push(`${cfg.name}: eaves overhang to outer fascia must be at least 22 mm.`);
  if(cfg.isSide&&cfg.width<=cfg.studFace*4) errors.push(`${cfg.name}: corner laps leave no usable wall body.`);
  if(!cfg.isSide&&cfg.topPlates===2&&cfg.upperEnd<=cfg.upperStart) errors.push(`${cfg.name}: upper-plate cut-outs overlap.`);
  if(cfg.layers.some(l=>!Number.isFinite(l.thickness)||l.thickness<0)) errors.push(`${cfg.name}: check floor layers.`);
  cfg.computedOpenings.forEach(o=>{
    if(![o.x,o.width,o.height,o.sill].every(Number.isFinite)||o.width<=0||o.height<=0)errors.push(`${cfg.name} opening ${o.id} needs positive finite dimensions.`);
    if(o.x<cfg.studFace*2+(cfg.isSide?cfg.studFace:cfg.studFace+cfg.studDepth)||o.x+o.width>cfg.width-cfg.studFace*2-(cfg.isSide?cfg.studFace:cfg.studFace+cfg.studDepth)) errors.push(`${cfg.name} opening ${o.id} needs room for king, jack and corner studs.`);
    if(o.sill<-cfg.frameBase) errors.push(`${cfg.name} opening ${o.id} begins below slab datum.`);
    if(o.type==="window"&&o.sill<2*cfg.studFace)errors.push(`${cfg.name} opening ${o.id} leaves no room for its rough sill above the sole plate.`);
    if(o.type==="door"&&cfg.dwarfEnabled&&o.sill+cfg.frameBase<cfg.courseHeight)errors.push(`${cfg.name} opening ${o.id} intersects the laid brick threshold course.`);
    if(o.sill+o.height+cfg.headerDepth>cfg.wallHeight-cfg.plates) errors.push(`${cfg.name} opening ${o.id} is too tall for its lintel and plates.`);
  });
  for(let i=1;i<cfg.computedOpenings.length;i++){
    const a=cfg.computedOpenings[i-1],b=cfg.computedOpenings[i];
    if(a.x+a.width+cfg.studFace*4>b.x) errors.push(`${cfg.name} openings ${a.id} and ${b.id} need more framing room.`);
  }
  return errors;
}

export function buildModel(cfg:WallConfig):Member[] {
  // Validation must precede every grid loop, including live previews.
  if(validate(cfg).length)return [];
  const m:Member[]=[];
  const add=(type:string,x:number,y:number,w:number,h:number,note="",qty=1,corner=false)=>{if(w>0&&h>0)m.push({shape:"rect",type,x,y,w,h,note,qty,corner});};
  const cutStud=(type:string,x:number,y:number,w:number,topLeft:number,topRight:number,note="")=>{const h=Math.max(topLeft,topRight);if(w>0&&h>cfg.studFace*.7)m.push({shape:"rect",type,x,y,w,h,topLeft,topRight,note,qty:1});};
  const slope=(type:string,x1:number,y1:number,x2:number,y2:number,thickness:number,note="",plumbEnds=false,seatAt?:"start"|"end",seatRun?:number,bearingX?:number,bearingY?:number)=>m.push({shape:"slope",type,x1,y1,x2,y2,thickness,length:Math.hypot(x2-x1,y2-y1),qty:1,note,plumbEnds,seatAt,seatRun,bearingX,bearingY});
  const doorCuts=cfg.computedOpenings.filter(o=>o.type==="door"&&o.sill<cfg.studFace).sort((a,b)=>a.x-b.x);
  let soleX=0;
  doorCuts.forEach(o=>{add("sole plate",soleX,0,o.x-soleX,cfg.studFace,"cut out after erection and bracing");soleX=o.x+o.width;});
  add("sole plate",soleX,0,cfg.width-soleX,cfg.studFace,"cut out after erection and bracing");
  add("lower top plate",0,cfg.wallHeight-cfg.plates,cfg.width,cfg.studFace);
  add("upper top plate",cfg.upperStart,cfg.wallHeight-cfg.studFace,cfg.upperEnd-cfg.upperStart,cfg.studFace,cfg.isSide?"extends over front/rear cut-outs":`${cfg.cornerLap} mm cut-out at each end`);
  const studH=cfg.wallHeight-cfg.plates-cfg.studFace;
  add("end stud",0,cfg.studFace,cfg.studFace,studH); add("end stud",cfg.width-cfg.studFace,cfg.studFace,cfg.studFace,studH);
  if(!cfg.isSide){
    add("California return stud",cfg.studFace,cfg.studFace,cfg.studDepth,studH,"turned flatwise for internal lining backing",1,true);
    add("California return stud",cfg.width-cfg.studFace-cfg.studDepth,cfg.studFace,cfg.studDepth,studH,"turned flatwise for internal lining backing",1,true);
  }
  const inOpening=(x:number)=>cfg.computedOpenings.some(o=>x>o.x-cfg.studFace*2-cfg.studFace/2&&x<o.x+o.width+cfg.studFace*2+cfg.studFace/2);
  const gridCentres=studGridCentres(cfg.width,cfg.studCentres,cfg.studOffset,cfg.studFace);
  const cornerMembers=m.filter(v=>v.corner||v.type==="end stud");
  gridCentres.forEach(x=>{if(!inOpening(x)&&!cornerMembers.some(v=>x+cfg.studFace/2>v.x!&&x-cfg.studFace/2<v.x!+v.w!))add("common stud",x-cfg.studFace/2,cfg.studFace,cfg.studFace,studH);});
  cfg.computedOpenings.forEach(o=>{
    const head=o.sill+o.height,leftJack=o.x-cfg.studFace,leftKing=o.x-cfg.studFace*2,rightJack=o.x+o.width,rightKing=o.x+o.width+cfg.studFace;
    add("king stud",leftKing,cfg.studFace,cfg.studFace,studH); add("king stud",rightKing,cfg.studFace,cfg.studFace,studH);
    add("jack stud",leftJack,cfg.studFace,cfg.studFace,head-cfg.studFace); add("jack stud",rightJack,cfg.studFace,cfg.studFace,head-cfg.studFace);
    add("lintel ply",leftJack,head,o.width+cfg.studFace*2,cfg.headerDepth,`two ${cfg.studFace} x ${cfg.headerDepth} plies through wall thickness`,2);
    if(o.type==="window")add("rough sill",o.x,o.sill-cfg.studFace,o.width,cfg.studFace);
    for(const x of gridCentres.filter(x=>x>=o.x&&x<o.x+o.width)){
      const studX=Math.max(o.x,Math.min(x-cfg.studFace/2,o.x+o.width-cfg.studFace));
      if(o.type==="window"&&o.sill>cfg.studFace*2)add("cripple stud",studX,cfg.studFace,cfg.studFace,o.sill-cfg.studFace*2);
      const above=head+cfg.headerDepth; add("cripple stud",studX,above,cfg.studFace,cfg.wallHeight-cfg.plates-above);
    }
  });
  cfg.parsedNogginRows.forEach(row=>{
    
    const verticals=m.filter(v=>v.shape==="rect"&&(["end stud","common stud","king stud","jack stud"].includes(v.type)||v.corner)).sort((a,b)=>(a.x||0)-(b.x||0));
    for(let i=0;i<verticals.length-1;i++){
      const left=(verticals[i].x||0)+(verticals[i].w||0),right=verticals[i+1].x||0;
      if(right-left<cfg.studFace*.6)continue;
      const y=row-cfg.studFace/2;
      const occupied=m.some(v=>v.shape==="rect"&&left<v.x!+v.w!-.001&&right>v.x!+.001&&y<v.y!+v.h!-.001&&y+cfg.studFace>v.y!+.001);
      const crosses=cfg.computedOpenings.some(o=>left<o.x+o.width&&right>o.x&&y<o.sill+o.height&&y+cfg.studFace>o.sill);
      if(!occupied&&!crosses&&y>cfg.studFace&&y+cfg.studFace<cfg.wallHeight-cfg.plates)add("noggin",left,y,right-left,cfg.studFace);
    }
  });
  if(cfg.gable){
    const center=cfg.width/2,apex=cfg.wallHeight+cfg.gableRise+cfg.rafterSeatLift,pocketLeft=center-cfg.ridgeWidth/2,pocketRight=center+cfg.ridgeWidth/2;
    const pitchRadians=cfg.roofPitch*Math.PI/180;
    const undersideOffset=cfg.rafterVerticalDepth/2;
    const seatRun=cfg.studDepth;
    const actualTan=Math.tan(pitchRadians);
    const roofAt=(x:number)=>apex-Math.max(0,x<=pocketLeft?pocketLeft-x:x-pocketRight)*actualTan;
    const addRoofStud=(type:string,x:number,note="")=>cutStud(type,x,cfg.wallHeight,cfg.studFace,roofAt(x)-cfg.wallHeight-undersideOffset,roofAt(x+cfg.studFace)-cfg.wallHeight-undersideOffset,note);
    // Keep the square support and both sloping apex studs face-to-face even
    // when the ridge is narrower than the support timber.
    const supportHalf=Math.max(cfg.ridgeWidth,cfg.studFace)/2;
    const centralLeft=center-supportHalf-cfg.studFace,centralRight=center+supportHalf;
    const symmetricCentres:number[]=[];
    for(let step=1;;step++){
      const left=center-step*cfg.studCentres,right=center+step*cfg.studCentres;
      if(left<=cfg.upperStart+cfg.studFace/2&&right>=cfg.upperEnd-cfg.studFace/2)break;
      if(left>cfg.upperStart+cfg.studFace/2)symmetricCentres.push(left);
      if(right<cfg.upperEnd-cfg.studFace/2)symmetricCentres.push(right);
    }
    symmetricCentres.sort((a,b)=>a-b).forEach(x=>{
      const left=x-cfg.studFace/2,right=left+cfg.studFace;
      if(!(right>centralLeft&&left<centralRight+cfg.studFace))addRoofStud("gable stud",left,`${cfg.studCentres} mm centres set symmetrically from ridge centreline; angled top cut`);
    });
    addRoofStud("gable apex stud",centralLeft,"left apex stud; angled top cut");
    add("ridge support stud",center-cfg.studFace/2,cfg.wallHeight,cfg.studFace,cfg.ridgeBottom-cfg.wallHeight,"square bearing beneath ridge beam; underside flush with rafter plumb ends");
    addRoofStud("gable apex stud",centralRight,"right apex stud; angled top cut");
    const tailDrop=cfg.eavesTailRun*Math.tan(pitchRadians);
    slope("gable end rafter",cfg.upperStart-cfg.eavesTailRun,cfg.wallHeight-tailDrop+cfg.rafterSeatLift,pocketLeft,apex,cfg.studDepth,`${cfg.roofPitch} degree; ${cfg.gableOverhang} mm to outer fascia; ${cfg.eavesTailRun} mm to tail; 20 mm plumb tail face then horizontal soffit cut; birdsmouth on gable plate; plumb ridge cut`,true,undefined,seatRun,cfg.upperStart,cfg.wallHeight);
    slope("gable end rafter",pocketRight,apex,cfg.upperEnd+cfg.eavesTailRun,cfg.wallHeight-tailDrop+cfg.rafterSeatLift,cfg.studDepth,`${cfg.roofPitch} degree; ${cfg.gableOverhang} mm to outer fascia; ${cfg.eavesTailRun} mm to tail; 20 mm plumb tail face then horizontal soffit cut; birdsmouth on gable plate; plumb ridge cut`,true,undefined,seatRun,cfg.upperEnd,cfg.wallHeight);
  }
  return m;
}

export function makeSchedule(cfg:WallConfig,members:Member[]) {
  const groups=new Map<string,{length:number;qty:number;section:string;cut:string;uses:Set<string>;notes:Set<string>}>();
  members.forEach(m=>{
    const length=Number((m.shape==="slope"?(m.length||0):/stud/.test(m.type)?(m.h||0):(m.w||0)).toFixed(1));
    const section=m.type.includes("lintel")?`${cfg.studFace} × ${cfg.headerDepth}`:`${cfg.studFace} × ${cfg.studDepth}`;
    const cut=m.shape==="slope"?"rafter":m.topLeft!==undefined?"angled stud":"square";
    const key=section+"|"+length+"|"+cut;
    if(!groups.has(key))groups.set(key,{length,qty:0,section,cut,uses:new Set(),notes:new Set()});
    const group=groups.get(key)!;group.qty+=m.qty||1;group.uses.add(m.type);if(m.note)group.notes.add(m.note);
  });
  return [...groups.values()].sort((a,b)=>a.section.localeCompare(b.section)||b.length-a.length).map(g=>({
    type:[...g.uses].join(", "),length:g.length,qty:g.qty,cut:g.cut,
    section:g.section+(g.notes.size?`; ${[...g.notes].join("; ")}`:"")
  }));
}
