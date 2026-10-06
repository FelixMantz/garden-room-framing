import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
const {sheathingPlan,wallOsbTop,OSB_STOCK}=await v.ssrLoadModule('/app/sheathing.ts');
const {buildModel,defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
after(()=>v.close());
test('wall / gable cutting plan fits fourteen ordered sheets and has unique panel IDs',()=>{
 const p=sheathingPlan();assert.equal(p.sheetCount,14);assert.equal(new Set(p.panels.map(q=>q.id)).size,p.panels.length);
 assert.ok(p.cuts.every(q=>q.sheet>=1&&q.sheet<=14));
 assert.ok(p.panels.every(q=>q.w>0&&q.h>0&&q.w<=1220&&q.h<=2440));
 assert.ok(p.cuts.filter(q=>q.panel.includes('G')).every(q=>q.source!=='new sheet'));
});
test('wall vertical joints bear on existing studs / cripples and gable joints on existing gable studs',()=>{
 const p=sheathingPlan();for(const cfg of p.configs){
  const members=buildModel(cfg),mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH')).sort((a,b)=>a.x-b.x);
  for(let i=0;i<mains.length-1;i++){
   const a=mains[i],b=mains[i+1];if(b.x-a.x-a.w>3.01)continue;
   assert.ok(Math.abs(b.x-a.x-a.w-3)<1e-8);
   const x=a.x+a.w+1.5;
   for(let y=45;y<wallOsbTop(cfg);y+=25){
    if(cfg.computedOpenings.some(o=>x>o.x&&x<o.x+o.width&&y>o.sill&&y<o.sill+o.height))continue;
    assert.ok(members.some(m=>m.shape==='rect'&&m.x<=x&&m.x+m.w>=x&&m.y<=y&&m.y+m.h>=y),`${cfg.id} seam ${x} lacks backing at ${y}`);
   }
  }
  const gs=p.panels.filter(q=>q.wall===cfg.id&&q.gable).sort((a,b)=>a.x-b.x);
  for(let i=0;i<gs.length-1;i++){const x=gs[i].x+gs[i].w+1.5;assert.ok(members.some(m=>['gable stud','ridge support stud'].includes(m.type)&&Math.abs(m.x+m.w/2-x)<.01));}
 }
});
test('base clearance and plate-backed horizontal gable joint respect eaves detail',()=>{
 const p=sheathingPlan();for(const cfg of p.configs){
  const mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH'));assert.ok(mains.every(q=>q.y===OSB_STOCK.bottom));
  if(!cfg.isSide){assert.equal(wallOsbTop(cfg),2017);continue;}
  const gs=p.panels.filter(q=>q.wall===cfg.id&&q.gable);assert.equal(gs[0].y-mains[0].y-mains[0].h,3);
  assert.ok(gs[0].y>cfg.wallHeight-cfg.studFace&&gs[0].y<cfg.wallHeight);
  assert.equal(mains[0].x,-cfg.cornerLap+3);assert.equal(mains.at(-1).x+mains.at(-1).w,cfg.width+cfg.cornerLap-3);
 }
});
test('changed roof pitches regenerate gable blanks and reuse allocation without oversized stock',()=>{
 for(const roofPitch of [15,35,45]){const p=sheathingPlan({...defaultSettings(),roofPitch});assert.ok(p.panels.every(q=>q.h<=2440&&q.w<=1220));assert.ok(p.sheetCount>=14);}
});

test('overlapping long-wall ends follow each wall set-out and taller blanks still use fourteen sheets',()=>{
 const p=sheathingPlan();assert.equal(OSB_STOCK.bottom,3);
 for(const cfg of p.configs){
  const mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH'));
  assert.ok(mains.every(q=>q.h===(cfg.isSide?2050:2014)));
  if(cfg.isSide)continue;
  assert.equal(mains[0].x,-11);assert.equal(mains.at(-1).x+mains.at(-1).w,cfg.width+11);
  assert.equal(mains[0].w,854.5);assert.equal(mains.at(-1).w,cfg.id==='front'?854.5:754.5);
 }
 assert.equal(p.sheetCount,14);
});
test('lower-wall drawing shares the OSB base clearance and corner page contains labelled corner only',async()=>{
 const {drawLowerWall}=await v.ssrLoadModule('/app/pdf/lower-wall.ts');
 const {drawSheathingDetails}=await v.ssrLoadModule('/app/pdf/sheathing.ts');
 const s=defaultSettings(),lower=drawLowerWall(s,17,22),corner=drawSheathingDetails(s,22,22);
 assert.ok(lower.includes(`OSB base +${s.brickCourses*s.courseHeight+3} slab / 3 above DPC`));
 for(const label of ['Long-wall OSB','Side-wall OSB','Long-wall corner stud','California return stud','Side-wall end stud','Corner post - 45 x 45','Side blind vertical batten','Long-wall blind vertical batten','Breather membrane','25 mm ventilated cavity','3 mm clear'])assert.ok(corner.includes(label),label);
 assert.ok(!corner.includes('cover board'));assert.ok(corner.includes('5 mm featheredge end gap'));
 assert.ok(!corner.includes('BOTTOM EDGE'));assert.ok(!corner.includes('TOP EDGES'));
});

test('Construction details tab renders one labelled external corner SVG',async()=>{
 const {renderToStaticMarkup}=await import('react-dom/server');
 const {createElement}=await import('react');
 const {default:ConstructionDetails}=await v.ssrLoadModule('/app/construction-details.tsx');
 const html=renderToStaticMarkup(createElement(ConstructionDetails,{settings:defaultSettings()}));
 assert.equal((html.match(/<svg\b/g)||[]).length,1);
 for(const label of ['Long-wall OSB','Side-wall OSB','California return stud','Corner post - 45 x 45','Side blind vertical batten','3 mm clear'])assert.ok(html.includes(label),label);
 assert.ok(!html.includes('Floor build-up and dwarf wall'));assert.ok(!html.includes('Timber frame positioning'));
});
