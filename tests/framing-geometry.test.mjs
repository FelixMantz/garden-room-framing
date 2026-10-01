import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";

const vite = await createServer({
  appType: "custom",
  configFile: false,
  root: new URL("..", import.meta.url).pathname,
  server: { middlewareMode: true, hmr:false },
});
const framing = await vite.ssrLoadModule("/app/framing.ts");

const { roofModel } = await vite.ssrLoadModule('/app/roof.ts');
const { rafterDimensions } = await vite.ssrLoadModule('/app/rafter-dimensions.ts');

after(async () => vite.close());

test('gable elevation tails share the cutting-detail profile and mirror at the ridge',async()=>{
 const {drawWallTechnical}=await vite.ssrLoadModule('/app/pdf/walls.ts');
 for(const id of ['left','right'])for(const roofPitch of [15,25,45]){
  const s={...framing.defaultSettings(),roofPitch,gableOverhang:400};
  const cfg=framing.configForWall(s,id),members=framing.buildModel(cfg);
  const [left,right]=members.filter(m=>m.type==='gable end rafter');
  const a=rafterDimensions(left),b=rafterDimensions(right);
  assert.equal(a.cutPolygon.length,8);assert.equal(b.cutPolygon.length,8);
  const mirrored=a.cutPolygon.map(([x,y])=>[cfg.width-x,y]);
  for(const [x,y] of mirrored)assert.ok(b.cutPolygon.some(([rx,ry])=>Math.abs(x-rx)<1e-8&&Math.abs(y-ry)<1e-8));
  assert.ok(Math.abs(a.cutPolygon[0][1]-a.cutPolygon.at(-1)[1]-20)<1e-8);
  assert.ok(Math.abs(b.cutPolygon[1][1]-b.cutPolygon[2][1]-20)<1e-8);
  const polygons=[];
  const recording={rect(){},line(){},text(){},textVertical(){},polygon(points){polygons.push(points);},stream(){return '';}};
  drawWallTechnical(cfg,members,5,16,recording);
  assert.equal(polygons.filter(p=>p.length===8).length,2);
 }
});

test("garden-room defaults use 250 mm eaves to outer fascia and 228 mm to rafter tails", () => {
  const cfg = framing.configForWall(framing.defaultSettings(), "left");
  const rafters = framing.buildModel(cfg).filter((m) => m.type === "gable end rafter");
  assert.equal(cfg.gableOverhang, 250);
  assert.deepEqual(rafters.map((m) => m.bearingX), [cfg.upperStart, cfg.upperEnd]);
  assert.deepEqual(rafters.map((m) => m.x1), [cfg.upperStart - 228, cfg.width / 2 + cfg.ridgeWidth / 2]);
  assert.equal(rafters[1].x2, cfg.upperEnd + 228);
});

test("gable infill studs are set out symmetrically from the ridge", () => {
  const cfg = framing.configForWall(framing.defaultSettings(), "left");
  const centres = framing.buildModel(cfg)
    .filter((m) => m.type === "gable stud")
    .map((m) => m.x + m.w / 2);
  assert.deepEqual(centres, [305, 705, 1105, 1905, 2305, 2705]);
  assert.deepEqual(centres.map((x) => cfg.width - x), [...centres].reverse());
});

test("stored wall defaults reproduce the optimised and ridge-centred 400 mm grid offsets", () => {
  const settings = framing.defaultSettings();
  const expected = { front: 45, rear: 45, left: 305, right: 305 };
  for (const id of framing.wallOrder) {
    assert.equal(settings.walls[id].studOffset, expected[id]);

  }
});

test("both gable wall grids place a common stud directly below the ridge support", () => {
  const settings = framing.defaultSettings();
  for (const id of ["left", "right"]) {
    const cfg = framing.configForWall(settings, id);
    const members = framing.buildModel(cfg);
    const centre = cfg.width / 2;
    const common = members.find(m => m.type === "common stud" && m.x + m.w / 2 === centre);
    const support = members.find(m => m.type === "ridge support stud");
    assert.ok(common, `${id} gable is missing the central common stud`);
    assert.ok(support, `${id} gable is missing the ridge support stud`);
    assert.equal(common.x, support.x);
    assert.equal(common.x + common.w / 2, centre);
  }
});

test("gable stud grids remain ridge-centred when the wall width changes", () => {
  const settings = framing.defaultSettings();
  settings.internalDepth = 3120;
  for (const id of ["left", "right"]) {
    const cfg = framing.configForWall(settings, id);
    const centres = framing.studGridCentres(cfg.width, cfg.studCentres, cfg.studOffset, cfg.studFace);
    assert.ok(centres.includes(cfg.width / 2));
  }
});

test("optimised common studs do not overlap opening king studs", () => {
  const settings = framing.defaultSettings();
  for (const id of framing.wallOrder) {
    const cfg = framing.configForWall(settings, id);
    const members = framing.buildModel(cfg);
    const common = members.filter((m) => m.type === "common stud");
    const kings = members.filter((m) => m.type === "king stud");
    for (const stud of common) {
      for (const king of kings) {
        assert.ok(stud.x + stud.w <= king.x || stud.x >= king.x + king.w);
      }
    }
  }
});

test("default window rough openings include cill and installation allowance", () => {
  const settings = framing.defaultSettings();
  assert.deepEqual(
    settings.walls.front.openings.filter(o => o.type === "window").map(({width, height}) => ({width, height})),
    [{width: 1010, height: 1040}, {width: 1010, height: 1040}],
  );
  assert.deepEqual(
    settings.walls.left.openings.map(({width, height}) => ({width, height})),
    [{width: 710, height: 1040}, {width: 710, height: 1040}],
  );
  for (const id of ["front", "left"]) {
    const cfg = framing.configForWall(settings, id);
    for (const opening of cfg.computedOpenings.filter(o => o.type === "window")) {
      assert.equal(opening.level, 757);
      assert.equal(opening.sill, 757);
      assert.equal(opening.levelAboveFfl, 900);
    }
  }
});


test("measured brickwork drives all wall geometry and floor-relative heights", () => {
  const settings = framing.defaultSettings();
  for (const id of framing.wallOrder) {
    const cfg = framing.configForWall(settings, id);
    assert.equal(cfg.brickLength, 5195);
    assert.equal(cfg.brickDepth, 3205);
    assert.equal(cfg.frameLength, 5190);
    assert.equal(cfg.frameDepth, 3200);
    if (cfg.isSide) {
      assert.equal(cfg.brickEnd - cfg.brickStart, 3205);
      assert.equal(cfg.upperStart - cfg.brickStart, 2.5);
      assert.equal(cfg.brickEnd - cfg.upperEnd, 2.5);
    }
    assert.equal(cfg.masonryHeight, 280);
    assert.equal(cfg.frameBase + cfg.wallHeight - cfg.ffl, 2220);
    assert.deepEqual(framing.validate(cfg), []);
    assert.ok(framing.buildModel(cfg).some(m => m.type === "end stud" && m.h === 1942));
  }
  const cfg = framing.configForWall(settings, "front");
  const door = cfg.computedOpenings.find(o => o.type === "door");
  assert.equal(door.width, 1265);
  assert.equal(door.height, 2080);
  assert.equal(door.x + door.width / 2, cfg.width / 2 - 0.5);
  assert.equal(door.levelAboveFfl, -45);
  assert.equal(door.sill + cfg.frameBase, 92);
  assert.equal(cfg.courseHeight, 70);
  assert.equal(door.sill + cfg.frameBase - cfg.courseHeight, 22);
  assert.equal(framing.doorLintelToLowerTopPlate(cfg, door), 95);
  assert.equal(door.sill + door.height + cfg.headerDepth, cfg.wallHeight - cfg.plates);
  assert.match(door.note, /70 mm brick threshold course/);
});


test("ridge depth grows upward and remains flush with both rafter undersides", () => {
  const settings = framing.defaultSettings();
  assert.equal(settings.ridgeWidth, 45);
  assert.equal(settings.ridgeDepth, 145);
  for (const id of ["left", "right"]) {
    let bottom;
    for (const ridgeDepth of [95, 145, 245, 900]) {
      const cfg = framing.configForWall({...settings, ridgeDepth}, id);
      const members = framing.buildModel(cfg);
      for (const r of members.filter(m => m.type === "gable end rafter")) {
        const ridgeX = r.y2 > r.y1 ? r.x2 : r.x1;
        const end = framing.slopePolygon(r).filter(p => p[0] === ridgeX);
        assert.ok(Math.abs(Math.min(...end.map(p => p[1])) - cfg.ridgeBottom) < 1e-8);
      }
      const support = members.find(m => m.type === "ridge support stud");
      assert.ok(Math.abs(support.y + support.h - cfg.ridgeBottom) < 1e-8);
      assert.equal(cfg.ridgeTop - cfg.ridgeBottom, ridgeDepth);
      assert.ok(cfg.maxY >= cfg.ridgeTop);
      assert.deepEqual(framing.validate(cfg), []);
      if (bottom !== undefined) assert.equal(cfg.ridgeBottom, bottom);
      bottom = cfg.ridgeBottom;
    }
  }
});

test('roof default ties sit on every third centred pair', () => {
  const r=roofModel(framing.defaultSettings());
  assert.deepEqual(r.errors,[]);
  assert.deepEqual(r.ties,[1395,2595,3795]);
  assert.equal(r.middle,r.length/2);
  assert.ok(r.ties.every(x=>r.rafters.includes(x+r.offset)));
  assert.equal(r.offset,60);
  assert.equal(r.overhang,250);
  assert.equal(r.gableOverhang,250);
});
test('roof settings maintain centre and reject impossible layouts', () => {
  const s=framing.defaultSettings();
  for(const count of [1,2,3,4,5]) {
    const r=roofModel({...s,tieCount:count,tieEvery:2});
    assert.deepEqual(r.errors,[]);
    assert.equal(r.ties.length,count);
    assert.equal(r.ties.includes(r.middle),count%2===1);
    assert.deepEqual(r.ties.map(x=>r.length-x),[...r.ties].reverse());
    assert.ok(r.ties.every(x=>r.rafters.includes(x+r.offset)));
  }
  assert.ok(roofModel({...s,tieCount:9,tieEvery:3}).errors.length);
  assert.ok(roofModel({...s,rafterCentres:0}).errors.length);
});

test('even ties at odd bay spacing shift rafter grid by half a bay',()=>{
 const r=roofModel({...framing.defaultSettings(),tieCount:4,tieEvery:3});
 assert.deepEqual(r.errors,[]);
 assert.ok(!r.ties.includes(r.middle));
 assert.ok(!r.rafters.includes(r.middle));
 assert.ok(r.ties.every(x=>r.rafters.includes(x+r.offset)));
 assert.deepEqual(r.ties.map(x=>r.length-x),[...r.ties].reverse());
});

test('tie and rafter faces touch for different widths, with no overlap',()=>{
 for(const tieWidth of [50,75,100]){
  const settings={...framing.defaultSettings(),tieWidth};
  const r=roofModel(settings);
  assert.deepEqual(r.errors,[]);
  for(const t of r.ties){
   const x=r.rafters.find(x=>Math.abs(x-t-r.offset)<.001);
   assert.equal(x-settings.studFace/2,t+tieWidth/2);
  }
 }
});

test('birdsmouth spans the plate exactly and rejoins a parallel rafter underside',()=>{
 for(const roofPitch of [20,25,35]){
  const cfg=framing.configForWall({...framing.defaultSettings(),roofPitch},'left');
  for(const m of framing.buildModel(cfg).filter(m=>m.type==='gable end rafter')){
   assert.equal(m.seatRun,95);
   const pts=framing.slopePolygon(m),seat=pts.filter(p=>Math.abs(p[1]-m.bearingY)<1e-8);
   assert.equal(seat.length,2);assert.equal(Math.abs(seat[0][0]-seat[1][0]),95);
   const slope=(m.y2-m.y1)/(m.x2-m.x1),half=95*Math.hypot(1,slope)/2;
   const underside=x=>m.y1+(x-m.x1)*slope-half;
   const toe=m.bearingX+(slope>0?95:-95);
   assert.ok(Math.abs(underside(toe)-m.bearingY)<1e-8);
  }
 }
});

test('rafter pitch equals the setting for every ridge width and overhang',()=>{
 for(const roofPitch of [20,25,35])for(const ridgeWidth of [45,75,145])for(const gableOverhang of [0,250,500]){
  const cfg=framing.configForWall({...framing.defaultSettings(),roofPitch,ridgeWidth,gableOverhang},'left');
  for(const m of framing.buildModel(cfg).filter(m=>m.type==='gable end rafter')){
   const angle=Math.atan2(Math.abs(m.y2-m.y1),Math.abs(m.x2-m.x1))*180/Math.PI;
   assert.ok(Math.abs(angle-roofPitch)<1e-10);
   assert.equal(m.seatRun,95);
   const ridgeX=m.y2>m.y1?m.x2:m.x1;
   const end=framing.slopePolygon(m).filter(p=>p[0]===ridgeX);
   assert.ok(Math.abs(Math.min(...end.map(p=>p[1]))-cfg.ridgeBottom)<1e-8);
  }
 }
});

test('gable outriggers remain wholly outside the wall and stop at the outer-rafter inner face',()=>{
 const s=framing.defaultSettings(),r=roofModel(s);
 assert.deepEqual(r.outriggerRuns,[
  {side:'left',start:-r.gableOverhang+22+s.studFace,end:0},
  {side:'right',start:r.length,end:r.length+r.gableOverhang-22-s.studFace},
 ]);
 assert.equal(r.outriggerRuns[0].end,0);
 assert.equal(r.outriggerRuns[1].start,r.length);
 assert.equal(r.outriggerRuns[0].end-r.outriggerRuns[0].start,r.gableOverhang-22-s.studFace);
 assert.equal(r.outriggerRuns[1].end-r.outriggerRuns[1].start,r.gableOverhang-22-s.studFace);
});
test('short end bays report the actual irregular spacing to the first regular rafters',()=>{
 const r=roofModel(framing.defaultSettings());
 const left=r.rafters[1]-r.rafters[0];
 const right=r.rafters.at(-1)-r.rafters.at(-2);
 assert.equal(left,232.5);
 assert.equal(right,112.5);
});

function overlaps(a,b){
 return Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1e-7 && Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1e-7;
}
test('wall members have no intersecting square-cut timber, including corner noggins and edge cripples',()=>{
 for(const cornerType of ['california'])for(const offset of [45,150,205,340])for(const id of framing.wallOrder){
  const s=framing.defaultSettings();s.cornerType=cornerType;s.walls[id].studOffset=offset;
  const members=framing.buildModel(framing.configForWall(s,id)).filter(m=>m.shape==='rect'&&m.topLeft===undefined);
  for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++)assert.ok(!overlaps(members[i],members[j]),`${id} ${offset}: ${members[i].type} intersects ${members[j].type}`);
 }
});
test('paired windows are symmetric about the current wall body',()=>{
 for(const id of ['front','left']){
  const cfg=framing.configForWall(framing.defaultSettings(),id),windows=cfg.computedOpenings.filter(o=>o.type==='window');
  assert.equal(windows[0].x,cfg.width-windows[1].x-windows[1].width);
 }
});
test('schedules separate angled apex studs from the square ridge support',()=>{
 const cfg=framing.configForWall(framing.defaultSettings(),'left');
 const rows=framing.makeSchedule(cfg,framing.buildModel(cfg));
 assert.ok(rows.some(r=>r.type==='ridge support stud'&&r.qty===1));
 assert.ok(rows.some(r=>r.type==='gable apex stud'&&r.qty===2));
});
test('invalid live geometry returns errors and an empty model rather than looping',()=>{
 for(const patch of [{studCentres:0},{studCentres:-1},{studCentres:Infinity},{roofPitch:90},{topPlates:3},{ridgeWidth:0},{gableOverhang:-1}]){
  const cfg=framing.configForWall({...framing.defaultSettings(),...patch},'left');
  assert.ok(framing.validate(cfg).length);assert.deepEqual(framing.buildModel(cfg),[]);
 }
});
test('roof top plates use the same lap lengths as the wall elevations and do not overlap in plan',()=>{
 for(const topPlates of [2]){
  const s={...framing.defaultSettings(),topPlates},r=roofModel(s);
  for(let i=0;i<r.plates.length;i++)for(let j=i+1;j<r.plates.length;j++)assert.ok(!overlaps(r.plates[i],r.plates[j]));
  const front=framing.configForWall(s,'front');
  assert.equal(r.plates[0].w,topPlates===2?front.upperEnd-front.upperStart:front.width);
 }
});

test('ridge settings reject narrow supports and leave valid apex studs clear',()=>{
 for(const ridgeWidth of [25,35,45,75,200]){
  const cfg=framing.configForWall({...framing.defaultSettings(),ridgeWidth},'left');
  if(ridgeWidth<cfg.studFace){assert.ok(framing.validate(cfg).some(e=>e.includes('square ridge support')));assert.deepEqual(framing.buildModel(cfg),[]);continue;}
  const members=framing.buildModel(cfg),support=members.find(m=>m.type==='ridge support stud');
  for(const stud of members.filter(m=>m.type==='gable apex stud'))assert.ok(stud.x+stud.w<=support.x+.001||stud.x>=support.x+support.w-.001);
 }
});
test('fly rafters reach the centreline while common rafters stop at ridge faces',async()=>{
 const {roofCutSchedule}=await vite.ssrLoadModule('/app/roof.ts');
 for(const ridgeWidth of [25,45,200]){
  const settings={...framing.defaultSettings(),ridgeWidth};
  const rows=roofCutSchedule(settings),roof=roofModel(settings);
  const common=rows.find(r=>r.type==='Field common rafters'),fly=rows.find(r=>r.type==='Outer fly rafters');
  const cos=Math.cos(settings.roofPitch*Math.PI/180);
  assert.ok(Math.abs(common.length*cos-((roof.span-ridgeWidth)/2+roof.eavesTailRun))<.05);
  assert.ok(Math.abs(fly.length*cos-(roof.span/2+roof.eavesTailRun))<.05);
 }
});
test('noggins avoid low window sills, lintels and cripple studs',()=>{
 const s=framing.defaultSettings();s.walls.left.openings.forEach(o=>{o.level=1240;o.height=400;});
 const cfg=framing.configForWall(s,'left');assert.deepEqual(framing.validate(cfg),[]);
 const members=framing.buildModel(cfg).filter(m=>m.shape==='rect'&&m.topLeft===undefined);
 for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++)assert.ok(!overlaps(members[i],members[j]),`${members[i].type} intersects ${members[j].type}`);
});
test('opening trimmers cannot occupy the California corner backing',()=>{
 const s=framing.defaultSettings();s.walls.front.openings[0].x=200;
 assert.ok(framing.validate(framing.configForWall(s,'front')).some(e=>e.includes('corner studs')));
});
test('square tie ends report their actual roof-plane collision',async()=>{
 const {tieEndClearance}=await vite.ssrLoadModule('/app/roof.ts');
 const s=framing.defaultSettings(),c=tieEndClearance(s);
 assert.ok(Math.abs(c.projection-14.5)<.1);assert.ok(Math.abs(c.run-31.1)<.1);
 assert.equal(tieEndClearance({...s,tieDepth:45}).projection,0);
});

test('tie chamfers follow the rafter top plane and retain full bottom length',async()=>{
 const {tieEndClearance}=await vite.ssrLoadModule('/app/roof.ts');
 for(const roofPitch of [15,25,45])for(const tieDepth of [45,75,200]){
  const s={...framing.defaultSettings(),roofPitch,tieDepth},d=tieEndClearance(s);
  assert.ok(d.run>=0);assert.ok(d.remainingDepth>0);
  assert.ok(Math.abs(d.remainingDepth+d.projection-tieDepth)<1e-8);
  if(d.projection>0){
   assert.ok(Math.abs(d.remainingDepth-d.rafterTopAtWall)<1e-8);
   assert.ok(Math.abs(d.rafterTopAtWall+d.run*Math.tan(roofPitch*Math.PI/180)-tieDepth)<1e-8);
  }else assert.equal(d.remainingDepth,tieDepth);
 }
});

test('centred timber overhang is 2.5 mm on each inner face and masonry stays independent',()=>{
 const s=framing.defaultSettings(),cfg=framing.configForWall(s,'front');
 assert.equal((s.brickInternalLength-s.internalLength)/2,2.5);
 assert.equal((s.brickInternalDepth-s.internalDepth)/2,2.5);
 assert.equal((cfg.brickLength-cfg.frameLength)/2,2.5);
 assert.equal((cfg.brickDepth-cfg.frameDepth)/2,2.5);
 const front=s.walls.front.openings,left=s.walls.left.openings;
 assert.deepEqual([front[1].x-front[0].x-front[0].width,front[2].x-front[1].x-front[1].width],[424,425]);
 assert.equal(left[1].x-left[0].x-left[0].width,534);
 s.internalLength+=50;s.internalDepth+=50;
 const moved=framing.configForWall(s,'front');
 assert.equal(moved.brickLength,cfg.brickLength);assert.equal(moved.brickDepth,cfg.brickDepth);
});

test('all wall elevations place nested short dimension bars nearer the drawing',async()=>{
 const {drawWallTechnical}=await vite.ssrLoadModule('/app/pdf/walls.ts');
 for(const id of ['front','rear','left','right']){
  const cfg=framing.configForWall(framing.defaultSettings(),id),labels=[];
  const recording={rect(){},line(){},polygon(){},text(label,x,y){labels.push({label,x,y});},textVertical(label,x,y){labels.push({label,x,y});},stream(){return '';}};
  drawWallTechnical(cfg,framing.buildModel(cfg),framing.wallOrder.indexOf(id)*2+1,17,recording);
  const frame=labels.find(p=>p.label==='2077 frame'),stud=labels.find(p=>p.label==='1942 stud cut'),sole=labels.find(p=>p.label==='45 sole');
  assert.ok(sole.x>stud.x&&stud.x>frame.x,`${id}: nested vertical bars must run shortest to longest outwards`);
  const body=labels.find(p=>p.label===`${cfg.width} frame body`),plate=labels.find(p=>p.label===`${cfg.upperEnd-cfg.upperStart} upper top plate`);
  assert.ok(cfg.gable?body.y>plate.y:plate.y>body.y,`${id}: larger top dimensions must be farther from the drawing`);
  const brick=labels.find(p=>p.label===`${cfg.brickBody} brick run`),noggin=labels.find(p=>p.label.includes('noggin / clear bay'));
  assert.ok(noggin.y<brick.y,`${id}: short bottom dimension must be inside the overall brick dimension`);
 }
});


test('all four outside fascia faces meet the requested wall-frame projections',()=>{
 for(const gableOverhang of [250,400,750])for(const roofGableOverhang of [100,250,600]){
  const s={...framing.defaultSettings(),gableOverhang,roofGableOverhang};
  const r=roofModel(s);
  assert.deepEqual(r.errors,[]);
  assert.equal(r.eavesTailRun+r.fasciaThickness,gableOverhang);
  assert.equal(r.flyRafterProjection+s.studFace/2+r.fasciaThickness,roofGableOverhang);
  assert.equal(r.outriggerRuns[0].start-s.studFace-r.fasciaThickness,-roofGableOverhang);
  assert.equal(r.outriggerRuns[1].end+s.studFace+r.fasciaThickness,r.length+roofGableOverhang);
  for(const id of ['left','right']){
   const cfg=framing.configForWall(s,id),[a,b]=framing.buildModel(cfg).filter(m=>m.type==='gable end rafter');
   assert.equal(cfg.upperStart-a.x1+r.fasciaThickness,gableOverhang);
   assert.equal(b.x2-cfg.upperEnd+r.fasciaThickness,gableOverhang);
  }
 }
 const s=framing.defaultSettings(),r=roofModel(s);
 assert.equal(r.length+2*r.gableOverhang,5690);
 assert.equal(r.span+2*r.overhang,3700);
 assert.equal(r.eavesTailRun,228);
 assert.equal(r.flyRafterProjection,205.5);
});

test('fascia allowances reject projections that leave no timber support',()=>{
 const s=framing.defaultSettings();
 for(const gableOverhang of [0,21])assert.ok(roofModel({...s,gableOverhang}).errors.length);
 for(const roofGableOverhang of [1,22,45,67])assert.ok(roofModel({...s,roofGableOverhang}).errors.length);
 assert.deepEqual(roofModel({...s,roofGableOverhang:0}).errors,[]);
});
