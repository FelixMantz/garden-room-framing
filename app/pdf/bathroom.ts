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
 b.panels.forEach(p=>{c.rect(X(p.x),Y(p.y),p.w*sc,p.h*sc,[255,255,255],black,.25);if(p.w<400)c.textVertical(p.w<100?p.id:`${p.id} | ${fmt(p.w)} x ${fmt(p.h)}`,X(p.x+p.w/2)+.7,Y(p.y+p.h/2),6,true);else {c.text(p.id,X(p.x+p.w/2),Y(p.y+p.h/2),9,true,'center');c.text(`${fmt(p.w)} x ${fmt(p.h)}`,X(p.x+p.w/2),Y(p.y+p.h/2)+5,7,false,'center');}});
 c.rect(X(b.leftOuter),Y(0),75*sc,b.doorStart*sc,'timber',black,.3);
 
 c.rect(X(b.leftOuter),Y(b.frontInner),(s.brickInternalLength-b.leftOuter)*sc,75*sc,'timber',black,.3);
 // Divider dimensions use brick datum except the 68 mm timber stub.
 vTechnical(c,Y(b.rearStud),Y(b.doorStart),X(b.leftOuter),X(b.leftOuter)-4,'68',6,'left');
 vTechnical(c,Y(b.doorStart),Y(b.frontInner),X(b.leftOuter),X(b.leftOuter)-4,'757 doorway',6,'left');
 hTechnical(c,X(b.leftOuter),X(b.rightStud),Y(b.frontOuter),Y(b.frontOuter)+10,`${fmt(b.frontLength)} long-wall frame from right stud`,6);
 hTechnical(c,X(b.leftInner),X(b.rightFinish),Y(b.frontInner),Y(b.frontInner)-7,'1512.5 inner stud to right finish',6);
 vTechnical(c,Y(b.frontInner),Y(b.frontOuter),X(b.leftOuter),X(b.leftOuter)-8,'75',5.5,'left');
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
 // Locate both divider strips from the brick-inside rear-left corner.
 vTechnical(c,Y(0),Y(b.frontInner),X(b.leftOuter),X(b.leftOuter)-8,`${fmt(b.frontInner)} to long sole`,6,'left');
 hTechnical(c,X(b.leftOuter),X(s.brickInternalLength),Y(s.brickInternalDepth),Y(s.brickInternalDepth)+14,`${fmt(s.brickInternalLength-b.leftOuter)} to right brick`,6);
 c.text('PIR sizes are geometric infill dimensions: measure the slab / supports and allow tight fitting or foam-sealed cuts.',12,190,7);
 c.text('P5 stops at partition: 10 mm movement gaps. Sole anchored to slab; studs start at +47. No P5 trapped beneath wall.',12,196,7);
 c.text('Doorway: continuous PIR + slip layer + uncut P5 + floor finish. No threshold bearer / fixings into floating deck.',12,202,6.7);
 footer(c,page,total,'floor PIR / supports');return c.stream();
}

export function drawBathroomDoor(s:Settings,page:number,total:number,c:C=canvas()){
 const b=bathroomModel(s),t=47,full=b.sideLength+75;
 const a=b.doorStart-b.rearStud,e=b.sideLength,hp=a-t,leaf=b.leafStart-b.rearStud,ls=a+5,le=e-5;
 const bottom=b.ffl+10,lt=bottom+1981,hb=lt+3,ht=hb+27.5;
 c.text('Bathroom door - short partition elevation and top-down plan',12,11,14,true);
 c.text('All mm | elevation viewed from main room | vertical datum: slab | plan: rear at RIGHT, front at LEFT',12,18,7.3);
 const k=.059,x=66,base=180,X=(v:number)=>x+v*k,Z=(v:number)=>base-v*k;
 c.text('SHORT PARTITION ELEVATION',12,27,8,true);
 c.rect(X(-95),Z(b.top),95*k,b.top*k,'floor',black,.18);
 c.rect(X(0),Z(b.top),825*k,47*k,'timber',black,.25);
 c.rect(X(e),Z(b.top),75*k,47*k,'timber',black,.25);
 c.rect(X(0),Z(47),a*k,47*k,'timber',black,.25);
 c.rect(X(e),Z(47),75*k,47*k,'timber',black,.25);
 c.rect(X(hp),Z(b.roughHead),47*k,b.jambCut*k,'timber',black,.3);
 c.rect(X(e),Z(b.plateBottom),75*k,b.studCut*k,'corner',black,.3);
 c.rect(X(hp),Z(b.roughHead+47),b.headerCut*k,47*k,'timber',black,.3);
 for(const u of [hp,389])c.rect(X(u),Z(b.plateBottom),47*k,b.crippleCut*k,'timber',black,.25);
 for(const u of [ls,le-27.5])c.rect(X(u),Z(hb),27.5*k,(hb-b.ffl)*k,[255,255,255],black,.3);
 c.rect(X(ls),Z(ht),(le-ls)*k,27.5*k,[255,255,255],black,.3);
 c.rect(X(leaf),Z(lt),686*k,1981*k,[255,255,255],black,.3);
 for(const [v,h] of [[250,480],[850,630],[1630,220]])for(const u of [80,365])c.rect(X(leaf+u),Z(bottom+v+h),240*k,h*k,[255,255,255],black,.15);
 for(const h of [200,990,1780])c.rect(X(leaf)-.6,Z(bottom+h),1.2,76*k,[255,255,255],black,.25);
 circle(c,X(leaf+616),Z(bottom+1000),1);
 c.line(12,Z(0),156,Z(0),black,.4);
 c.line(12,Z(b.ffl),154,Z(b.ffl),black,.18,[2,1]);
 c.text('Slab 0',12,184,6.5,true);c.text('FFL',12,Z(b.ffl)-2,6.5,true);
 c.textVertical('REAR WALL',X(-50),118,6,true);
 c.textVertical('END STUD / ROTATED BACKING',X(862.5),118,6,true);
 // Height dimensions alternate sides; every former callout is a dimension to slab.
 vTechnical(c,Z(b.top),Z(0),X(0),22,fmt(b.top),6,'left');
 vTechnical(c,Z(b.plateBottom),Z(0),X(0),31,fmt(b.plateBottom),6,'left');
 vTechnical(c,Z(ht),Z(0),X(ls),40,fmt(ht),6,'left');
 vTechnical(c,Z(lt),Z(0),X(leaf),49,fmt(lt),6,'left');
 vTechnical(c,Z(b.roughHead+47),Z(0),X(e),134,fmt(b.roughHead+47),6);
 vTechnical(c,Z(b.roughHead),Z(0),X(e),143,fmt(b.roughHead),6);
 vTechnical(c,Z(hb),Z(0),X(e),152,fmt(hb),6);
 // Component cuts and floor heights are attached directly to their geometry.
 vTechnical(c,Z(b.roughHead),Z(47),X(hp),59,`${fmt(b.jambCut)} hinge post`,5.9,'left');
 vTechnical(c,Z(b.plateBottom),Z(47),X(full),124,`${fmt(b.studCut)} corner studs`,5.9);
 vTechnical(c,Z(b.plateBottom),Z(b.roughHead+47),X(389),X(389)+4,fmt(b.crippleCut),5.7);
 vTechnical(c,Z(lt),Z(bottom),X(leaf+686),X(leaf+686)-4,'1981 leaf',6,'left');
 vTechnical(c,Z(b.ffl),Z(0),X(0),16,fmt(b.ffl),5.8,'left');
 vTechnical(c,Z(47),Z(0),X(a),X(a)+5,'47',5.7);
 vTechnical(c,Z(bottom),Z(b.ffl),X(leaf),X(leaf)-2,'10',5.4,'left');
 hTechnical(c,X(0),X(full),Z(b.top),33,'900 overall including corner',6);
 hTechnical(c,X(hp),X(e),Z(b.roughHead+47),Z(b.roughHead+47)-5,'804 header',6);
 hTechnical(c,X(0),X(a),180,188,'68',5.8);
 hTechnical(c,X(a),X(e),180,188,'757 rough',6);
 hTechnical(c,X(e),X(full),180,188,'75',5.8);
 hTechnical(c,X(leaf),X(leaf+686),180,198,'686 leaf',6);
 // Mirrored plan: viewed down, rather than looking up from below.
 c.text('TOP-DOWN PLAN / HORIZONTAL ELEMENTS',169,32,8,true);
 const q=.125,px=173,py=65,P=(v:number)=>px+(full-v)*q;
 const rect=(u:number,v:number,w:number,h:number,fill:any=[255,255,255])=>c.rect(P(u+w),py+v*q,w*q,h*q,fill,black,.25);
 rect(0,0,full,75,'floor');rect(a,0,757,75);
 rect(hp,0,47,75,'timber');rect(e,0,75,47,'timber');rect(e,47,47,75,'corner');
 for(const u of [ls,le-27.5])rect(u,-12.5,27.5,100);
 rect(ls+27.5,53,12,32,'timber');rect(le-27.5-12,53,12,32,'timber');
 rect(leaf,18,686,35);
 c.text('FRONT / LONG WALL',P(full),56,6.3,true);c.text('REAR / HINGES',P(0),56,6.3,true,'right');
 const dim=(u:number,v:number,y:number,label:string,size=6)=>hTechnical(c,P(v),P(u),py,y,label,size);
 dim(0,full,45,'900 overall');
 dim(e,full,86,'75 end stud',5.8);dim(a,e,86,'757 rough');dim(0,a,86,'68 stub',5.8);
 dim(ls,le,96,'747 lining outside');dim(ls+27.5,le-27.5,106,'692 between jambs');
 dim(leaf,leaf+686,116,'686 leaf');
 // Datum dimensions locate the elements independently, measured from rear stud face.
 dim(0,hp,128,'21',5.8);
 dim(0,a,138,'68',5.8);
 dim(0,ls,148,'73',5.8);
 dim(0,leaf,158,'103.5',5.8);
 dim(0,leaf+686,168,'789.5 to leaf far edge',5.8);
 dim(0,le,178,'820 to lining outside',5.8);
 dim(0,e,188,'825 to long-wall stud face',5.8);
 vTechnical(c,py,py+75*q,P(full),166,'75 frame depth',5.8,'left');
 c.text('47 x 75 end stud + rotated 75 x 47 backing',169,198,6.3);
 c.text('Door 200612 / lining 200351 | 5 fitting packers | scribed lining / board junction | non-loadbearing head end-fixed to corner',12,203,6);
 footer(c,page,total,'bathroom door');return c.stream();
}
export function drawBathroom(s:Settings,page:number,total:number,c:C=canvas()){
 const b=bathroomModel(s),k=.065,x=87,base=181,X=(v:number)=>x+v*k,Z=(v:number)=>base-v*k;
 c.text('Bathroom - front divider elevation',12,11,14,true);
 c.text('Viewed from main room | 47 x 75 timber; slab-fixed sole | dimensions in mm | horizontal datum: door-end frame edge',12,18,7.4);
 const studs=[{x:0,w:47},{x:47,w:75},{x:400,w:47},{x:800,w:47},{x:1200,w:47},{x:b.frontLength-47,w:47}];
 c.rect(X(0),Z(b.top),b.frontLength*k,47*k,'timber',black,.3);
 c.rect(X(0),Z(47),b.frontLength*k,47*k,'timber',black,.3);
 studs.forEach(p=>c.rect(X(p.x),Z(b.plateBottom),p.w*k,b.studCut*k,p.x===47?'corner':'timber',black,.3));
 const nt=b.ffl+1100,nb=nt-47;
 for(let i=1;i<studs.length-1;i++){const start=studs[i].x+studs[i].w,end=studs[i+1].x;c.rect(X(start),Z(nt),(end-start)*k,47*k,'timber',black,.25);
 hTechnical(c,X(start),X(end),Z(nt),Z(nt)-8,fmt(end-start),6.2);}
 c.line(X(0)-3,base,X(b.frontLength)+3,base,black,.4);
 c.line(12,Z(b.ffl),270,Z(b.ffl),black,.2,[2,1]);
 c.text('FFL',12,Z(b.ffl)-2,6.5,true);c.text('SLAB 0',12,185,6.5,true);
 // Width and stud locations: chain plus baseline dimensions.
 hTechnical(c,X(0),X(b.frontLength),Z(b.top),22,`${fmt(b.frontLength)} overall`,7);
 const edges=[0,47,122,400,447,800,847,1200,1247,1553,1600];
 for(let i=0;i<edges.length-1;i++)hTechnical(c,X(edges[i]),X(edges[i+1]),Z(b.top),33,fmt(edges[i+1]-edges[i]),5.7);
 for(const [u,y] of [[400,190],[800,196],[1200,202]])hTechnical(c,X(0),X(u),181,y,`${u} stud left edge`,6.3);
 hTechnical(c,X(1200),X(1553),181,190,'353 to end stud',6.3);
 vTechnical(c,Z(b.top),Z(0),X(0),26,`${fmt(b.top)} overall`,6.7,'left');
 vTechnical(c,Z(b.plateBottom),Z(47),X(0),39,`${fmt(b.studCut)} stud cut`,6.5,'left');
 vTechnical(c,Z(nt),Z(b.ffl),X(0),52,'1100 FFL to noggin top',6.3,'left');
 vTechnical(c,Z(nb),Z(47),X(0),65,`${fmt(nb-47)} lower clear`,6.3,'left');
 vTechnical(c,Z(b.plateBottom),Z(nt),X(1600),210,`${fmt(b.plateBottom-nt)} upper clear`,6.3);
 vTechnical(c,Z(nt),Z(nb),X(1600),223,'47 noggin',6);
 vTechnical(c,Z(47),Z(0),X(1600),223,'47 sole',6);
 vTechnical(c,Z(b.top),Z(b.plateBottom),X(1600),223,'47 top',6);
 vTechnical(c,Z(b.ffl),Z(0),X(1600),239,`${fmt(b.ffl)} FFL`,6.3);
 hTechnical(c,X(0),X(47),Z(47),Z(47)-6,'47',5.8);
 hTechnical(c,X(47),X(122),Z(47),Z(47)-12,'75 rotated',5.8);
 c.textVertical('DOOR-END CORNER',X(23.5),90,6,true);
 c.textVertical('ROTATED BACKING STUD',X(84.5),90,6,true);
 footer(c,page,total,'front divider elevation');return c.stream();
}
