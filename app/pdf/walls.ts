import { buildModel, doorLintelToLowerTopPlate, makeSchedule, scheduleGroups, wallStudCentres, wallOrder, type Member, type WallConfig } from "../framing";
import { rafterDimensions } from "../rafter-dimensions";
import { canvas, clean, fmt, wrapText, hTechnical as drawH, vTechnical as drawV, BRICK_DATUM_DASH, type Fill } from "./layout";
import { textWidth } from '../pdf-font-widths';
import { dimensionRails } from './dimension-rails';
export function drawWallSchedule(cfg:WallConfig,members:Member[],page:number,total:number,part:"Wall"|"Gable"="Wall"){
  const c=canvas();
  c.text(`${cfg.name} - cutting schedule${cfg.gable?` - ${part.toLowerCase()}`:""}`,12,14,16,true);
  c.text(`For technical elevation T-${wallOrder.indexOf(cfg.id)+1} | dimensions in mm | quantities include lintel plies`,12,23,8);
  const cols=[90,15,26,42,100],tx=12; let y=33;
  const xs=cols.map((_,i)=>tx+cols.slice(0,i).reduce((a,b)=>a+b,0));
  for(const group of scheduleGroups(cfg,members).filter(group=>group.name===part)){
  if(cfg.gable){c.text(`${group.name.toUpperCase()} CUTTING LIST`,tx,y+5,9,true);y+=10;}
  const rows=makeSchedule(cfg,group.members);
  c.rect(tx,y,273,8); ["Component / use","Qty","Cut length","Section / cut","Notes"].forEach((v,i)=>c.text(v,xs[i]+2,y+5.3,7,true)); y+=8;
  for(const row of rows){
    const values=[row.type,String(row.qty),row.lengthLabel,row.section.split(";")[0]+(row.cut==="rafter"?"; plumb + seat":row.cut==="angled stud"?"; angled top":"; square"),row.section.split(";").slice(1).join(";")];
    const lines=values.map((v,i)=>wrapText(v,cols[i]-4,6.5));
    const height=Math.max(7,Math.max(...lines.map(v=>v.length))*3+2);
    if(y+height>193)throw new Error("Wall cutting schedule exceeds page capacity.");
    lines.forEach((ls,i)=>ls.forEach((v,j)=>c.text(v,xs[i]+2,y+4+j*3,6.5,i===1||i===2)));
    y+=height;c.line(tx,y,285,y);
  }
  y+=8;
  }
  c.text(cfg.gable?(part==="Gable"?"Rafters: overall board length (detail p. 13). Other angled cuts: long side (short side). Gable sole plate = upper top plate.":"Upper top plate is included in the separate gable cutting list as the gable sole plate."):"Quantities include both lintel plies where applicable.",12,199,7);
  c.text(`Garden room framing set | cutting schedule | page ${page} of ${total}`,148.5,205,6.4,false,"center");
  return c.stream();
}

export function drawWallTechnical(cfg:WallConfig,members:Member[],page:number,total:number,c=canvas()){
  const horizontal:Parameters<typeof drawH>[]=[],vertical:Parameters<typeof drawV>[]=[];
  const hTechnical=(...args:Parameters<typeof drawH>)=>{if(cfg.id==='front')drawH(...args);else horizontal.push(args);};
  const vTechnical=(...args:Parameters<typeof drawV>)=>{vertical.push(args);};
  const W=297;
  c.text(`${cfg.name} - dimensioned elevation`,12,11,14,true);
  c.text(`Drawing T-${wallOrder.indexOf(cfg.id)+1} | dimensions in mm | elevation viewed from outside | do not scale`,12,18,7.5);
  c.text(`Timber ${cfg.studFace} x ${cfg.studDepth} | ${cfg.studCentres} C/C | ${cfg.topPlates} top plates | California corners`,12,23,7);
  c.text("Dot-dash: brick datum / witnesses. Solid: timber-frame witnesses and dimension bars. Opening chain uses timber-frame faces.",12,28,6);
  // Dimension rails use external projected datums: never extend centreline witnesses down the length of studs.
  const area={x:50,y:cfg.gable?50:cfg.id==='front'?51:45,w:190,h:cfg.gable?111:cfg.id==='front'?110:116};
  const domainX=cfg.maxX-cfg.minX,domainY=cfg.maxY+cfg.frameBase;
  const scale=Math.min(area.w/domainX,area.h/domainY),usedW=domainX*scale,usedH=domainY*scale;
  const ox=area.x+(area.w-usedW)/2-cfg.minX*scale,top=area.y+(area.h-usedH)/2;
  const X=(v:number)=>ox+v*scale,Y=(v:number)=>top+(cfg.maxY-v)*scale;
  const slab=Y(-cfg.frameBase),sole=Y(0),wallTop=Y(cfg.wallHeight),ffl=Y(cfg.ffl-cfg.frameBase);
  {
    const doorCuts=cfg.computedOpenings.filter(o=>o.type==="door"&&o.sill<0).sort((a,b)=>a.x-b.x);
    for(let course=0;course<cfg.brickCourses;course++){
      const cuts=course===0?[]:doorCuts,y=-cfg.frameBase+course*cfg.courseHeight;let x=cfg.brickStart;
      for(const o of cuts){if(o.x>x)c.rect(X(x),Y(y+cfg.courseHeight),(o.x-x)*scale,cfg.courseHeight*scale,"masonry");x=o.x+o.width;}
      if(cfg.brickEnd>x)c.rect(X(x),Y(y+cfg.courseHeight),(cfg.brickEnd-x)*scale,cfg.courseHeight*scale,"masonry");
    }
  }
  c.line(X(cfg.minX),ffl,X(cfg.maxX),ffl,[0,0,0],.14,[2,1]);c.text("FFL",X(cfg.maxX)+2,ffl+1,6,true);
  cfg.computedOpenings.forEach(o=>{c.rect(X(o.x),Y(o.sill+o.height),o.width*scale,o.height*scale,[255,255,255],[0,0,0],.18);});
  members.forEach(m=>{
    const fill:Fill=m.corner?"corner":m.type.includes('lintel')?"lintel":"timber";
    if(m.shape==='slope')c.polygon(rafterDimensions(m).cutPolygon.map(p=>[X(p[0]),Y(p[1])]),fill,[0,0,0],.10);
    else if(m.topLeft!==undefined&&m.topRight!==undefined){const x=m.x||0,y=m.y||0,w=m.w||0;c.polygon([[X(x),Y(y)],[X(x+w),Y(y)],[X(x+w),Y(y+m.topRight)],[X(x),Y(y+m.topLeft)]],fill,[0,0,0],.10);}
    else c.rect(X(m.x||0),Y((m.y||0)+(m.h||0)),Math.max(.18,(m.w||0)*scale),Math.max(.18,(m.h||0)*scale),fill,[0,0,0],.10);
  });
  if(cfg.gable)c.rect(X(cfg.width/2-cfg.ridgeWidth/2),Y(cfg.ridgeTop),cfg.ridgeWidth*scale,cfg.ridgeDepth*scale,"ridge",[0,0,0],.18);
  // Top rails start above the whole gable; bottom rails start below masonry.
  // Their x coordinates still refer to the labelled faces or centrelines.
  const topWitness=Y(cfg.maxY)-1,bottomWitness=slab+1;
  // Overall and plate chain dimensions.
  hTechnical(c,X(0),X(cfg.width),topWitness,area.y-15,`${fmt(cfg.width)} frame body`,6.1);
  hTechnical(c,X(cfg.upperStart),X(cfg.upperEnd),topWitness,area.y-9,`${fmt(cfg.upperEnd-cfg.upperStart)} upper top plate`,5.6);
  if(cfg.id==="front"){
    const [leftWindow,door]=cfg.computedOpenings;
    const leftWindowKingInner=leftWindow.x-cfg.studFace;
    const doorKingInner=door.x-cfg.studFace;
    hTechnical(c,X(0),X(doorKingInner),topWitness,area.y-3,`${fmt(doorKingInner)} D2 L king inner`,4.2);
    hTechnical(c,X(0),X(leftWindowKingInner),topWitness,area.y+3,`${fmt(leftWindowKingInner)} W1 L king inner`,3.8);
  }
  hTechnical(c,X(cfg.brickStart),X(cfg.brickEnd),slab,area.y+area.h+(cfg.id==='front'?28:10),`${fmt(cfg.brickBody)} brick run`,5.7,BRICK_DATUM_DASH);
  // Opening widths and horizontal set-out from wall origin.
  const openingDimY=area.y+area.h+(cfg.id==='front'?10:4);
  if(cfg.id!=="front")cfg.computedOpenings.forEach(o=>hTechnical(c,X(o.x),X(o.x+o.width),bottomWitness,openingDimY,`${fmt(o.width)} clear`,5.2));
  // King outside faces are the faces away from the opening; each king is
  // one studFace thick towards its opening. These datums precede jack fitting.
  const kingFaces=cfg.computedOpenings.flatMap(o=>[o.x-2*cfg.studFace,o.x+o.width+2*cfg.studFace]);
  const points=[0,...(cfg.id==="front"?kingFaces:cfg.computedOpenings.flatMap(o=>[o.x,o.x+o.width])),cfg.width].sort((a,b)=>a-b);
  if(cfg.id==="front"){
    kingFaces.forEach((x,i)=>c.text(`K${i+1}`,X(x),openingDimY,4.5,true,"center"));
    c.text("King outside-face chain (45 mm towards opening)",X(cfg.width/2),openingDimY-3,5,true,"center");
  }
  for(let i=0;i<points.length-1;i++)if(points[i+1]-points[i]>1)hTechnical(c,X(points[i]),X(points[i+1]),bottomWitness,area.y+area.h+16,fmt(points[i+1]-points[i]),4.5);
  // The front-wall brick returns above the threshold are set out from the
  // outside masonry corners, rather than from the timber-frame origin.
  const brickDoor=cfg.id==="front"?cfg.computedOpenings.find(o=>o.type==="door"):undefined;
  if(brickDoor){
    const brickSetOutY=area.y+area.h+22;
    hTechnical(c,X(cfg.brickStart),X(brickDoor.x),slab,brickSetOutY,`${fmt(brickDoor.x-cfg.brickStart)} L brick return (courses 2-4)`,4.5,BRICK_DATUM_DASH);
    hTechnical(c,X(brickDoor.x+brickDoor.width),X(cfg.brickEnd),slab,brickSetOutY,`${fmt(cfg.brickEnd-brickDoor.x-brickDoor.width)} R brick return (courses 2-4)`,4.5,BRICK_DATUM_DASH);
  }
  // Opening vertical chains are allocated to the nearest side margin. Only witness lines enter the framing field.
  let leftRail=area.x-2,rightRail=area.x+area.w+2;
  const nextRail=(side:"left"|"right")=>side==="left"?(leftRail-=5):(rightRail+=5);
  cfg.computedOpenings.forEach((o,i)=>{
    const side:"left"|"right"=cfg.id==='front'&&o.type==='door'?'right':o.x+o.width/2<cfg.width/2?"left":"right";
    const tag=`${o.type==='door'?'D':'W'}${o.id}`;
    const featureX=side==="left"?X(cfg.minX)-1:X(cfg.maxX)+1;
    const duplicateFrontWindow=cfg.id==='front'&&o.type==='window'&&cfg.computedOpenings.some(previous=>previous.id<o.id&&previous.type==='window'&&previous.width===o.width&&previous.height===o.height&&previous.level===o.level);
    if(!duplicateFrontWindow){
      vTechnical(c,Y(o.sill),Y(o.sill+o.height),featureX,nextRail(side),`${tag} ${fmt(o.height)} clear`,4.6,side);
      vTechnical(c,o.type==='window'?sole:ffl,Y(o.sill),featureX,nextRail(side),`${tag} ${fmt(o.level)} ${o.type==='door'?'opening base / FFL':'sill / sole'}`,4.3,side);
      vTechnical(c,Y(o.sill+o.height),Y(o.sill+o.height+cfg.headerDepth),featureX,nextRail(side),`${tag} ${fmt(cfg.headerDepth)} lintel`,4.1,side);
      if(o.type==='door')vTechnical(c,Y(o.sill+o.height),Y(cfg.wallHeight-cfg.plates),featureX,nextRail(side),`${tag} ${fmt(doorLintelToLowerTopPlate(cfg,o))} lintel U/S - plate U/S`,3.9,side);
    }
    c.text(`${o.type.toUpperCase()} ${o.id}: ${fmt(o.width)} x ${fmt(o.height)} clear`,X(o.x+o.width/2),Y(o.sill+o.height/2),5.2,true,"center");
  });
  if(cfg.gable){
    vTechnical(c,wallTop,Y(cfg.ridgeBottom),X(cfg.width/2),nextRail("right"),`${fmt(cfg.ridgeBottom-cfg.wallHeight)} wall top - ridge U/S`,4.3,"right");
    vTechnical(c,Y(cfg.ridgeBottom),Y(cfg.ridgeTop),X(cfg.width/2),nextRail("right"),`${fmt(cfg.ridgeDepth)} ridge`,4.3,"right");
    const run=(cfg.frameDepth-cfg.ridgeWidth)/2;
    hTechnical(c,X(cfg.upperStart),X(cfg.width/2-cfg.ridgeWidth/2),topWitness,area.y-15,`${fmt(run)} horizontal run`,5.0);
    const grid=wallStudCentres(cfg);
    const first=grid[0],last=grid.at(-1),centre=cfg.width/2;
    const leftOfRidge=[...grid].reverse().find(x=>x<centre-.01);
    if(first!==undefined)hTechnical(c,X(0),X(first),bottomWitness,area.y+area.h+22,`${fmt(first)} first stud C/L from left`,3.9);
    if(leftOfRidge!==undefined)hTechnical(c,X(leftOfRidge),X(centre),bottomWitness,area.y+area.h+22,`${fmt(centre-leftOfRidge)} stud C/C to ridge`,3.9);
    if(last!==undefined)hTechnical(c,X(last),X(cfg.width),bottomWitness,area.y+area.h+22,`${fmt(cfg.width-last)} first stud C/L from right`,3.9);
    c.text(`${fmt(cfg.roofPitch)} deg roof pitch`,285,23,6.2,true,"right");
  }
  // Overall datums are outermost, beyond the opening and gable rails.
  vTechnical(c,slab,sole,X(cfg.brickStart),nextRail("left"),`${fmt(cfg.frameBase)} masonry`,5.2,"left");
  vTechnical(c,sole,wallTop,X(0),nextRail("left"),`${fmt(cfg.wallHeight)} frame`,5.4,"left");
  vTechnical(c,slab,ffl,X(cfg.brickEnd),nextRail("right"),`${fmt(cfg.ffl)} slab to FFL`,5.1,"right");
  vTechnical(c,ffl,wallTop,X(cfg.width),nextRail("right"),`${fmt(cfg.frameBase+cfg.wallHeight-cfg.ffl)} FFL to wall top`,5.0,"right");
  // Assembly rails: dimensions refer to real member faces, outside the field.
  const leftLap=Math.abs(cfg.upperStart),rightLap=Math.abs(cfg.upperEnd-cfg.width);
  const lapRail=area.y+(cfg.id==="front"?9:3);
  hTechnical(c,X(Math.min(0,cfg.upperStart)),X(Math.max(0,cfg.upperStart)),topWitness,lapRail,`${fmt(leftLap)} lap`,4.7);
  hTechnical(c,X(Math.min(cfg.width,cfg.upperEnd)),X(Math.max(cfg.width,cfg.upperEnd)),topWitness,lapRail,`${fmt(rightLap)} lap`,4.7);
  const noggin=members.find(m=>m.type==="noggin"),studTop=cfg.wallHeight-cfg.plates;
  if(noggin){
    hTechnical(c,X(noggin.x!),X(noggin.x!+noggin.w!),bottomWitness,area.y+area.h+(cfg.id==='front'?4:28),`${fmt(noggin.w!)} noggin / clear bay`,4.6);
    vTechnical(c,sole,Y(noggin.y!+noggin.h!),X(0),nextRail("left"),`${fmt(noggin.y!+noggin.h!)} sole U/S - noggin top`,4.5,"left");
    vTechnical(c,Y(noggin.y!+noggin.h!),Y(studTop),X(cfg.width),nextRail("right"),`${fmt(studTop-noggin.y!-noggin.h!)} clear PIR / noggin top - plate U/S`,4.5,"right");
    c.text("Full-height bays: 1200 mm-high x bay-width 90 mm PIR above aligned noggins; foam fitting gaps. Openings interrupt the row.",12,33,6);
  }
  vTechnical(c,Y(cfg.studFace),Y(studTop),X(0),nextRail("left"),`${fmt(studTop-cfg.studFace)} stud cut`,4.9,"left");
  vTechnical(c,sole,Y(cfg.studFace),X(0),nextRail("left"),`${fmt(cfg.studFace)} sole`,4.3,"left");
  vTechnical(c,Y(studTop),wallTop,X(cfg.width),nextRail("right"),`${fmt(cfg.plates)} plates`,4.3,"right");
  if(cfg.id!=='front'){
    for(const band of ['top','bottom'] as const){
      const candidates=horizontal.filter(a=>(a[4]<area.y+area.h/2?'top':'bottom')===band);
      // Opening-chain widths and clear-width dimensions share identical endpoints.
      // Keep the explicit clear-opening label rather than drawing duplicate bars.
      const unique=candidates.filter(a=>!candidates.some(b=>b!==a&&Math.abs(a[1]-b[1])<.01&&Math.abs(a[2]-b[2])<.01&&b[5].includes('clear')&&!a[5].includes('clear')));
      for(const d of dimensionRails(unique.map(a=>({start:a[1],end:a[2],labelExtent:textWidth(clean(a[5]),a[6]??5.7,true)*25.4/72,value:a})))){
        const args=[...d.value] as Parameters<typeof drawH>;
        args[4]=band==='top'?area.y+3-d.rail*6:area.y+area.h+4+d.rail*5;
        drawH(...args);
      }
    }
  }
  for(const side of ['left','right'] as const){
    const candidates=vertical.filter(a=>(a[4]<area.x+area.w/2?'left':'right')===side);
    for(const d of dimensionRails(candidates.map(a=>({start:a[1],end:a[2],labelExtent:textWidth(clean(a[5]),a[6]??5.7,true)*25.4/72,value:a})))){
      const args=[...d.value] as Parameters<typeof drawV>;
      args[4]=side==='left'?area.x-7-d.rail*4.2:area.x+area.w+7+d.rail*4.2;
      drawV(...args);
    }
  }
  const notesY=191;
  c.text("SETTING-OUT NOTES",12,notesY,8,true);
  const grid=wallStudCentres(cfg);
  const gridNote=cfg.id==="front"?"Front studs and window cripples: right-hand positions mirror the left across the wall centre.":cfg.gable?`Ridge-centred grid: first C/L ${fmt(grid[0]||0)} from left and ${fmt(cfg.width-(grid.at(-1)||cfg.width))} from right.`:`Stud grid phase ${fmt(cfg.studOffset)}; opening trimmers replace intersecting grid studs.`;
  c.text(cfg.id==="front"
    ? `King outside faces from LEFT frame end: ${kingFaces.map((x,i)=>`K${i+1} ${fmt(x)}`).join(" | ")}. Each king extends 45 mm towards its opening.`
    : `${gridNote} Witness lines start outside the frame; levels use sole underside unless labelled.`,12,196,6);
  const door=cfg.computedOpenings.find(o=>o.type==="door"&&o.sill<0);
  c.text(door?`Door threshold is one brick course: top +${fmt(cfg.courseHeight)} slab; structural opening base +${fmt(door.sill+cfg.frameBase)} slab.`:`Square frame body: both diagonals ${fmt(Math.hypot(cfg.width,cfg.wallHeight))}; check before bracing. Brick courses ${cfg.brickCourses} x ${fmt(cfg.courseHeight)}.`,12,200,6);
  c.text(`Garden room framing set | technical elevation ${wallOrder.indexOf(cfg.id)+1} of 4 | page ${page} of ${total}`,W/2,205,6.4,false,"center");
  return c.stream();
}
