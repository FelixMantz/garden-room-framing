import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
const {claddingLayout,CLADDING_LAYOUT}=await v.ssrLoadModule('/app/cladding-layout.ts');
const {buildModel,defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
after(()=>v.close());
test('common gauge closes at the actual soffit with a full-width eaves board',()=>{
 const p=claddingLayout();assert.deepEqual(p.errors,[]);assert.equal(p.courses,14);
 assert.ok(p.lap>=35&&p.lap<=40);
 assert.ok(Math.abs(CLADDING_LAYOUT.bottom+(p.courses-1)*p.gauge+175-p.eavesTop)<1e-7);
 for(const w of p.walls){
  const maxCourse=Math.max(...w.pieces.map(v=>v.course));assert.equal(maxCourse,w.cfg.gable?21:14);
  for(const piece of w.pieces)assert.ok(Math.abs(piece.bottom-(-25+(piece.course-1)*p.gauge))<1e-7);
 }
});
test('every blank is allocated exactly once with kerfs and trimming inside ordered stock',()=>{
 const p=claddingLayout(),allocated=p.bins.flatMap(v=>v.pieces);
 assert.equal(p.bins.length,52);assert.equal(p.spare,8);
 assert.equal(allocated.length,p.pieces.length);assert.equal(new Set(allocated.map(v=>v.id)).size,p.pieces.length);
 for(const b of p.bins){assert.ok(b.remaining>=10);assert.equal(b.pieces.reduce((n,v)=>n+v.length+3,0)+b.remaining,4790);}
});
test('long-wall joints are on framing and have an independent fixing gap',()=>{
 const p=claddingLayout();
 for(const w of p.walls){
  const supports=buildModel(w.cfg).filter(v=>v.shape==='rect'&&['common stud','end stud','king stud'].includes(v.type)).map(v=>v.x+v.w/2);
  for(const j of w.joints){assert.ok(supports.some(x=>Math.abs(j-x)<1e-7));
   for(const a of w.pieces.filter(v=>Math.abs(v.end-(j-2.5))<1e-7))assert.ok(w.pieces.some(b=>b.course===a.course&&Math.abs(b.x-a.end-5)<1e-7));
  }
 }
 assert.deepEqual(p.walls[1].joints,[845,2445]);
 assert.ok(p.jointBackingMetres>5.9&&p.jointBackingMetres<6);
});
test('gable board polygons follow both roof slopes without gaps between the stepped courses',()=>{
 const p=claddingLayout();
 assert.ok(p.pieces.filter(v=>['left','right'].includes(v.wall)&&v.course>=16).every(v=>v.bevel));
 for(const w of p.walls.filter(v=>v.cfg.gable))for(const a of w.pieces.filter(v=>v.bevel)){
  const top=a.bottom+175;
  if(a.course>=16)assert.equal(a.bevel,true);
  // Every top segment must equal the clipped roof envelope at its midpoint.

  const roofPeak=w.max;
  for(let i=2;i<a.points.length-1;i++){
   const [x,y]=a.points[i],[xx,yy]=a.points[i+1],mid=(x+xx)/2;
   assert.ok(Math.abs((y+yy)/2-Math.min(top,roofPeak-Math.abs(mid-w.peak)*Math.tan(w.cfg.roofPitch*Math.PI/180)))<1e-5);
  }
  for(const [x,y] of a.points){assert.ok(y<=top+1e-7);assert.ok(y>=a.bottom-1e-7);assert.ok(x>=a.x-1e-7&&x<=a.end+1e-7);}
  if(a.top-a.bottom>p.gauge+1e-7){
   const next=w.pieces.find(v=>v.course===a.course+1);
   if(next)assert.ok(next.x<=a.x+(p.gauge/Math.tan(w.cfg.roofPitch*Math.PI/180))+.01);
  }
 }
});
test('layout recalculates measured inputs and rejects invalid overlap before drawing',()=>{
 const p=claddingLayout(defaultSettings(),{...CLADDING_LAYOUT,topAdjustment:20});
 assert.equal(p.errors.length,0);assert.ok(p.lap>=35&&p.lap<=40);
 assert.equal(claddingLayout(undefined,{...CLADDING_LAYOUT,minLap:180}).errors.length,1);
 assert.equal(claddingLayout(undefined,{...CLADDING_LAYOUT,boardWidth:NaN}).pieces.length,0);
});
test('grouped quantities and repeated stock patterns preserve every required cut',async()=>{
 const {claddingCutSummary}=await v.ssrLoadModule('/app/cladding-layout.ts'),p=claddingLayout(),summary=claddingCutSummary(p);
 assert.equal(summary.cuts.reduce((n,g)=>n+g.quantity,0),122);
 assert.equal(summary.patterns.reduce((n,g)=>n+g.stocks.length,0),52);
 for(const cut of summary.cuts)assert.equal(summary.patterns.reduce((n,g)=>n+g.stocks.length*g.lengths.filter(x=>x===cut.length).length,0),cut.quantity);
 for(const g of summary.patterns)assert.equal(g.lengths.reduce((n,l)=>n+l+3,10)+g.remaining,4800);
});
