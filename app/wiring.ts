import { roofModel } from './roof';
import { bathroomModel } from './bathroom';
import { configForWall, type Settings, type WallId } from './framing';
/** Proposed accessory layout. Coordinates in each INTERNAL elevation, from its left end; z above FFL. */
export const WIRING = {socket:500,switch:1200,high:2100,network:1700,bathCeiling:2100} as const;
/** CU fits the 298mm clear bay between the front-right king and California corner framing. */
export function consumerUnit(s:Settings){
 const cfg=configForWall(s,'front'),width=244,height=270;
 const top=cfg.wallHeight-cfg.topPlates*cfg.studFace+cfg.frameBase-cfg.ffl;
 return {x:289,z:top-height/2,top,bottom:top-height,width,height};
}
/** Centre of the clear gable triangle: centroid, one third of its height above the plates. */
export function leftGableFeature(s:Settings){
 const cfg=configForWall(s,'left'),base=cfg.wallHeight+cfg.frameBase-cfg.ffl;
 return {id:'G1',x:cfg.width/2,z:Math.round(base+(cfg.ridgeBottom-cfg.wallHeight)/3)};
}
export const MAIN_LIGHT_GROUPS=['main room','feature','external'] as const;
export function networkSwitch(s:Settings){return {x:consumerUnit(s).x,z:WIRING.network};}
export type Point={id:string,x:number,z:number,kind:string};
export type Run={id:string,points:number[][],type:'ring'|'light'|'heater'|'aircon'|'data'|'spur'|'supply'};
export function serviceEntry(s:Settings){
 const outsideFront=s.internalDepth+(s.brickInternalDepth-s.internalDepth)/2+s.brickThickness;
 return {setback:200,x:outsideFront-200,swaHeight:250,dataHeight:350};
}
function baseWiringWall(s:Settings,id:WallId){
 const cfg=configForWall(s,id),w=cfg.width,cu=consumerUnit(s),entry=cfg.frameBase-cfg.ffl+cfg.studFace+62;
 const points:Point[]=[],runs:Run[]=[];
 const p=(id:string,x:number,z:number,kind='socket')=>{points.push({id,x,z,kind});};
 const r=(id:string,pts:number[][],type:Run['type']='ring')=>runs.push({id,points:pts,type});
 if(id==='front'){
  const door=cfg.computedOpenings.find(o=>o.type==='door')!;
  const dl=w-door.x-door.width,dr=w-door.x;
  p('S1',300,500);p('S2',w-300,500);p('SW-M',dl-160,1200,'switch3');
  p('EXT-L1',dl-240,1800,'light');p('EXT-L2',dr+240,1800,'light');
  p('CU',cu.x,cu.z,'cu');p('NET',cu.x,WIRING.network,'network');
  r('R: CU / S1',[[cu.x+100,cu.bottom],[cu.x+100,500],[300,500]]);
  r('R: CU / right wall',[[cu.x-105,cu.bottom],[cu.x-105,500],[0,500]]);
  r('SWA: right corner / CU',[[0,250],[cu.x-70,250],[cu.x-70,cu.bottom],[cu.x,cu.bottom]],'supply');r('R: S2 / left',[[w-300,500],[w,500]]);
  r('PSU: S1 / NET USB-C',[[300,500],[300,WIRING.network],[cu.x,WIRING.network]],'spur');
  p('N2',440,500,'data');p('N3',w-440,500,'data');
 }else if(id==='rear'){
  p('S5',500,500);p('S6',w-2100,500);
  r('R: left / S5 / S6',[[0,500],[500,500],[w-2100,500],[w,500]]);
  p('WH-ISO',w-570,850,'isolator');p('WH',w-650,450,'heater');r('H: lead',[[w-570,850],[w-570,450],[w-650,450]],'heater');
 }else if(id==='left'){
  const g=leftGableFeature(s);p(g.id,g.x,g.z,'feature');
  p('S3',450,500);p('S4',w-450,500);p('F-L',w-650,500,'fcu');
  r('R: front / S3 / F-L / S4 / rear',[[0,500],[450,500],[w-650,500],[w-450,500],[w,500]]);
  for(const [i,z] of [[1,650],[2,800]]){p(`OUT-L${i}`,w-650,z,'external');r(`F-L ch${i}`,[[w-650,500],[w-650+(i-1)*50,500],[w-650+(i-1)*50,z],[w-650,z]],'spur');}
 }else{
  const gr=leftGableFeature(s);p('G2',gr.x,gr.z,'feature');
  p('S7',w-1305,500);p('S8',w-505,500);p('F-R',w-905,500,'fcu');p('AP',w*.44,2450,'ap');const bath=bathroomModel(s);p('AC',(w+bath.frontOuter-bath.dy)/2,cfg.wallHeight+cfg.frameBase-cfg.ffl,'aircon');
  r('R: front CU / S8 / F-R / S7 / rear',[[w,500],[w-505,500],[w-905,500],[w-1305,500],[0,500]]);
  const incoming=serviceEntry(s);p('SWA-IN',incoming.x,incoming.swaHeight,'supply');p('DATA-IN',incoming.x,incoming.dataHeight,'data');
  r('SWA: right entry / front corner',[[incoming.x,250],[w,250]],'supply');
  for(let i=0;i<2;i++)r(`HOUSE DATA right ${i+1}`,[[incoming.x,350],[incoming.x,350+i*30],[w,350+i*30]],'data');
  for(const [i,z] of [[1,650],[2,800]]){p(`OUT-R${i}`,w-905,z,'external');r(`F-R ch${i}`,[[w-905,500],[w-905+(i-1)*50,500],[w-905+(i-1)*50,z],[w-905,z]],'spur');}
 }
 if(id==='front'){
  r('N2: single front-right RJ45',[[cu.x,WIRING.network],[cu.x+35,WIRING.network],[cu.x+35,535],[440,535],[440,500]],'data');
  for(let i=0;i<2;i++)r(`HOUSE DATA ${i+1}`,[[0,350+i*30],[cu.x+80+i*30,350+i*30],[cu.x+80+i*30,WIRING.network],[cu.x,WIRING.network]],'data');
 }
 return {cfg,w,points,runs,cu};
}

/** Cable topology: one switched radial per group, with fittings connected in parallel at each loop point. */
function baseCeilingLighting(s:Settings){
 const roof=roofModel(s),bath=bathroomModel(s);
 const bx=bath.leftOuter-bath.dx,by=bath.frontOuter-bath.dy;
 const candidates=roof.rafters.slice(1).map((v,i)=>(roof.rafters[i]+v)/2-s.studDepth).filter(x=>x>100&&x<s.internalLength-100);
 const main:{id:string,point:number[]}[]=[];
 [600,1800,3000,4200].forEach((target,i)=>{
  const x=candidates.reduce((a,v)=>Math.abs(v-target)<Math.abs(a-target)?v:a,candidates[0]);
  main.push({id:`M${i*2+1}`,point:[x,x>bx?by+250:750]},{id:`M${i*2+2}`,point:[x,s.internalDepth-750]});
 });
 const feature=roof.ties.map((x,i)=>({id:`T${i+1}`,point:[x-s.studDepth,s.internalDepth-220]}));
 const mainOrder=['M8','M6','M4','M2','M1','M3','M5','M7'];
 return {main,feature,mainOrder,featureOrder:[...feature].reverse().map(p=>p.id).concat('G1')};
}

export type FramingPort={id:string,wall:WallId,x:number,z:number,type:Run['type'],path:number[][],plan:number[],group:string};
export type RoofRun={id:string,type:Run['type'],points:number[][],from:string,to?:string};
/** Both drawings use this register, so every wall break has exactly one roof continuation. */
export function framingConnections(s:Settings){
 const f=baseWiringWall(s,'front'),rr=baseWiringWall(s,'right'),back=baseWiringWall(s,'rear'),g=leftGableFeature(s);
 const cu=consumerUnit(s),D=s.internalDepth,L=s.internalLength,t=s.studDepth;
 const top=f.cfg.wallHeight+f.cfg.frameBase-f.cfg.ffl,stub=top+60;
 const ports:FramingPort[]=[],roofRuns:RoofRun[]=[];
 const point=(m:ReturnType<typeof baseWiringWall>,id:string)=>m.points.find(p=>p.id===id)!;
 const add=(id:string,wall:WallId,x:number,from:number[][],type:Run['type'],group:string)=>{
  const cfg=configForWall(s,wall);
  const z=wall==='left'||wall==='right'?cfg.ridgeBottom+cfg.frameBase-cfg.ffl-Math.abs(x-cfg.width/2)*Math.tan(s.roofPitch*Math.PI/180)+s.studDepth/(2*Math.cos(s.roofPitch*Math.PI/180)):stub;
  const plan=wall==='front'?[L+t-x,D]:wall==='rear'?[x-t,0]:wall==='left'?[0,D-x]:[L,x];
  const path=[...from];if(path.at(-1)![0]!==x)path.push([x,path.at(-1)![1]]);path.push([x,z]);
  const p={id,wall,x,z,type,group,path,plan};ports.push(p);return p;
 };
 const sw=point(f,'SW-M'),door=f.cfg.computedOpenings.find(o=>o.type==='door')!,dl=f.w-door.x-door.width,dr=f.w-door.x;
 add('RD','front',dl-85,[[300,500],[dl-85,500]],'ring','DOOR');
 add('RE','front',dr+85,[[f.w-300,500],[dr+85,500]],'ring','DOOR');
 // Separate projected risers in the front-right bay; outlets remain at the previously agreed positions.
 add('LC','front',cu.x-85,[[cu.x-85,cu.top]],'light','CU/NET');
 add('AC','front',cu.x-15,[[cu.x-15,cu.top]],'aircon','CU/NET');
 add('SP','front',cu.x-115,[[cu.x-115,cu.top]],'light','CU/NET');
 for(let i=0;i<4;i++)add(`SW${i}`,'front',sw.x+(i-1.5)*30,[[sw.x,sw.z]],'light','SW-M');
 for(const [id,offset] of [['X1A',-20],['X1B',20],['X2',0]] as const){const a=point(f,id==='X2'?'EXT-L2':'EXT-L1');add(id,'front',a.x+offset,[[a.x,a.z]],'light',id==='X2'?'LANTERN 2':'LANTERN 1');}
 const net=point(f,'NET');
 for(const [id,dx] of [['N1A',20],['N3A',55],['N4A',90]] as const)add(id,'front',cu.x+dx,[[net.x,net.z]],'data','CU/NET');
 const nl=point(f,'N3'),drop=dr+110;
 add('N3B','front',drop,[[nl.x,nl.z],[nl.x,535],[drop,535]],'data','DOOR DATA');
 const ac=point(rr,'AC');add('AD','right',ac.x+80,[[ac.x,ac.z]],'aircon','AIRCON');
 const ap=point(rr,'AP');add('N1B','right',g.x-145,[[ap.x,ap.z]],'data','AP');
 const rg=point(rr,'G2');add('FG2','right',rg.x+125,[[rg.x,rg.z]],'light','G2');
 add('FG','left',g.x-125,[[g.x,g.z]],'light','G1');
 const get=(id:string)=>ports.find(p=>p.id===id)!;
 // Roof lanes lie INSIDE the walls, crossing rafters at engineered bores. Offsets are schematic, not hole set-out or segregation distances.
 const lane=(n:number)=>600+n*45,front=(n:number)=>D-lane(n),rear=(n:number)=>lane(n),right=(n:number)=>L-Math.max(40,70+n*15),left=(n:number)=>Math.max(40,70+n*15);
 const roofLane=(p:FramingPort,n:number):number[]=>p.wall==='front'?[p.plan[0],front(n)]:p.wall==='rear'?[p.plan[0],rear(n)]:p.wall==='right'?[right(n),p.plan[1]]:[left(n),p.plan[1]];
 const link=(id:string,a:string,b:string,n:number,type:Run['type'])=>{
  const p=get(a),q=get(b),aa=roofLane(p,n),bb=roofLane(q,n);let middle:number[][]=[];
  if(p.wall===q.wall)middle=p.wall==='front'||p.wall==='rear'?[[bb[0],aa[1]]]:[[aa[0],bb[1]]];
  else if(p.wall==='front'&&q.wall==='right')middle=[[bb[0],aa[1]]];
  else if(p.wall==='right'&&q.wall==='front')middle=[[aa[0],bb[1]]];
  else if(p.wall==='front'&&q.wall==='rear')middle=[[right(n),aa[1]],[right(n),bb[1]]];
  else if(p.wall==='front'&&q.wall==='left')middle=[[bb[0],aa[1]]];
  roofRuns.push({id,from:a,to:b,type,points:[p.plan,aa,...middle,bb,q.plan]});
 };
 link('R door bypass','RD','RE',-10,'ring');link('Lighting permanent','LC','SW0',1,'light');
link('Aircon radial','AC','AD',7,'aircon');
 link('Lantern feed','SW3','X1A',8,'light');link('Lantern loop','X1B','X2',9,'light');
 link('N1 AP','N1A','N1B',-8,'data');
 // N3 follows the ring over the door, then drops beside its far jamb and follows the low ring to N3.
 const np=get('N3A'),nq=get('N3B'),nrY=front(-10)-45;
 roofRuns.push({id:'N3 socket',from:'N3A',to:'N3B',type:'data',points:[np.plan,[np.plan[0],nrY],[nq.plan[0],nrY],nq.plan]});
 // Only the short front-right exit reaches the retained future camera.
 const cam=get('N4A'),camLane=[cam.plan[0],D-60];
 roofRuns.push({id:'N4 CAM',from:'N4A',type:'data',points:[cam.plan,camLane,[L-30,camLane[1]],[L-30,D],[L,D]]});
 return {ports,roofRuns,top,stub,get,lane,front,rear,left,right};
}

export function wiringWall(s:Settings,id:WallId){
 const m=baseWiringWall(s,id),connections=framingConnections(s);
 // Keep local entries, supplies and the 500mm socket ring. All long high-level routes are on the roof drawing.
 const runs=[...m.runs];
 for(const p of connections.ports.filter(p=>p.wall===id))runs.push({id:p.id,points:p.path,type:p.type});
 const bath=bathroomWiring(s);
 if(id==='front')runs.push({id:'BL: CU / right wall',type:'light',points:[[m.cu.x-35,m.cu.bottom],[m.cu.x-35,bath.low],[0,bath.low]]});
 if(id==='right')runs.push({id:'BL: right wall / partition',type:'light',points:[[m.w,bath.low],[bath.partitionY,bath.low]]});
 if(id==='front')runs.push({id:'H: CU / right channel',type:'heater',points:[[m.cu.x+60,m.cu.bottom],[m.cu.x+60,470],[0,470]]});
 if(id==='right')runs.push({id:'H: front / rear channel',type:'heater',points:[[m.w,470],[0,470]]});
 if(id==='rear'){const wh=m.points.find(p=>p.id==='WH-ISO')!;runs.push({id:'H: channel / WH-ISO',type:'heater',points:[[m.w,470],[wh.x,470],[wh.x,wh.z]]});}
 const points=m.points;
 return {...m,points,runs,ports:connections.ports.filter(p=>p.wall===id),stub:connections.stub};
}

export function ceilingLighting(s:Settings){
 const b=baseCeilingLighting(s),c=framingConnections(s);
 const main=b.main,feature=b.feature,runs:{from:string,to:string,group:'main'|'feature',points:number[][]}[]=[];
 const mp=c.get('SW1'),fp=c.get('SW2');
 let last={id:'SW1',point:mp.plan};
 b.mainOrder.forEach((id,i)=>{
  const next=main.find(p=>p.id===id)!,front=i<4;
  let pts:number[][];
  if(i===0)pts=[last.point,[last.point[0],c.front(-2)],[next.point[0],c.front(-2)],next.point];
  else if(last.point[0]===next.point[0])pts=[last.point,[last.point[0]-25,last.point[1]],[last.point[0]-25,next.point[1]],next.point];
  else{const exit=last.point[0]+(front?-25:25),y=front?c.front(-2):c.rear(-2);pts=[last.point,[exit,last.point[1]],[exit,y],[next.point[0],y],next.point];}
  runs.push({from:last.id,to:id,group:'main',points:pts});last=next;
 });
 last={id:'SW2',point:fp.plan};
 [...feature].reverse().forEach((next,i)=>{
  const yy=c.front(-1);
  const pts=i===0?[last.point,[last.point[0],yy],[next.point[0],yy],next.point]:[last.point,[last.point[0]-25,last.point[1]],[last.point[0]-25,yy],[next.point[0],yy],next.point];
  runs.push({from:last.id,to:next.id,group:'feature',points:pts});last=next;
 });
 const fg=c.get('FG'),fg2=c.get('FG2'),first=feature.at(-1)!;
 const rightGableContinuation={from:'T3',to:'G2',points:[first.point,[first.point[0]+25,first.point[1]],[first.point[0]+25,c.front(-1)],[c.right(-1),c.front(-1)],[c.right(-1),fg2.plan[1]],fg2.plan]};
 const gableContinuation={from:'T1',to:'G1',points:[last.point,[last.point[0]-25,last.point[1]],[last.point[0]-25,c.front(-1)],[c.left(-1),c.front(-1)],[c.left(-1),fg.plan[1]],fg.plan]};
 const smoke={id:'SM',point:[2200,s.internalDepth/2-250]},sp=c.get('SP');
 const smokeRun={from:'SP',to:'SM',points:[sp.plan,[sp.plan[0],c.front(2)],[smoke.point[0],c.front(2)],smoke.point]};
 return {...b,runs,gableContinuation,rightGableContinuation,smoke,smokeRun,ports:c.ports,roofRuns:c.roofRuns,connections:c};
}

/** Bathroom feed follows the low right-wall channel then rises in the attached short partition. */
export function bathroomWiring(s:Settings){
 const b=bathroomModel(s),bx=b.leftOuter-b.dx,by=b.frontOuter-b.dy,partitionY=by-b.partition/2,low=525,riseX=s.internalLength-100;
 const pull={id:'SW-B',point:[bx+220,by-180]},light={id:'B1',point:[bx+(s.internalLength-bx)/2,by/2]};
 return {bx,by,partitionY,low,riseX,pull,light,
  feed:{from:'BL',to:'SW-B',points:[[s.internalLength,partitionY],[riseX,partitionY],[riseX,pull.point[1]],pull.point]},
  rise:[[s.internalLength-bx,low],[riseX-bx,low],[riseX-bx,2160],[220,2160],[220,2100]],
  switched:{from:'SW-B',to:'B1',points:[pull.point,[pull.point[0],light.point[1]],light.point]}};
}

/** The prescriptive joist rules do not approve holes in rafters (LABC TT 7.1). */
export function rafterDrillingAssessment(s:Settings){
 const pitch=s.roofPitch*Math.PI/180,depth=s.studDepth;
 // Ordered 220mm screws at 67 degrees to roof: 25 batten + 100 PIR + 11 deck.
 const battenScrewEmbed=220*Math.sin(67*Math.PI/180)-(25+100+11);
 return {depth,centre:depth/2,exampleBore:20,exampleCover:(depth-20)/2,battenScrewEmbed,approvedZones:[] as number[][],pitch};
}
