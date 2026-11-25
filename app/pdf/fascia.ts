import type { Settings } from '../framing';
import { FASCIA, fasciaPlan } from '../fascia';
import { canvas, fmt, hTechnical, vTechnical } from './layout';

/** The app and technical PDF share this dimensioned gable / stock diagram. */
export function drawFascia(s:Settings,page:number,total:number,c=canvas()){
 const m=fasciaPlan(s),p=s.roofPitch*Math.PI/180,cos=Math.cos(p),tan=Math.tan(p);
 c.text('225 mm uPVC fascia / bargeboard cutting',12,12,14,true);
 c.text('White, flat 16 mm full replacement boards | 4 x 5000 mm stock | dimensions in mm',12,20,8);
 const sc=Math.min(.065,1000/(m.centreRun*cos)),x0=28,y0=109,run=m.centreRun*cos;
 const P=(x:number,n:number)=>[x0+x*sc,y0-(x*tan+n/cos)*sc];
 for(const [lo,hi,fill] of [[-s.studDepth,0,'timber'],[0,11,'floor'],[11,111,'floor'],[111,136,'timber']] as const)
  c.polygon([P(0,lo),P(run,lo),P(run,hi),P(0,hi)],fill);
 const top=FASCIA.width-s.studDepth;
 const outline=[P(-16,-s.studDepth),P(run,-s.studDepth),P(run,top),P(-16,top)];
 outline.forEach((a,i)=>{const b=outline[(i+1)%4];c.line(a[0],a[1],b[0],b[1],[0,0,0],.65,[1.5,1]);});
 for(const x of [0,run]){const a=P(x,-s.studDepth-35),b=P(x,170);c.line(a[0],a[1],b[0],b[1],[0,0,0],.15,[1,1]);}
 c.text('Eaves plumb plane',12,120,7);c.text('Ridge centre',x0+run*sc,30,7,true,'right');
 c.text('11 OSB + 100 PIR + 25 batten = 136 above rafters.',12,34,7);
 c.text(`${fmt(s.studDepth)} rafter + 136 = ${fmt(m.totalDepth)} total; ${fmt(m.uncovered)} above 225 board.`,12,40,7);
 c.text('Dashed outline: board underside flush with full rafter depth.',12,46,6.8);
 c.text('Roof thickness raises both plumb ends; it is not added to length.',12,52,6.8);
 c.text('GABLE BLANK CALCULATION',207,34,8,true);
 const rows=[['Rafter top to ridge FACE',m.ridgeFaceRun],['Half ridge / cos(pitch)',m.halfRidge],['16 fascia / cos(pitch)',m.fasciaExtension],['225 x tan(pitch), end cuts',m.endAllowance],['Required rectangular blank',m.blankLength],['Spare from 2170 blank',m.trialSpare]] as const;
 rows.forEach(([label,value],i)=>{c.text(label,207,42+i*9,6.8,i===4);c.text(fmt(value),285,46+i*9,8,i>=4,'right');});
 c.text('Top-edge run reaches ridge centre; no ridge-face assumption.',12,127,7);
 // Board rotated into stock coordinates: parallel plumb cuts form a parallelogram.
 const bs=240/2170,bx=20,by=143,bh=225*bs;
 c.rect(bx,by,2170*bs,bh);
 c.polygon([[bx,by+bh],[bx+m.edgeLength*bs,by+bh],[bx+m.blankLength*bs,by],[bx+m.endAllowance*bs,by]],'floor',[0,0,0],.4);
 hTechnical(c,bx,bx+2170*bs,by,137,'2170 stock blank',7);
 hTechnical(c,bx,bx+m.blankLength*bs,by+bh,175,`${fmt(m.blankLength)} longest point-to-point envelope`,7);
 vTechnical(c,by,by+bh,bx+2170*bs,273,'225',7);
 c.text(`Stock 1-4: ${fmt(m.eavesHalf)} eaves half + ${fmt(m.blankLength)} gable blank + 2 x 3 kerfs; ${fmt(m.remaining)} spare each.`,12,184,7.5,true);
 c.text(`${fmt(m.eavesRun)} eaves runs: one supported centre joint each. Barge ends lap eaves board ends; no exposed free ends.`,12,191,7);
 c.text('4 external 300 corners; 4 straight 300 joints (2 eaves + 2 shaped apex covers). Trim to fit; permit thermal movement.',12,197,7);
 c.text(`Garden room framing set | fascia cutting | page ${page} of ${total}`,148.5,205,6.4,false,'center');
 return c.stream();
}
