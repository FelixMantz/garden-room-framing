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
 c.text('100 mm PIR stock: 2400 x 1200. Hatched strips = solid timber supports below the bathroom partitions.',12,25,7);
 b.panels.forEach(p=>{c.rect(X(p.x),Y(p.y),p.w*sc,p.h*sc,[255,255,255],black,.25);c.text(p.id,X(p.x+p.w/2),Y(p.y+p.h/2),9,true,'center');c.text(`${fmt(p.w)} x ${fmt(p.h)}`,X(p.x+p.w/2),Y(p.y+p.h/2)+5,7,false,'center');});
 c.rect(X(b.leftOuter),Y(0),75*sc,b.frontInner*sc,'timber',black,.3);
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
 const sx=266,sy=93,k=.27;
 c.rect(sx-8,sy,36,8,'masonry',black,.25);c.line(sx-8,sy,sx+28,sy,black,.6);
 c.rect(sx,sy-b.floorPir*k,75*k,b.packing*k,'floor',black,.2);
 c.rect(sx,sy-94*k,75*k,47*k,'timber',black,.2);c.rect(sx,sy-47*k,75*k,47*k,'timber',black,.2);
 c.rect(sx-8,sy-(b.floorPir+b.deck)*k,36,22*k,'floor',black,.2);
 c.rect(sx,sy-(b.floorPir+b.deck+47)*k,75*k,47*k,'timber',black,.2);
 c.rect(sx+7,sy-(b.floorPir+b.deck+85)*k,47*k,38*k,'timber',black,.2);
 c.text('Stud',287,49,6);c.text('47 x 75 sole',243,57,6);c.text('22 P5 deck',243,63,6);c.text('2 x 47 = 94',243,76,6);c.text(`${fmt(b.packing)} packing to 100`,243,85,6);c.text('DPM on slab',243,99,6);c.line(263,84,265,sy-97*k,black,.13);
 c.text('SUPPORT SET-OUT',243,110,8,true);
 const notes=[`Left support x ${fmt(b.leftOuter)}-${fmt(b.leftInner)}`,`Rear to front: 0-${fmt(b.frontInner)}`,`Front support y ${fmt(b.frontInner)}-${fmt(b.frontOuter)}`,`Left to right: ${fmt(b.leftOuter)}-${fmt(s.brickInternalLength)}`,'Two 47 x 75 layers laid flat.','Use measured timber thickness;',`packing = 100 - 2 x thickness.`,'Full-width continuous packing.','Support spans beneath doorway.','DPM remains continuous below.'];
 notes.forEach((n,i)=>c.text(n,243,117+i*4.7,6.3,i<4));
 c.text('PIR sizes are geometric infill dimensions: measure the slab / supports and allow tight fitting or foam-sealed cuts.',12,190,7);
 c.text('Lay 22 mm glued T&G P5 above PIR and supports; fix partition sole through the deck into solid support timber.',12,196,7);
 c.text('30 mm perimeter PIR upstand and floor-edge detail: p. 17. Seal DPM penetrations. Floor finish: 15 mm parquet; FFL +137 slab.',12,202,6.7);
 footer(c,page,total,'floor PIR / supports');return c.stream();
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
 // Door / swing is the confirmed 700 mm layout envelope; final jamb positions depend on lining.
 const hinge=b.rearFinish+100,end=hinge+700;
 c.rect(X(b.leftOuter-13),Y(hinge),101*sc,700*sc,[255,255,255],black,0);
 c.line(X(b.leftOuter),Y(hinge),X(b.leftOuter-700),Y(hinge),black,.4);
 for(let i=0;i<24;i++){const a=i*Math.PI/48,z=(i+1)*Math.PI/48;c.line(X(b.leftOuter-700*Math.cos(a)),Y(hinge+700*Math.sin(a)),X(b.leftOuter-700*Math.cos(z)),Y(hinge+700*Math.sin(z)),black,.2);}
 c.text('700 door',12,75,7,true);c.text('opens out',12,80,6.5);
 c.rect(X(b.leftFinish+b.basinLeft),Y(b.rearFinish),500*sc,300*sc,[255,255,255],black,.3);c.text('BASIN 500 x 300',X(b.leftFinish+b.basinLeft+250),Y(b.rearFinish+160),7,true,'center');
 c.rect(X(b.rightFinish-600),Y(b.rearFinish+235),600*sc,400*sc,[255,255,255],black,.3);c.text('WC 600 x 400',X(b.rightFinish-300),Y(b.rearFinish+410),7,true,'center');
 hTechnical(c,X(b.leftFinish),X(b.rightFinish),Y(b.frontFinish),114,'1500 finished clear',6.5);
 vTechnical(c,Y(b.rearFinish),Y(b.frontFinish),X(b.rightFinish),174,'800 finished clear',6);
 c.text('REAR WALL',110,30,7,true,'center');
 c.text('FIXTURE / PIPE DATUMS',191,31,9,true);
 const lines=['Basin left gap approx. 105 (working position).','Basin front to finished divider: 500.','WC rear edge: 235 from finished rear wall.','WC front edge: 165 from finished divider.','WC centre: 435 from finished rear wall.','Supply: 50 OD, lagged fresh-water supply.','Centre: 350 from outside rear frame;','170 from outside right frame.','Soil: 110 outside diameter.','Centre: 550 from outside rear frame;','200 from outside right frame.','Outside frame to finished face: 107.5.','Pipe centres use outside-frame offsets.','Check connection clearance on site.'];
 lines.forEach((n,i)=>c.text(n,191,38+i*4.7,6.7,i===5||i===8||i===11));
 // Front divider viewed from main room. Single top and sole plates.
 c.text('FRONT DIVIDER ELEVATION',12,129,8,true);
 const k=.027,fx=20,base=193,F=(x:number)=>fx+x*k,Z=(z:number)=>base-(z-(b.floorPir+b.deck))*k;
 const studs=[0,400,800,1200,b.frontLength-47];
 c.rect(F(0),Z(b.soleTop),b.frontLength*k,47*k,'timber',black,.2);c.rect(F(0),Z(b.top),b.frontLength*k,47*k,'timber',black,.2);
 studs.forEach(x=>c.rect(F(x),Z(b.plateBottom),47*k,b.studCut*k,'timber',black,.2));
 for(let i=0;i<studs.length-1;i++)c.rect(F(studs[i]+47),Z(b.ffl+1100),Math.max(0,studs[i+1]-studs[i]-47)*k,47*k,'timber',black,.2);
 hTechnical(c,F(0),F(b.frontLength),base,199,`${fmt(b.frontLength)} frame length`,6);
 vTechnical(c,Z(b.top),base,F(b.frontLength),70,`${fmt(b.top-b.floorPir-b.deck)} frame height`,6);
 c.text('TIMBER CUTTING / ASSEMBLY',86,129,8,true);
 const cuts=[`Front sole + top: 2 x ${fmt(b.frontLength)} (47 x 75).`,`Front studs: 5 x ${fmt(b.studCut)} (47 x 75).`,'Front studs left edges: 0, 400, 800, 1200, 1553.', 'Noggin row: 1100 above FFL; 47 tall.', 'Front noggins: 3 x 353 + 1 x 306.',`Left wall top plate: 1 x ${fmt(b.sideLength)}.`,'Left wall door jambs / header / sole: site set-out.','Door height and lining allowance not yet specified.','700 is the sketch door / swing envelope;', 'confirm leaf, lining and fitting gaps before cutting.', 'Left wall butts against front divider inside face.', 'Tie rear / right ends to external framing studs.'];
 cuts.forEach((n,i)=>c.text(n,86,136+i*4.8,6.6,i<2));
 c.text('LEFT / DOOR DIVIDER',191,129,8,true);
 const lx=201,lk=.027,LY=(z:number)=>193-(z-(b.floorPir+b.deck))*lk;
 c.rect(lx,LY(b.top),b.sideLength*lk,47*lk,'timber',black,.2);
 c.rect(lx,LY(b.plateBottom),47*lk,b.studCut*lk,'timber',black,.2);
 c.rect(lx+(b.sideLength-47)*lk,LY(b.plateBottom),47*lk,b.studCut*lk,'timber',black,.2);
 c.line(lx,LY(b.ffl+2000),lx+b.sideLength*lk,LY(b.ffl+2000),black,.25,[1,1]);
 c.text('Header height /',230,153,6.5);c.text('jamb positions TBC',230,158,6.5);
 hTechnical(c,lx,lx+b.sideLength*lk,193,199,`${fmt(b.sideLength)} frame`,6);
 c.text('700 door envelope;',230,175,6.5);c.text('allow for lining.',230,180,6.5);
 c.text('Partition top +2357 slab, level with external frame top. Partition sole on deck at +122 slab; top +169 slab.',12,202,6.8);
 footer(c,page,total,'bathroom partitions');return c.stream();
}
