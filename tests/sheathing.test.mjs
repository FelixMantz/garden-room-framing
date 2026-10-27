import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
const {sheathingPlan,wallOsbTop,osbFinishedProfile,OSB_STOCK}=await v.ssrLoadModule('/app/sheathing.ts');
const {buildModel,defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
after(()=>v.close());
test('finished window profiles close across the panel joint and preserve both gable lengths',async()=>{
 const {osbFinishedProfile}=await v.ssrLoadModule('/app/sheathing.ts'),p=sheathingPlan();
 const profile=id=>{const panel=p.panels.find(q=>q.id===id);return osbFinishedProfile(panel,p.configs.find(c=>c.id===panel.wall));};
 const upper=profile('LU2'),lower=profile('LB2');
 assert.deepEqual(upper.cutouts,[{x:221,y:0,w:710,h:1010}]);
 assert.deepEqual(lower.cutouts,[{x:221,y:754,w:710,h:27}]);
 assert.equal(upper.cutouts[0].h+lower.cutouts[0].h+OSB_STOCK.gap,1040);
 assert.equal(Number(upper.sideHeights[0].toFixed(1)),1534);
 assert.equal(Number(upper.sideHeights[1].toFixed(1)),2092);
 assert.deepEqual(profile('LU3').sideHeights,upper.sideHeights.toReversed());
 assert.equal(profile('RU2').cutouts.length,0);
 const front=profile('F1').cutouts[0];
 assert.deepEqual(front,{x:539,y:754,w:315,h:1040});
 assert.equal(2014-front.y-front.h,220);
});
test('wall / gable cutting plan fits fifteen ordered sheets and has unique panel IDs',()=>{
 const p=sheathingPlan();assert.equal(p.sheetCount,15);assert.equal(new Set(p.panels.map(q=>q.id)).size,p.panels.length);
 assert.ok(p.cuts.every(q=>q.sheet>=1&&q.sheet<=15));
 assert.ok(p.panels.every(q=>q.w>0&&q.h>0&&q.w<=1220&&q.h<=2440));
 
});
test('visual sheet nests preserve finished sizes, rotations and kerf-separated pieces',async()=>{
 const p=sheathingPlan();assert.equal(p.nests.length,p.cuts.length);
 for(const q of p.nests){
  const cut=p.cuts.find(a=>a.panel===q.panel);
  assert.deepEqual([q.w,q.h],q.rotated?[cut.h,cut.w]:[cut.w,cut.h]);
  assert.ok(q.x>=0&&q.y>=0&&q.x+q.w<=1220+.001&&q.y+q.h<=2440+.001);
  for(const other of p.nests.filter(a=>a.sheet===q.sheet&&a.panel!==q.panel)){
   const xOverlap=Math.min(q.x+q.w,other.x+other.w)-Math.max(q.x,other.x);
   const yOverlap=Math.min(q.y+q.h,other.y+other.h)-Math.max(q.y,other.y);
   assert.ok(xOverlap<=-3+.001||yOverlap<=-3+.001,`${q.panel} / ${other.panel} kerf`);
  }
 }
 const {drawSheathingCuts,drawSheathingCutsContinued}=await v.ssrLoadModule('/app/pdf/sheathing.ts');
 const output=drawSheathingCuts(defaultSettings(),21,30)+drawSheathingCutsContinued(defaultSettings(),22,30);
 assert.equal((output.match(/\(x 3\)/g)||[]).length,1);assert.ok(output.includes('(1534)'));assert.ok(output.includes('(2092)'));
 assert.ok(output.includes('(627 x 125)'));assert.ok(!output.includes('CUTTING ORDER'));
});
test('wall vertical joints bear on existing studs / cripples and gable joints on existing gable studs',()=>{
 const p=sheathingPlan();for(const cfg of p.configs){
  const members=buildModel(cfg),mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH')).sort((a,b)=>a.x-b.x);
  for(let i=0;i<mains.length-1;i++){
   const a=mains[i],b=mains[i+1];if(b.x-a.x-a.w>4.01)continue;
   assert.ok(b.x-a.x-a.w>=3&&b.x-a.x-a.w<=4);
   const x=(a.x+a.w+b.x)/2;
   for(let y=45;y<wallOsbTop(cfg);y+=25){
    if(cfg.computedOpenings.some(o=>x>o.x&&x<o.x+o.width&&y>o.sill&&y<o.sill+o.height))continue;
    assert.ok(members.some(m=>m.shape==='rect'&&m.x<=x&&m.x+m.w>=x&&m.y<=y&&m.y+m.h>=y),`${cfg.id} seam ${x} lacks backing at ${y}`);
   }
  }
  const gs=p.panels.filter(q=>q.wall===cfg.id&&q.gable).sort((a,b)=>a.x-b.x);
  for(let i=0;i<gs.length-1;i++){const x=(gs[i].x+gs[i].w+gs[i+1].x)/2;assert.ok(members.some(m=>['gable stud','ridge support stud'].includes(m.type)&&Math.abs(m.x+m.w/2-x)<.01));}
 }
});
test('base clearance and noggin-backed horizontal joint respect eaves detail',()=>{
 const p=sheathingPlan();for(const cfg of p.configs){
  const mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH'));assert.ok(mains.every(q=>q.y===OSB_STOCK.bottom));
  if(!cfg.isSide){assert.equal(wallOsbTop(cfg),2017);continue;}
  const gs=p.panels.filter(q=>q.wall===cfg.id&&q.gable);assert.equal(gs[0].y-mains[0].y-mains[0].h,3);
  assert.equal(gs[0].y,787);assert.equal(mains[0].h,781);
  assert.equal(mains[0].x,-cfg.cornerLap+3);assert.equal(mains.at(-1).x+mains.at(-1).w,cfg.width+cfg.cornerLap-3);
 }
});
test('changed roof pitches regenerate gable blanks and reuse allocation without oversized stock',()=>{
 for(const roofPitch of [15,35,45]){const p=sheathingPlan({...defaultSettings(),roofPitch});assert.ok(p.panels.every(q=>q.h<=2440&&q.w<=1220));assert.ok(p.sheetCount>=14);}
});

test('overlapping long-wall ends follow each wall set-out and taller blanks still use fifteen sheets',()=>{
 const p=sheathingPlan();assert.equal(OSB_STOCK.bottom,3);
 for(const cfg of p.configs){
  const mains=p.panels.filter(q=>q.wall===cfg.id&&!q.gable&&!q.id.startsWith('FH'));
  assert.ok(mains.every(q=>q.h===(cfg.isSide?781:2014)));
  if(cfg.isSide)continue;
  assert.equal(mains[0].x,-11);assert.equal(mains.at(-1).x+mains.at(-1).w,cfg.width+11);
  assert.equal(mains[0].w,854);assert.equal(mains.at(-1).w,cfg.id==='front'?854:754);
 }
 assert.equal(p.sheetCount,15);
});
test('lower-wall drawing shares the OSB base clearance and corner page contains labelled corner only',async()=>{
 const {drawLowerWall}=await v.ssrLoadModule('/app/pdf/lower-wall.ts');
 const {drawSheathingDetails}=await v.ssrLoadModule('/app/pdf/sheathing.ts');
 const s=defaultSettings(),lower=drawLowerWall(s,17,22),corner=drawSheathingDetails(s,22,22);
 assert.ok(lower.includes(`OSB base +${s.brickCourses*s.courseHeight+3} slab / 3 above DPC`));
 for(const label of ['Long-wall OSB','Side-wall OSB','Long-wall corner stud','California return stud','Side-wall end stud','Brown corner face - 22 x 100','Side backing','Long-wall backing','Breather membrane','25 mm ventilated cavity','3 mm clear'])assert.ok(corner.includes(label),label);
 assert.ok(corner.includes('Return ripped to 22 x 78*'));assert.ok(corner.includes('Featheredge extends into dead corner'));
 assert.ok(!corner.includes('BOTTOM EDGE'));assert.ok(!corner.includes('TOP EDGES'));
});

test('Construction details tab renders the socket band, cill and external corner drawings',async()=>{
 const {renderToStaticMarkup}=await import('react-dom/server');
 const {createElement}=await import('react');
 const {default:ConstructionDetails}=await v.ssrLoadModule('/app/construction-details.tsx');
 const html=renderToStaticMarkup(createElement(ConstructionDetails,{settings:defaultSettings()}));
 assert.equal((html.match(/<svg\b/g)||[]).length,3);
 for(const label of ['125 mm-high band','70 mm PIR','437.5 mm','562.5 mm','20.4 m','Widen vertical channels locally around backboxes'])assert.ok(html.includes(label),label);
 assert.ok(html.includes('Window cill depth assessment'));
 assert.ok(html.includes('20.0 mm projection'));
 assert.ok(html.includes('Window cill - wall section'));
 for(const label of ['Long-wall OSB','Side-wall OSB','California return stud','Brown corner face - 22 x 100','Side backing','3 mm clear'])assert.ok(html.includes(label),label);
 assert.ok(!html.includes('Floor build-up and dwarf wall'));assert.ok(!html.includes('Timber frame positioning'));
});



test('whole-mm wall cuts preserve door-head clearance and the installed roof slope',()=>{
 const p=sheathingPlan(),front=p.panels.filter(q=>q.wall==='front');
 const byId=id=>front.find(q=>q.id===id),a=byId('F2'),b=byId('FH1'),c=byId('FH2'),d=byId('F3');
 assert.deepEqual([b.w,b.h,c.w,c.h],[627,125,627,125]);
 assert.deepEqual([b.x-a.x-a.w,c.x-b.x-b.w,d.x-c.x-c.w],[3,4,3]);
 assert.ok(p.panels.every(q=>[q.x,q.y,q.w,q.h,...q.points.flat()].every(Number.isInteger)));
 for(const cfg of p.configs.filter(c=>c.gable)){
  const slope=Math.tan(cfg.roofPitch*Math.PI/180),ridgeSide=cfg.width/2-cfg.ridgeWidth/2;
  const ridgeRafterTop=cfg.wallHeight+cfg.gableRise+cfg.rafterSeatLift+cfg.rafterVerticalDepth/2;
  for(const q of p.panels.filter(q=>q.wall===cfg.id&&q.gable)){
   const f=osbFinishedProfile(q,cfg);
   for(const fraction of [0,.25,.5,.75,1]){
    const x=q.x+q.w*fraction;
    if(Math.abs(x-cfg.width/2)<cfg.ridgeWidth/2)continue;
    const timberTop=ridgeRafterTop-Math.abs(Math.abs(x-cfg.width/2)-cfg.ridgeWidth/2)*slope;
    const cutTop=q.y+f.sideHeights[0]+fraction*(f.sideHeights[1]-f.sideHeights[0]);
    assert.ok(timberTop-cutTop>=3-1e-8&&timberTop-cutTop<4.01,`${q.id} clearance at ${x}`);
   }
   if(q.id.endsWith('2')||q.id.endsWith('3')){
    const angle=Math.atan(Math.abs(f.sideHeights[1]-f.sideHeights[0])/q.w)*180/Math.PI;
    assert.ok(Math.abs(angle-cfg.roofPitch)<.05);
   }
  }
 }
});

test('cill projection includes the frame footprint, cladding envelope and proud trims',async()=>{
 const {windowCillModel}=await v.ssrLoadModule('/app/window-cill.ts');
 const settings=defaultSettings(),m=windowCillModel(settings);
 assert.deepEqual(m.options.map(o=>o.projection),[-35,20,50]);
 assert.equal(m.frameBack,-59);assert.equal(m.requiredFrameOffset,31);
 assert.equal(windowCillModel(settings,{frameOuterOffset:0}).projection,9);
 assert.equal(windowCillModel(settings,{frameOuterOffset:31}).meetsTarget,true);
 assert.equal(windowCillModel(settings,{claddingEnvelope:22,trimProud:5}).projection,28);
 assert.equal(windowCillModel(settings,{cillDepth:180}).projection,50);
});


test('brown L corner clears the lap envelope and order reserves eight full-height legs',async()=>{
 const {claddingCorner,CLADDING_ORDER,CLADDING_GOODS,CLADDING_DELIVERY}=await v.ssrLoadModule('/app/cladding.ts');
 const m=claddingCorner();
 assert.equal(m.frontEnd-m.trimOuter,100);
 assert.equal(m.returnEnd-m.trimOuter,100);
 assert.equal(m.claddingOuter-m.trimOuter,22);
 assert.equal(m.frontEnd-m.frontStart,36);
 assert.equal(m.returnEnd-m.sideStart,36);
 assert.equal(m.claddingOuter-m.trimInner,0);
 assert.equal(m.frontStart-m.battenOuter,10);
 assert.equal(m.sideStart-m.battenOuter,10);
 assert.equal(CLADDING_ORDER[1].quantity-4,5);
 assert.equal(CLADDING_GOODS+CLADDING_DELIVERY,848);
 const {drawSheathingDetails}=await v.ssrLoadModule('/app/pdf/sheathing.ts');
 const rects=[];
 const c={rect:(x,y,w,h)=>rects.push({x,y,w,h}),line:()=>{},text:()=>{},textVertical:()=>{},stream:()=>''};
 drawSheathingDetails(defaultSettings(),8,17,c);
 // Both featheredge runs must have actual batten backing at their first fixing.
 const same=(a,b)=>Math.abs(a-b)<1e-7;
 for(const r of rects.filter(r=>same(r.h,m.envelope*.48)))
  assert.ok(rects.some(b=>b.x<=r.x+40*.48&&b.x+b.w>=r.x+40*.48&&same(b.h,25*.48)&&same(b.y,105+m.battenOuter*.48)));
 for(const r of rects.filter(r=>same(r.w,m.envelope*.48)))
  assert.ok(rects.some(b=>b.y<=r.y+40*.48&&b.y+b.h>=r.y+40*.48&&same(b.w,25*.48)&&same(b.x,137+m.battenOuter*.48)));
});

test('wall batten purchase allocation fits kerfs and retains a separate defect reserve',async()=>{
 const {wallBattenPlan}=await v.ssrLoadModule('/app/cladding-battens.ts');
 const p=wallBattenPlan(defaultSettings());
 assert.equal(p.stockForCuts,30);assert.equal(p.orderLengths,30);assert.equal(p.shortReserveLengths,10);
 assert.equal(p.roofSurplusDeducted,0);
 assert.ok(p.bins.every(b=>b.remaining>=0&&b.pieces.reduce((sum,q)=>sum+q.length+3,0)<=4800));
 assert.equal(p.bins.flatMap(b=>b.pieces).length,p.pieces.length);
 assert.equal(p.pieces.filter(q=>q.purpose==='Additional corner backing').length,8);
 assert.equal(p.pieces.filter(q=>q.purpose==='Opening jamb / face-trim backing').length,10);
 assert.ok(p.byWall.every(w=>w.metres>0));
 const adjusted=wallBattenPlan({...defaultSettings(),wallHeight:2300});
 assert.ok(adjusted.totalMetres>p.totalMetres);
});
