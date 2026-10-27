import { buildModel, slopePolygon, type Settings, type WallConfig } from '../framing';
import { sheathingPlan, wallOsbTop, gableJointAxis, osbFinishedProfile, OSB_STOCK } from '../sheathing';
import { canvas, fmt, hTechnical, vTechnical } from './layout';
import { wallOsbLabel } from '../sheathing-progress';
import { claddingCorner } from '../cladding';
type C=ReturnType<typeof canvas>;
const footer=(c:C,page:number,total:number,label:string)=>c.text(`Garden room framing set | ${label} | page ${page} of ${total}`,148.5,207,6.4,false,'center');
export function drawSheathing(s:Settings,page:number,total:number,c:C=canvas()){
 const p=sheathingPlan(s);c.text('OSB wall sheathing - all four external elevations',12,11,14,true);
 c.text('11 mm OSB3 | ordered sheets 1220 x 2440 | 3-4 mm joints | dimensions from sole underside / wall-body left',12,18,7.5);
 c.text(`${p.sheetCount} sheets allocated including both gables; keep all labelled offcuts. Panel IDs refer to the cutting plan.`,12,24,7.5,true);
 function wall(cfg:WallConfig,left:number,base:number,title:number){
  const sc=.023,min=cfg.isSide?-cfg.cornerLap:0,X=(x:number)=>left+(x-min)*sc,Y=(y:number)=>base-y*sc;
  c.text(`${cfg.name.toUpperCase()} - viewed from outside`,left,title,9,true);
  for(const q of p.panels.filter(q=>q.wall===cfg.id)){
   c.polygon(q.points.map(([x,y])=>[X(x),Y(y)]),[255,255,255],[0,0,0],.3);
   const cx=X(q.x+q.w/2),cy=Y(q.bridge?Math.min(q.y+q.h-100,cfg.wallHeight-140):q.y+Math.min(q.h/2,300));
   c.text(q.id,cx,cy,6.5,true,'center');
   if(!q.gable)c.text(`${fmt(q.w)} wide`,cx,base+4,5.5,false,'center');
  }
  // Studs and noggins behind OSB, with openings routed out after fitting.
  for(const m of buildModel(cfg)){
   const pts=m.shape==='slope'?slopePolygon(m):[[m.x!,m.y!],[m.x!+m.w!,m.y!],[m.x!+m.w!,m.y!+m.h!],[m.x!,m.y!+m.h!]];
   for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];c.line(X(a[0]),Y(a[1]),X(b[0]),Y(b[1]),[0,0,0],.08,[.6,.6]);}
  }
  for(const o of cfg.computedOpenings){c.rect(X(o.x),Y(o.sill+o.height),o.width*sc,o.height*sc,[255,255,255],[0,0,0],.25);c.text(o.type==='window'?'WINDOW':'DOOR',X(o.x+o.width/2),Y(o.sill+o.height/2),6,true,'center');}
  c.line(X(min),base,X(cfg.isSide?cfg.width+cfg.cornerLap:cfg.width),base,[0,0,0],.15,[2,.7,.3,.7]);
  const mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH'));
  c.text(`Joint axes x: ${mains.filter((q,i)=>i<mains.length-1&&mains[i+1].x-q.x-q.w<=4.01).map(q=>fmt((q.x+q.w+mains[mains.indexOf(q)+1].x)/2)).join(', ')}`,left,base+9,6);
  c.text(`OSB top ${fmt(wallOsbTop(cfg))}; bottom +${OSB_STOCK.bottom}; blank height ${fmt(wallOsbTop(cfg)-OSB_STOCK.bottom)}`,left,base+14,6);
  if(cfg.gable)c.text(`Joint axis +${fmt(gableJointAxis(cfg))}; upper sheets bridge plates; 3-4 below deck`,left,base+19,6);
 }
 wall(p.configs[0],12,80,32);wall(p.configs[1],160,80,32);
 wall(p.configs[2],12,175,107);wall(p.configs[3],160,175,107);
 c.text('Solid outlines = OSB cuts; dashed timber = backing. Window / door edges bear on sill, lintel and jamb timber.',12,199,6.8);
 footer(c,page,total,'OSB wall elevations');return c.stream();
}
export function drawSheathingCuts(s:Settings,page:number,total:number,c:C=canvas(),part=0){
 const p=sheathingPlan(s),black=[0,0,0];
 c.text('OSB wall sheet nests - finished cutting patterns',12,11,14,true);
 c.text(`1220 x 2440 x 11 stock | 3 mm kerf | ${p.sheetCount} sheets walls / gables | ${OSB_STOCK.quantity-p.sheetCount} roof / reserve`,12,19,8);
 c.text('Whole-mm finished cuts; rounded inward for 3-4 mm joints. Cut on waste side; dotted areas are waste / window cut-outs.',12,26,7);
 const profile=(q:typeof p.nests[number])=>{const panel=p.panels.find(a=>a.id===q.panel)!;return {panel,...osbFinishedProfile(panel,p.configs.find(a=>a.id===panel.wall)!)};};
 const key=(pieces:typeof p.nests)=>JSON.stringify(pieces.map(q=>{const f=profile(q);return [q.x,q.y,q.w,q.h,q.rotated,f.points,f.cutouts];}));
 const groups:{sheets:number[],pieces:typeof p.nests}[]=[];
 for(let sheet=1;sheet<=p.sheetCount;sheet++){
  const pieces=p.nests.filter(q=>q.sheet===sheet),match=groups.find(g=>key(g.pieces)===key(pieces));
  if(match)match.sheets.push(sheet);else groups.push({sheets:[sheet],pieces});
 }
 const perPage=Math.ceil(groups.length/2),shown=groups.slice(part*perPage,(part+1)*perPage);
 const cols=4,rows=Math.ceil(shown.length/cols),cellH=151/rows,sc=Math.min(58/2440,(cellH-18)/2440),cellW=68;
 shown.forEach((g,i)=>{
  const cellX=12+(i%cols)*cellW,top=46+Math.floor(i/cols)*cellH,x=cellX+17;
  c.text(`x ${g.sheets.length}`,x+1220*sc/2,top-12,8,true,'center');
  c.text(`Sheet${g.sheets.length>1?'s':''} ${g.sheets.join(', ')}`,x+1220*sc/2,top-8,5.5,false,'center');
  c.rect(x,top,1220*sc,2440*sc,'floor',black,.25);
  g.pieces.forEach(q=>{
   const f=profile(q),panel=f.panel,px=x+q.x*sc,py=top+q.y*sc;
   const point=(u:number,v:number)=>[px+(q.rotated?v:u)*sc,py+(q.rotated?u:v)*sc];
   const ids=g.sheets.map(sheet=>p.nests.filter(a=>a.sheet===sheet).find(a=>a.x===q.x&&a.y===q.y&&a.w===q.w&&a.h===q.h)!.panel).map(wallOsbLabel).join('\n');
   c.polygon(f.points.map(([u,v])=>point(u,v)),[255,255,255],black,.25);
   // Blank bounding box is dashed; solid diagonal is the actual gable cut.
   if(panel.gable){const corners=[[0,0],[panel.w,0],[panel.w,panel.h],[0,panel.h]].map(([u,v])=>point(u,v));for(let j=0;j<4;j++)c.line(...[...corners[j],...corners[(j+1)%4]] as [number,number,number,number],black,.1,[.7,.5]);}
   f.cutouts.forEach(o=>{
    const a=point(o.x,o.y),b=point(o.x+o.w,o.y+o.h);
    c.rect(a[0],a[1],b[0]-a[0],b[1]-a[1],'floor',black,.25);
   });
   const textAt=(label:string,u:number,v:number,size=5,bold=false,vertical=false)=>{const a=point(u,v),lines=label.split('\n');lines.forEach((line,i)=>{const offset=(i-(lines.length-1)/2)*size*.42;if(vertical!==q.rotated)c.textVertical(line,a[0]+offset,a[1],size,bold);else c.text(line,a[0],a[1]+.6+offset,size,bold,'center');});};
   const labelY=panel.gable?Math.max(...f.cutouts.map(o=>o.y+o.h),0)+(Math.min(...f.sideHeights)-Math.max(...f.cutouts.map(o=>o.y+o.h),0))/2:panel.h/2;
   if(!f.cutouts.length&&!panel.gable){
    if(q.h*sc<4){textAt(`${fmt(q.w)} x ${fmt(q.h)}`,panel.w/2,panel.h/2,4.6,true);c.line(px+q.w*sc,py+q.h*sc/2,cellX+60,py+q.h*sc/2,black,.1);c.text(ids,cellX+61,py+q.h*sc/2+.5,4.6);}
    else if(q.w*sc<12){textAt(ids,panel.w/2-65,panel.h/2,4.8,true,true);textAt(`${fmt(panel.w)} x ${fmt(panel.h)}`,panel.w/2+90,panel.h/2,4.8,false,true);}
    else{textAt(ids,panel.w/2,panel.h/2-90,5,true);textAt(`${fmt(q.w)} x ${fmt(q.h)}`,panel.w/2,panel.h/2+110,4.8,true);}
   }else{
    textAt(panel.gable&&panel.w<500?ids.replace(' [DONE]','\n[DONE]'):ids,panel.w/2,panel.gable&&panel.w<500?120:(!panel.gable&&f.cutouts.length?200:labelY),panel.w<500?5:6,true);
    // Both lengths on the actual gable edges; they share the flat-base datum.
    const left=point(0,0),right=point(panel.w,0);
    if(panel.gable&&panel.w<500){
     textAt(fmt(panel.w),panel.w/2,270,5.2);
     textAt(fmt(f.sideHeights[0]),panel.w/3,Math.min(...f.sideHeights)/2,5,true,true);
     textAt(fmt(f.sideHeights[1]),panel.w*2/3,Math.min(...f.sideHeights)/2,5,true,true);
    }else if(panel.gable){
     vTechnical(c,py,py+f.sideHeights[0]*sc,left[0],left[0]-3,fmt(f.sideHeights[0]),5.5,'left');
     vTechnical(c,py,py+f.sideHeights[1]*sc,right[0],right[0]+3,fmt(f.sideHeights[1]),5.5);
     hTechnical(c,left[0],right[0],py,py-2.3,fmt(panel.w),5.5);
    }else{if(q.y===0)hTechnical(c,left[0],right[0],py,py-2.3,fmt(panel.w),5.5);else textAt(fmt(panel.w),panel.w/2,340,5.5);vTechnical(c,py,py+panel.h*sc,right[0],right[0]+3,fmt(panel.h),5.5);}
    for(const o of f.cutouts){
     const leftArm=o.x,rightArm=panel.w-o.x-o.w,below=o.y,above=panel.h-o.y-o.h;
     if(o.h>=100){
      textAt(`${fmt(o.w)} x ${fmt(o.h)}`,o.x+o.w/2,o.y+o.h/2,5.5,true,true);
      if(leftArm>0)textAt(fmt(leftArm),leftArm/2,o.y+o.h/2,5.5,true,true);
      if(rightArm>0)textAt(fmt(rightArm),panel.w-rightArm/2,o.y+o.h/2,5.5,true,true);
      if(!panel.gable){const edge=point(0,0)[0]-3;
       if(below>0)vTechnical(c,py,py+below*sc,left[0],edge,fmt(below),5.5,'left');
       if(above>0)vTechnical(c,py+(o.y+o.h)*sc,py+panel.h*sc,left[0],edge,fmt(above),5.5,'left');
      }
     }else{
      const a=point(0,panel.h);c.text(`${fmt(leftArm)} | ${fmt(o.w)} | ${fmt(rightArm)}`,px+q.w*sc/2,a[1]-5.3,5.2,true,'center');
      c.text(`${fmt(o.h)} notch; ${fmt(below)} remains`,px+q.w*sc/2,a[1]-2.8,5.2,false,'center');
     }
    }
   }
  });
 });
 c.text(`Cutting guide ${part+1} of 2`,285,11,9,true,'right');
 c.text('Gable lengths: flat base to each diagonal end. Follow roof pitch.',12,197,6.5);
 c.text('Lower notches: left arm | opening | right arm. Check installed frame / openings before cutting; retain labelled offcuts.',12,201,6.5);
 footer(c,page,total,'OSB cutting plan');return c.stream();
}
export function drawSheathingCutsContinued(s:Settings,page:number,total:number,c:C=canvas()){return drawSheathingCuts(s,page,total,c,1);}
export function drawSheathingDetails(s:Settings,page:number,total:number,c:C=canvas()){
 c.text('Featheredge cladding - brown two-piece L corner',12,11,14,true);
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
 // Factory-treated L cover boards overlap the featheredge ends.
 const m=claddingCorner(),{trimOuter:o,trimInner:i,battenOuter:b,claddingOuter:f}=m;
 block(o,o,m.cornerFront,m.trimThickness,'timber');
 block(o,i,m.trimThickness,m.cornerReturn,'timber');
 // Battens support board ends and trim fixings; the cover bears on lap high points.
 const {frontStart,sideStart}=m;
 block(b,b,100,25,'timber');block(b,-11,25,100,'timber');
 block(frontStart,f,140-frontStart,m.envelope,'timber');
 block(f,sideStart,m.envelope,140-sideStart,'timber');
 // Continuous breather membrane: outside both sheets, turning around the overlap.
 c.line(X(-11)-.6,Y(140),X(-11)-.6,Y(-11)-.6,black,.5);
 c.line(X(-11)-.6,Y(-11)-.6,X(140),Y(-11)-.6,black,.5);
 c.text('OUTSIDE',91,34,9,true);c.text('INSIDE',191,164,9,true);
 label('Long-wall OSB - 11 mm; overlaps side edge',115,-5.5,214,94);
 label('Long-wall corner stud - 45 x 95',s.studFace/2,s.studDepth/2,214,116);
 label('California return stud - 45 x 95',s.studFace+s.studDepth/2,s.studDepth-s.studFace/2,214,138);
 label('Side-wall end stud - 45 x 95',s.studDepth/2,s.studDepth+s.studFace/2,214,160);
 label('Side-wall OSB - 11 mm',-5.5,100,12,157);
 label('Side backing - two 25 x 50 battens',-23.5,20,12,113);
 label('Side featheredge - 32 lap envelope*',-52,90,12,135);
 label('Brown corner face - 22 x 100',0,o+11,12,44);
 label('Return ripped to 22 x 78*',o+11,0,12,66);
 label('Featheredge extends into dead corner',-52,sideStart+15,12,91);
 label('Long-wall featheredge - 32 envelope*',115,-52,214,30);
 label('Long-wall backing - two 25 x 50 battens',20,-23.5,214,72);
 label('Breather membrane - continuous wrap',-12.2,130,12,179);
 label('25 mm ventilated cavity between battens',115,-23.5,214,50);
 label('Corner trim bears on lap high points',20,i,214,105);
 label('Cladding ends backed by battens',frontStart+25,-23.5,214,179);
 hTechnical(c,X(o),X(m.frontEnd),Y(o),55,'100 face',7);
 vTechnical(c,Y(o),Y(m.returnEnd),X(o),88,'100 overall return',7,'left');
 c.text('Side OSB first; long-wall OSB overlaps its 11 mm edge. Leave 3 mm clear at side-sheet ends; wrap membrane continuously.',12,187,7);
 c.text('Fit featheredge first, then the L cover. Fix each trim into supported battens / framing; avoid crushing the laps when tightening.',12,193,7);
 c.text('* Working set-out: 32 mm lap envelope + 22 mm corner trim; no added rear gap. Corner face is 22 mm beyond the maximum laps.',12,199,7);
 c.text('Concealed cover: 36 mm both faces. Keep 10 mm clear of perpendicular boards. Rip return to actual face width minus thickness; protect cut edge.',12,203,6.7);
 footer(c,page,total,'OSB and cladding corner');return c.stream();
}

