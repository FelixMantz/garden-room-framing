import { type Settings } from '../framing';
import { tieEndClearance } from '../roof';
import { canvas, fmt, hTechnical, vTechnical } from './layout';

/** Side elevation: transverse screws are seen end-on; rafter is behind the tie. */
export function drawTieConnection(s:Settings,page:number,total:number){
 const c=canvas(),d=tieEndClearance(s),k=.55,ox=66,oy=120;
 const X=(x:number)=>ox+x*k,Y=(z:number)=>oy-z*k;
 const slope=Math.tan(s.roofPitch*Math.PI/180),end=d.remainingDepth;
 const bolt=s.studDepth/2,seat=end+bolt*slope-12,plates=2*s.studFace;
 const top=(x:number)=>end+x*slope;
 const leader=(x:number,z:number,tx:number,ty:number)=>{c.line(X(x),Y(z),tx,ty,[0,0,0],.18);};
 c.text('Tie beam / rafter connection',12,12,14,true);
 c.text('Side view - adjacent rafter shown behind the tie beam | dimensions in mm',12,19,8);
 // Rafter and continuous roof deck behind the foreground tie.
 c.polygon([[0,top(0)],[255,top(255)],[255,top(255)-s.studDepth/Math.cos(s.roofPitch*Math.PI/180)],[s.studDepth,0],[0,0]].map(([x,z])=>[X(x),Y(z)]),'timber');
 const deck=11/Math.cos(s.roofPitch*Math.PI/180);
 c.polygon([[-10,top(-10)],[255,top(255)],[255,top(255)+deck],[-10,top(-10)+deck]].map(([x,z])=>[X(x),Y(z)]),[255,255,255]);
 // Both plate courses and chamfered oak tie.
 for(let i=0;i<2;i++)c.rect(X(0),Y(-i*s.studFace),s.studDepth*k,s.studFace*k,'plate');
 c.polygon([[0,0],[255,0],[255,s.tieDepth],[d.run,s.tieDepth],[0,end]].map(([x,z])=>[X(x),Y(z)]),'tie');
 // Counterbore is open to the sloping face; no washer beneath the coach head.
 c.polygon([[bolt-14,seat],[bolt+14,seat],[bolt+14,top(bolt+14)],[bolt-14,top(bolt-14)]].map(([x,z])=>[X(x),Y(z)]),[255,255,255]);
 c.rect(X(bolt-5.5),Y(seat),11*k,(seat+plates)*k,[255,255,255]);
 c.rect(X(bolt-5),Y(seat),10*k,180*k,[255,255,255],[0,0,0],.3);
 // Fully threaded shank with square neck directly beneath the domed head.
 for(let z=seat-8;z>seat-180;z-=3)c.line(X(bolt-5),Y(z),X(bolt+5),Y(z-2),[0,0,0],.10);
 c.rect(X(bolt-5.29),Y(seat),10.58*k,6.6*k,[255,255,255]);
 const head:number[][]=[];
 for(let i=0;i<=24;i++){const a=Math.PI*i/24;head.push([X(bolt+12.325*Math.cos(a)),Y(seat+5.38*Math.sin(a))]);}
 c.polygon(head,[255,255,255],[0,0,0],.3);
 c.rect(X(bolt-15),Y(-plates),30*k,3*k,[255,255,255],[0,0,0],.3);
 c.rect(X(bolt-8.5),Y(-plates-3),17*k,8*k,[255,255,255],[0,0,0],.3);
 // Two horizontal screws run into the page through the tie into the rafter.
 for(const [x,z] of [[bolt/2,top(bolt/2)/2],[120,s.tieDepth-30]]){
  const pts=Array.from({length:25},(_,i)=>[X(x+4*Math.cos(i*Math.PI/12)),Y(z+4*Math.sin(i*Math.PI/12))]);
  c.polygon(pts,[255,255,255],[0,0,0],.3);
  c.line(X(x-2),Y(z-2),X(x+2),Y(z+2),[0,0,0],.3);
  c.line(X(x-2),Y(z+2),X(x+2),Y(z-2),[0,0,0],.3);
 }
 c.text('M10 x 180 A2 coach bolt - DIN 603',12,29,9,true);
 c.text('24.65 dia. head; 5.38 high; fully threaded',12,35,7.5);
 c.text('28 dia. counterbore',12,44,8,true);
 c.text('12 deep vertically at bolt centre',12,50,7.5);
 c.text(`${fmt(12-14*slope)} shallow side (towards tie end)`,12,56,7.5);
 c.text(`${fmt(12+14*slope)} deep side (towards tie centre)`,12,62,7.5);
 c.text(`${fmt(s.tieDepth-seat)} deep from original flat top`,12,68,7.5,true);
 leader(bolt,seat,105,44);
 c.text('11 OSB',234,27,9,true);leader(245,top(245)+deck/2,250,30);
 c.text('Rafter',253,53,9,true);leader(232,top(232)-30,259,55);
 c.text('Chamfer',15,78,8,true);leader(12,top(12),44,77);
 c.rect(160,82,70,23,[255,255,255],[255,255,255],0);
 c.text('Oak tie beam',164,88,10,true);
 c.text(`${fmt(s.tieWidth)} depth into page`,164,95,8);
 c.text(`Bolt centred across depth: ${fmt(s.tieWidth/2)}`,164,102,8);
 c.text('Horizontal screws into adjacent rafter',150,130,8,true);
 c.text('Second screw: 120 from end; 30 below top',150,137,7.5);
 leader(120,s.tieDepth-30,148,128);
 c.text('Top plates',17,141,9,true);c.text(`2 x ${fmt(s.studFace)}`,17,147,8);
 c.text('M10 A2 nut + one A2 plate washer',151,155,8,true);
 c.text('Washer: 30 x 30 x 3; nut: 17 AF x 8 high',151,162,7.5);
 c.text(`Approx. ${fmt(180-seat-plates-11)} thread beyond nut`,151,169,7.5);
 leader(bolt,-plates-5,148,155);
 c.text('11 dia. through-hole',151,181,8);leader(bolt,-40,148,179);
 vTechnical(c,Y(end),Y(0),X(0),X(0)-8,`${fmt(end)} end`,8,'left');
 vTechnical(c,Y(s.tieDepth),Y(0),X(255),X(255)+8,`${fmt(s.tieDepth)} height`,8);
 c.line(X(0),Y(s.tieDepth),X(d.run),Y(s.tieDepth),[0,0,0],.12,[1,1]);
 hTechnical(c,X(0),X(d.run),Y(s.tieDepth),38,`${fmt(d.run)} chamfer run`,7);
 hTechnical(c,X(0),X(bolt),Y(0),Y(0)+8,fmt(bolt),7);
 hTechnical(c,X(bolt),X(s.studDepth),Y(0),Y(0)+8,fmt(bolt),7);
 hTechnical(c,X(0),X(s.studDepth),Y(-plates),190,`${fmt(s.studDepth)} plate width`,8);
 vTechnical(c,Y(s.tieDepth),Y(s.tieDepth-30),X(120),X(120)+8,'30',7);
 c.text(`Garden room framing set | tie beam connection | page ${page} of ${total}`,148.5,207,6.5,false,'center');
 return c.stream();
}
