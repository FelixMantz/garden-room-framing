import type { Settings } from '../framing';
import { CLADDING_LAYOUT, claddingLayout, claddingCutSummary, type CladdingOptions } from '../cladding-layout';
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
export function drawCladdingCuts(s:Settings,page:number,total:number,c=canvas(),o:CladdingOptions=CLADDING_LAYOUT){
 const p=claddingLayout(s,o),{cuts}=claddingCutSummary(p);
 c.text('Featheredge cutting list - quantity x length',12,11,14,true);
 c.text(`All four elevations combined | ${o.boardWidth} mm-wide blanks | cut lengths in mm | ${p.pieces.length} pieces`,12,19,8);
 c.text('QUANTITY',18,31,8,true);c.text('CUT LENGTH',64,31,8,true);c.text('FINISH AFTER CROSS-CUTTING',115,31,8,true);
 cuts.forEach((g,i)=>{const y=41+i*7.8;
  c.text(`${g.quantity} x`,24,y,10,true);c.text(`${g.length} mm`,64,y,10,true);
  const slope=g.pieces.filter(v=>v.bevel).length,notch=g.pieces.filter(v=>v.notches.length).length;
  c.text([slope?`${slope} slope / top rip`:'',notch?`${notch} opening notch`:''].filter(Boolean).join('; ')||'Square blanks',115,y,8);
  c.line(16,y+2.5,280,y+2.5,[0,0,0],.1);
 });
 c.text(`Total ${p.pieces.length} blanks / ${fmt(p.totalMetres)} linear m; allocate ${p.bins.length} of ${o.ordered} ordered 4.8 m boards.`,12,182,8,true);
 c.text('Use the nesting patterns on the next page before cutting. Quantities include full-width blanks for gable slopes and opening notches.',12,190,7.5);
 c.text('Label blanks by length, then match piece IDs on the elevation / app installation details. Equal lengths can have different final profiles.',12,196,7.2);
 c.text('Measure fitted corners, cills and flashings before final shaping. Protect cut ends; preserve the thick lower edge.',12,202,7.2);
 footer(c,page,total,'Cladding quantity x length');return c.stream();
}
export function drawCladdingStock(s:Settings,page:number,total:number,c=canvas(),o:CladdingOptions=CLADDING_LAYOUT){
 const p=claddingLayout(s,o),{patterns}=claddingCutSummary(p);
 c.text('4.8 m stock - repeated nesting patterns',12,11,14,true);
 c.text(`${p.bins.length} boards used; ${p.spare} whole boards spare | each bar = one 4800 mm board | 3 mm kerf per cut + 5 mm end trims + 10 mm minimum offcut`,12,19,8);
 patterns.forEach((g,i)=>{const y=29+i*Math.min(8.35,154/Math.max(1,patterns.length-1)),k=184/o.stockLength;
  c.text(`${g.stocks.length} x`,12,y+3.6,8.5,true);
  let x=32+o.endTrim*k;
  c.rect(32,y,184,5.2,[255,255,255],[0,0,0],.2);
  g.lengths.forEach(length=>{c.rect(x,y,length*k,5.2,'timber',[0,0,0],.12);c.text(String(length),x+length*k/2,y+3.6,7,true,'center');x+=(length+o.kerf)*k;});
  c.text(`${Math.floor(g.remaining)} mm left`,222,y+3.6,7);
 });
 c.text('Repeat each pattern the stated number of times. Blank lengths are printed inside the bars; remaining space is offcut / trimming allowance.',12,191,7.2);
 c.text('Stock labels S1 onward and piece assignments remain available in the app. Cross-cut blanks first; shape gable ends / notches afterwards.',12,197,7.2);
 c.text('Eight whole boards are a default reserve for defects and site adjustments; offcuts shown exclude any reuse of slope / notch waste.',12,202,7);
 footer(c,page,total,'Cladding stock nesting');return c.stream();
}
