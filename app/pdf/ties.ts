import { type Settings } from '../framing';
import { tieEndClearance } from '../roof';
import { canvas, fmt, hTechnical, vTechnical } from './layout';

/** Broken-length side elevation; only the top corners are removed. */
export function drawTieChamfer(settings:Settings,c=canvas(),compact=false){
 const d=tieEndClearance(settings),length=settings.internalDepth+2*settings.studDepth;
 const left=compact?150:55,right=compact?273:242,bottom=compact?179:143;
 const scale=Math.min(compact?.39:.75,(compact?32:65)/settings.tieDepth,(compact?36:55)/Math.max(1,d.run));
 const top=bottom-settings.tieDepth*scale,endTop=bottom-d.remainingDepth*scale,run=d.run*scale;
 c.text('TIE-END CHAMFERS - SIDE ELEVATION',compact?139:20,compact?125:18,compact?8:14,true);
 c.text('Both ends mirrored; middle length omitted.',compact?139:20,compact?131:26,compact?6:8);
 c.polygon([[left,bottom],[right,bottom],[right,endTop],[right-run,top],[left+run,top],[left,endTop]],'tie');
 if(d.projection>.01){
   // Dashed stock outlines show the triangular offcuts above the finished face.
   c.line(left,endTop,left,top,[0,0,0],.12,[1,1]);
   c.line(left,top,left+run,top,[0,0,0],.12,[1,1]);
   c.line(right,endTop,right,top,[0,0,0],.12,[1,1]);
   c.line(right-run,top,right,top,[0,0,0],.12,[1,1]);
   hTechnical(c,left,left+run,top,top-6,`${fmt(d.run)} run`,compact?5:7);
   hTechnical(c,right-run,right,top,top-6,`${fmt(d.run)} run`,compact?5:7);
   vTechnical(c,top,endTop,left,left-5,`${fmt(d.projection)} cut`,compact?5:7,'left');
   c.text(`${fmt(settings.roofPitch)} deg`,left+run+3,top+5,compact?6:8,true);
 }
 vTechnical(c,endTop,bottom,left,left-11,`${fmt(d.remainingDepth)} end`,compact?5:7,'left');
 vTechnical(c,top,bottom,right,right+7,`${fmt(settings.tieDepth)} depth`,compact?5:7,'right');
 const mid=(left+right)/2;
 c.rect(mid-3,top-1,6,bottom-top+2,[255,255,255],[255,255,255],0);
 for(const x of [mid-3,mid+3]){c.line(x,top-1,x+1,(top+bottom)/2,[0,0,0],.2);c.line(x+1,(top+bottom)/2,x,bottom+1,[0,0,0],.2);}
 hTechnical(c,left,right,bottom,bottom+8,`${fmt(length)} overall - bottom edge unchanged`,compact?5.5:8);
 if(!compact){
  c.text(d.projection>.01?`Chamfer both top corners at ${fmt(settings.roofPitch)} degrees to the horizontal tie top, across the full ${fmt(settings.tieWidth)} mm width.`:'No chamfer required: the square tie ends are below the rafter top plane.',20,168,8);
  c.text(d.projection>.01?`Remove ${fmt(d.projection)} mm vertically at each outer end; mark ${fmt(d.run)} mm inward along the top.`:`Clearance above the square end: ${fmt(d.rafterTopAtWall-settings.tieDepth)} mm.`,20,177,8);
  c.text('Keep the underside flat on the top plates. The chamfer aligns with the adjacent rafter upper face.',20,186,8);
  c.text('Dimensions in mm | dashed lines show removed corners | do not scale',20,198,7);
 }
 return c.stream();
}
