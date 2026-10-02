import { roofOverhangs } from '../roof-overhangs';
import type { Settings } from '../framing';
import { canvas, fmt, hTechnical, vTechnical, type Fill } from './layout';
import { rafterTailCut } from '../rafter-dimensions';

/** Eaves junction: dimensions in mm; proprietary profiles remain schematic. */
export function drawEaves(s:Settings,page:number,total:number,c=canvas()){
  const pitch=s.roofPitch*Math.PI/180, co=Math.cos(pitch);
  const {fasciaThickness,eavesTailRun}=roofOverhangs(s.gableOverhang,s.roofGableOverhang,s.studFace);
  const scale=Math.min(.18,80/(eavesTailRun+s.studDepth)), left=64, base=147, right=left+Math.min(118,(base-42-141*scale/co)/Math.tan(pitch));
  const y=(x:number,n:number)=>base-(x-left)*Math.tan(pitch)-n*scale/co;
  const osb=11,pir=100,batten=25,top=osb+pir;
  const tailCut=rafterTailCut(s.studDepth,s.roofPitch),tailFlatX=left+tailCut.horizontalRun*scale;
  const tailTopY=y(left,0),tailFlatY=tailTopY+tailCut.plumbFace*scale;
  const line=(a:number[],b:number[],w=.2,dash:number[]|null=null)=>c.line(a[0],a[1],b[0],b[1],[0,0,0],w,dash);
  const layer=(a:number,b:number,fill:Fill,x1=left,x2=right)=>c.polygon([[x1,y(x1,a)],[x2,y(x2,a)],[x2,y(x2,b)],[x1,y(x1,b)]],fill,[0,0,0],.2);
  const leader=(label:string,x:number,yy:number,tx:number,ty:number,align:'left'|'right'='left')=>{
    const end=align==='left'?tx-2:tx+2;
    line([x,yy],[end,ty-1],.13);c.rect(x-.4,yy-.4,.8,.8,[0,0,0],[0,0,0],.2);
    c.text(label,tx,ty,7.2,true,align);
  };
  const arrow=(a:number[],b:number[],dash:number[]|null=null)=>{
    line(a,b,.35,dash);const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
    for(const turn of [-.5,.5])line(b,[b[0]-2.4*Math.cos(angle+turn),b[1]-2.4*Math.sin(angle+turn)],.35);
  };
  c.text('Eaves - roof build-up and gutter junction',12,11,14,true);
  c.text(`Section down the roof slope | pitch ${fmt(s.roofPitch)} degrees | dimensions in mm | do not scale`,12,18,8);
  c.text(`${fmt(s.gableOverhang)} mm horizontal: outer wall framing to outer fascia; ${fmt(eavesTailRun)} mm to rafter tail.`,12,24,7.5);
  // Single eaves-to-ridge batten layer shown beyond the section; air channel in front.
  // The wall follows the actual eaves projection. Fit longer projections to this sheet.
  const wallX=left+eavesTailRun*scale;
  const wallInner=wallX+s.studDepth*scale, plateY=y(wallInner,-s.studDepth);
  c.polygon([[left,tailTopY],[right,y(right,0)],[right,y(right,-s.studDepth)],
    [wallInner,plateY],[wallX,plateY],[wallX,y(wallX,-s.studDepth)],[tailFlatX,tailFlatY],[left,tailFlatY]],'timber',[0,0,0],.2);
  for(let i=0;i<s.topPlates;i++)c.rect(wallX,plateY+i*s.studFace*scale,s.studDepth*scale,s.studFace*scale,'plate',[0,0,0],.25);
  // Local cutaway to the adjacent rafter bay: the infill occupies the wall-head gap.
  c.polygon([[wallX,y(wallX,0)],[wallInner,y(wallInner,0)],[wallInner,plateY],[wallX,plateY]],[255,255,255],[0,0,0],0);
  const infill=[[wallX,y(wallX,0)],[wallInner,y(wallInner,0)],[wallInner,plateY],[wallX,plateY]];
  infill.forEach((p,i)=>line(p,infill[(i+1)%4],.22,[1,1]));
  c.text('PIR',(wallX+wallInner)/2,(y((wallX+wallInner)/2,0)+plateY)/2+1,7,true,'center');
  const wallBottom=Math.max(plateY+s.topPlates*s.studFace*scale+5,174);
  const wallOsb=11, wallBatten=25, cladding=18, claddingGap=3;
  // Unnotched sheathing ends 2/3 up the lower plate, below the rafter tails.
  const sheathingDrop=(s.topPlates-1+1/3)*s.studFace;
  const sheathingTop=plateY+sheathingDrop*scale;
  const sheathingOuter=wallX-wallOsb*scale;
  const battenOuter=sheathingOuter-wallBatten*scale;
  const claddingOuter=battenOuter-cladding*scale;
  const osbClearance=sheathingDrop-wallOsb*Math.tan(pitch);
  line([wallX,plateY+s.topPlates*s.studFace*scale],[wallX,wallBottom]);
  line([wallInner,plateY+s.topPlates*s.studFace*scale],[wallInner,wallBottom]);
  line([wallX,wallBottom],[wallX+4,wallBottom-1]);
  line([wallX+4,wallBottom-1],[wallInner-4,wallBottom+1]);
  line([wallInner-4,wallBottom+1],[wallInner,wallBottom]);
  layer(0,osb,'floor');
  layer(osb,top,[255,255,255]);
  for(let x=left+7;x<right-3;x+=10)c.text('PIR',x,y(x,osb+pir/2)+1,6,false,'center');
  line([left,y(left,top)],[right,y(right,top)],.65);
  for(const n of [top+2,top+batten])line([left,y(left,n)],[right,y(right,n)],.15,[2,1]);
  // Thin stepped metal sheet; drawing thickness exaggerated for legibility.
  const tileN=top+batten+5;
  const tilePoints:number[][]=[[left-15,y(left-15,tileN)]];
  for(let x=left+7;x<right;x+=250*scale*co){tilePoints.push([x,y(x,tileN)],[x+1,y(x+1,tileN)+1.2]);}
  tilePoints.push([right,y(right,tileN)]);
  tilePoints.slice(1).forEach((p,i)=>line(tilePoints[i],p,.65));
  // Vertical fascia fixed to rafter tails; tray passes over its top.
  const soffitThickness=9;
  const fasciaTop=y(left,top)+2,fasciaBottom=tailFlatY+soffitThickness*scale,fasciaHeight=(fasciaBottom-fasciaTop)/scale;
  c.rect(left-fasciaThickness*scale,fasciaTop,fasciaThickness*scale,fasciaBottom-fasciaTop,'timber',[0,0,0],.3);
  // Solid soffit closes the overhang; roof ventilation is above the membrane.
  const soffitY=tailFlatY;
  const soffitUnderside=soffitY+soffitThickness*scale;
  // Wall sheathing and finishes: a cutaway between vertical cladding battens.
  c.rect(sheathingOuter,sheathingTop,wallOsb*scale,wallBottom-sheathingTop,'floor',[0,0,0],.2);
  // Breather membrane continues above the OSB over the plates, sealed at its head.
  line([sheathingOuter,wallBottom],[sheathingOuter,sheathingTop],.45);
  line([sheathingOuter,sheathingTop],[wallX,plateY],.45);
  line([wallX,plateY],[wallX,plateY-1],.45);
  // Battens beyond the section; mesh closes the ventilated cavity at its top.
  for(const xx of [battenOuter,sheathingOuter])line([xx,soffitUnderside],[xx,wallBottom],.15,[2,1]);
  for(let xx=battenOuter+.5;xx<sheathingOuter;xx+=.9)line([xx,soffitUnderside],[xx+.5,soffitUnderside+.5],.18);
  const claddingTop=soffitUnderside+claddingGap*scale;
  for(let yy=claddingTop;yy<wallBottom;yy+=125*scale){
    const bottom=Math.min(yy+150*scale,wallBottom);
    c.polygon([[battenOuter-5*scale,yy],[battenOuter,yy],[battenOuter,bottom],[claddingOuter,bottom]],'timber',[0,0,0],.2);
  }
  // Soffit stops at the cladding face, rather than passing through the wall layers.
  if(claddingOuter>left)c.rect(left,soffitY,claddingOuter-left,soffitThickness*scale,[255,255,255],[0,0,0],.25);
  // Tray tucked under membrane and extending beyond fascia, with a drip into gutter.
  const trayEnd=[left-19,y(left,top)+8];
  line([left+24,y(left+24,top)+.8],[left,y(left,top)+.8],.35);
  line([left,y(left,top)+.8],trayEnd,.35);line(trayEnd,[trayEnd[0],trayEnd[1]+2],.35);
  // Open half-round gutter, supported by fascia bracket (schematic).
  const gx=left-19,gy=y(left,top)+5,gr=12;
  const arc=Array.from({length:25},(_,i)=>[gx+gr*Math.cos(Math.PI*i/24),gy+gr*Math.sin(Math.PI*i/24)]);
  arc.slice(1).forEach((p,i)=>line(arc[i],p,.65));
  line([left-4,gy+7],[gx+gr,gy+7],.5);
  // Inlet is above tray; dots indicate insect grille, not solid blocking.
  const inletX=left-1;
  for(let n=4;n<batten;n+=5)c.rect(inletX,y(inletX,top+n),.5,.5,[0,0,0],[0,0,0],.2);
  arrow([left-11,y(left-11,top+12)],[left+24,y(left+24,top+12)],[1.5,1]);
  arrow([left+32,y(left+32,top)+2],[left+5,y(left+5,top)+2]);
  // Starter cleat schematically hooks the first tile edge.
  line([left+8,y(left+8,tileN)-.8],[left-15,y(left-15,tileN)-.8],.3);
  line([left-15,y(left-15,tileN)-.8],[left-15,y(left-15,tileN)+1.5],.3);
  // Leaders stay short or outside the roof, avoiding longitudinal dimension lines.
  leader('Extralight Shingle roof tiles',right-27,y(right-27,tileN),197,39);
  leader('Single vertical battens 25 x 50',right-6,y(right-6,top+12),197,51);
  c.text('Eaves to ridge; approx. 200 mm centres.',197,57,6.5);
  c.text('Dashed: batten beyond section;',197,63,6.5);
  c.text('25 mm ventilation between battens.',197,69,6.5);
  c.text('No separate horizontal tile-batten layer.',197,75,6.5);
  leader('Breathable membrane',right,y(right,top),197,83);
  c.text('Directly on PIR; laps over tray.',197,88,6.5);
  leader('PIR insulation 100',right,y(right,osb+50),197,100);
  leader('OSB roof deck 11',right,y(right,osb/2),197,113);
  leader(`Rafter ${fmt(s.studFace)} x ${fmt(s.studDepth)}`,right,y(right,-s.studDepth/2),197,126);
  leader('Starter cleat',left-14,y(left-14,tileN),15,88);
  leader('Vent inlet above tray',left-1,y(left-1,top+12),15,104);
  leader('Eaves protector tray',48,y(left,top)+7,15,116);
  leader('Rain gutter',gx-8,gy+9,15,153);
  leader('Vertical fascia',left-2,fasciaBottom-8,15,177);
  leader(`${fmt(tailCut.plumbFace)} mm plumb rafter face`,left,tailTopY+tailCut.plumbFace*scale/2,15,166);
  leader(`${fmt(tailCut.horizontalRun)} horizontal underside cut`,(left+tailFlatX)/2,tailFlatY,65,177);
  if(claddingOuter>left)leader('Solid soffit 9 - stops at cladding face',(tailFlatX+claddingOuter)/2,soffitUnderside,65,185);
  vTechnical(c,plateY,sheathingTop,wallX,wallInner+7,fmt(sheathingDrop),6);
  leader('Wall OSB 11; unnotched top edge',sheathingOuter,sheathingTop,135,174);
  c.text(`${fmt(s.studFace*2/3)} up lower plate; ${fmt(osbClearance)} rafter clearance.`,135,179,6.2);
  leader('PIR blocking above wall plates',wallInner, (y(wallInner,0)+plateY)/2,197,139);
  c.text('Dashed cutaway: adjacent rafter bay.',197,144,6.5);
  c.text('Close to deck; seal edges to timber.',197,149,6.5);
  leader(`${s.topPlates} top plates: ${fmt(s.studFace)} x ${fmt(s.studDepth)}`,wallInner,plateY+s.studFace*scale,197,160);
  c.text('Wall below; maintain insulation continuity.',197,165,6.2);
  c.text('Join roof / wall air and vapour control layers.',197,170,6.2);
  c.text('Wall: 11 OSB + 25 cavity + 18 featheredge.',197,177,6.2);
  c.text('Battens dashed; insect mesh at cavity head.',197,182,6.2);
  c.text('Cladding top: 3 mm below soffit underside.',197,187,6.2);
  hTechnical(c,left-fasciaThickness*scale,wallX,fasciaBottom,181,`${fmt(s.gableOverhang)} wall to outer fascia`,5.5);
  c.text('FASCIA SECTION',15,35,8,true);
  const fx=40,fy=43,fs=.14,fw=fasciaThickness*fs,fh=fasciaHeight*fs;
  c.rect(fx,fy,fw,fh,'timber',[0,0,0],.25);
  hTechnical(c,fx,fx+fw,fy,39,fmt(fasciaThickness),6);
  vTechnical(c,fy,fy+fh,fx+fw,55,`${fmt(fasciaHeight)} overall height`,6);
  c.text('22 mm timber thickness assumed.',65,46,6.5);
  c.text('Fascia bottom flush with 9 mm soffit underside;',65,51,6.5);
  c.text('confirm against tray / gutter set-out.',65,56,6.5);


  c.line(12,190,285,190,[0,0,0],.2);
  c.text('Solid arrow: drainage. Dashed arrow: air inlet ABOVE membrane. Soffit closes the overhang; it does not ventilate the roof.',12,195,7);
  c.text('Wall membrane continues over plates; seal its head to timber. Confirm upper-plate restraint / fixings with reduced sheathing height.',12,200,6.5);
  c.text(`Garden room framing set | eaves cross section | page ${page} of ${total}`,148.5,207,6.4,false,'center');
  return c.stream();
}
