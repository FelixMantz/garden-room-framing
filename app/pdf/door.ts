import { textWidth } from "../pdf-font-widths";
import { doorAssembly } from "../door-assembly";
import { rafterDimensions } from "../rafter-dimensions";
import { roofModel, roofCutSchedule, tieEndClearance } from "../roof";
import { buildModel, configForWall, doorLintelToLowerTopPlate, makeSchedule, slopePolygon, studGridCentres, type Member, type Settings, type WallConfig } from "../framing";
import { canvas, clean, fmt, wrapText, dimension, hTechnical, vTechnical, type Material, type Fill } from "./layout";
export function drawDoorVertical(settings:Settings,page:number,total:number,scheduleOnly=false){
  const cfg=configForWall(settings,"front"),door=cfg.computedOpenings.find(o=>o.type==="door"),c=canvas();
  c.text(scheduleOnly?"French-door component and level schedules":"French-door front elevation and vertical build-up",12,11,14,true);
  c.text(scheduleOnly?"For the preceding door elevation | slab datum +0 | dimensions in mm":"Single front-on assembly | slab datum +0 | dimensions in mm | do not scale",12,18,7.5);
  if(!door){
    c.text("No door opening is configured on the front wall.",12,34,10,true);
    c.text(`Garden room framing set | door level overview | page ${page} of ${total}`,148.5,205,6.4,false,"center");
    return c.stream();
  }

  const assembly=doorAssembly(cfg,door);
  if(!assembly.matchesOpening){
    c.text(`Configured opening: ${fmt(door.width)} x ${fmt(door.height)}.`,12,34,10,true);
    c.text(`Measured French-door detail requires ${assembly.requiredWidth} x ${assembly.requiredHeight} with the stated allowances.`,12,42,8);
    c.text("See the wall elevation for the configured opening; the measured leaves have not been resized.",12,50,8);
    c.text(`Garden room framing set | door front elevation | page ${page} of ${total}`,148.5,205,6.4,false,"center");
    return c.stream();
  }
  const {fit,lining,operating,closedPairWidth,leafHeight,leftLeafWidth,rightLeafWidth,meetingOverlap,leafThickness,
    openingBase,openingTop,frameBottom,cillTop,leafBottom,frameTop,headBottom,leafTop}=assembly;
  const slab=0,ffl=cfg.ffl;
  const thresholdTop=cfg.courseHeight,thresholdSetout=openingBase-thresholdTop;
  const lintelTop=openingTop+cfg.headerDepth,soleBottom=cfg.frameBase,soleTop=soleBottom+cfg.studFace;
  const lowerPlateBottom=cfg.frameBase+cfg.wallHeight-cfg.plates,lowerPlateTop=lowerPlateBottom+cfg.studFace;
  const wallTop=cfg.frameBase+cfg.wallHeight,tieTop=wallTop+settings.tieDepth;
  const minLevel=-105,maxLevel=tieTop+35,area={top:27,bottom:181};
  const breakLow=450,breakHigh=1850,upperBreakY=99,lowerBreakY=108;
  const Y=(level:number)=>level<=breakLow
    ? area.bottom-(level-minLevel)*(area.bottom-lowerBreakY)/(breakLow-minLevel)
    : level>=breakHigh
      ? upperBreakY-(level-breakHigh)*(upperBreakY-area.top)/(maxLevel-breakHigh)
      : (upperBreakY+lowerBreakY)/2;
  const rough={x:52,w:106},X=(value:number)=>rough.x+value*rough.w/door.width;
  const leftEdge=20,rightEdge=180;
  const levelLine=(level:number,bold=false)=>{
    // Short external level ticks; no horizontal rule through the lintel or cill.
    c.line(leftEdge-5,Y(level),leftEdge-1,Y(level),[0,0,0],bold?.20:.08,bold?null:[1.5,1]);
    c.line(rightEdge+1,Y(level),rightEdge+5,Y(level),[0,0,0],bold?.20:.08,bold?null:[1.5,1]);
  };
  const splitRect=(x:number,low:number,w:number,high:number,fill:Fill,stroke=[0,0,0],lineWidth=.15)=>{
    if(low<breakLow){const top=Math.min(high,breakLow);if(top>low)c.rect(x,Y(top),w,Y(low)-Y(top),fill,stroke,lineWidth);}
    if(high>breakHigh){const bottom=Math.max(low,breakHigh);if(high>bottom)c.rect(x,Y(high),w,Y(bottom)-Y(high),fill,stroke,lineWidth);}
  };
  const splitVLine=(x:number,low:number,high:number,width=.12,dash:number[]|null=null)=>{
    if(low<breakLow)c.line(x,Y(low),x,Y(Math.min(high,breakLow)),[0,0,0],width,dash);
    if(high>breakHigh)c.line(x,Y(Math.max(low,breakHigh)),x,Y(high),[0,0,0],width,dash);
  };
  const leader=(label:string,fromX:number,fromY:number,textX:number,textY:number,align:"left"|"right"="left",bold=false,size=4.7)=>{
    const endX=textX+(align==="left"?-1:1);
    c.line(fromX,fromY,endX,textY-1.2,[0,0,0],.10);
    const labelWidth=textWidth(clean(label),size,bold)*25.4/72;
    c.rect(align==="left"?textX-.5:textX-labelWidth-.5,textY-size*.36,labelWidth+1,size*.45,[255,255,255],[255,255,255],0);
    c.text(label,textX,textY,size,bold,align);
  };

  if(!scheduleOnly){
  c.rect(leftEdge,Y(slab),rightEdge-leftEdge,Y(-85)-Y(slab),[190,190,190],[0,0,0],.16);
  c.text("CONCRETE SLAB",(leftEdge+rightEdge)/2,Y(-46)+2,5.8,true,"center");
  {
    for(const [x,w] of [[leftEdge,rough.x-leftEdge],[rough.x+rough.w,rightEdge-(rough.x+rough.w)]]){
      c.rect(x,Y(soleBottom),w,Y(slab)-Y(soleBottom),"masonry",[0,0,0],.16);
      for(let row=1;row<cfg.brickCourses;row++)c.line(x,Y(row*cfg.courseHeight),x+w,Y(row*cfg.courseHeight),[0,0,0],.08);
      c.rect(x,Y(soleTop),w,Y(soleBottom)-Y(soleTop),"timber",[0,0,0],.16);
    }
    c.line(leftEdge,Y(soleBottom),rightEdge,Y(soleBottom),[0,0,0],.30);
  }
  let floorLevel=slab;
  cfg.layers.forEach(layer=>{const next=floorLevel+layer.thickness;c.rect(rough.x,Y(next),rough.w,Y(floorLevel)-Y(next),"floor",[0,0,0],.12);floorLevel=next;});
  c.rect(rough.x,Y(thresholdTop),rough.w,Y(slab)-Y(thresholdTop),"masonry",[0,0,0],.18);
  c.line(rough.x,Y(ffl),rough.x+rough.w,Y(ffl),[0,0,0],.30);

  const studW=cfg.studFace*rough.w/door.width;
  for(const [kingX,jackX] of [[rough.x-2*studW,rough.x-studW],[rough.x+rough.w+studW,rough.x+rough.w]]){
    splitRect(kingX,soleTop,studW,lowerPlateBottom,"timber");
    splitRect(jackX,soleTop,studW,openingTop,"timber");
  }
  c.rect(rough.x-studW,Y(lintelTop),rough.w+2*studW,Y(openingTop)-Y(lintelTop),"lintel");
  c.rect(leftEdge,Y(lowerPlateTop),rightEdge-leftEdge,Y(lowerPlateBottom)-Y(lowerPlateTop),"timber");
  c.rect(leftEdge,Y(wallTop),rightEdge-leftEdge,Y(lowerPlateTop)-Y(wallTop),"timber");
  // Front elevation: ties run perpendicular to this wall, so show their ends.
  roofModel(settings).ties.forEach(t=>{
    const local=t-door.x-settings.tieWidth/2;
    if(local+settings.tieWidth>=0&&local<=door.width){
      c.rect(X(local),Y(tieTop),settings.tieWidth*rough.w/door.width,Y(wallTop)-Y(tieTop),"tie");
      const chamfer=tieEndClearance(settings);
      if(chamfer.projection>.01)c.line(X(local),Y(wallTop+chamfer.remainingDepth),X(local+settings.tieWidth),Y(wallTop+chamfer.remainingDepth),[0,0,0],.22);
    }
  });

  splitRect(rough.x,openingBase,rough.w,openingTop,[255,255,255],[0,0,0],.24);
  splitRect(X(fit),frameBottom,X(fit+lining)-X(fit),frameTop,"timber",[0,0,0],.15);
  splitRect(X(door.width-fit-lining),frameBottom,X(door.width-fit)-X(door.width-fit-lining),frameTop,"timber",[0,0,0],.15);
  c.rect(X(fit),Y(frameTop),X(door.width-fit)-X(fit),Y(headBottom)-Y(frameTop),"timber",[0,0,0],.15);
  c.rect(X(fit),Y(cillTop),X(door.width-fit)-X(fit),Y(frameBottom)-Y(cillTop),"timber",[0,0,0],.15);

  const leafStart=fit+lining+operating,leftLeafEnd=leafStart+leftLeafWidth,rightLeafStart=leftLeafEnd-meetingOverlap,rightLeafEnd=rightLeafStart+rightLeafWidth;
  splitRect(X(leafStart),leafBottom,X(leftLeafEnd)-X(leafStart),leafTop,[255,255,255],[0,0,0],.18);
  splitRect(X(rightLeafStart),leafBottom,X(rightLeafEnd)-X(rightLeafStart),leafTop,[255,255,255],[0,0,0],.18);
  splitVLine(X(leftLeafEnd),leafBottom,leafTop,.12,[1,1]);
  splitVLine(X(rightLeafStart),leafBottom,leafTop,.12,[1,1]);
  c.text("LEFT LEAF",X((leafStart+leftLeafEnd)/2),113,6.1,true,"center");
  c.text("589 full / 577 rebate",X((leafStart+leftLeafEnd)/2),118,5.1,false,"center");
  c.text("RIGHT LEAF",X((rightLeafStart+rightLeafEnd)/2),113,6.1,true,"center");
  c.text("588 full / 576 rebate",X((rightLeafStart+rightLeafEnd)/2),118,5.1,false,"center");
  c.text(`${meetingOverlap} rebate overlap`,X((rightLeafStart+leftLeafEnd)/2),124,4.8,true,"center");

  [slab,thresholdTop,ffl,openingBase,frameBottom,cillTop,leafBottom,leafTop,headBottom,frameTop,openingTop,lintelTop,lowerPlateBottom,lowerPlateTop,wallTop].forEach(level=>levelLine(level,[slab,thresholdTop,ffl,openingTop,lowerPlateBottom,wallTop].includes(level)));
  c.text(`BRICK THRESHOLD COURSE ${fmt(thresholdTop)}`,rough.x+rough.w/2,Y(thresholdTop/2)+1.3,4.8,true,"center");
  c.text("HARDWOOD CILL 40",rough.x+rough.w/2,Y((frameBottom+cillTop)/2)+1.3,5.0,true,"center");
  c.text("HARDWOOD HEAD 40",rough.x+rough.w/2,Y((headBottom+frameTop)/2)+1.3,5.0,true,"center");
  c.text(`TIMBER LINTEL ${fmt(cfg.headerDepth)}`,rough.x+rough.w/2,Y((openingTop+lintelTop)/2)+1.3,5.2,true,"center");
  const lintelPlateGap=lowerPlateBottom-lintelTop;
  if(lintelPlateGap>0)c.text(`CRIPPLE GAP ${fmt(lintelPlateGap)}`,rough.x+rough.w/2,Y((lintelTop+lowerPlateBottom)/2)+1.2,4.5,true,"center");
  c.text(`LOWER TOP PLATE ${fmt(cfg.studFace)}`,(leftEdge+rightEdge)/2,Y((lowerPlateBottom+lowerPlateTop)/2)+1.2,4.6,true,"center");
  c.text(`UPPER TOP PLATE ${fmt(cfg.studFace)}`,(leftEdge+rightEdge)/2,Y((lowerPlateTop+wallTop)/2)+1.2,4.6,true,"center");
  leader(`TIE ${settings.tieWidth} x ${settings.tieDepth}; END ${fmt(tieEndClearance(settings).remainingDepth)}`,X(door.width/2),Y((wallTop+tieTop)/2),120,30,"left",true,5.0);

  // Broken-height elevation: the repetitive middle of the leaves is intentionally omitted.
  c.rect(leftEdge,upperBreakY-.6,rightEdge-leftEdge,lowerBreakY-upperBreakY+1.2,[255,255,255],[255,255,255],0);
  const squiggle=(y:number)=>{for(let x=rough.x-studW;x<rough.x+rough.w+studW;x+=4){const x2=Math.min(x+4,rough.x+rough.w+studW);c.line(x,y+(Math.floor((x-(rough.x-studW))/4)%2?1.15:-1.15),x2,y+(Math.floor((x-(rough.x-studW))/4)%2?-1.15:1.15),[0,0,0],.20);}};
  squiggle(upperBreakY+1.8);squiggle(lowerBreakY-1.8);
  c.text("BREAK — 1400 LEAF HEIGHT OMITTED; TRUE DIMENSIONS RETAINED",rough.x+rough.w/2,104.7,4.4,true,"center");

  // Labels sit beside the exact construction bands; leaders identify layers too thin to carry text.
  let layerBase=0;
  cfg.layers.forEach((layer,i)=>{
    leader(`${clean(layer.name).toUpperCase()} ${fmt(layer.thickness)} (BEHIND)`,rough.x,Y(layerBase+layer.thickness/2),47,171-i*8,"right",true,4.4);
    layerBase+=layer.thickness;
  });
  leader(`LEAF BOTTOM +${fmt(leafBottom)}`,70,Y(leafBottom),76,123,"left",true,4.5);
  leader(`OPENING BASE +${fmt(openingBase)}`,70,Y(openingBase),76,128,"left",true,4.5);
  leader("5 FRAME-FIT GAP",70,Y((openingBase+frameBottom)/2),76,133,"left",false,4.4);
  leader("5 OPERATING GAP",70,Y((cillTop+leafBottom)/2),76,138,"left",false,4.4);
  leader(`${fmt(thresholdSetout)} BRICK TOP TO OPENING BASE`,rough.x+rough.w*.76,Y((thresholdTop+openingBase)/2),112,146,"left",true,4.2);
  leader("5 FIT | 40 HARDWOOD JAMB | 5 OPERATING",X(fit+lining/2),Y(1980),57,91,"left",true,4.4);
  leader(`LEAF TOP +${fmt(leafTop)}`,X(door.width*.56),Y(leafTop),112,76,"left",true,4.5);
  leader("5 OPERATING GAP",X(door.width*.56),Y((leafTop+headBottom)/2),112,81,"left",false,4.4);
  leader("5 FRAME-FIT GAP",X(door.width*.56),Y((frameTop+openingTop)/2),112,86,"left",false,4.4);
  leader(`OPENING TOP +${fmt(openingTop)}`,X(door.width*.56),Y(openingTop),112,91,"left",true,4.5);
  vTechnical(c,Y(ffl),Y(wallTop),leftEdge,12,`${fmt(wallTop-ffl)} FFL to tie U/S`,4.8,"left");
  vTechnical(c,Y(openingBase),Y(openingTop),leftEdge-1,18,`${fmt(door.height)} structural opening`,4.5,"left");
  vTechnical(c,Y(leafBottom),Y(leafTop),rightEdge+1,187,`${fmt(leafHeight)} leaves`,4.5,"right");
  vTechnical(c,Y(openingTop),Y(lowerPlateBottom),rightEdge+1,181,`${fmt(doorLintelToLowerTopPlate(cfg,door))} lintel U/S to plate U/S`,4.0,"right");
  hTechnical(c,rough.x,rough.x+rough.w,Y(-85)+1,183,`${fmt(door.width)} structural opening`,5.1);
  hTechnical(c,X(leafStart),X(rightLeafEnd),Y(-85)+1,190,`${fmt(closedPairWidth)} closed leaf set`,4.8);

  // Independent margin chains keep true heights readable across the break.
  vTechnical(c,Y(slab),Y(soleBottom),rightEdge,191,`${fmt(soleBottom)} dwarf wall`,5,"right");
  vTechnical(c,Y(soleTop),Y(lowerPlateBottom),rightEdge,201,`${fmt(lowerPlateBottom-soleTop)} king stud cut`,5,"right");
  vTechnical(c,Y(soleTop),Y(openingTop),rightEdge,211,`${fmt(openingTop-soleTop)} jack stud cut`,5,"right");
  vTechnical(c,Y(frameBottom),Y(frameTop),rightEdge,221,`${fmt(frameTop-frameBottom)} frame outside height`,5,"right");
  vTechnical(c,Y(ffl),Y(openingTop),rightEdge,231,`${fmt(openingTop-ffl)} FFL - lintel U/S`,5,"right");
  vTechnical(c,Y(slab),Y(wallTop),rightEdge,241,`${fmt(wallTop)} slab - wall top`,5,"right");
  vTechnical(c,Y(slab),Y(tieTop),rightEdge,251,`${fmt(tieTop)} slab - tie top`,5,"right");
  hTechnical(c,X(fit),X(door.width-fit),Y(-85)+1,197,`${fmt(door.width-2*fit)} frame outside width`,5.1);
  hTechnical(c,rough.x-studW,rough.x+rough.w+studW,Y(tieTop)-1,24,`${fmt(door.width+2*cfg.studFace)} lintel cut`,5.1);
  c.text(`Garden room framing set | door front elevation | page ${page} of ${total}`,148.5,205,6.4,false,"center");
  return c.stream();
  }
  const floorTops:number[]=[];let cumulative=0;cfg.layers.forEach(layer=>{cumulative+=layer.thickness;floorTops.push(cumulative);});
  const wallDoorRows:{top:number;thickness:number;label:string}[]=[
    {top:tieTop,thickness:settings.tieDepth,label:"Tie beam"},
    {top:wallTop,thickness:cfg.studFace,label:"Upper top plate"},
    {top:lowerPlateTop,thickness:cfg.studFace,label:"Lower top plate"},
    {top:lintelTop,thickness:cfg.headerDepth,label:"Door lintel"},
    {top:openingTop,thickness:fit,label:"Top frame-fit gap"},
    {top:frameTop,thickness:lining,label:"Hardwood head"},
    {top:headBottom,thickness:operating,label:"Top operating gap"},
    {top:leafTop,thickness:leafHeight,label:"Door leaf"},
    {top:soleTop,thickness:cfg.studFace,label:"Sole plate"},
    {top:cfg.masonryHeight,thickness:cfg.masonryHeight,label:"Brick dwarf wall"},
    ...(lowerPlateBottom>lintelTop?[{top:lowerPlateBottom,thickness:lowerPlateBottom-lintelTop,label:"Above-lintel infill"}]:[]),
    {top:leafBottom,thickness:operating,label:"Bottom operating gap"},
    {top:cillTop,thickness:lining,label:"Hardwood cill"},
    {top:frameBottom,thickness:fit,label:"Bottom frame-fit gap"},
    ...[
      {top:openingBase,thickness:thresholdSetout,label:"Brick top to opening base"},
      {top:thresholdTop,thickness:thresholdTop-slab,label:"Brick threshold course"},
    ],
  ].sort((a,b)=>b.top-a.top);
  const floorRows=cfg.layers.map((layer,i)=>({top:floorTops[i],thickness:layer.thickness,label:clean(layer.name)})).sort((a,b)=>b.top-a.top);
  const tx=12,tw=165,rowH=7,itemRight=tx+100,thicknessRight=tx+130;
  const schedule=(title:string,rows:{top:number;thickness:number;label:string}[],titleY:number,tableY:number,tx=12,tw=165)=>{
    const itemRight=tx+tw*.6,thicknessRight=tx+tw*.8;
    c.text(title,tx,titleY,7.0,true);
    c.rect(tx,tableY,tw,rowH,[235,238,234],[0,0,0],.14);
    c.text("Component",tx+2,tableY+3.65,7,true);
    c.text("Thickness",thicknessRight-2,tableY+3.65,6.5,true,"right");
    c.text("Top above slab",tx+tw-2,tableY+3.65,6.5,true,"right");
    rows.forEach((row,i)=>{const y=tableY+rowH*(i+1);c.line(tx,y+rowH,tx+tw,y+rowH,[0,0,0],.07);c.text(row.label,tx+2,y+3.65,6.5);c.text(fmt(row.thickness),thicknessRight-2,y+3.65,6.5,true,"right");c.text(`+${fmt(row.top)}`,tx+tw-2,y+3.65,6.5,true,"right");});
    const bottom=tableY+rowH*(rows.length+1);
    c.line(tx,tableY,tx,bottom,[0,0,0],.11);c.line(itemRight,tableY,itemRight,bottom,[0,0,0],.08);c.line(thicknessRight,tableY,thicknessRight,bottom,[0,0,0],.08);c.line(tx+tw,tableY,tx+tw,bottom,[0,0,0],.11);
    return bottom;
  };
  const wallDoorBottom=schedule("WALL FRAME & DOOR COMPONENTS - TOP DOWN (mm)",wallDoorRows,30,34);
  const floorTitleY=wallDoorBottom+7,floorTableY=floorTitleY+4;
  const floorBottom=schedule("FLOOR COMPONENTS - TOP DOWN (mm)",floorRows,30,34,188,97);

  const notesY=floorBottom+8;c.text("DOOR ASSEMBLY",188,notesY,7.5,true);
  const notes=[
    `Width: ${door.width} = ${fit} fit + ${lining} jamb + ${operating} op + ${closedPairWidth} leaves + ${operating} op + ${lining} jamb + ${fit} fit.`,
    `Height: ${door.height} = ${fit} fit + ${lining} cill + ${operating} op + ${leafHeight} leaf + ${operating} op + ${lining} head + ${fit} fit.`,
    `Left: ${leftLeafWidth} full / 577 rebate; heights 1979 hinge / 1976 meeting.`,
    `Right: ${rightLeafWidth} full / 576 rebate; heights 1975 hinge / 1980 meeting.`,
    `Meeting rebates ${meetingOverlap} overlap; leaves ${leafThickness} thick; opposing rebates 21 deep.`,
    `Cill top +${fmt(cillTop)} slab = ${fmt(cillTop-ffl)} above FFL on this set-out.`,
    `Brick threshold top +${fmt(thresholdTop)} slab; structural opening base +${fmt(openingBase)}; ${fmt(thresholdSetout)} between.`,
    "Confirm actual cill rebates before fixing its support/upstand.",
  ];let noteY=notesY+7;notes.forEach((note,i)=>{wrapText(note,97,5).forEach(line=>{if(noteY>199)throw new Error('Door detail exceeds its PDF page. Reduce custom floor layers.');c.text(line,188,noteY,5.0,i===6);noteY+=2.4;});noteY+=2.3;});
  c.text(`Garden room framing set | door front elevation | page ${page} of ${total}`,148.5,205,6.4,false,"center");
  return c.stream();
}

