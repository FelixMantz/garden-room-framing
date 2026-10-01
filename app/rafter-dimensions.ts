import { slopePolygon, type Member } from './framing';

export const RAFTER_TAIL_PLUMB_FACE = 20;

export function rafterTailCut(depth:number,pitchDegrees:number,plumbFace=RAFTER_TAIL_PLUMB_FACE){
  const pitch=pitchDegrees*Math.PI/180;
  const verticalDepth=depth/Math.cos(pitch);
  const horizontalRun=Math.max(0,(verticalDepth-plumbFace)/Math.tan(pitch));
  return {plumbFace,verticalDepth,horizontalRun};
}

export function rafterDimensions(m:Member){
  const run=Math.abs(m.x2!-m.x1!),rise=Math.abs(m.y2!-m.y1!);
  const pitch=Math.atan2(rise,run)*180/Math.PI;
  const verticalDepth=(m.thickness||0)/Math.cos(pitch*Math.PI/180);
  const heel=(m.seatRun||0)*Math.tan(pitch*Math.PI/180);
  const tail=rafterTailCut(m.thickness||0,pitch);
  const polygon=slopePolygon(m),risesRight=m.y2!>m.y1!;
  let cutPolygon=polygon;
  if(risesRight&&polygon.length>=4){
    const tailTop=polygon[0],flatY=tailTop[1]-tail.plumbFace;
    cutPolygon=[...polygon.slice(0,-1),[m.x1!+tail.horizontalRun,flatY],[m.x1!,flatY]];
  }else if(!risesRight&&polygon.length>=4){
    const tailTop=polygon[1],flatY=tailTop[1]-tail.plumbFace;
    cutPolygon=[...polygon.slice(0,2),[m.x2!,flatY],[m.x2!-tail.horizontalRun,flatY],...polygon.slice(3)];
  }
  return {run,rise,pitch,plumb:90-pitch,verticalDepth,heel,seat:m.seatRun||0,
    notchNormal:heel*Math.cos(pitch*Math.PI/180),length:Math.hypot(run,rise),polygon,cutPolygon,
    tailPlumbFace:tail.plumbFace,tailFlatRun:tail.horizontalRun};
}
