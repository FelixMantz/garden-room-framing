import { buildModel, type Settings, type WallId } from '../framing';
import { rafterDimensions } from '../rafter-dimensions';
import { bathroomModel } from '../bathroom';
import { roofModel } from '../roof';
import { wiringWall, ceilingLighting, bathroomWiring, rafterDrillingAssessment, WIRING, type Run } from '../wiring';
import { canvas, wrapText } from './layout';
type C=ReturnType<typeof canvas>;
const footer=(c:C,p:number,t:number)=>c.text(`Garden room framing set | wiring proposal | page ${p} of ${t}`,148.5,205,6.4,false,'center');
function text(c:C,v:string,x:number,y:number,w=85,size=7){const lines=wrapText(v,w,size);lines.forEach((l,i)=>c.text(l,x,y+i*3.6,size));return lines.length*3.6;}
function wire(c:C,pts:number[][],type:Run['type']='ring'){for(let i=1;i<pts.length;i++)c.line(...[...pts[i-1],...pts[i]] as [number,number,number,number],[0,0,0],type==='ring'?.65:.4,type==='data'?[2,1]:null);}
function box(c:C,id:string,x:number,y:number,kind='socket'){
 const w=kind==='cu'?10:kind==='network'?8:kind==='socket'?8:kind==='feature'?4:Math.max(6,id.length*.95),h=kind==='cu'?11:5;
 c.rect(x-w/2,y-h/2,w,h,[255,255,255],[0,0,0],.3);c.text(id,x,y+.7,kind==='network'?5:5.3,true,'center');
 if(kind==='switch3')for(const dx of [-2,0,2])c.line(x+dx,y-1.8,x+dx,y-1);
 if(kind==='socket'){c.line(x-1,y-1.7,x-1,y-.7);c.line(x+1,y-1.7,x+1,y-.7);}
}
function key(c:C,items:string[],y=176){
 c.text('KEY',12,y-5,7.2,true);
 items.forEach((item,i)=>c.text(item,12+(i%3)*92,y+Math.floor(i/3)*5,6.8));
}
function cableNotes(c:C,types:Set<string>,y=33){
 const notes:string[]=[];
 if(types.has('ring'))notes.push('R / RD-RE: 4mm2 T&E, B32 ring; Iz >=20.3A (>=20A per leg).');
 if(types.has('light'))notes.push('All lighting / BL / SW / SP / FG / X / M / T: 1.5mm2 T&E, B6; Iz >=6.6A.');
 if(types.has('heater'))notes.push('H channel: 10mm2 T&E, B32, heater 26A; Iz >=35.3A. Appliance lead: supplied flex.');
 if(types.has('aircon'))notes.push('AC-AD: 2.5mm2 T&E internal radial, 15A manufacturer basis; Iz 19.7A, no grouping.');
 if(types.has('spur'))notes.push('F-L/F-R ring links: 4mm2; after 13A FCU / S1-PSU spur: 2.5mm2; Iz >=15.8A.');
 notes.push('Basis: 35C; wall cables against plasterboard (method 102), clear of PIR; ring + heater: max 2 grouped loaded circuits; keep lighting lightly loaded.');
 notes.push('mm2 = line/neutral area, not diameter. CPC: 1.5=1; 2.5/4=1.5; 10=4mm2. No long insulation burial.');
 notes.push('Approx. flat W x H (mm): 1.5=8.6x4.7; 2.5=9.9x5.3; 4=11.4x6.1; 10=16.8x8.4. Exterior tails: suitable flex, not exposed T&E.');
 notes.push('Thermal sizing only: 55m submain at 50A exceeds 3% lighting voltage drop before final circuits; see master-spec calculation.');
 notes.forEach((v,i)=>c.text(v,12,y+i*3,6));
}
export function drawWiringWall(s:Settings,id:WallId,p:number,t:number,c=canvas()){
 const m=wiringWall(s,id),cfg=m.cfg;
 c.text(`Wiring - ${cfg.name.toLowerCase()} / internal elevation`,12,12,14,true);
 c.text('Looking from inside: framing is mirrored from the exterior drawings.',12,20,7.5);
 cableNotes(c,new Set(m.runs.map(r=>r.type)),33);
 const highest=Math.max(cfg.maxY+cfg.frameBase-cfg.ffl,m.stub,...m.ports.map(p=>p.z));
 const sc=Math.min(255/m.w,84/highest),ox=(297-m.w*sc)/2,base=154;
 const X=(v:number)=>ox+v*sc,Z=(v:number)=>base-v*sc;
 const H=(v:number)=>v+cfg.frameBase-cfg.ffl;
 // True geometry, mirrored into the internal view; unhatched fine outlines keep wiring legible.
 for(const b of buildModel(cfg)){
  if(b.shape==='slope'){c.polygon(rafterDimensions(b).cutPolygon.map(([a,z])=>[X(m.w-a),Z(H(z))]),undefined,undefined,.1);continue;}
  const x=b.x||0,y=b.y||0,w=b.w||0,h=b.h||0;
  if(b.topLeft!==undefined&&b.topRight!==undefined)c.polygon([[X(m.w-x),Z(H(y))],[X(m.w-x-w),Z(H(y))],[X(m.w-x-w),Z(H(y+b.topRight))],[X(m.w-x),Z(H(y+b.topLeft))]],undefined,undefined,.08);
  else c.rect(X(m.w-x-w),Z(H(y+h)),w*sc,h*sc,undefined,undefined,.08);
 }
 for(const o of cfg.computedOpenings){c.rect(X(m.w-o.x-o.width),Z(H(o.sill+o.height)),o.width*sc,o.height*sc,undefined,undefined,.25);c.text(o.type.toUpperCase(),X(m.w-o.x-o.width/2),Z(H(o.sill+o.height/2)),7,true,'center');}
 c.line(X(0),base,X(m.w),base);c.text('FFL 0',X(0),base+3,6.5);
 const ends={front:['FRONT RIGHT','FRONT LEFT'],rear:['REAR LEFT','REAR RIGHT'],left:['FRONT LEFT','REAR LEFT'],right:['REAR RIGHT','FRONT RIGHT']}[id];
 c.text(ends[0],X(0),base+7,6.5,true);c.text(ends[1],X(m.w),base+7,6.5,true,'right');
 for(const r of m.runs)wire(c,r.points.map(([x,z])=>[X(x),Z(z)]),r.type);
 if(id==='right'){const bath=bathroomWiring(s);c.text('BL > PARTITION',X(bath.partitionY)+1,Z(bath.low)-2,5.7,true);}
 for(const a of m.points){
  if(a.kind==='cu'){c.rect(X(a.x-m.cu.width/2),Z(m.cu.top),m.cu.width*sc,m.cu.height*sc,undefined,undefined,.4);c.text('CU',X(a.x),Z(a.z)+.7,6,true,'center');}
  else if(a.kind==='network'){c.rect(X(a.x-53.5),Z(a.z+35),107*sc,70*sc,undefined,undefined,.3);c.text('NET',X(a.x),Z(a.z)+.6,5,true,'center');}
  else box(c,a.id,X(a.x),Z(a.z),a.kind);
 }
 const groups=new Map<string,typeof m.ports>();
 for(const p of m.ports)groups.set(p.group,[...(groups.get(p.group)||[]),p]);
 let gi=0;for(const [group,ps] of groups){
  const xx=ps.reduce((a,p)=>a+p.x,0)/ps.length,zz=Math.max(...ps.map(p=>p.z));
  const yy=Z(zz)-2-(gi++%2)*4.5;
  for(const p of ps)c.line(X(p.x)-.5,Z(p.z),X(p.x)+.5,Z(p.z),undefined,.25);
  const title=ps.map(p=>p.id).join('/');
  c.text(title,X(xx),yy,5.5,true,'center');
 }
 c.text(m.runs.some(r=>r.type==='data')?'SOLID: electricity    DASHED: network cables / house data':'SOLID: electricity',12,27,7,true);
 const positions=m.points.filter(a=>!['external','data','heater','junction'].includes(a.kind)).map(a=>`${a.id}: ${Math.round(a.x)} / +${a.z}`).join('   |   ');
 text(c,positions,12,166,273,6.1);
 c.text('Set-out above: horizontal distance from LEFT end of this view / height above FFL. OUT symbols project exterior fittings.',12,171,6.2);
 const keys:Record<WallId,string[]>={
 front:['CU = consumer unit; NET = Flex Mini','SW-M = 3-gang: main / feature / outside','S1/S2 = mains; N2/N3 = single RJ45s','RD / RE = ring door-bypass risers','LC / AC = lighting / aircon roof feeds','SW0 = feed; SW1-SW3 = switched groups','X1A/B = lantern 1 in/out; X2 = lantern 2','N1A / N3A = AP / left socket feeds','N4A = future front-right camera','N3B = drop beside RE, then low to N3','Incoming SWA/data turn from RIGHT wall','R/L/H/A = ring / lights / heater / aircon','FFL = finished floor; heights in mm','Solid = mains; dashed = data','SP = CU smoke feed; BL = bathroom feed'],
 rear:['S5 / S6 = double mains sockets','WH / WH-ISO = heater / isolator','H = heater feed in low cable channel','R = ring at +500 throughout bathroom','FFL = finished floor level','H rises from +470 to WH-ISO'],
 left:['S3 / S4 = double mains sockets','F-L = fused spur + Shelly','OUT-L1 / L2 = outside single sockets','G1 = centred gable feature-light end','FG = feature loop from T1 via roof','R = socket ring; FFL = finished floor'],
 right:['S7/S8 = mains; F-R = fused spur','OUT-R1/R2 = outside single sockets','AD = AC supply exits behind indoor unit','AC = indoor head; outdoor unit supplied','N1B / AP = U7 Lite data connection','Outdoor AC isolation; no indoor switch','N4 camera is on the roof plan','Solid = mains; dashed = data','BL = lighting via socket boxes to partition','G2 / FG2 = right-gable feature branch','H = +470 channel; separate B32 radial','SWA/DATA-IN: 200mm from FRONT outer brick','SWA +250 / data +350 FFL; separate entries']};
 key(c,keys[id].filter(item=>m.runs.some(r=>r.type==='data')||!item.toLowerCase().includes('dashed')),180);
 footer(c,p,t);return c.stream();
}
function plan(c:C,s:Settings,title:string){
 const r=roofModel(s),sc=.030,x=(297-s.internalLength*.030)/2,y=63,X=(v:number)=>x+v*sc,Y=(v:number)=>y+v*sc;
 c.text(title,12,12,14,true);
 c.text('Reflected ceiling plan - viewed looking UP. Front at bottom; right gable at right. Cable routes inside the building.',12,21,7);
 c.rect(x,y,s.internalLength*sc,s.internalDepth*sc,undefined,undefined,.4);
 for(const rr of r.rafters){const xx=rr-s.studDepth;if(xx>0&&xx<s.internalLength)c.rect(X(xx-s.studFace/2),Y(0),s.studFace*sc,s.internalDepth*sc,undefined,undefined,.08);}
 c.line(X(0),Y(s.internalDepth/2),X(s.internalLength),Y(s.internalDepth/2),undefined,.15,[1,1]);
 for(const tt of r.ties){const xx=tt-s.studDepth;c.rect(X(xx-r.width/2),Y(0),r.width*sc,s.internalDepth*sc,undefined,undefined,.15);}
 c.text('REAR / SOUTH',X(s.internalLength),y-3,7,true,'right');c.text('FRONT / NORTH - ENTRANCE',X(s.internalLength/2),Y(s.internalDepth)+6,7,true,'center');
 c.text('LEFT GABLE',x-3,Y(s.internalDepth/2),6,true,'right');c.text('RIGHT GABLE',X(s.internalLength)+3,Y(s.internalDepth/2),6,true);
 const b=bathroomModel(s),bx=b.leftOuter-b.dx,by=b.frontOuter-b.dy;c.rect(X(bx),Y(0),(s.internalLength-bx)*sc,by*sc,undefined,undefined,.35);
 c.text('BATHROOM',X(bx+550),Y(350),6,true);return {r,sc,X,Y,b,bx,by};
}
export function drawWiringCeiling(s:Settings,p:number,t:number,c=canvas()){
 const {X,Y,bx,by}=plan(c,s,'Wiring - ceiling and framing cable routes');
 const lighting=ceilingLighting(s),conn=lighting.connections,D=s.internalDepth,L=s.internalLength;
 // Dedicated roof transport, one line per cable, including the ring's door bypass.
 for(const run of lighting.roofRuns)wire(c,run.points.map(([a,b])=>[X(a),Y(b)]),run.type);
 for(const run of lighting.runs)wire(c,run.points.map(([a,b])=>[X(a),Y(b)]),'light');
 wire(c,lighting.gableContinuation.points.map(([a,b])=>[X(a),Y(b)]),'light');
 wire(c,lighting.rightGableContinuation.points.map(([a,b])=>[X(a),Y(b)]),'light');
 [...lighting.main,...lighting.feature].forEach(p=>box(c,p.id,X(p.point[0]),Y(p.point[1]),'light'));
 wire(c,lighting.smokeRun.points.map(([a,b])=>[X(a),Y(b)]),'light');box(c,'SM',X(lighting.smoke.point[0]),Y(lighting.smoke.point[1]),'light');
 for(const run of lighting.roofRuns.filter(r=>r.id.includes(' CAM'))){const end=run.points.at(-1)!;box(c,run.id,X(end[0]),Y(end[1]),'data');}
 // Grouped port labels match the break labels on each internal wall elevation.
 const groups=new Map<string,typeof conn.ports>();for(const q of conn.ports){const id=q.wall+':'+q.group;groups.set(id,[...(groups.get(id)||[]),q]);}
 for(const ps of groups.values()){
  const q=ps[0],xx=ps.reduce((a,p)=>a+p.plan[0],0)/ps.length,yy=ps.reduce((a,p)=>a+p.plan[1],0)/ps.length;
  const label=q.group==='CU/NET'?'CU/NET':ps.map(p=>p.id).join('/');
  for(const p of ps)c.rect(X(p.plan[0])-.3,Y(p.plan[1])-.3,.6,.6,undefined,undefined,.15);
  if(q.wall==='front'){const shift=q.group.includes('LANTERN')?170:55;c.text(label,X(xx),Y(D-shift),5.3,true,'center');}
  else if(q.wall==='right')c.text(label,X(L)-1.5,Y(yy)-1.5,5.3,true,'right');
  else if(q.wall==='rear')c.text(label,X(xx),Y(0)+4,5.3,true,'center');
  else c.text(label,X(0)+2,Y(yy)-1.5,5.3,true);
 }
 key(c,['RD-RE = ring door bypass in roof','LC-SW0 = lighting feed to switch bank','SW1/SW2/SW3 = main/feature/outside','M1-M8 = parallel main-light loop','T3 > T2 > T1 > G1; T3 > G2 branch','X1A/B > X2 = lantern loop','AC-AD = AC; heater stays in wall channel','N1A-N1B = AP; N3A-N3B = socket','N4A = future front-right camera','SP-SM = permanent smoke feed','Solid = mains; dashed = network','Bathroom ceiling wiring: separate page'],166);
 c.text('SW-M: one CU feed IN; three direct feeds OUT to main / feature / outside. Lights connect in parallel.',12,28,6.8);
 cableNotes(c,new Set(['ring','light','aircon']),33);
 const a=rafterDrillingAssessment(s);
 c.text(`RAFTER DRILLING: ${a.depth} x ${s.studFace} C24. No prescriptive permitted bore zone; LABC requires calculations for rafter holes.`,12,185,6.7,true);
 c.text('Do not apply floor-joist drilling rules. No rafter holes are authorised by this plan; keep clear of birdsmouths, ridge and tie fixings.',12,189,6.5);
 c.text(`Depth centre = ${a.centre.toFixed(1)}mm; a 20mm bore leaves ${a.exampleCover.toFixed(1)}mm timber to each face. Provide suitable fixing-penetration protection.`,12,193,6.5);
 c.text(`220mm batten screws at 67 degrees embed about ${a.battenScrewEmbed.toFixed(0)}mm from the upper face, into the central depth: avoid their full paths.`,12,197,6.5);
 c.text('Sources: LABC TT 7.1 (notches/holes in solid timber); NHBC TG 8.1/27 (cables in walls and sloping ceilings).',12,201,6.2);
 footer(c,p,t);return c.stream();
}
export function drawWiringBathroom(s:Settings,p:number,t:number,c=canvas()){
 const b=bathroomModel(s),bw=bathroomWiring(s);c.text('Wiring - bathroom partitions and separate dropped ceiling',12,12,14,true);
 c.text('Cloakroom only: WC and basin. Provisional ceiling underside +2100 FFL; confirm door-head and ceiling supports before construction.',12,22,7.5);
 cableNotes(c,new Set(['light']),27);
 const sc=.039,base=145,x=25,X=(v:number)=>x+v*sc,Z=(v:number)=>base-v*sc;
 // Long partition: opening is positioned from the real bathroom model.
 const width=b.sideLength+b.partition,doorStart=b.doorStart-b.rearStud,doorEnd=b.doorEnd-b.rearStud;
 c.text('LONG PARTITION / PULL-CORD PROJECTION',x,43,8,true);
 c.rect(X(0),Z(2220),width*sc,2220*sc,undefined,undefined,.2);
 for(const a of [0,width-47])c.rect(X(a),Z(2220),47*sc,2220*sc,undefined,undefined,.12);
 c.rect(X(doorStart),Z(b.roughHead-b.ffl),(doorEnd-doorStart)*sc,(b.roughHead-b.ffl)*sc,undefined,undefined,.25);
 const pullX=X(width-180),pullY=Z(WIRING.bathCeiling);
 box(c,'SW-B',pullX,pullY,'pull');c.line(pullX,pullY+2.5,pullX,Z(1400),undefined,.18,[.5,.7]);c.rect(pullX-.6,Z(1400),1.2,1.8,undefined,undefined,.15);
 c.text('DOOR',X((doorStart+doorEnd)/2),Z(1000),7,true,'center');
 text(c,'SW-B is a ceiling-mounted pull-cord switch INSIDE the bathroom, close to the entrance and clear of the door swing. The elevation projects its position; the fine dotted line is the mechanical cord, not a cable. No switch wiring drops into the partition.',12,155,90,7);
 // Short partition and drop-ceiling section, with unobstructed solid wall for a fall-back switch location.
 const xx=125,ww=b.frontLength*sc;c.text('SHORT PARTITION / SECTION',xx,43,7.5,true);
 c.rect(xx,Z(2220),ww,2220*sc,undefined,undefined,.2);for(let a=0;a<b.frontLength;a+=400)c.rect(xx+a*sc,Z(2220),47*sc,2220*sc,undefined,undefined,.1);
 c.line(xx,Z(2100),xx+ww,Z(2100),undefined,.65);
 const px=xx+220*sc,lx=xx+ww/2;
 wire(c,bw.rise.map(([a,z])=>[xx+a*sc,Z(z)]),'light');c.text('BL +525',xx+ww+2,Z(525)+1,6,true);
 wire(c,[[px+25*sc,Z(2100)],[px+25*sc,Z(2185)],[lx,Z(2185)],[lx,Z(2100)]],'light');
 box(c,'SW-B',px,Z(2100),'pull');box(c,'B1',lx,Z(2100),'light');
 c.line(px,Z(2100)+2.5,px,Z(1400),undefined,.18,[.5,.7]);c.rect(px-.6,Z(1400),1.2,1.8,undefined,undefined,.15);
 text(c,'Flat MR-plasterboard ceiling over the bathroom only; its timber support design remains to be set. One separate light B1 at the centre. Keep its connections accessible via the fitting or a hatch; do not bury non-maintenance-free junctions.',115,155,90,7);
 const cs=.04,cx=214,cy=49,CX=(v:number)=>cx+(v-bw.bx)*cs,CY=(v:number)=>cy+v*cs;
 c.text('BATHROOM / CEILING PLAN',214,43,7.5,true);
 c.rect(cx,cy,(s.internalLength-bw.bx)*cs,bw.by*cs,undefined,undefined,.3);
 const [pcx,pcy]=bw.pull.point,[lxPlan,lyPlan]=bw.light.point;
 wire(c,bw.feed.points.map(([a,b])=>[CX(a),CY(b)]),'light');
 c.text('BL RISE',CX(bw.riseX)-2,CY(bw.partitionY)-2,6,true,'right');
 wire(c,bw.switched.points.map(([a,b])=>[CX(a),CY(b)]),'light');
 box(c,'SW-B',CX(pcx),CY(pcy),'pull');box(c,'B1',CX(lxPlan),CY(lyPlan),'light');
 c.text('REAR',cx,cy-2,6,true);c.text('ENTRANCE SIDE',cx,cy+bw.by*cs+5,6,true);
 text(c,'BL: permanent feed from the 6A lighting circuit at the CU. Follow the front/right wall socket zone at +525 FFL through the socket backboxes; no connection to the ring. Enter the attached short partition, rise 100mm from the right-wall junction, then run in the bathroom ceiling void to SW-B.',214,100,70,6.7);
 text(c,'B1 has its own pull-cord control. Use continuous T&E on its own 6A, 30mA RCBO; pass through socket backboxes, with no ring live/neutral connection. No roof feed enters at the free-standing door end.',214,147,70,6.7);
 key(c,['SW-B = ceiling pull-cord light switch','B1 = bathroom light, separate control','FFL = finished floor level','MR = moisture-resistant plasterboard','T&E = twin-and-earth cable','Fine dots = mechanical pull cord','VCL = vapour-control layer','WC = toilet'],187);
 footer(c,p,t);return c.stream();
}
