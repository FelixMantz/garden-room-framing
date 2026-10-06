import { buildModel, slopePolygon, type Settings, type WallConfig } from '../framing';
import { sheathingPlan, wallOsbTop, OSB_STOCK } from '../sheathing';
import { canvas, fmt } from './layout';
type C=ReturnType<typeof canvas>;
const footer=(c:C,page:number,total:number,label:string)=>c.text(`Garden room framing set | ${label} | page ${page} of ${total}`,148.5,207,6.4,false,'center');
export function drawSheathing(s:Settings,page:number,total:number,c:C=canvas()){
 const p=sheathingPlan(s);c.text('OSB wall sheathing - all four external elevations',12,11,14,true);
 c.text('11 mm OSB3 | ordered sheets 1220 x 2440 | 3 mm joints | dimensions from sole underside / wall-body left',12,18,7.5);
 c.text(`${p.sheetCount} sheets allocated including both gables; keep all labelled offcuts. Panel IDs refer to the cutting plan.`,12,24,7.5,true);
 function wall(cfg:WallConfig,left:number,base:number,title:number){
  const sc=.023,min=cfg.isSide?-cfg.cornerLap:0,X=(x:number)=>left+(x-min)*sc,Y=(y:number)=>base-y*sc;
  c.text(`${cfg.name.toUpperCase()} - viewed from outside`,left,title,9,true);
  for(const q of p.panels.filter(q=>q.wall===cfg.id)){
   c.polygon(q.points.map(([x,y])=>[X(x),Y(y)]),[255,255,255],[0,0,0],.3);
   const cx=X(q.x+q.w/2),cy=Y(q.y+Math.min(q.h/2,300));
   c.text(q.id,cx,cy,6.5,true,'center');
   if(!q.gable)c.text(`${fmt(q.w)} wide`,cx,base+4,5.5,false,'center');
  }
  // Studs and noggins behind OSB, with openings routed out after fitting.
  for(const m of buildModel(cfg)){
   const pts=m.shape==='slope'?slopePolygon(m):[[m.x!,m.y!],[m.x!+m.w!,m.y!],[m.x!+m.w!,m.y!+m.h!],[m.x!,m.y!+m.h!]];
   for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];c.line(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),[0,0,0],.08,[.6,.6]);}
  }
  for(const o of cfg.computedOpenings){c.rect(X(o.x),Y(o.sill+o.height),o.width*sc,o.height*sc,[255,255,255],[0,0,0],.25);c.text(o.type==='window'?'WINDOW':'DOOR',X(o.x+o.width/2),Y(o.sill+o.height/2),6,true,'center');}
  if(cfg.gable){const x=cfg.width/2-cfg.ridgeWidth/2;c.rect(X(x),Y(cfg.ridgeTop),cfg.ridgeWidth*sc,(cfg.ridgeTop-cfg.ridgeBottom)*sc,[255,255,255],[0,0,0],.2);c.text('Cut around ridge beam',left+80,title+5,5.5);}
  c.line(X(min),base,X(cfg.isSide?cfg.width+cfg.cornerLap:cfg.width),base,[0,0,0],.15,[2,.7,.3,.7]);
  const mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH'));
  c.text(`Joint axes x: ${mains.filter((q,i)=>i<mains.length-1&&Math.abs(mains[i+1].x-q.x-q.w-3)<.01).map(q=>fmt(q.x+q.w+1.5)).join(', ')}`,left,base+9,6);
  c.text(`OSB top ${fmt(wallOsbTop(cfg))}; bottom +${OSB_STOCK.bottom}; blank height ${fmt(wallOsbTop(cfg)-OSB_STOCK.bottom)}`,left,base+14,6);
  if(cfg.gable)c.text(`Gable joint axis +${fmt(cfg.wallHeight-cfg.studFace/2)} on upper plate; 3 below roof deck`,left,base+19,6);
 }
 wall(p.configs[0],12,80,32);wall(p.configs[1],160,80,32);
 wall(p.configs[2],12,175,107);wall(p.configs[3],160,175,107);
 c.text('Solid outlines = OSB cuts; dashed timber = backing. Window / door edges bear on sill, lintel and jamb timber.',12,199,6.8);
 footer(c,page,total,'OSB wall elevations');return c.stream();
}
export function drawSheathingCuts(s:Settings,page:number,total:number,c:C=canvas()){
 const p=sheathingPlan(s);c.text('OSB cutting and offcut reuse plan',12,11,14,true);
 c.text(`${p.sheetCount} of ${OSB_STOCK.quantity} ordered sheets allocated to walls and gables; ${OSB_STOCK.quantity-p.sheetCount} remain for roof / reserve. 3 mm saw kerf allowed.`,12,18,7.5);
 c.text('Cut full-height wall blanks first; route openings and retain cut-outs. Cut gable blanks next, then mark / cut roof slopes.',12,24,7);
 const groups=[p.cuts.filter(q=>!q.panel.includes('G')&&!q.panel.startsWith('FH')),p.cuts.filter(q=>q.panel.includes('G')||q.panel.startsWith('FH'))];
 groups.forEach((cuts,col)=>{const x=12+col*144;c.text(col?'GABLES / DOOR HEAD - REUSED MATERIAL':'WALL BLANKS - CUT WIDTH x HEIGHT',x,33,8,true);let y=40;
  for(const q of cuts){c.text(`${q.panel}  ${fmt(q.w)} x ${fmt(q.h)}  [sheet ${q.sheet}]`,x,y,7,true);c.text(q.source,x,y+4,6);y+=8;}
 });
 c.line(12,181,285,181,[0,0,0],.2);
 const notes=['Blank dimensions include joint clearance; these are finished sizes, not nominal 1200 mm module sizes.',
 'Gable sizes are enclosing rectangles: mark the slope from the elevation / actual rafter, then trim. Cut around the projecting ridge beam.',
 `The ${p.sheetCount}-sheet layout is a practical cutting plan, not a proven mathematical minimum. Keep one extra sheet available for damage / site variation.`,
 'Do not discard offcuts until every listed reuse is complete. Measure the actual frame before batching cuts; leave the saw kerf on the waste side.'];
 let y=187;for(const n of notes){c.text(n,12,y,6.7);y+=5;}
 footer(c,page,total,'OSB cutting plan');return c.stream();
}
export function drawSheathingDetails(s:Settings,page:number,total:number,c:C=canvas()){
 c.text('Featheredge cladding - corner post and concealed edge battens',12,11,14,true);
 c.text('Horizontal section / plan | dimensions in mm | schematic corner framing; do not scale',12,18,7.5);
 const x=137,y=105,k=.48,black=[0,0,0],X=(v:number)=>x+v*k,Y=(v:number)=>y+v*k;
 const block=(a:number,b:number,w:number,h:number,fill:'timber'|'floor')=>c.rect(X(a),Y(b),w*k,h*k,fill,black,.25);
 const label=(text:string,a:number,b:number,tx:number,ty:number,align:'left'|'right'='left')=>{
  const elbow=tx===12?78:210;
  c.line(X(a),Y(b),elbow,ty-1,black,.16);c.line(elbow,ty-1,tx===12?76:tx,ty-1,black,.16);
  c.rect(X(a)-.4,Y(b)-.4,.8,.8,black,black,0);c.text(text,tx,ty,8,true,align);
 };
 // California corner: end stud, flatwise lining return, and perpendicular side-wall end stud.
 block(0,0,s.studFace,s.studDepth,'timber');
 block(s.studFace,s.studDepth-s.studFace,s.studDepth,s.studFace,'timber');
 block(0,s.studDepth,s.studDepth,s.studFace,'timber');
 // Fit the side first; the long-wall sheet covers its 11 mm edge.
 block(-OSB_STOCK.thickness,0+OSB_STOCK.gap,OSB_STOCK.thickness,137,'floor');
 block(-OSB_STOCK.thickness,-OSB_STOCK.thickness,151,OSB_STOCK.thickness,'floor');
 // Non-structural trim post sits just outside the wrapped OSB corner.
 const postSize=45,postInner=-OSB_STOCK.thickness-.8,postOuter=postInner-postSize,endGap=5,claddingStart=postInner+endGap;
 block(postOuter,postOuter,postSize,postSize,'timber');
 // Blind vertical battens: their 50 mm face supports featheredge ends behind the cladding.
 block(postInner,-36,50,25,'timber');block(-36,postInner,25,50,'timber');
 block(claddingStart,-54,140-claddingStart,18,'timber');block(-54,claddingStart,18,140-claddingStart,'timber');
 // Continuous breather membrane: outside both sheets, turning around the overlap.
 c.line(X(-11)-.6,Y(140),X(-11)-.6,Y(-11)-.6,black,.5);
 c.line(X(-11)-.6,Y(-11)-.6,X(140),Y(-11)-.6,black,.5);
 c.text('OUTSIDE',91,57,9,true);c.text('INSIDE',191,164,9,true);
 label('Long-wall OSB - 11 mm; overlaps side edge',115,-5.5,214,94);
 label('Long-wall corner stud - 45 x 95',s.studFace/2,s.studDepth/2,214,116);
 label('California return stud - 45 x 95',s.studFace+s.studDepth/2,s.studDepth-s.studFace/2,214,138);
 label('Side-wall end stud - 45 x 95',s.studDepth/2,s.studDepth+s.studFace/2,214,160);
 label('Side-wall OSB - 11 mm',-5.5,100,12,157);
 label('Side blind vertical batten - 25 x 50',-23.5,20,12,113);
 label('Side featheredge - nominal 18 mm',-45,90,12,135);
 label('Corner post - 45 x 45 treated timber',postOuter+postSize/2,postOuter+postSize/2,12,44);
 label('5 mm featheredge end gap to post',-45,postInner+endGap/2,12,91);
 label('Long-wall featheredge - nominal 18 mm',115,-45,214,30);
 label('Long-wall blind vertical batten - 25 x 50',20,-23.5,214,72);
 label('Breather membrane - continuous wrap',-12.2,130,12,179);
 label('25 mm ventilated cavity between battens',115,-23.5,214,50);
 // Small clearance enlarged by the plan scale, identified with a leader rather than a false dimension.
 label('3 mm clear at side-sheet end',-5.5,1.5,12,66);
 c.text('Fit side sheets first. Front / rear sheets extend 11 beyond each frame end; fix the overlap into corner timber.',12,190,7.5);
 c.text('Fix both blind battens through OSB into corner studs, then screw the post to both battens before fitting featheredge.',12,196,7.5);
 c.text('45 x 45 post is a working size: approx. 3 mm proud of 18 mm cladding. Leave 5 mm end gaps; keep cavity top / bottom open.',12,202,7.5);
 footer(c,page,total,'OSB and cladding corner');return c.stream();
}
