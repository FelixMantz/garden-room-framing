import { configForWall, type Settings } from './framing';
export const BATHROOM={width:1500,depth:800,partition:75,lining:12.5,door:686,doorHeight:1981,doorThickness:35,doorLining:27.5,doorGap:3,fittingGap:5,undercut:10,basinWidth:500,basinDepth:300,basinLeft:105,toiletProjection:600,toiletWidth:400,toiletRear:235,timberThickness:47};
export function bathroomModel(s:Settings){
 const b=BATHROOM,dx=(s.brickInternalLength-s.internalLength)/2,dy=(s.brickInternalDepth-s.internalDepth)/2;
 // Plan datum = rear-left inside brick corner. Y increases towards front.
 const rightStud=s.brickInternalLength-dx,rearStud=dy,rightFinish=rightStud-b.lining,rearFinish=rearStud+b.lining;
 const leftFinish=rightFinish-b.width,frontFinish=rearFinish+b.depth;
 const leftInner=leftFinish-b.lining,leftOuter=leftInner-b.partition,frontInner=frontFinish+b.lining,frontOuter=frontInner+b.partition;
 const floorPir=s.layers[0].thickness,deck=s.layers[1].thickness,ffl=s.layers.reduce((a,l)=>a+l.thickness,0);
 const top=configForWall(s,'rear').frameBase+s.wallHeight;
 const soleTop=floorPir+b.timberThickness,plateBottom=top-b.timberThickness;
 const roughWidth=b.door+2*(b.doorGap+b.doorLining+b.fittingGap);
 // Full hinge post. Latch post extends into, and shares support with, long-wall corner.
 const doorStart=rearStud+b.timberThickness,doorEnd=doorStart+roughWidth;
 const leafStart=doorStart+b.fittingGap+b.doorLining+b.doorGap;
 const roughHead=ffl+b.undercut+b.doorHeight+b.doorGap+b.doorLining+b.fittingGap;
 const zones=[{x:0,y:0,w:leftOuter,h:s.brickInternalDepth},{x:leftOuter,y:frontOuter,w:s.brickInternalLength-leftOuter,h:s.brickInternalDepth-frontOuter},{x:leftInner,y:0,w:s.brickInternalLength-leftInner,h:frontInner},{x:leftOuter,y:doorStart,w:b.partition,h:roughWidth}];
 const panels:{id:string;x:number;y:number;w:number;h:number}[]=[];
 for(const z of zones)for(let y=z.y;y<z.y+z.h-.01;y+=1200)for(let x=z.x;x<z.x+z.w-.01;x+=2400)panels.push({id:`P${panels.length+1}`,x,y,w:Math.min(2400,z.x+z.w-x),h:Math.min(1200,z.y+z.h-y)});
 return {...b,doorStart,doorEnd,roughWidth,leafStart,roughHead,jambCut:roughHead-soleTop,crippleCut:plateBottom-roughHead-b.timberThickness,centreOffset:leafStart+b.door/2-(rearFinish+b.depth/2),dx,dy,rightStud,rearStud,rightFinish,rearFinish,leftFinish,frontFinish,leftInner,leftOuter,frontInner,frontOuter,floorPir,deck,ffl,top,soleTop,plateBottom,studCut:plateBottom-soleTop,frontLength:rightStud-leftOuter,sideLength:frontInner-rearStud,packing:floorPir-2*b.timberThickness,panels};
}
