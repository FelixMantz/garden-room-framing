import { configForWall, type Settings } from '../framing';
import { canvas, fmt, hTechnical, vTechnical, BRICK_DATUM_DASH } from './layout';

/** Centred timber setting-out relative to the measured masonry, independent of openings. */
export function drawFramePosition(s:Settings,page:number,total:number){
  const c=canvas(),cfg=configForWall(s,'front');
  const insetX=(cfg.brickLength-cfg.frameLength)/2,insetY=(cfg.brickDepth-cfg.frameDepth)/2;
  const overhangX=(s.brickInternalLength-s.internalLength)/2,overhangY=(s.brickInternalDepth-s.internalDepth)/2;
  c.text('Timber frame positioning on the dwarf wall',12,12,14,true);
  c.text('Dimensions in mm | centred on measured brickwork | plan shows perimeter datums; door interruption omitted',12,19,7.5);
  const k=.034,ox=25,oy=43,X=(v:number)=>ox+v*k,Y=(v:number)=>oy+v*k;
  const outline=(x:number,y:number,w:number,h:number,brick=false)=>{
    const dash=brick?BRICK_DATUM_DASH:null;
    for(const [a,b] of [[[x,y],[x+w,y]],[[x+w,y],[x+w,y+h]],[[x+w,y+h],[x,y+h]],[[x,y+h],[x,y]]])
      c.line(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),[0,0,0],brick?.15:.3,dash);
  };
  outline(0,0,cfg.brickLength,cfg.brickDepth,true);
  outline(s.brickThickness,s.brickThickness,s.brickInternalLength,s.brickInternalDepth,true);
  outline(insetX,insetY,cfg.frameLength,cfg.frameDepth);
  outline(insetX+s.studDepth,insetY+s.studDepth,s.internalLength,s.internalDepth);
  // Front and rear wall bodies run through; side wall bodies butt between them.
  // These joints describe sole/lower plates, not the overlapping upper top plates.
  const rearJoint=insetY+s.studDepth,frontJoint=insetY+cfg.frameDepth-s.studDepth;
  for(const y of [rearJoint,frontJoint]){
    c.line(X(insetX),Y(y),X(insetX+s.studDepth),Y(y),[0,0,0],.5);
    c.line(X(insetX+cfg.frameLength-s.studDepth),Y(y),X(insetX+cfg.frameLength),Y(y),[0,0,0],.5);
  }
  c.text(`FULL LENGTH - REAR BODY ${fmt(cfg.frameLength)}`, X(cfg.brickLength/2),oy+10,7,true,'center');
  c.text(`FULL LENGTH - FRONT BODY ${fmt(cfg.frameLength)}`, X(cfg.brickLength/2),Y(cfg.brickDepth)-6,7,true,'center');
  c.textVertical(`LEFT BODY ${fmt(s.internalDepth)} - BUTTS BETWEEN FRONT / REAR`, X(insetX)+8,Y(cfg.brickDepth/2),6.5,true);
  c.textVertical(`RIGHT BODY ${fmt(s.internalDepth)} - BUTTS BETWEEN FRONT / REAR`, X(insetX+cfg.frameLength)-8,Y(cfg.brickDepth/2),6.5,true);
  // Show the 95 mm stop at each end without scaling up the entire plan.
  hTechnical(c,X(insetX),X(insetX+s.studDepth),Y(frontJoint),Y(frontJoint)-8,'95',6);
  hTechnical(c,X(insetX+cfg.frameLength-s.studDepth),X(insetX+cfg.frameLength),Y(rearJoint),Y(rearJoint)+8,'95',6);
  c.text('Bold joints: side bodies stop 95 mm from each outer timber corner.',X(cfg.brickLength/2),140,6.5,false,'center');
  c.text('Upper top plates lap the corners as shown on the elevations.',X(cfg.brickLength/2),126,6.5,false,'center');
  hTechnical(c,X(0),X(cfg.brickLength),oy,34,`${fmt(cfg.brickLength)} outside brick`,7,BRICK_DATUM_DASH);
  hTechnical(c,X(insetX),X(insetX+cfg.frameLength),Y(cfg.brickDepth),162,`${fmt(cfg.frameLength)} outside timber`,7);
  vTechnical(c,Y(0),Y(cfg.brickDepth),ox,17,`${fmt(cfg.brickDepth)} outside brick`,7,'left');
  vTechnical(c,Y(insetY),Y(insetY+cfg.frameDepth),X(cfg.brickLength),211,`${fmt(cfg.frameDepth)} outside timber`,7);
  c.text('Brick clear interior',X(cfg.brickLength/2),83,9,true,'center');
  c.text(`${fmt(s.brickInternalLength)} x ${fmt(s.brickInternalDepth)}`,X(cfg.brickLength/2),91,10,false,'center');
  c.text('Timber clear interior',X(cfg.brickLength/2),106,9,true,'center');
  c.text(`${fmt(s.internalLength)} x ${fmt(s.internalDepth)}`,X(cfg.brickLength/2),114,10,false,'center');
  c.text('2.5 mm offsets are too small to distinguish at plan scale.',X(cfg.brickLength/2),133,6.7,false,'center');

  c.text('Enlarged wall section',222,34,10,true);
  c.text('Same positioning on all four walls',222,41,7);
  const sc=.5,bx=229,by=84,tx=bx+insetX*sc,inside=bx+s.brickThickness*sc,ti=tx+s.studDepth*sc;
  c.text('OUTSIDE',222,53,7,true);c.text('INSIDE',279,53,7,true,'right');
  c.rect(bx,by,s.brickThickness*sc,30,'masonry');
  c.rect(tx,by-s.studFace*sc,s.studDepth*sc,s.studFace*sc,'plate');
  c.line(tx,by,ti,by,[0,0,0],.6);
  c.text('DPC beneath sole plate',222,120,7);
  hTechnical(c,tx,ti,by-s.studFace*sc,58,`${fmt(s.studDepth)} timber`,7);
  hTechnical(c,bx,inside,by+30,130,`${fmt(s.brickThickness)} brick`,7,BRICK_DATUM_DASH);
  c.line(inside,by-4,inside,by+34,[0,0,0],.15,BRICK_DATUM_DASH);
  c.line(ti,by-4,ti,by+6,[0,0,0],.15);
  c.line(inside,by+8,ti,by+8,[0,0,0],.25);
  c.line((inside+ti)/2,by+8,284,by+8,[0,0,0],.15);
  c.line(284,by+8,284,134,[0,0,0],.15);
  c.text(`${fmt(overhangX)} mm internal timber overhang`,283,139,7,true,'right');
  c.text(`${fmt(s.studDepth-overhangX)} mm timber bearing on brick`,222,150,7.5,true);
  c.text(`${fmt(insetX)} mm brick exposed outside timber`,222,158,7);

  c.text('Centred setting-out',12,177,9,true);
  c.text(`Left / right: ${fmt(overhangX)} mm internal timber overhang; ${fmt(insetX)} mm outside brick projection.`,12,185,8);
  c.text(`Front / rear: ${fmt(overhangY)} mm internal timber overhang; ${fmt(insetY)} mm outside brick projection.`,12,192,8);
  c.text('Dot-dash = brick datums. Solid = timber datums. Dimensions refer to bare stud / sole-plate faces.',12,199,7);
  c.text(`Garden room framing set | timber on dwarf wall | page ${page} of ${total}`,148.5,207,6.5,false,'center');
  return c.stream();
}
