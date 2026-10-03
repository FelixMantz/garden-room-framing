import { drawTieChamfer } from './ties';
import { roofModel, roofCutSchedule, roofDeckNoggins, tieEndClearance } from "../roof";
import { buildModel, configForWall, type Settings } from "../framing";
import { rafterDimensions } from "../rafter-dimensions";
import { canvas, fmt, dimension, hTechnical, vTechnical } from "./layout";
export function drawRoof(settings:Settings,page:number,total:number,c=canvas()){
  const r=roofModel(settings),n=roofDeckNoggins(settings),cos=Math.cos(settings.roofPitch*Math.PI/180),f=(n:number)=>String(Number(n.toFixed(1)));
  c.text("Roof framing - centred set-out",12,11,14,true);
  c.text(`${r.count} ties, ${r.width} x ${r.depth} mm | every ${r.every} rafter bays (${r.every*r.centres} mm) | ${r.centres} mm common rafter centres`,12,17,8);
  c.text(`Outer timber frame ${r.length} x ${r.span} mm | ridge ${settings.ridgeWidth} x ${settings.ridgeDepth} mm | pitch ${settings.roofPitch} degrees`,12,22,7);
  if(r.rafters.length>=4)c.text(`End bays - gable end-rafter C/L to first regular rafter C/L: left ${f(r.rafters[1]-r.rafters[0])} mm; right ${f(r.rafters.at(-1)!-r.rafters.at(-2)!)} mm`,12,27,7);
  const scale=Math.min(213/(r.length+2*r.gableOverhang),106/(r.span+2*r.overhang));
  const X=(v:number)=>38+(v+r.gableOverhang)*scale,Y=(v:number)=>66+(v+r.overhang)*scale;
  const ridgeFront=(r.span-settings.ridgeWidth)/2,ridgeRear=(r.span+settings.ridgeWidth)/2;
  const tailFront=Y(-r.eavesTailRun),tailRear=Y(r.span+r.eavesTailRun);
  const fasciaFront=Y(-r.overhang),fasciaRear=Y(r.span+r.overhang);
  c.rect(X(0),Y(0),r.length*scale,r.span*scale,[250,250,250]);
  r.plates.forEach(p=>c.rect(X(p.x),Y(p.y),p.w*scale,p.h*scale,"plate",[0,0,0]));
  const pair=(x:number,fly=false)=>{
    const frontEnd=fly?r.span/2:ridgeFront,rearStart=fly?r.span/2:ridgeRear;
    // Separate plumb-ended members terminate at the two ridge faces.
    c.rect(X(x-settings.studFace/2),tailFront,settings.studFace*scale,(frontEnd+r.eavesTailRun)*scale,"timber");
    c.rect(X(x-settings.studFace/2),Y(rearStart),settings.studFace*scale,(r.span+r.eavesTailRun-rearStart)*scale,"timber");
  };
  r.rafters.forEach((x,i)=>{pair(x);c.text(String(i+1),X(x),tailFront-2,6,false,"center");});
  if(r.gableOverhang>0){
    r.outriggerRuns.forEach((run,i)=>{
      [0,r.span/4,3*r.span/4,r.span].forEach(y=>c.rect(X(run.start),Y(y-settings.studFace/2),(run.end-run.start)*scale,settings.studFace*scale,"outrigger"));
      pair(i===0?-r.flyRafterProjection:r.length+r.flyRafterProjection,true);
    });
  }
  // Fascia faces are the overall roof datums; timber sits inside them.
  const fasciaLeft=X(-r.gableOverhang),fasciaRight=X(r.length+r.gableOverhang);
  c.rect(fasciaLeft,fasciaFront,fasciaRight-fasciaLeft,r.fasciaThickness*scale,"timber");
  c.rect(fasciaLeft,tailRear,fasciaRight-fasciaLeft,r.fasciaThickness*scale,"timber");
  if(r.gableOverhang>0){
    c.rect(fasciaLeft,tailFront,r.fasciaThickness*scale,tailRear-tailFront,"timber");
    c.rect(fasciaRight-r.fasciaThickness*scale,tailFront,r.fasciaThickness*scale,tailRear-tailFront,"timber");
  }
  r.ties.forEach((x,i)=>{c.rect(X(x-r.width/2),Y(0),r.width*scale,r.span*scale,"tie");c.text(`T${i+1}: ${f(x)}`,X(x),tailRear+4,6,true,"center");});
  // Top-flush blocking follows the sheet seam on both slopes, including verge bays.
  n.blocks.forEach(b=>c.rect(X(b.x),Y(b.y-b.planWidth/2),b.length*scale,b.planWidth*scale,"outrigger",[0,0,0],.25));
  c.rect(X(0),Y(ridgeFront),r.length*scale,settings.ridgeWidth*scale,"ridge");

  c.text("FRONT WALL",X(r.middle),Y(settings.studDepth)+4,6,true,"center");
  c.text("REAR WALL",X(r.middle),Y(r.span-settings.studDepth)-2,6,true,"center");
  // External centre marks avoid bisecting the centre tie along its full length.
  c.line(X(r.middle),tailFront-3,X(r.middle),tailFront-1,[0,0,0],.15,[1,1]);
  c.line(X(r.middle),tailRear+1,X(r.middle),tailRear+2,[0,0,0],.15,[1,1]);
  hTechnical(c,X(-r.gableOverhang),X(r.length+r.gableOverhang),tailFront,36,`${f(r.length+2*r.gableOverhang)} outer fascia to outer fascia`,5.5);
  hTechnical(c,X(0),X(r.length),tailFront,42,`${f(r.length)} wall outer faces`,5.3);
  if(r.gableOverhang>0){
    hTechnical(c,X(-r.gableOverhang),X(0),tailFront,48,`${f(r.gableOverhang)} to fascia`,4.4);
    hTechnical(c,X(r.length),X(r.length+r.gableOverhang),tailFront,48,`${f(r.gableOverhang)} to fascia`,4.4);
  }
  if(r.rafters.length>=4){
    hTechnical(c,X(r.rafters[0]),X(r.rafters[1]),tailFront,54,`${f(r.rafters[1]-r.rafters[0])} C/L`,4.8);
    hTechnical(c,X(r.rafters.at(-2)!),X(r.rafters.at(-1)!),tailFront,54,`${f(r.rafters.at(-1)!-r.rafters.at(-2)!)} C/L`,4.8);
    hTechnical(c,X(0),X(r.rafters[1]),tailFront,60,`${f(r.rafters[1])} first regular C/L`,4.5);
    hTechnical(c,X(r.rafters.at(-2)!),X(r.length),tailFront,60,`${f(r.length-r.rafters.at(-2)!)} last C/L`,4.5);
  }
  const common=r.rafters.findIndex((x,i)=>i>0&&Math.abs(x-r.rafters[i-1]-r.centres)<.01);
  if(common>0)hTechnical(c,X(r.rafters[common-1]),X(r.rafters[common]),tailFront,54,`${f(r.centres)} C/C`,4.7);
  const edge=fasciaRight;
  vTechnical(c,fasciaFront,fasciaRear,edge,284,`${f(r.span+2*r.overhang)} H fascia overall depth`,5,"right");
  vTechnical(c,Y(0),Y(r.span),edge,278,`${f(r.span)} H wall outer / tie length`,4.8,"right");
  vTechnical(c,Y(settings.studDepth),Y(r.span-settings.studDepth),edge,272,`${f(r.span-2*settings.studDepth)} H clear between plates`,4.8,"right");
  vTechnical(c,Y(0),Y(ridgeFront),edge,266,`${f(ridgeFront)} H [${f(ridgeFront/cos)} S] wall - ridge face`,4.6,"right");
  vTechnical(c,Y(0),Y(settings.studDepth),edge,260,`${f(settings.studDepth)} H bearing`,4.4,"right");
  if(r.overhang>0){
    vTechnical(c,fasciaFront,Y(0),edge,254,`${f(r.overhang)} H to fascia`,4.5,"right");
    vTechnical(c,Y(r.span),fasciaRear,edge,254,`${f(r.overhang)} H to fascia`,4.5,"right");
  }
  vTechnical(c,tailFront,Y(ridgeFront),edge,248,`${f(ridgeFront+r.eavesTailRun)} H [${f(n.deckSlope)} S] tail - ridge face`,4.5,"right");
  if(n.blocks.length){
    vTechnical(c,Y(n.frontY),Y(ridgeFront),edge,242,`${f(n.fromRidgeHorizontal)} H [${f(n.fromRidgeSlope)} S] noggin C/L - ridge face`,4.4,"right");
    vTechnical(c,Y(ridgeRear),Y(n.rearY),edge,242,`${f(n.fromRidgeHorizontal)} H [${f(n.fromRidgeSlope)} S] ridge face - noggin C/L`,4.4,"right");
  }
  const outerX=fasciaLeft;
  [0,r.span/4,3*r.span/4].forEach((y,i)=>{
    const end=[r.span/4,3*r.span/4,r.span][i];
    if(r.outriggerRuns.length){
      const sameSlope=end<=r.span/2||y>=r.span/2;
      vTechnical(c,Y(y),Y(end),outerX,25,`${f(end-y)} H${sameSlope?` [${f((end-y)/cos)} S]`:''} outrigger C/C`,4.7,"left");
    }
  });
  vTechnical(c,Y(ridgeFront),Y(ridgeRear),X(0),32,`${f(settings.ridgeWidth)} H ridge`,4.4,"left");
  const leftRun=r.outriggerRuns[0];
  if(leftRun)hTechnical(c,X(leftRun.start),X(leftRun.end),Y(r.span/4),Y(r.span/4)-5,`${f(leftRun.end-leftRun.start)} clear`,4.5);
  hTechnical(c,X(0),X(r.ties[0]),tailRear,tailRear+10,`${f(r.ties[0])} first tie C/L`,4.7);
  for(let i=1;i<r.ties.length;i++)hTechnical(c,X(r.ties[i-1]),X(r.ties[i]),tailRear,tailRear+10,`${f(r.ties[i]-r.ties[i-1])} tie C/C`,4.7);
  hTechnical(c,X(r.ties.at(-1)!),X(r.length),tailRear,tailRear+10,`${f(r.length-r.ties.at(-1)!)} last tie C/L`,4.7);
  // Short face dimensions have their own staggered rails beneath the roof.
  hTechnical(c,X(r.ties[0]-r.width/2),X(r.ties[0]+r.width/2),tailRear,tailRear+16,`${f(r.width)} tie width`,4.5);
  hTechnical(c,X(r.ties[0]),X(r.ties[0]+r.offset),tailRear,tailRear+22,`${f(r.offset)} tie/rafter C/L`,4.5);
  c.text(`${n.blocks.length} noggins ${settings.studFace} x ${settings.studDepth}: top faces flush with roof deck; 1,200 mm ridge row + 3 mm OSB joint. Cut lengths: page 10.`,12,196.5,6);
  c.text(`H = horizontal plan distance; [S] = along one ${settings.roofPitch} deg roof slope. Across-ridge totals use H only. C/L = centreline; C/C = centres.`,12,200,6);
  c.text(`Garden room framing set | page ${page} of ${total} | verify structural sizing and as-built dimensions before cutting`,148.5,205,6.2,false,"center",[90,90,90]);
  return c.stream();
}

export function drawRoofSchedule(settings:Settings,page:number,total:number){
 const c=canvas(),r=roofModel(settings);
 c.text("Roof cutting and set-out schedules",12,14,16,true);
 c.text("Dimensions in mm | gable rafters and top plates are counted on the wall schedules",12,23,8);
 const rows=roofCutSchedule(settings);
 c.text("ROOF CUTTING SCHEDULE",12,34,10,true);
 const xs=[12,80,98,124,160];
 ["Component","Qty","Section","Length","Cut / allowance"].forEach((v,i)=>c.text(v,xs[i],43,8,true));
 rows.forEach((r,i)=>{const y=52+i*7;[r.type,String(r.qty),r.section,fmt(r.length),r.cut].forEach((v,j)=>c.text(v,xs[j],y,7.3));c.line(12,y+2.5,285,y+2.5);});
 const clearance=tieEndClearance(settings);
 c.text(clearance.projection>.01
   ?`TIE CHAMFERS: both top corners, ${fmt(settings.roofPitch)} deg; ${fmt(clearance.projection)} vertical cut x ${fmt(clearance.run)} horizontal run.`
   :'TIE ENDS: no chamfer required; square ends clear the rafter upper plane.',12,116,7,true);
 c.text(`Full ${fmt(settings.tieWidth)} mm width; end depth ${fmt(clearance.remainingDepth)}. Keep underside flat and overall length ${fmt(r.span)} unchanged.`,12,121,7);
 c.text("RAFTER PAIRS / SET-OUT",12,130,10,true);
 c.text("Pair / position / previous bay (mm)",12,136,8);
 if(r.rafters.length>60)throw new Error("Roof schedule supports up to 60 rafter pairs.");
 r.rafters.forEach((x,i)=>{const col=Math.floor(i/15),row=i%15;c.text(`${i+1} / ${fmt(x)} / ${i?fmt(x-r.rafters[i-1]):"-"}`,12+col*55,142+row*3.3,7);});
 drawTieChamfer(settings,c,true);
 c.text(`Tie positions: ${r.ties.map(fmt).join(", ")} from left wall outer face`,12,198,7);
 c.text(`Garden room framing set | roof schedule | page ${page} of ${total}`,148.5,205,6.4,false,"center");
 return c.stream();
}

export function drawCuts(settings:Settings,page:number,total:number){
  const cfg=configForWall(settings,'left'),members=buildModel(cfg),m=members.find(m=>m.type==="gable end rafter")!,d=rafterDimensions(m),c=canvas();
  c.text("Gable rafters - dimensions and cut angles",12,11,14,true);
  c.text("Applies to both gable ends; opposite slope is mirrored. All dimensions in mm; angles in degrees.",12,18,8);
  c.text(`Roof pitch ${fmt(d.pitch)} deg | section ${cfg.studFace} x ${cfg.studDepth} | ${fmt(cfg.gableOverhang)} wall to outer fascia = ${fmt(cfg.eavesTailRun)} to tail + 22 fascia`,12,24,8);
  const sc=Math.min(118/d.run,53/(d.rise+d.verticalDepth)),X=(x:number)=>22+(x-m.x1!)*sc,Y=(y:number)=>92-(y-m.y1!)*sc;
  c.polygon(d.cutPolygon.map(p=>[X(p[0]),Y(p[1])]),"timber");
  c.line(X(m.x1!),Y(m.y1!),X(m.x2!),Y(m.y1!),[90,110,115],.15,[2,1]);
  dimension(c,[X(m.x1!),103],[X(m.x2!),103],`${fmt(d.run)} horizontal tail-to-ridge-face run`);
  dimension(c,[X(m.x2!)+6,Y(m.y1!)],[X(m.x2!)+6,Y(m.y2!)],`${fmt(d.rise)} rise`,true);
  c.text(`Long edge ${fmt(d.length)} between plumb cuts`,X((m.x1!+m.x2!)/2),45,8,true,"center");
  const arc=(cx:number,cy:number,radius:number,start:number,end:number)=>{
    for(let i=0;i<16;i++){
      const a=(start+(end-start)*i/16)*Math.PI/180,b=(start+(end-start)*(i+1)/16)*Math.PI/180;
      c.line(cx+radius*Math.cos(a),cy+radius*Math.sin(a),cx+radius*Math.cos(b),cy+radius*Math.sin(b),[24,107,120],.22);
    }
  };
  const rt=d.polygon[1];
  arc(X(rt[0]),Y(rt[1]),7,90,180-d.pitch);
  c.text(`${fmt(d.plumb)} deg`,X(rt[0])+10,Y(rt[1])+5,7,true);
  c.text(`Ridge plumb: ${fmt(d.plumb)} deg to long edge`,160,32,8,true);
  hTechnical(c,X(m.x1!),X(m.bearingX!),Y(m.y1!),98,`${fmt(m.bearingX!-m.x1!)} tail - heel`,5.1);
  hTechnical(c,X(m.bearingX!),X(m.x2!),Y(m.y1!),98,`${fmt(m.x2!-m.bearingX!)} heel - ridge`,5.1);
  const tailTop=d.cutPolygon[0],tailFlatEnd=d.cutPolygon.at(-2)!,tailFaceBottom=d.cutPolygon.at(-1)!;
  vTechnical(c,Y(tailTop[1]),Y(tailFaceBottom[1]),X(m.x1!),17,`${fmt(d.tailPlumbFace)} fascia face`,5,"left");
  hTechnical(c,X(m.x1!),X(tailFlatEnd[0]),Y(tailFlatEnd[1]),90,`${fmt(d.tailFlatRun)} horizontal soffit cut`,4.8);
  c.text(`${fmt(cfg.studDepth)} stock depth (normal to edge)`,20,62,6.3,true);
  c.line(53,64,X((m.x1!+m.x2!)/2),Y((m.y1!+m.y2!)/2),[0,0,0],.1);
  c.text(`${fmt((m.x2!-m.bearingX!)/Math.cos(d.pitch*Math.PI/180))} heel - ridge along edge`,20,54,6.3,true);
  c.text(`Tail: ${fmt(d.tailPlumbFace)} mm plumb fascia face, then horizontal underside cut`,12,111,8,true);
  c.text(`Fascia face / long edge: ${fmt(d.plumb)} deg; underside cut is 90 deg to fascia face`,12,117,8);
  const gableStuds=members.filter(stud=>stud.type==="gable stud"||stud.type==="gable apex stud");
  const leftStud=gableStuds.find(stud=>stud.x!<cfg.width/2&&stud.topRight!>stud.topLeft!);
  const rightStud=gableStuds.find(stud=>leftStud&&Math.abs(stud.x!-(cfg.width-leftStud.x!-cfg.studFace))<.001);
  const topCutRise=cfg.studFace*Math.tan(cfg.roofPitch*Math.PI/180);
  c.text("GABLE STUD TOP CUTS - SIDE FACE",160,43,9,true);
  c.text("LEFT SLOPE",173,51,7,true);
  c.text("RIGHT SLOPE",237,51,7,true);
  const drawStudTop=(stud:typeof leftStud,x:number)=>{
    if(!stud)return;
    const slope=Math.tan(cfg.roofPitch*Math.PI/180);
    const width=Math.min(18,20/slope),bottom=83,high=58,low=high+width*slope;
    const risesRight=stud.topRight!>stud.topLeft!;
    c.polygon([[x,bottom],[x+width,bottom],[x+width,risesRight?high:low],[x,risesRight?low:high]],"timber");
    c.line(x,low,x+width,low,[0,0,0],.12,[1,1]);
    c.text(`${fmt(cfg.roofPitch)} deg`,x+width+2,low-2,6.5,true);
    // A break keeps the top angle legible; dimensions retain the full cut lengths.
    c.line(x,78,x+width/2,80,[0,0,0],.2);c.line(x+width/2,80,x+width,78,[0,0,0],.2);
    hTechnical(c,x,x+width,bottom,88,`${fmt(cfg.studFace)} face`,5.4);
    const long=Math.max(stud.topLeft!,stud.topRight!),short=Math.min(stud.topLeft!,stud.topRight!);
    vTechnical(c,bottom,high,x+width,x+width+9,`${fmt(long)} long`,5,"right");
    vTechnical(c,bottom,low,x,x-6,`${fmt(short)} short`,5,"left");
    c.text(`C/L ${fmt(stud.x!+cfg.studFace/2)} from wall left`,x+width/2,93,5,false,"center");
  };
  drawStudTop(leftStud,178);
  drawStudTop(rightStud,241);
  c.text(`Top cut: ${fmt(cfg.roofPitch)} deg from square (${fmt(90-cfg.roofPitch)} deg to stud edge).`,160,97,7);
  c.text(`Long - short = ${fmt(topCutRise)} across the ${fmt(cfg.studFace)} mm face.`,160,103,7);
  c.text("Wall schedules give the long-edge length from square foot.",160,109,7);
  c.text("Mirror for the opposite slope; ridge support has a square top.",160,115,7);
  c.text("Birdsmouth - full-width plate seat",12,129,10,true);
  const bx=m.bearingX!,by=m.bearingY!,tan=Math.tan(d.pitch*Math.PI/180);
  const l=m.x1!,r=bx+d.seat+50;
  const ds=Math.min(.22,24/(d.heel+(bx-l)*tan),68/(r-l));
  const xx=(x:number)=>16+(x-l)*ds,yy=(y:number)=>161-(y-by)*ds;
  const top=(x:number)=>m.y1!+(x-m.x1!)*tan+d.verticalDepth/2;
  // Include the tail plumb face so the birdsmouth can be set out from the end.
  c.rect(xx(bx),yy(by),cfg.studDepth*ds,10,"plate");
  const tailTopY=top(l),tailFlatY=tailTopY-d.tailPlumbFace,tailFlatEndX=l+d.tailFlatRun;
  c.polygon([[xx(l),yy(tailTopY)],[xx(r),yy(top(r))],[xx(r),yy(by+(r-bx-d.seat)*tan)],[xx(bx+d.seat),yy(by)],[xx(bx),yy(by)],[xx(bx),yy(by-d.heel)],[xx(tailFlatEndX),yy(tailFlatY)],[xx(l),yy(tailFlatY)]],"timber");
  vTechnical(c,yy(tailTopY),yy(tailFlatY),xx(l),xx(l)-5,`${fmt(d.tailPlumbFace)} face`,4.5,"left");
  hTechnical(c,xx(l),xx(tailFlatEndX),yy(tailFlatY),179,`${fmt(d.tailFlatRun)} horizontal soffit cut`,6);
  c.line(xx(bx)+2,yy(by)-2,xx(bx)+5,yy(by)-2,[24,107,120],.2);
  c.line(xx(bx)+5,yy(by)-2,xx(bx)+5,yy(by)+1,[24,107,120],.2);
  c.text("90 deg",xx(bx)+7,yy(by)-3,7,true);
  const cos=Math.cos(d.pitch*Math.PI/180),sin=Math.sin(d.pitch*Math.PI/180);
  const tailToHeel=(bx-l)/cos;
  if(bx>l+.01){
    const tail=[xx(l),yy(top(l))],heel=[xx(bx),yy(top(bx))];
    const a=[tail[0]-4*sin,tail[1]-4*cos],b=[heel[0]-4*sin,heel[1]-4*cos];
    c.line(tail[0],tail[1],a[0],a[1],[0,0,0],.11);
    c.line(heel[0],heel[1],b[0],b[1],[0,0,0],.11);
    c.line(a[0],a[1],b[0],b[1],[0,0,0],.14);
    for(const p of [a,b])c.line(p[0]-sin,p[1]-cos,p[0]+sin,p[1]+cos,[0,0,0],.14);
    c.text(`${fmt(tailToHeel)} along slope (${fmt(bx-l)} horiz)`,(a[0]+b[0])/2,Math.min(a[1],b[1])-4,6.2,true,"center");
  }else c.text("Heel at tail (0 overhang)",16,139,6.5,true);
  const heelDimX=xx(bx)-3,heelTop=yy(by),heelBottom=yy(by-d.heel);
  c.line(heelDimX,heelTop,heelDimX,heelBottom,[0,0,0],.14);
  for(const y of [heelTop,heelBottom])c.line(heelDimX-1,y+1,heelDimX+1,y-1,[0,0,0],.14);
  c.line(heelDimX,heelBottom,xx(bx)+3,heelBottom+7,[0,0,0],.10);
  c.text(`${fmt(d.heel)} heel (vertical)`,xx(bx)+4,heelBottom+11,6.2,true);
  vTechnical(c,yy(top(bx)),yy(by),xx(bx),xx(r)+5,`${fmt(top(bx)-by)} above heel`,4.8,"right");
  vTechnical(c,yy(top(bx+d.seat)),yy(by),xx(bx+d.seat),xx(r)+11,`${fmt(d.verticalDepth)} toe plumb`,4.8,"right");
  hTechnical(c,xx(l),xx(bx+d.seat),yy(by-d.heel),190,`${fmt(bx+d.seat-l)} tail - toe (horizontal)`,5.1);
  dimension(c,[xx(bx),185],[xx(bx+d.seat),185],`${fmt(d.seat)} seat`);
  c.text(`Tail cut: ${fmt(d.tailPlumbFace)} plumb face + ${fmt(d.tailFlatRun)} horizontal underside`,118,139,7.4,true);
  c.text(`Heel cut ${fmt(d.heel)} vertical; seat cut ${fmt(d.seat)} horizontal`,118,146,7.4,true);
  c.text(`Notch depth ${fmt(d.notchNormal)} normal to rafter`,118,153,7.4);
  c.text(`Plate bearing ${fmt(cfg.studDepth)} (full-width seat)`,118,160,7.4);
  c.text(`Seat / long edge: ${fmt(d.pitch)} deg; heel / long edge: ${fmt(d.plumb)} deg`,118,167,7.4);
  c.text("Seat and heel cuts meet at 90 deg.",118,174,7.4);
  c.text(`Tail to seat toe: ${fmt(bx+d.seat-l)} horizontal / ${fmt((bx+d.seat-l)/cos)} along edge`,118,181,7.0);
  c.text(`Heel to ridge face: ${fmt((m.x2!-bx)/cos)} along edge`,118,187,7.0);
  c.text("Tail underside cut is horizontal and 90 degrees to the 20 mm plumb fascia face.",12,193,7.5);
  c.text("Horizontal rafter run ends at the ridge face; ridge width is excluded from the run.",12,198,7);
  c.text(`Garden room framing set | page ${page} of ${total} | dimensioned model, not a verified cutting template`,148.5,205,6.2,false,"center",[90,90,90]);
  return c.stream();
}
