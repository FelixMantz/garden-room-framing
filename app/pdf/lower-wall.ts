import type { Settings } from '../framing';
import { OSB_STOCK } from '../sheathing';
import { canvas, fmt, hTechnical, vTechnical, type Fill } from './layout';

/** Nominal junction proposal. Structural / floor datums come from the shared model. */
export function drawLowerWall(s:Settings,page:number,total:number){
  const c=canvas(), k=.16, ix=90, base=176;
  const X=(x:number)=>ix+x*k, Y=(z:number)=>base-z*k;
  const masonry=s.brickCourses*s.courseHeight, ffl=s.layers.reduce((n,l)=>n+l.thickness,0);
  const board=12.5, upstand=30, coverDepth=25, rebateDepth=19, rebateBack=board+rebateDepth, skirtFace=board+coverDepth;
  const skirtHeight=220, skirtBottom=ffl+2, skirtTop=skirtBottom+skirtHeight, rebateTop=skirtBottom+145;
  const socket=ffl+500, bandBottom=ffl+410, bandTop=ffl+590, top=ffl+720;
  const mainPir=90, servicePir=70, cavity=s.studDepth-servicePir, box=35, floorGap=2;
  const black=[0,0,0], white=[255,255,255];
  const line=(x1:number,z1:number,x2:number,z2:number,w=.2,dash:number[]|null=null)=>c.line(X(x1),Y(z1),X(x2),Y(z2),black,w,dash);
  const rect=(x:number,z:number,w:number,h:number,fill:Fill=white)=>c.rect(X(x),Y(z+h),w*k,h*k,fill,black,.2);
  const poly=(p:number[][],fill:Fill=white)=>c.polygon(p.map(([x,z])=>[X(x),Y(z)]),fill,black,.23);
  const leader=(label:string,x:number,z:number,tx:number,ty:number,align:'left'|'right'='left')=>{
    c.line(X(x),Y(z),align==='left'?tx-2:tx+2,ty-1,black,.13);
    c.rect(X(x)-.3,Y(z)-.3,.6,.6,black,black,0);c.text(label,tx,ty-(tx===12?3:0),7,true,align);
  };
  c.text('Lower wall - floor, cladding and socket junction',12,11,14,true);
  c.text('Section between studs; adjacent timber shown dashed | all dimensions in mm | do not scale',12,18,8);
  c.text('Dimensions in mm; vertical set-out from slab / FFL. Profiles schematic.',12,24,7.5);
  c.text('OUTSIDE',65,32,8,true,'center');c.text('INSIDE',134,32,8,true,'center');
  // Slab depth is deliberately broken: no foundation dimension is inferred.
  rect(-s.brickThickness-10,-65,510,65,'floor');
  for(let x=-110;x<400;x+=35)line(x,-65,x+17,-57,.22);
  // Mortar bed plus the actual 60 mm brick in every 70 mm course.
  for(let i=0;i<s.brickCourses;i++)rect(-2.5-s.brickThickness,i*s.courseHeight+s.courseHeight-s.brickHeight,s.brickThickness,s.brickHeight,'masonry');
  rect(-s.studDepth,masonry,s.studDepth,s.studFace,'plate');
  // Insulation in the bay; thinner band creates a warm-side service recess.
  rect(-s.studDepth,masonry+s.studFace,mainPir,bandBottom-masonry-s.studFace);
  rect(-s.studDepth,bandBottom,servicePir,bandTop-bandBottom);
  rect(-s.studDepth,bandTop,mainPir,top-bandTop);
  c.text('90 PIR',X(-s.studDepth+mainPir/2),Y((masonry+s.studFace+bandBottom)/2)+1,7,true,'center');
  c.text('70 PIR',X(-s.studDepth+servicePir/2),Y((bandBottom+bandTop)/2)+1,7,true,'center');
  c.text('90 PIR',X(-s.studDepth+mainPir/2),Y((bandTop+top)/2)+1,7,true,'center');
  for(const x of [-s.studDepth,0])line(x,masonry+s.studFace,x,top,.15,[1.5,1]);
  // VCL follows the inner insulation face behind services; all steps sealed.
  const vapour=[[-s.studDepth+mainPir,top],[-s.studDepth+mainPir,bandTop],[-cavity,bandTop],[-cavity,bandBottom],[-s.studDepth+mainPir,bandBottom],[-s.studDepth+mainPir,masonry+s.studFace],[0,masonry+s.studFace],[0,masonry],[0,masonry-45]];
  vapour.slice(1).forEach((p,i)=>line(vapour[i][0],vapour[i][1],p[0],p[1],.42,[2,.7]));
  // Plasterboard directly on studs, interrupted by the socket box aperture.
  rect(0,masonry,board,socket-38-masonry,'floor');rect(0,socket+38,board,top-socket-38,'floor');
  rect(board-box,socket-36,box,72);rect(board,socket-43,7,86,'floor');
  for(const z of [socket-8,socket+8])poly(Array.from({length:12},(_,i)=>[-12+3*Math.cos(i*Math.PI/6),z+3*Math.sin(i*Math.PI/6)]));
  // Sheathing, water-resistive membrane, cavity batten beyond section and weatherboards.
  const osbOuter=-s.studDepth-OSB_STOCK.thickness, battenOuter=osbOuter-25, osbBottom=masonry+OSB_STOCK.bottom;
  rect(osbOuter,osbBottom,OSB_STOCK.thickness,top-osbBottom,'floor');
  line(osbOuter,masonry-23,osbOuter,top,.55);
  for(const x of [battenOuter,osbOuter])line(x,masonry-10,x,top,.17,[2,1]);
  for(let z=masonry-25;z<top;z+=125){const zt=Math.min(z+150,top);poly([[battenOuter-18,z],[battenOuter,z],[battenOuter,zt],[battenOuter-5,zt]],'timber');}
  // Drained cladding foot: membrane lapped onto outward-falling flashing.
  line(osbOuter,masonry+10,osbOuter,masonry-20,.4);line(osbOuter,masonry-20,battenOuter-24,masonry-30,.4);line(battenOuter-24,masonry-30,battenOuter-24,masonry-40,.4);
  for(let x=battenOuter+2;x<osbOuter;x+=5)line(x,masonry-10,x+1,masonry-13,.3);
  // Continuous upper DPM and DPC lap behind the insulated brick upstand.
  line(0,0,400,0,.6);line(.8,0,.8,masonry,.6);
  line(-2.5-s.brickThickness,masonry,1,masonry,.6);line(1,masonry,1,masonry-70,.6);
  // Full-thickness upstand meets the top of the floor PIR; no relieved foot.
  const deckBase=s.layers[0].thickness;
  rect(0,deckBase,upstand,masonry-deckBase);
  line(-2.5,0,-2.5,masonry,.6);line(-2.5-s.brickThickness,masonry,1,masonry,.6);
  
  let floorZ=0;
  s.layers.forEach((l,i)=>{const start=i===0?0:upstand+floorGap;rect(start,floorZ,400-start,l.thickness,i===0?white:'floor');floorZ+=l.thickness;});
  // Perimeter expansion gap in deck / finish; skirting fixed independently of floor.
  rect(upstand,deckBase,floorGap,ffl-deckBase);
  // Georgian cover: 25 overall / 19 rebate, measured from plasterboard face.
  poly([[board,skirtTop],[board+2,skirtTop],[board+4,skirtTop-8],[board+11,skirtTop-15],
    [board+8,skirtTop-24],[board+15,skirtTop-34],[skirtFace,skirtTop-47],
    [skirtFace,skirtBottom],[rebateBack,skirtBottom],[rebateBack,rebateTop],[board,rebateTop]],'timber');
  // A screw into sole plate, above DPC. No fixings through the upstand membrane.
  line(skirtFace,masonry+25,-22,masonry+25,.22);
  line(50,ffl,400,ffl,.13,[3,1]);
  c.textVertical('30 PIR',X(upstand/2)+.8,Y((masonry+deckBase)/2),6.5,true);
  c.text(`${fmt(deckBase)} PIR`,X(220),Y(deckBase/2)+1,7,true,'center');
  // Only concealed or small details retain leader annotations.
  leader('Vertical battens (dashed)',battenOuter+12,top-155,12,50);
  leader('Breather membrane',osbOuter,top-255,12,72);
  leader(`OSB base +${fmt(osbBottom)} slab / ${OSB_STOCK.bottom} above DPC`,osbOuter+OSB_STOCK.thickness/2,osbBottom,12,97);
  leader('Insect mesh + drip',battenOuter-20,masonry-30,12,116);
  leader('DPC / DPM lap',1,140,12,145);
  leader('Polythene VCL 250 micron',-cavity,bandBottom+35,112,92);
  // Height dimensions occupy the former component-callout columns.
  vTechnical(c,Y(0),Y(masonry),X(-s.brickThickness),57,`${fmt(masonry)}`,7,'left');
  vTechnical(c,Y(masonry),Y(masonry+s.studFace),X(-s.studDepth),57,`${fmt(s.studFace)}`,6,'left');
  vTechnical(c,Y(0),Y(s.courseHeight),X(-s.brickThickness),66,`${fmt(s.courseHeight)}`,6,'left');
  vTechnical(c,Y(bandBottom),Y(bandTop),X(board),109,'180',7);
  vTechnical(c,Y(masonry+s.studFace),Y(bandBottom),X(-s.studDepth+mainPir),103,fmt(bandBottom-masonry-s.studFace),7);
  vTechnical(c,Y(skirtBottom),Y(skirtTop),X(skirtFace),111,'220',7);
  vTechnical(c,Y(deckBase),Y(masonry),X(upstand),123,`${fmt(masonry-deckBase)}`,7);
  vTechnical(c,Y(ffl),Y(socket),X(board+7),147,'500 socket C/L',7);
  vTechnical(c,Y(ffl),Y(bandBottom),X(board),163,'410 band underside',7);
  line(board,socket,360,socket,.13,[2,1]);
  c.text(`+${fmt(masonry)} slab`,132,Y(masonry)-2,6.5,true);
  c.text(`FFL +${fmt(ffl)}`,135,Y(ffl)-2,7,true);
  c.text('SLAB 0',135,Y(0)+5,7,true);
  hTechnical(c,X(-2.5-s.brickThickness),X(-2.5),Y(0),190,`${fmt(s.brickThickness)}`,7);
  hTechnical(c,X(-s.studDepth),X(0),Y(masonry+s.studFace),Y(masonry+s.studFace)-5,`${fmt(s.studDepth)}`,6.5);
  // Short floor layers use offset labels so their dimensions remain readable.
  floorZ=0;
  s.layers.forEach((l,i)=>{
    const y1=Y(floorZ),y2=Y(floorZ+l.thickness),dx=174;
    c.line(X(400)+1,y1,dx,y1,black,.1);c.line(X(400)+1,y2,dx,y2,black,.1);
    c.line(dx,y1,dx,y2,black,.13);
    for(const y of [y1,y2])c.line(dx-1,y+1,dx+1,y-1,black,.13);
    const mid=(y1+y2)/2,labelY=i===0?mid:i===1?mid+1:mid-2;
    c.line(dx,mid,dx+3,labelY,black,.1);c.text(fmt(l.thickness),dx+4,labelY+1,6.5,true);
    floorZ+=l.thickness;
  });
  c.line(187,28,187,197,black,.2);
  // Enlarged horizontal section: all thicknesses are dimensions, not callouts.
  c.text('SOCKET / WALL - PLAN SECTION',195,32,8,true);
  const pk=.48,px=199,py=53;
  const P=(x:number)=>px+(x-battenOuter+18)*pk;
  const plan=(a:number,b:number,fill:Fill=white)=>c.rect(P(a),py,(b-a)*pk,18,fill,black,.2);
  plan(battenOuter-18,battenOuter,'timber');plan(battenOuter,osbOuter);
  plan(osbOuter,-s.studDepth,'floor');plan(-s.studDepth,-cavity);
  c.text('70 PIR',P(-s.studDepth+servicePir/2),py+10,7,true,'center');
  c.line(P(osbOuter),py-1,P(osbOuter),py+19,black,.4);
  c.line(P(-cavity),py-1,P(-cavity),py+19,black,.4,[2,.7]);
  c.rect(P(0),py,board*pk,3,'floor',black,.2);c.rect(P(0),py+15,board*pk,3,'floor',black,.2);
  c.rect(P(board-box),py+3,box*pk,12,white,black,.2);
  c.rect(P(board),py+2,3,14,'floor',black,.2);
  hTechnical(c,P(battenOuter-18),P(battenOuter),py,43,'18',6.5);
  hTechnical(c,P(battenOuter),P(osbOuter),py,48,'25',6.5);
  hTechnical(c,P(osbOuter),P(-s.studDepth),py,38,'11',6.5);
  hTechnical(c,P(-s.studDepth),P(-cavity),py,48,'70',7);
  hTechnical(c,P(-cavity),P(0),py,43,`${fmt(cavity)}`,6.5);
  hTechnical(c,P(0),P(board),py,48,'12.5',6.5);
  hTechnical(c,P(board-box),P(board),py+18,79,'35 box',6.5);
  hTechnical(c,P(-s.studDepth),P(0),py+18,88,`${fmt(s.studDepth)} stud depth`,6.5);
  c.text(`${fmt(board+cavity-box)} nominal clearance behind box`,195,96,6.5);
  // Main insulation thickness is measured on a separate unbroken slice.
  c.rect(P(-s.studDepth),104,mainPir*pk,7,white,black,.2);
  c.text('90 PIR',P(-s.studDepth+mainPir/2),108.5,7,true,'center');
  c.rect(P(0),104,board*pk,7,'floor',black,.2);
  hTechnical(c,P(-s.studDepth),P(-s.studDepth+mainPir),111,118,'90 elsewhere',6.5);
  // Enlarged cover profile and floor edge clarify the tight 2 mm gap.
  c.text('SKIRTING / FLOOR - ENLARGED',195,125,8,true);
  const sk=.23,sx=217,sy=191;
  const S=(x:number)=>sx+x*sk,T=(z:number)=>sy-(z-deckBase)*sk;
  c.rect(S(-45),T(masonry),45*sk,(masonry-deckBase)*sk,'masonry',black,.2);
  c.rect(S(0),T(masonry),upstand*sk,(masonry-deckBase)*sk,white,black,.2);
  c.rect(S(0),T(skirtTop+5),board*sk,(skirtTop+5-masonry)*sk,'floor',black,.2);
  const profile=[[board,skirtTop],[board+2,skirtTop],[board+4,skirtTop-8],[board+11,skirtTop-15],
    [board+8,skirtTop-24],[board+15,skirtTop-34],[skirtFace,skirtTop-47],[skirtFace,skirtBottom],
    [rebateBack,skirtBottom],[rebateBack,rebateTop],[board,rebateTop]];
  c.polygon(profile.map(([x,z])=>[S(x),T(z)]),'timber',black,.23);
  c.textVertical('30 PIR',S(upstand/2)+.8,T((masonry+deckBase)/2),6.5,true);
  let zz=deckBase;
  s.layers.slice(1).forEach(l=>{c.rect(S(upstand+floorGap),T(zz+l.thickness),120*sk,l.thickness*sk,'floor',black,.2);zz+=l.thickness;});
  c.line(S(-45),T(masonry),S(0),T(masonry),black,.5);
  c.line(S(0),T(masonry),S(0),T(deckBase),black,.5);
  hTechnical(c,S(0),S(upstand),T(deckBase),197,'30',6.5);
  hTechnical(c,S(board),S(skirtFace),T(skirtTop),133,'25',6.5);
  hTechnical(c,S(board),S(rebateBack),T(rebateTop),158,'19 rebate',6.5);
  vTechnical(c,T(skirtBottom),T(rebateTop),S(skirtFace),263,'145 rebate',6.5);
  vTechnical(c,T(skirtBottom),T(skirtTop),S(skirtFace),278,'220 overall',6.5);
  // Offset gap leaders deliberately show both tiny clearances without exaggerating them.
  const gapY=T(deckBase+12),gapX=S(upstand+floorGap/2);
  c.line(gapX,gapY,240,174,black,.13);c.text('2 perimeter gap',239,171,6.2,true);
  c.line(S(35),T(ffl+1),243,179,black,.13);c.text('2 above floor',244,180,6.2,true);
  c.text('31.5 cavity = 12.5 board + 19 rebate',195,202,6.2);
  c.text('Requested 2 mm floor gap is below typical 10 mm guidance. Socket set-out provisional; check box, seals and cable protection.',12,202,6.2);
  c.text(`Garden room framing set | lower wall cross section | page ${page} of ${total}`,148.5,208,6.4,false,'center');
  return c.stream();
}
