import type { Settings, WallId } from '../framing';
import { CLADDING_LAYOUT, claddingLayout, type CladdingOptions } from '../cladding-layout';
import { canvas, fmt } from './layout';
const footer=(c:ReturnType<typeof canvas>,page:number,total:number,label:string)=>c.text(`Garden room framing set | ${label} | page ${page} of ${total}`,148.5,207,6.4,false,'center');
export function drawCladding(s:Settings,page:number,total:number,c=canvas(),o:CladdingOptions=CLADDING_LAYOUT){
 const p=claddingLayout(s,o);
 c.text('Cladding layout - all elevations',12,11,14,true);
 c.text(`${o.boardWidth} mm featheredge | ${fmt(p.gauge)} mm course gauge | ${fmt(p.lap)} mm lap | outside views | dimensions in mm`,12,18,8);
 p.walls.forEach((w,i)=>{
  const ox=i%2?160:22,by=i<2?96:178,k=Math.min(116/(w.b-w.a),64/(w.max-o.bottom));
  const X=(x:number)=>ox+(x-w.a)*k,Y=(z:number)=>by-(z-o.bottom)*k;
  c.text(w.cfg.name,ox,i<2?28:109,10,true);
  for(const v of w.pieces){
   c.polygon(v.points.map(([x,y])=>[X(x),Y(y)]),[255,255,255],[0,0,0],.12);
   for(const n of v.notches)c.rect(X(n.x),Y(n.top),(n.end-n.x)*k,(n.top-n.bottom)*k,[255,255,255],[0,0,0],.12);
   if(v.end-v.x>400)c.text(v.id,X((v.x+v.end)/2),Y(v.bottom+Math.min(p.gauge,v.top-v.bottom)/2)+.6,5.3,false,'center');
  }
  for(const op of w.cfg.computedOpenings){const y=Math.max(o.bottom,op.sill);c.rect(X(op.x),Y(op.sill+op.height),op.width*k,(op.sill+op.height-y)*k,[255,255,255],[0,0,0],.3);c.text(op.type==='window'?'WINDOW':'DOOR',X(op.x+op.width/2),Y((op.sill+op.height+y)/2),6,true,'center');}
  c.text(`End-to-end ${fmt(w.b-w.a)}; ${Math.max(...w.pieces.map(v=>v.course))} courses`,ox,by+5,6.8);
  c.text(w.joints.length?`Joint axes x = ${w.joints.map(fmt).join(' / ')} from left frame edge`:'Single lengths between corners / openings',ox,by+10,6.5);
 });
 c.text(`Base ${fmt(o.bottom)} from sole / DPC. Eaves top ${fmt(p.eavesTop)}; ${p.courses} courses to eaves. IDs refer to the following cutting sheets.`,12,196,7);
 c.text('Corners hide board ends. Gables continue the same gauge; cut diagonal tops to the roof line. Measure installed terminations before cutting.',12,201,6.8);
 footer(c,page,total,'All-elevation cladding layout');return c.stream();
}
export function drawCladdingCuts(s:Settings,wall:WallId,page:number,total:number,c=canvas(),o:CladdingOptions=CLADDING_LAYOUT){
 const p=claddingLayout(s,o),w=p.walls.find(v=>v.id===wall)!;
 c.text(`${w.cfg.name} - featheredge cutting schedule`,12,11,14,true);
 c.text(`${o.boardWidth} mm blanks | lengths rounded UP to mm | x / z measured from left frame edge / sole underside | stock references S1-S${p.bins.length}`,12,18,7.2);
 const rows=w.pieces;
 const half=Math.ceil(rows.length/2),step=Math.min(7.5,151/Math.max(1,half));
 rows.forEach((v,i)=>{
  const col=Math.floor(i/half),row=i%half,x=12+col*141,y=33+row*step;
  if(row===0){c.text('Piece / course base z',x,26,7,true);c.text('Length / stock / finish',x+68,26,7,true);}
  c.text(`${v.id}  z ${fmt(v.bottom)}`,x,y,7);
  c.text(`${v.length}  S${v.stock}${v.bevel?'  slope/rip':''}${v.notches.length?'  notch*':''}`,x+68,y,7,true);
  c.text(`Top L/R ${fmt(v.points.at(-1)![1]-v.bottom)} / ${fmt(v.points[2][1]-v.bottom)}${v.bevel&&v.x<w.peak&&v.end>w.peak?` / apex ${fmt(v.top-v.bottom)}`:''}`,x,y+2.8,6.2);
 });
 c.text(`Common gauge ${fmt(p.gauge)}; lap ${fmt(p.lap)}. Mark bases from datum: z = ${fmt(o.bottom)} + (course - 1) x ${p.gauge.toFixed(4)}; do not accumulate rounded steps.`,12,188,6.8);
 c.text('* Notch the full blank around openings: allow 5 mm around structural apertures. See app for x / z notch extents and diagonal end heights.',12,193,6.8);
 c.text('Opening positions are structural datums, not measured trim / cill limits. Adjust notches to fitted liners, flashings and cills before batch cutting.',12,198,6.8);
 c.text('Keep thick edges down; retain the thick edge when ripping the top. Fit a starter packer; support top rips and preserve insect-protected airflow.',12,203,6.8);
 footer(c,page,total,`${w.cfg.name} cladding cuts`);return c.stream();
}
export function drawCladdingStock(s:Settings,page:number,total:number,c=canvas(),o:CladdingOptions=CLADDING_LAYOUT){
 const p=claddingLayout(s,o);
 c.text('Featheredge stock allocation and finishing',12,11,14,true);
 c.text(`${p.bins.length} of ${o.ordered} ordered 4.8 m boards allocated; ${p.spare} unallocated | ${fmt(p.totalMetres)} linear m of blanks | 3 mm kerf + 5 mm end trim each end`,12,18,8);
 const half=Math.ceil(p.bins.length/2),step=Math.min(4.5,142/half);
 p.bins.forEach((b,i)=>{const col=Math.floor(i/half),row=i%half,x=12+col*141,y=29+row*step;c.text(`S${i+1}: ${b.pieces.map(v=>v.id).join(' + ')} | rem ${Math.floor(b.remaining)}`,x,y,6.4);});
 c.text('Exact-fit eaves: H = eaves top - base; gauge = (H - board width) / (courses - 1). Choose a course count giving 35-40 mm lap.',12,177,7);
 c.text(`Default: H ${fmt(p.eavesTop-o.bottom)}, ${p.courses} courses, gauge ${fmt(p.gauge)}, lap ${fmt(p.lap)}. Full-width top board; no narrow eaves sliver.`,12,182,7);
 c.text('Joint axes alternate by course on long runs. Provide 100 mm-wide backing (two adjacent 50 mm battens), fixed into sound framing.',12,187,7);
 c.text(`Allow ${fmt(p.jointBackingMetres)} m ADDITIONAL 25 x 50 backing at joint axes, before cutting waste; use reserved wall stock and check usable offcuts.`,12,192,7);
 c.text('5 mm provisional butt gaps; protect cut ends, keep each board independently fixed. Confirm overlap / joint gaps with supplier and dry-laid sample.',12,197,7);
 c.text('Gable tips / thin upper edges need packing and a weathered verge cover; retain ventilation. Allocation excludes defect losses and reuses no notch waste.',12,202,6.8);
 footer(c,page,total,'Cladding stock and setting-out');return c.stream();
}
