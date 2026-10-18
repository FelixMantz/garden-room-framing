import {type Settings} from '../framing';
import {roofEnvelope} from '../roof-envelope';
import {canvas,fmt,hTechnical,vTechnical} from './layout';
const black=[0,0,0];
function title(c:ReturnType<typeof canvas>,name:string,s:Settings){
 c.text(name,12,12,14,true);
 c.text(`mm ALONG THE ${fmt(s.roofPitch)} DEG SLOPE; widths parallel to ridge.`,12,21,9,true);
}
function footer(c:ReturnType<typeof canvas>,page:number,total:number){c.text(`Garden room framing set | roof envelope | page ${page} of ${total}`,148.5,205,6.4,false,'center');}
export function drawRoofEnvelope(s:Settings,page:number,total:number,c=canvas()){
 const m=roofEnvelope(s);title(c,'Roof OSB / PIR',s);
 // Two developed slopes use independent axes, retaining the actual sheet proportions.
 const scale=Math.min(250/m.width,65/(m.deck.deckSlope+m.tip)),X=(x:number)=>24+(x-m.left)*scale;
 function plan(kind:'osb'|'pir',top:number){
  const Y=(v:number)=>top+(v+(kind==='pir'?m.tip:0))*scale;
  c.text(kind==='osb'?'11 OSB':'100 PIR',12,top-8,10,true);
  const panels=kind==='osb'?m.osb:[...m.upper,...m.eaves];
  panels.forEach(q=>{c.rect(X(q.x),Y(q.y),q.w*scale,q.h*scale,kind==='osb'?'timber':'floor');c.text(q.id,X(q.x+q.w/2),Y(q.y+q.h/2)-1,8,true,'center');c.text(`${fmt(q.w)} x ${fmt(q.h)}`,X(q.x+q.w/2),Y(q.y+q.h/2)+4,7,false,'center');});
  for(const x of [0,m.roof.length])c.line(X(x),Y(kind==='pir'?-m.tip:0),X(x),Y(kind==='pir'?m.pirEnd:m.deck.deckSlope),black,.4,[2,1]);
  const wallS=m.deck.deckSlope-m.roof.eavesTailRun/Math.cos(s.roofPitch*Math.PI/180);
  c.line(X(m.left),Y(wallS),X(m.right),Y(wallS),black,.4,[2,1]);
  if(kind==='osb'){
   for(const x of m.structural)c.line(X(x),Y(0),X(x),Y(m.deck.deckSlope),black,.12,[1,1]);
   c.line(X(m.left),Y(m.deck.fromRidgeSlope),X(m.right),Y(m.deck.fromRidgeSlope),black,.7);
   hTechnical(c,X(m.left),X(m.right),Y(0),top-2,`${fmt(m.width)}`,8);
   vTechnical(c,Y(0),Y(1200),X(m.right),X(m.right)+9,'1200',8);
   vTechnical(c,Y(1203),Y(m.deck.deckSlope),X(m.right),X(m.right)+9,fmt(m.lower),8);
   vTechnical(c,Y(0),Y(m.deck.deckSlope),X(m.right),X(m.right)+18,fmt(m.deck.deckSlope),8);
  }else{
   c.line(X(m.left),Y(0),X(m.right),Y(0),black,.2,[1,1]);
   vTechnical(c,Y(-m.tip),Y(m.jointS),X(m.right),X(m.right)+9,'1200 blank',8);
   vTechnical(c,Y(m.jointS),Y(m.pirEnd),X(m.right),X(m.right)+9,`${fmt(m.pirLower)} blank`,8);
  }
  c.text('Ridge',X(m.left)-2,top+3,7,true,'right');c.text('Eaves',X(m.left)-2,Y(m.deck.deckSlope)-1,7,true,'right');
 }
 plan('osb',40);plan('pir',123);
 c.text(`Noggin C/L ${fmt(m.deck.fromRidgeSlope)}; joints 3.`,12,109,8);
 c.text('Heavy: noggins | dotted: rafters | dashed: walls',12,193,8);
 c.text('OSB square ends; lower-corner datums.',285,193,8,false,'right');
 footer(c,page,total);return c.stream();
}
export function drawRoofEnvelopeCuts(s:Settings,page:number,total:number,c=canvas()){
 const m=roofEnvelope(s);title(c,'Roof sheet nests',s);
 c.text('OSB 2440 x 1220 x 11 | kerf 3',12,33,10,true);
 m.columns.forEach((q,i)=>{
  const x=12+i*55,sc=65/2440;
  c.text(`Sheets ${i+1} / ${i+1+m.columns.length}`,x,42,8,true);
  c.rect(x,46,1220*sc,2440*sc);
  c.rect(x,46,q.w*sc,1200*sc,'timber');c.rect(x,46+1203*sc,q.w*sc,m.lower*sc,'floor');
  c.text(`U${i+1}`,x+q.w*sc/2,46+600*sc,9,true,'center');
  c.text(`E${i+1}`,x+q.w*sc/2,46+(1203+m.lower/2)*sc,9,true,'center');
  c.text(`${fmt(q.w)} wide`,x,117,8);
 });
 c.text(`OSB lower face: 1200 + 3 + ${fmt(m.lower)} = ${fmt(m.deck.deckSlope)}; square both ends.`,12,124,8);
 c.text('PIR 2400 x 1200 x 100 | kerf 3',12,130,10,true);
 const sc=42/2400,top=144;
 const nests=[{label:'1-4',parts:[{id:'RU1 / RU2',w:2400,h:1200}]},{label:'5',parts:[{id:'RU3',w:m.width-4800,h:1200},{id:'RU3',w:m.width-4800,h:1200}]},{label:'6-9',parts:[{id:'RE2 / RE3',w:2400,h:m.pirLower}]},{label:'10',parts:[{id:'RE1',w:m.width-4800,h:m.pirLower},{id:'RE1',w:m.width-4800,h:m.pirLower}]}];
 nests.forEach((nest,i)=>{const x=12+i*68;c.text(`Boards ${nest.label}`,x,138,8,true);c.rect(x,top,2400*sc,1200*sc);let offset=0;for(const q of nest.parts){c.rect(x+offset*sc,top,q.w*sc,q.h*sc,'floor');c.text(q.id,x+(offset+q.w/2)*sc,top+q.h*sc/2,7,true,'center');offset+=q.w+3;}});
 c.text(`OSB: 26 = 15 walls + ${m.osbSheets} roof + ${m.osbReserve} spare`,12,180,9,true);
 c.text(`100 PIR: 16 = 6 floor + ${m.pirSheets} roof`,12,187,9,true);
 c.text('Wall / socket / plinth PIR reserved separately.',12,194,8);
 if(!m.fits||m.osbReserve<0)c.text('Adjusted geometry: stock check required.',285,194,8,true,'right');
 footer(c,page,total);return c.stream();
}
/** Label baseline is perpendicular to the measured direction. */
function cutDimension(c:ReturnType<typeof canvas>,a:number[],b:number[],offset:number,label:string){
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
 const aa=[a[0]+nx*offset,a[1]+ny*offset],bb=[b[0]+nx*offset,b[1]+ny*offset];
 c.line(...[a[0],a[1],aa[0],aa[1]] as [number,number,number,number],black,.1);
 c.line(...[b[0],b[1],bb[0],bb[1]] as [number,number,number,number],black,.1);
 c.line(aa[0],aa[1],bb[0],bb[1],black,.15);
 for(const q of [aa,bb])c.line(q[0]-nx,q[1]-ny,q[0]+nx,q[1]+ny,black,.18);
 let angle=Math.atan2(dy,dx)*180/Math.PI+90;while(angle>90)angle-=180;while(angle<-90)angle+=180;
 c.textRotated(label,(aa[0]+bb[0])/2+nx*2,(aa[1]+bb[1])/2+ny*2,angle,7.5,true);
}
export function drawRoofEnvelopeDetails(s:Settings,page:number,total:number,c=canvas()){
 const m=roofEnvelope(s),p=s.roofPitch*Math.PI/180;title(c,'PIR cuts / edge backing',s);
 c.text('Ridge',12,34,10,true);
 const sc=.43,X=(u:number,n:number)=>98+(-11*Math.sin(p)+u*Math.cos(p)-n*Math.sin(p))*sc,Y=(u:number,n:number)=>96-(11*Math.cos(p)+u*Math.sin(p)+n*Math.cos(p))*sc;
 const world=(q:number[])=>[X(q[0],q[1]),Y(q[0],q[1])];
 c.rect(98,96-m.ridgeAboveRafter*sc,s.ridgeWidth*sc,37,'ridge');
 c.polygon(m.pirRidgePolygon.map(world),'floor');
 c.polygon([[-150,0],[0,0],[0,-11],[-150,-11]].map(world),'timber');
 const centre=98+s.ridgeWidth*sc/2;c.line(centre,36,centre,145,black,.15,[1,1]);
 const foot=world(m.ridgeSideFoot),corner=world(m.ridgeSideTop),end=world(m.ridgeCentreTop);
 cutDimension(c,corner,end,-12,`${fmt(m.rebateWidth)} H`);
 cutDimension(c,foot,corner,26,`${fmt(m.rebateDepth)} V`);
 cutDimension(c,world([-110,0]),world([-110,100]),-12,'100');
 cutDimension(c,world([-140,-11]),world([-140,0]),-12,'11');
 // Angle arc between the upper face and the vertical meeting cut.
 const tip=world([m.tip,100]),radius=9;
 for(let i=0;i<18;i++){const a=(90+(90-s.roofPitch)*i/18)*Math.PI/180,b=(90+(90-s.roofPitch)*(i+1)/18)*Math.PI/180;c.line(tip[0]+radius*Math.cos(a),tip[1]+radius*Math.sin(a),tip[0]+radius*Math.cos(b),tip[1]+radius*Math.sin(b),black,.15);}
 c.textRotated(`${fmt(90-s.roofPitch)} deg`,tip[0]-7,tip[1]+15,0,7.5,true);
 c.line(X(0,-11),Y(0,-11),127,130,black,.15);c.text('OSB contact',128,131,7);
 c.text('H horizontal / V vertical',12,145,7);
 c.text('Plumb cheek / horizontal shoulder',12,152,7);
 c.text('Eaves',160,34,10,true);
 const ex=173,ey=49,es=.43,w=195;
 c.polygon([[ex+m.bevel*es,ey],[ex+w*es,ey],[ex+w*es,ey+100*es],[ex,ey+100*es]],'floor');
 cutDimension(c,[ex,ey+100*es],[ex+m.bevel*es,ey],15,`${fmt(100/Math.cos(p))}`);
 cutDimension(c,[ex,ey+100*es],[ex+m.bevel*es,ey+100*es],12,fmt(m.bevel));
 cutDimension(c,[ex+w*es,ey],[ex+w*es,ey+100*es],-12,'100');
 c.textRotated(`${fmt(90-s.roofPitch)} deg`,ex+m.bevel*es+11,ey+10,0,7.5,true);
 // Full upper / lower blanks with the actual ridge rebate; common scale.
 const bs=92/1200,base=165;
 function strip(kind:'upper'|'lower',top:number){
  const length=kind==='upper'?1200:m.pirLower,short=kind==='upper'?m.jointS+m.osbSetback:m.pirLower-m.bevel;
  c.text(kind==='upper'?'Upper':'Lower',148,top+4,7,true);
  if(kind==='upper'){
   const u0=-m.jointS,F=(q:number[])=>[base+(q[0]-u0)*bs,top+(100-q[1])*bs];
   c.polygon([[u0,0],[u0,100],[m.tip,100],m.ridgeCentreTop,m.ridgeSideTop,m.ridgeSideFoot].map(F),'floor');
   cutDimension(c,[base,top],[base+length*bs,top],-5,fmt(length));
   cutDimension(c,[base,top+100*bs],[base+short*bs,top+100*bs],5,fmt(short));
  }else{
   c.polygon([[base,top],[base+short*bs,top],[base+length*bs,top+100*bs],[base,top+100*bs]],'floor');
   cutDimension(c,[base,top],[base+short*bs,top],-5,fmt(short));
   cutDimension(c,[base,top+100*bs],[base+length*bs,top+100*bs],5,fmt(length));
  }
 }
 strip('upper',126);strip('lower',151);
 c.text('45 x 95 noggins: one sheet-joint row per slope',12,177,10,true);
 const gx=24,gy=183,gw=220,gh=9;
 c.rect(gx,gy,gw,gh);for(const x of [gx,gx+55,gx+110,gx+165,gx+220])c.line(x,gy,x,gy+gh,black,.7);
 c.line(gx,gy+gh/2,gx+gw,gy+gh/2,black,.65);
 c.text(`${m.blocking.length} seam blocks total | joint C/L ${fmt(m.deck.fromRidgeSlope)} from ridge | no added edge rows`,12,198,8);
 footer(c,page,total);return c.stream();
}
export function drawRoofBattens(s:Settings,page:number,total:number,c=canvas()){
 const m=roofEnvelope(s);title(c,'Batten overlay / fixing schedule',s);
 const scale=Math.min(247/m.width,115/(m.deck.deckSlope+m.tip)),X=(x:number)=>25+(x-m.left)*scale,Y=(v:number)=>40+(v+m.tip)*scale;
 [...m.upper,...m.eaves].forEach(q=>{c.rect(X(q.x),Y(q.y),q.w*scale,q.h*scale,'floor');c.text(q.id,X(q.x+q.w/2),Y(q.y+q.h/2),8,true,'center');});
 const start=100,end=m.deck.deckSlope-100,mid=(start+end)/2;
 for(const x of m.structural){c.rect(X(x-25),Y(0),50*scale,m.pirEnd*scale,'timber',black,.35);for(const y of [start,...(m.roof.rafters.includes(x)?[mid]:[]),end])c.rect(X(x)-.75,Y(y)-.75,1.5,1.5,'ridge');}
 for(const x of m.intermediate){c.line(X(x),Y(0),X(x),Y(m.pirEnd),black,.5,[2,1]);for(const y of [start,end]){c.line(X(x)-1,Y(y)-1,X(x)+1,Y(y)+1,black,.25);c.line(X(x)-1,Y(y)+1,X(x)+1,Y(y)-1,black,.25);}}
 hTechnical(c,X(m.left),X(m.right),Y(0),33,fmt(m.width),8);
 vTechnical(c,Y(0),Y(m.deck.deckSlope),X(m.right),283,fmt(m.deck.deckSlope),8);
 c.text('Ridge',12,Y(0)+2,7,true);c.text('Eaves',12,Y(m.deck.deckSlope)-1,7,true);
 c.text('25 x 50 | ~200 centres | every second structural, into rafters',12,146,9,true);
 c.text('Solid / squares: inclined SPAX 220 | 30 x 3 + 4 x 2 = 98; 2 spare',12,155,9);
 c.text('Dashed / crosses: gold 140 into OSB | 26 x 2 = 52; 48 remaining',12,164,9);
 c.text(`Proposed screw stations: ${fmt(start)} / ${fmt(mid)} / ${fmt(end)} from ridge face`,12,173,8);
 c.text('SPAX 220: 67 deg to roof plane / 23 deg from perpendicular; tips point upslope.',12,179,7);
 c.text(`Structural C/L from left deck edge: ${m.structural.map(x=>fmt(x-m.left)).join(', ')}`,12,184,6.4);
 c.text(`Intermediate C/L: ${m.intermediate.map(x=>fmt(x-m.left)).join(', ')}`,12,191,6.4);
 footer(c,page,total);return c.stream();
}

