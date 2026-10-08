import { type Settings } from '../framing';
import { bathroomModel } from '../bathroom';
import { canvas, fmt, hTechnical, vTechnical } from './layout';
type C=ReturnType<typeof canvas>;
const black=[0,0,0];
const footer=(c:C,p:number,t:number,title:string)=>c.text(`Garden room framing set | ${title} | page ${p} of ${t}`,148.5,207,6.4,false,'center');
function circle(c:C,x:number,y:number,r:number){const pts=Array.from({length:32},(_,i)=>[x+r*Math.cos(i*Math.PI/16),y+r*Math.sin(i*Math.PI/16)]);c.polygon(pts,[255,255,255],black,.25);}
export function drawFloor(s:Settings,page:number,total:number,c:C=canvas()){
 const b=bathroomModel(s),sc=.043,X=(v:number)=>18+v*sc,Y=(v:number)=>40+v*sc;
 c.text('Flooring - PIR panels and bathroom partition supports',12,11,14,true);
 c.text('Top view | rear wall at top, front wall at bottom | mm | plan datum: rear-left inside brick corner',12,18,7.5);
 c.text('100 mm PIR stock: 2400 x 1200. Hatched strips = 47 x 75 sole plates fixed directly to slab over DPC / DPM.',12,25,7);
 b.panels.forEach(p=>{c.rect(X(p.x),Y(p.y),p.w*sc,p.h*sc,[255,255,255],black,.25);if(p.w<100)c.textVertical(p.id,X(p.x+p.w/2)+.7,Y(p.y+p.h/2),6,true);else {c.text(p.id,X(p.x+p.w/2),Y(p.y+p.h/2),9,true,'center');c.text(`${fmt(p.w)} x ${fmt(p.h)}`,X(p.x+p.w/2),Y(p.y+p.h/2)+5,7,false,'center');}});
 c.rect(X(b.leftOuter),Y(0),75*sc,b.doorStart*sc,'timber',black,.3);
 c.rect(X(b.leftOuter),Y(b.doorEnd),75*sc,(b.frontInner-b.doorEnd)*sc,'timber',black,.3);
 c.rect(X(b.leftOuter),Y(b.frontInner),(s.brickInternalLength-b.leftOuter)*sc,75*sc,'timber',black,.3);
 c.text('BATHROOM',X((b.leftInner+s.brickInternalLength)/2),Y(b.frontInner/2)-11,8,true,'center');
 // Pipe offsets use the OUTSIDE wall frame, not the brick-inside plan datum.
 const frameOutsideRight=b.rightStud+s.studDepth,frameOutsideRear=b.rearStud-s.studDepth;
 for(const [d,rx,ry] of [[50,170,350],[110,200,550]]){const px=X(frameOutsideRight-rx),py=Y(frameOutsideRear+ry);circle(c,px,py,d*sc/2);c.text(`${d}`,px-4,py+1,6,true,'right');}
 c.text('REAR',X(s.brickInternalLength/2),36,8,true,'center');c.text('FRONT / MAIN DOORS',X(s.brickInternalLength/2),Y(s.brickInternalDepth)+7,8,true,'center');
 hTechnical(c,X(0),X(s.brickInternalLength),40,32,`${fmt(s.brickInternalLength)} brick internal`,6.5);
 vTechnical(c,Y(0),Y(s.brickInternalDepth),18,10,`${fmt(s.brickInternalDepth)} brick internal`,6,'left');
 hTechnical(c,X(0),X(b.leftOuter),Y(s.brickInternalDepth),Y(s.brickInternalDepth)+14,`${fmt(b.leftOuter)} to support outer face`,6);
 c.text('PARTITION SUPPORT SECTION',243,34,8,true);
 const sx=266,sy=98,k=.24;
 c.rect(sx-8,sy,36,7,'masonry',black,.25);
 c.line(sx-8,sy,sx+28,sy,black,.35,[2,.7]);
 c.rect(sx,sy-47*k,75*k,47*k,'timber',black,.3);
 c.rect(sx,sy-175*k,75*k,128*k,'timber',black,.2);
 c.rect(sx-3,sy-175*k,3,175*k,'floor',black,.15);
 c.rect(sx+75*k,sy-175*k,3,175*k,'floor',black,.15);
 for(const x of [sx-12,sx+75*k+5.4]){
  c.rect(x,sy-b.floorPir*k,6.6,b.floorPir*k,'floor',black,.2);
  c.rect(x,sy-(b.floorPir+b.deck)*k,6.6,b.deck*k,'floor',black,.2);
  c.rect(x,sy-b.ffl*k,6.6,(b.ffl-b.floorPir-b.deck)*k,[255,255,255],black,.2);
 }
 c.line(sx+9,sy-35*k,sx+9,sy+4,black,.6);
 vTechnical(c,sy-47*k,sy,sx,258,'47 sole',6,'left');
 hTechnical(c,sx,sx+75*k,sy,105,'75',6);
 c.text('Stud starts +47',243,48,6.4,true);
 c.text('Sole anchored into slab',243,113,6.2,true);
 c.text('DPC / DPM below sole',243,118,6.2);
 c.text('P5: 10 mm gap to wall',243,123,6.2);
 c.text('PIR +100 / P5 +122 / FFL +137',243,128,6);
 c.text('SOLE SET-OUT (BRICK DATUM)',243,133,7,true);
 const notes=[`x ${fmt(b.leftOuter)}-${fmt(b.leftInner)} (75 wide)`,`Rear foot y 0-${fmt(b.doorStart)}`,`Front foot y ${fmt(b.doorEnd)}-${fmt(b.frontInner)}`,`Long sole y ${fmt(b.frontInner)}-${fmt(b.frontOuter)}`,`Long sole x ${fmt(b.leftOuter)}-${fmt(b.rightStud)}`,`P10: 75 x ${fmt(b.roughWidth)} doorway PIR`,'No raised bearer / packing.','DPM continuous; seal anchor holes.'];
 notes.forEach((t,i)=>c.text(t,243,141+i*5,6.1,i<4));
 // Locate both divider strips from the brick-inside rear-left corner.
 vTechnical(c,Y(0),Y(b.frontInner),X(b.leftOuter),X(b.leftOuter)-8,`${fmt(b.frontInner)} to long sole`,6,'left');
 hTechnical(c,X(b.leftOuter),X(s.brickInternalLength),Y(s.brickInternalDepth),Y(s.brickInternalDepth)+14,`${fmt(s.brickInternalLength-b.leftOuter)} to right brick`,6);
 c.text('PIR sizes are geometric infill dimensions: measure the slab / supports and allow tight fitting or foam-sealed cuts.',12,190,7);
 c.text('P5 stops at partition: 10 mm movement gaps. Sole anchored to slab; studs start at +47. No P5 trapped beneath wall.',12,196,7);
 c.text('Doorway: continuous PIR + slip layer + uncut P5 + floor finish. No threshold bearer / fixings into floating deck.',12,202,6.7);
 footer(c,page,total,'floor PIR / supports');return c.stream();
}
export function drawBathroomDoor(s:Settings,page:number,total:number,c:C=canvas()){
 const b=bathroomModel(s),t=b.timberThickness,full=b.sideLength+b.partition;
 const a=b.doorStart-b.rearStud,e=b.doorEnd-b.rearStud;
 const leaf=b.leafStart-b.rearStud,liningStart=a+b.fittingGap,liningEnd=e-b.fittingGap;
 const leafBottom=b.ffl+b.undercut,leafTop=leafBottom+b.doorHeight,headBottom=leafTop+b.doorGap,headTop=headBottom+b.doorLining;
 c.text('Bathroom door - full short partition, lining and leaf set-out',12,11,14,true);
 c.text('Rear hinges; opens into main room | all mm | horizontal datum: rear wall inner STUD face; vertical datum: slab',12,18,7.3);
 c.text('FULL WALL ELEVATION - viewed from main room',12,27,8,true);
 const k=.059,x=70,base=184,X=(v:number)=>x+v*k,Z=(v:number)=>base-v*k;
 // Adjacent walls and shared top / sole corner.
 c.rect(X(-95),Z(b.top),95*k,b.top*k,'floor',black,.18);
 c.rect(X(b.sideLength),Z(b.top),75*k,b.top*k,'floor',black,.18);
 c.rect(X(0),Z(b.top),b.sideLength*k,t*k,'timber',black,.25);
 c.rect(X(b.sideLength),Z(b.top),75*k,t*k,'timber',black,.25);
 c.rect(X(0),Z(t),a*k,t*k,'timber',black,.25);
 c.rect(X(e),Z(t),(full-e)*k,t*k,'timber',black,.25);
 for(const y of [0,e])c.rect(X(y),Z(b.roughHead),t*k,b.jambCut*k,'timber',black,.3);
 c.rect(X(0),Z(b.roughHead+t),(b.roughWidth+2*t)*k,t*k,'timber',black,.3);
 for(const y of [0,(b.sideLength-t)/2,e])c.rect(X(y),Z(b.plateBottom),t*k,b.crippleCut*k,'timber',black,.25);
 // Lining, head and closed leaf, all drawn to actual measured positions.
 c.rect(X(liningStart),Z(headBottom),b.doorLining*k,(headBottom-b.ffl)*k,[255,255,255],black,.3);
 c.rect(X(liningEnd-b.doorLining),Z(headBottom),b.doorLining*k,(headBottom-b.ffl)*k,[255,255,255],black,.3);
 c.rect(X(liningStart),Z(headTop),(liningEnd-liningStart)*k,b.doorLining*k,[255,255,255],black,.3);
 c.rect(X(leaf),Z(leafTop),b.door*k,b.doorHeight*k,[255,255,255],black,.3);
 // Six panels are schematic; leaf envelope and frame positions are dimensional.
 for(const [y,h] of [[250,480],[850,630],[1630,220]])for(const u of [80,365])c.rect(X(leaf+u),Z(leafBottom+y+h),240*k,h*k,[255,255,255],black,.15);
 for(const h of [200,990,1780])c.rect(X(leaf)-.6,Z(leafBottom+h),1.2,76*k,[255,255,255],black,.25);
 circle(c,X(leaf+b.door-70),Z(leafBottom+1000),1);
 c.line(55,Z(0),135,Z(0),black,.45);
 c.line(55,Z(b.ffl),137,Z(b.ffl),black,.2,[2,1]);
 c.text('SLAB 0',12,Z(0)+1,7,true);
 c.text(`FFL +${fmt(b.ffl)}`,12,Z(b.ffl)+1,7,true);
 c.textVertical('REAR WALL',X(-50),120,6,true);
 c.textVertical('LONG WALL / SHARED CORNER',X(b.sideLength+50),120,6,true);
 vTechnical(c,Z(b.top),Z(0),X(0),32,`${fmt(b.top)} overall`,6,'left');
 vTechnical(c,Z(b.roughHead),Z(t),X(0),43,`${fmt(b.jambCut)} post cut`,6,'left');
 vTechnical(c,Z(leafTop),Z(leafBottom),X(leaf+b.door),137,'1981 leaf',6);
 hTechnical(c,X(0),X(full),Z(b.top),35,`${fmt(full)} including long-wall corner`,6);
 hTechnical(c,X(a),X(e),Z(t),191,`${fmt(b.roughWidth)} rough opening`,6);
 hTechnical(c,X(leaf),X(leaf+b.door),Z(b.ffl),198,`${b.door} leaf`,6);
 // Leaders to the tightly spaced head components.
 const levels=[['Top plate top',b.top],['Top plate underside',b.plateBottom],['Header top',b.roughHead+t],['Rough head underside',b.roughHead],['Lining head top',headTop],['Lining head underside',headBottom],['Leaf top',leafTop]];
 levels.forEach(([name,z],i)=>{
  const y=42+i*6.2;
  c.line(X(e)+1,Z(Number(z)),147,y,black,.12);
  c.text(`${name} +${fmt(Number(z))}`,149,y+1,6.1,i===3);
 });
 c.text(`Sole top +${fmt(t)} / slab-fixed`,149,90,6.5,true);
 c.text(`Leaf bottom +${fmt(leafBottom)} = FFL +${b.undercut}`,149,96,6.3);
 c.text(`Posts 2 x ${fmt(b.jambCut)}; header ${fmt(b.roughWidth+2*t)}`,149,102,6.3);
 c.text(`Cripples 3 x ${fmt(b.crippleCut)}; top plate ${fmt(b.sideLength)}`,149,108,6.3);
 // Enlarged plan presents every horizontal element in one datum.
 c.text('ENLARGED PLAN / HORIZONTAL ELEMENTS',149,119,8,true);
 const q=.145,px=153,py=136,P=(v:number)=>px+v*q;
 c.rect(P(0),py,full*q,75*q,'floor',black,.2);
 c.rect(P(a),py,b.roughWidth*q,75*q,[255,255,255],black,0);
 c.rect(P(0),py,a*q,75*q,'timber',black,.3);
 c.rect(P(e),py,t*q,75*q,'timber',black,.3);
 for(const u of [liningStart,liningEnd-b.doorLining])c.rect(P(u),py-12.5*q,b.doorLining*q,100*q,[255,255,255],black,.3);
 // Stops sit behind the closed 35 mm leaf and project 12 mm into the opening.
 c.rect(P(liningStart+b.doorLining),py+53*q,12*q,32*q,'timber',black,.2);
 c.rect(P(liningEnd-b.doorLining-12),py+53*q,12*q,32*q,'timber',black,.2);
 c.rect(P(leaf),py+18*q,b.door*q,35*q,[255,255,255],black,.3);
 c.text('rear',P(0),132,6,true);c.text('front / long-wall corner',P(full),132,6,true,'right');
 hTechnical(c,P(a),P(e),py,153,'757 rough: 5 + 27.5 + 3 + 686 + 3 + 27.5 + 5',5.9);
 hTechnical(c,P(liningStart),P(liningEnd),py,160,'747 lining outside',6);
 hTechnical(c,P(leaf),P(leaf+b.door),py+35*q,167,'686 leaf / 692 between jambs',6);
 const coords=[`Post 0-47 | rough 47-${fmt(e)} | front post ${fmt(e)}-${fmt(e+t)}`,`Lining ${fmt(liningStart)}-${fmt(liningEnd)} | leaf ${fmt(leaf)}-${fmt(leaf+b.door)}`,`Finished room faces 12.5-812.5 | long-wall framing ${fmt(b.sideLength)}-${fmt(full)}`,`Leaf centre ${fmt(leaf+b.door/2)}; room centre 412.5; offset +${fmt(b.centreOffset)}`];
 coords.forEach((v,i)=>c.text(v,149,175+i*5,6.3,i===0));
 c.text('Plan includes 12 x 32 stops; leaf thickness 35; lining depth 100.',149,195,6.1);
 c.text('Door: Wickes 200612 (1981 x 686 x 35). Lining: 200351 (27.5 x 108); rip depth to finished wall, nominal 100; stops 12 x 32.',12,202,6.3);
 footer(c,page,total,'bathroom door - full wall');return c.stream();
}
export function drawBathroom(s:Settings,page:number,total:number,c:C=canvas()){
 const b=bathroomModel(s),sc=.065,X=(v:number)=>65+(v-b.leftOuter)*sc,Y=(v:number)=>38+(v-b.rearStud)*sc;
 c.text('Bathroom - internal divider wall framing and fixture set-out',12,11,14,true);
 c.text('Rear-right corner | 1500 x 800 finished clear | 75 mm timber depth + 12.5 mm plasterboard each side',12,18,7.5);
 c.rect(X(b.leftOuter),Y(b.rearStud),75*sc,b.sideLength*sc,'timber',black,.3);
 c.rect(X(b.leftOuter),Y(b.frontInner),b.frontLength*sc,75*sc,'timber',black,.3);
 c.rect(X(b.leftInner),Y(b.rearStud),12.5*sc,b.sideLength*sc,'floor',black,.15);
 c.rect(X(b.leftOuter-12.5),Y(b.rearStud),12.5*sc,(b.sideLength+75)*sc,'floor',black,.15);
 c.rect(X(b.leftInner),Y(b.frontFinish),(b.rightStud-b.leftInner)*sc,12.5*sc,'floor',black,.15);
 c.rect(X(b.leftOuter),Y(b.frontOuter),b.frontLength*sc,12.5*sc,'floor',black,.15);
 c.line(X(b.leftOuter),Y(b.rearFinish),X(b.rightFinish),Y(b.rearFinish),black,.4);c.line(X(b.rightFinish),Y(b.rearFinish),X(b.rightFinish),Y(b.frontOuter+12.5),black,.4);
 // Leaf and lining derive from the selected door assembly.
 const hinge=b.leafStart;
 c.rect(X(b.leftOuter-13),Y(b.doorStart),101*sc,b.roughWidth*sc,[255,255,255],black,0);
 c.line(X(b.leftOuter),Y(hinge),X(b.leftOuter-b.door),Y(hinge),black,.4);
 for(let i=0;i<24;i++){const a=i*Math.PI/48,z=(i+1)*Math.PI/48;c.line(X(b.leftOuter-b.door*Math.cos(a)),Y(hinge+b.door*Math.sin(a)),X(b.leftOuter-b.door*Math.cos(z)),Y(hinge+b.door*Math.sin(z)),black,.2);}
 c.text('686 door',12,75,7,true);c.text('opens out',12,80,6.5);
 c.rect(X(b.leftFinish+b.basinLeft),Y(b.rearFinish),500*sc,300*sc,[255,255,255],black,.3);c.text('BASIN 500 x 300',X(b.leftFinish+b.basinLeft+250),Y(b.rearFinish+160),7,true,'center');
 c.rect(X(b.rightFinish-600),Y(b.rearFinish+235),600*sc,400*sc,[255,255,255],black,.3);c.text('WC 600 x 400',X(b.rightFinish-300),Y(b.rearFinish+410),7,true,'center');
 hTechnical(c,X(b.leftFinish),X(b.rightFinish),Y(b.frontFinish),114,'1500 finished clear',6.5);
 vTechnical(c,Y(b.rearFinish),Y(b.frontFinish),X(b.rightFinish),174,'800 finished clear',6);
 hTechnical(c,X(b.leftFinish+b.basinLeft),X(b.leftFinish+b.basinLeft+500),Y(b.rearFinish),26,'500 basin',6);
 vTechnical(c,Y(b.rearFinish),Y(b.rearFinish+300),X(b.leftFinish+b.basinLeft),X(b.leftFinish+b.basinLeft)-5,'300',6,'left');
 vTechnical(c,Y(b.rearFinish),Y(b.rearFinish+235),X(b.rightFinish),181,'235 WC rear',5.7);
 vTechnical(c,Y(b.rearFinish+635),Y(b.frontFinish),X(b.rightFinish),181,'165 WC front',5.7);
 vTechnical(c,Y(b.doorStart),Y(b.doorEnd),X(b.leftOuter),57,'757 rough opening',6,'left');
 hTechnical(c,X(b.leftOuter),X(b.rightStud),Y(b.frontOuter),121,`${fmt(b.frontLength)} framing`,6);
 c.text('REAR WALL',110,33,7,true,'center');
 c.text('FIXTURE / PIPE DATUMS',191,31,9,true);
 const lines=['Basin left gap approx. 105 (working position).','Basin front to finished divider: 500.','WC rear edge: 235 from finished rear wall.','WC front edge: 165 from finished divider.','WC centre: 435 from finished rear wall.','Supply: 50 OD, lagged fresh-water supply.','Centre: 350 from outside rear frame;','170 from outside right frame.','Soil: 110 outside diameter.','Centre: 550 from outside rear frame;','200 from outside right frame.','Outside frame to finished face: 107.5.','Pipe centres use outside-frame offsets.','Check connection clearance on site.'];
 lines.forEach((n,i)=>c.text(n,191,38+i*4.7,6.7,i===5||i===8||i===11));
 // Front divider viewed from main room. Single top and sole plates.
 c.text('FRONT DIVIDER ELEVATION',12,129,8,true);
 const k=.027,fx=20,base=193,F=(x:number)=>fx+x*k,Z=(z:number)=>base-z*k;
 const studs=[75,400,800,1200,b.frontLength-47];
 c.rect(F(0),Z(b.soleTop),b.frontLength*k,47*k,'timber',black,.2);c.rect(F(0),Z(b.top),b.frontLength*k,47*k,'timber',black,.2);
 studs.forEach(x=>c.rect(F(x),Z(b.plateBottom),47*k,b.studCut*k,'timber',black,.2));
 for(let i=0;i<studs.length-1;i++)c.rect(F(studs[i]+47),Z(b.ffl+1100),Math.max(0,studs[i+1]-studs[i]-47)*k,47*k,'timber',black,.2);
 c.line(F(0)-2,Z(b.ffl),F(b.frontLength)+2,Z(b.ffl),black,.15,[1,1]);
 vTechnical(c,Z(b.ffl+1100),Z(b.ffl),F(0),14,'1100 FFL to noggin top',5.7,'left');
 studs.forEach((x,i)=>c.text(`${fmt(x)}`,F(x+23.5),Z(b.top)-3,5.3,true,'center'));
 hTechnical(c,F(0),F(b.frontLength),base,199,`${fmt(b.frontLength)} frame length`,6);
 vTechnical(c,Z(b.top),base,F(b.frontLength),70,`${fmt(b.top)} slab to top`,6);
 c.text('TIMBER CUTTING / ASSEMBLY',86,129,8,true);
 const cuts=[`Front sole + top: 2 x ${fmt(b.frontLength)} (47 x 75).`,`Front studs: 5 x ${fmt(b.studCut)} (47 x 75).`,'Front studs left edges: 75, 400, 800, 1200, 1553.', 'Noggin row: 1100 above FFL; 47 tall.', 'Front noggins: 278, 353, 353, 306.',`Left wall top plate: 1 x ${fmt(b.sideLength)}.`,`Door opening: ${fmt(b.roughWidth)} wide (see detail page).`,`Jamb posts: 2 x ${fmt(b.jambCut)} (47 x 75).`,`Header: ${fmt(b.roughWidth+94)} (47 x 75).`, `Cripples: 3 x ${fmt(b.crippleCut)} (47 x 75).`, 'Left wall butts against front divider inside face.', 'Tie rear / right ends to external framing studs.'];
 cuts.forEach((n,i)=>c.text(n,86,136+i*4.8,6.6,i<2));
 c.text('LEFT / DOOR DIVIDER',191,129,8,true);
 const lx=201,lk=.027,LY=(z:number)=>193-z*lk;
 c.rect(lx,LY(b.top),b.sideLength*lk,47*lk,'timber',black,.2);
 const end=b.doorEnd-b.rearStud;
 for(const y of [0,end])c.rect(lx+y*lk,LY(b.roughHead),47*lk,b.jambCut*lk,'timber',black,.2);
 c.rect(lx,LY(b.roughHead+47),(b.roughWidth+94)*lk,47*lk,'timber',black,.2);
 for(const y of [0,(b.sideLength-47)/2,end])c.rect(lx+y*lk,LY(b.plateBottom),47*lk,b.crippleCut*lk,'timber',black,.2);
 c.rect(lx,LY(b.soleTop),47*lk,47*lk,'timber',black,.2);
 c.rect(lx+end*lk,LY(b.soleTop),47*lk,47*lk,'timber',black,.2);
 c.text('757 rough opening',230,153,6.5);c.text('Head +2163.5 slab',230,158,6.5);
 hTechnical(c,lx,lx+b.sideLength*lk,193,199,`${fmt(b.sideLength)} to long wall`,6);
 c.text('Latch post shares',230,175,6.5);c.text('long-wall corner.',230,180,6.5);
 c.text('Partition top +2357 slab, level with external frame top. Sole anchored directly to slab over DPC / DPM; top +47. Studs start immediately above sole.',12,202,6.8);
 footer(c,page,total,'bathroom partitions');return c.stream();
}
