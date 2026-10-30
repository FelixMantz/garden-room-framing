import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
const v=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'});
const {defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
const {wiringWall}=await v.ssrLoadModule('/app/wiring.ts');
const {generateFramingPdf}=await v.ssrLoadModule('/app/framing-pdf.ts');
after(()=>v.close());
test('door bypass rises beside jambs and crosses only inside roof framing, clear of the lintel',async()=>{
 const s=defaultSettings(),m=wiringWall(s,'front'),door=m.cfg.computedOpenings.find(o=>o.type==='door');
 const left=m.w-door.x-door.width,right=m.w-door.x;
 const rd=m.ports.find(p=>p.id==='RD'),re=m.ports.find(p=>p.id==='RE');
 assert.ok(rd.x<left);assert.ok(re.x>right);
 for(const p of [rd,re]){assert.equal(p.path[0][1],500);assert.ok(p.z>2220);}
 for(const run of m.runs)for(let i=1;i<run.points.length;i++){const a=run.points[i-1],b=run.points[i];if(a[1]===b[1])assert.ok(!(Math.min(a[0],b[0])<right&&Math.max(a[0],b[0])>left),'wall cable crosses doorway/lintel: '+run.id);}
 const {framingConnections}=await v.ssrLoadModule('/app/wiring.ts'),c=framingConnections(s),run=c.roofRuns.find(r=>r.id==='R door bypass');
 assert.deepEqual(run.points[0],rd.plan);assert.deepEqual(run.points.at(-1),re.plan);
 assert.ok(run.points.some(p=>p[1]<s.internalDepth-100));
});
test('ring rejoins the right/rear wall at socket height through the bathroom',()=>{
 const s=defaultSettings(),right=wiringWall(s,'right'),rear=wiringWall(s,'rear');
 const r=right.runs.find(r=>r.id==='R: front CU / S8 / F-R / S7 / rear');
 const b=rear.runs.find(r=>r.id==='R: left / S5 / S6');
 assert.deepEqual(r.points.at(-1),[0,500]);assert.deepEqual(b.points.at(-1),[rear.w,500]);
 for(const run of [r,b])assert.ok(run.points.every(p=>p[1]===500));
 assert.equal(right.points.filter(p=>p.kind==='cu').length,0);
});
test('construction output has six wiring pages with local keys, eight main lights and separate B1',()=>{
 const pdf=new TextDecoder().decode(generateFramingPdf(defaultSettings(),'construction'));
 assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,26);
 for(let i=1;i<=8;i++)assert.ok(pdf.includes(`(M${i})`));
 assert.ok(pdf.includes('(B1)'));assert.ok(pdf.includes('(SW-B)'));
 assert.match(pdf,/KEY/);assert.match(pdf,/separate control/);
 assert.doesNotMatch(pdf,/network home runs \(reference\)|cable register and structural crossings/);
 assert.doesNotMatch(pdf,/NaN|Infinity/);
});

test('consumer unit sits in the clear front-right bay with its top at the underside of the double plates',async()=>{
 const {consumerUnit}=await v.ssrLoadModule('/app/wiring.ts');
 const s=defaultSettings(),front=wiringWall(s,'front'),cu=consumerUnit(s);
 assert.equal(front.points.filter(p=>p.kind==='cu').length,1);
 assert.equal(cu.top,front.cfg.wallHeight-90+front.cfg.frameBase-front.cfg.ffl);
 assert.ok(cu.x-cu.width/2>=140);assert.ok(cu.x+cu.width/2<=438);
 assert.equal(cu.bottom,cu.top-270);
 const {buildModel}=await v.ssrLoadModule('/app/framing.ts');
 const members=buildModel(front.cfg);
 for(const m of members){if(!m.w||!m.h)continue;const x=front.w-m.x-m.w,z=m.y+front.cfg.frameBase-front.cfg.ffl;assert.ok(!(x<cu.x+cu.width/2&&x+m.w>cu.x-cu.width/2&&z<cu.top&&z+m.h>cu.bottom),m.type+' intersects CU');}
});
test('all network runs start at front-wall NET, with only physical roof cables on the ceiling sheet',async()=>{
 const s=defaultSettings(),front=wiringWall(s,'front'),net=front.points.find(p=>p.id==='NET');
 for(const id of ['N1A','N3A','N4A'])assert.deepEqual(front.ports.find(p=>p.id===id).path[0],[net.x,net.z]);
 assert.deepEqual(front.runs.find(r=>r.id.startsWith('N2:')).points[0],[net.x,net.z]);
 const {drawWiringCeiling}=await v.ssrLoadModule('/app/pdf/wiring.ts'),page=drawWiringCeiling(s,1,1);
 assert.ok(!page.includes('(NET)'));assert.ok(!page.includes('(CU)'));assert.ok(page.includes('(M1)'));
 assert.match(page,/N1A-N1B/);assert.doesNotMatch(page,/N2 =|HOUSE DATA|external soffits|REAR SOFFIT/);
});

test('single front-corner outlets retain single cables and switch/network equipment positions',()=>{
 const s=defaultSettings(),front=wiringWall(s,'front'),right=wiringWall(s,'right');
 const cu=front.points.find(p=>p.id==='CU'),sw=front.points.find(p=>p.id==='SW-M');
 assert.notEqual(sw.x,cu.x);assert.equal(sw.z,1200);assert.equal(sw.kind,'switch3');
 const door=front.cfg.computedOpenings.find(o=>o.type==='door');assert.equal(sw.x,front.w-door.x-door.width-160);
 const net=front.points.find(p=>p.id==='NET');assert.equal(net.x,cu.x);assert.equal(net.z,1700);assert.ok(!right.points.some(p=>p.id==='NET'));
 assert.deepEqual(front.points.filter(p=>/^N[23]$/.test(p.id)).map(p=>p.id),['N2','N3']);
 assert.equal(front.runs.filter(r=>r.id.startsWith('N2:')).length,1);
 assert.equal(front.ports.filter(p=>p.id==='N3B').length,1);
 const near=front.runs.find(r=>r.id.startsWith('N2:'));assert.ok(near.points.some(p=>p[1]===535));
 const far=front.ports.find(p=>p.id==='N3B'),outlet=front.points.find(p=>p.id==='N3');assert.deepEqual(far.path[0],[outlet.x,outlet.z]);assert.ok(far.x>front.w-door.x);assert.ok(far.path.some(p=>p[1]===535));
 assert.deepEqual(right.runs.find(r=>r.type==='ring').points[0],[right.w,500]);
});

test('three-gang lighting has separate main, feature and external returns, and bathroom has a ceiling pull cord',async()=>{
 const front=wiringWall(defaultSettings(),'front');
 const returns=front.runs.filter(r=>/^SW[123]$/.test(r.id));
 assert.equal(returns.length,3);
 assert.deepEqual(returns.map(r=>r.id),['SW1','SW2','SW3']);
 const {drawWiringBathroom,drawWiringCeiling}=await v.ssrLoadModule('/app/pdf/wiring.ts');
 const bathroom=drawWiringBathroom(defaultSettings(),1,1),ceiling=drawWiringCeiling(defaultSettings(),1,1);
 assert.match(bathroom,/ceiling-mounted pull-cord switch INSIDE/);
 assert.match(bathroom,/mechanical cord/);assert.doesNotMatch(bathroom,/1200|latch-side corner/);
 assert.doesNotMatch(ceiling,/\(SW-B\)|\(B1\)/);assert.match(bathroom,/CEILING PLAN/);
});

test('main and feature lighting each have one feed and loop through every fitting without separate home runs',async()=>{
 const {ceilingLighting}=await v.ssrLoadModule('/app/wiring.ts');
 const m=ceilingLighting(defaultSettings());
 for(const [group,points] of [['main',m.main],['feature',m.feature]]){
  const runs=m.runs.filter(r=>r.group===group);
  assert.equal(runs.length,points.length);assert.equal(runs.filter(r=>r.from===(group==='main'?'SW1':'SW2')).length,1);
  assert.deepEqual(new Set(runs.map(r=>r.to)),new Set(points.map(p=>p.id)));
  for(let i=1;i<runs.length;i++)assert.equal(runs[i].from,runs[i-1].to);
  for(const run of runs)for(let i=1;i<run.points.length;i++)assert.ok(run.points[i][0]===run.points[i-1][0]||run.points[i][1]===run.points[i-1][1]);
 }
});

test('service entries are on right wall near front corner and feature loop continues to left-gable centroid',async()=>{
 const s=defaultSettings(),front=wiringWall(s,'front'),right=wiringWall(s,'right'),left=wiringWall(s,'left');
 for(const id of ['SWA-IN','DATA-IN']){const p=right.points.find(p=>p.id===id);assert.ok(p);assert.ok(p.z<front.cu.bottom);assert.ok(!front.points.some(p=>p.id===id));}
 assert.ok(right.runs.some(r=>r.id.startsWith('HOUSE DATA')));assert.ok(right.runs.some(r=>r.type==='supply'));
 const {configForWall}=await v.ssrLoadModule('/app/framing.ts');const cfg=configForWall(s,'left'),g=left.points.find(p=>p.id==='G1');
 assert.equal(g.x,cfg.width/2);assert.ok(Math.abs(g.z-(cfg.wallHeight+cfg.frameBase-cfg.ffl+(cfg.ridgeBottom-cfg.wallHeight)/3))<.51);
 const {ceilingLighting}=await v.ssrLoadModule('/app/wiring.ts');const lighting=ceilingLighting(s);
 assert.equal(lighting.featureOrder.at(-1),'G1');assert.equal(lighting.gableContinuation.from,'T1');assert.equal(lighting.gableContinuation.to,'G1');
});


test('every wall continuation has exactly one roof connection and all transport stays inside the frame',async()=>{
 const s=defaultSettings(),{framingConnections,ceilingLighting}=await v.ssrLoadModule('/app/wiring.ts'),c=framingConnections(s),lighting=ceilingLighting(s);
 const endpoints=c.roofRuns.flatMap(r=>[r.from,r.to]).filter(Boolean).concat(['SW1','SW2','FG','FG2','SP']);
 for(const p of c.ports){
  assert.equal(endpoints.filter(id=>id===p.id).length,1,p.id+' continuation count');
  const wall=wiringWall(s,p.wall),run=wall.runs.find(r=>r.id===p.id);
  assert.deepEqual(run.points.at(-1),[p.x,p.z]);
 }
 for(const r of c.roofRuns){
  assert.deepEqual(r.points[0],c.get(r.from).plan);
  if(r.to)assert.deepEqual(r.points.at(-1),c.get(r.to).plan);
 }
 const paths=[...c.roofRuns,...lighting.runs,lighting.gableContinuation,lighting.rightGableContinuation];
 for(const r of paths){for(const p of r.points){assert.ok(p[0]>=0&&p[0]<=s.internalLength,r.id||r.to);assert.ok(p[1]>=0&&p[1]<=s.internalDepth,r.id||r.to);}for(let i=1;i<r.points.length;i++){const [a,b]=[r.points[i-1],r.points[i]];assert.ok(a[0]===b[0]||a[1]===b[1],r.id||r.to);}}
});

test('roof proposal identifies structural bores and omits soffit/surface-carrier assumptions',async()=>{
 const {drawWiringCeiling,drawWiringWall}=await v.ssrLoadModule('/app/pdf/wiring.ts'),s=defaultSettings(),roof=drawWiringCeiling(s,1,1);
 assert.match(roof,/No prescriptive permitted bore zone/);assert.match(roof,/Do not apply floor-joist drilling rules/);assert.match(roof,/No rafter holes are authorised/);
 for(const id of ['front','rear','left','right'])assert.doesNotMatch(drawWiringWall(s,id,1,1),/soffit|VISIBLE room-side surface carriers/);
 assert.doesNotMatch(roof,/soffit|fascia|overhang/);
});


test('lighting loops use the switch bank with no separate junction enclosure, and bathroom feed is isolated to its page',async()=>{
 const s=defaultSettings(),{ceilingLighting,bathroomWiring}=await v.ssrLoadModule('/app/wiring.ts');
 const m=ceilingLighting(s),bath=bathroomWiring(s);
 assert.equal(m.roofRuns.find(r=>r.id==='Lighting permanent').to,'SW0');
 assert.equal(m.roofRuns.find(r=>r.id==='Lantern feed').from,'SW3');
 assert.equal(m.smokeRun.from,'SP');assert.equal(m.smokeRun.to,'SM');
 assert.equal(bath.feed.from,'BL');assert.deepEqual(bath.feed.points[0],[s.internalLength,bath.partitionY]);assert.deepEqual(bath.feed.points.at(-1),bath.pull.point);assert.deepEqual(bath.switched.points.at(-1),bath.light.point);
 for(const id of ['front','rear','left','right'])assert.ok(!wiringWall(s,id).points.some(p=>p.id==='JB-L'||p.id==='AC-ISO'));
 const {drawWiringCeiling,drawWiringBathroom}=await v.ssrLoadModule('/app/pdf/wiring.ts');
 const roof=drawWiringCeiling(s,1,1),page=drawWiringBathroom(s,1,1);
 assert.doesNotMatch(roof,/JB-L|SW-B|B1/);assert.match(page,/\(SW-B\)/);assert.match(page,/\(B1\)/);assert.match(page,/BL RISE/);
});

test('N3 roof bypass follows the ring and drops beside its far door riser before following the low ring',async()=>{
 const s=defaultSettings(),front=wiringWall(s,'front'),ring=front.ports.find(p=>p.id==='RE'),data=front.ports.find(p=>p.id==='N3B');
 assert.ok(Math.abs(data.x-ring.x)<=35);assert.ok(data.path.some(p=>p[0]===data.x&&p[1]===535));
 const {framingConnections}=await v.ssrLoadModule('/app/wiring.ts'),c=framingConnections(s),r=c.roofRuns.find(p=>p.id==='R door bypass'),n=c.roofRuns.find(p=>p.id==='N3 socket');
 const horizontal=p=>p.points.slice(1).map((b,i)=>[p.points[i],b]).filter(([a,b])=>a[1]===b[1]&&Math.abs(a[0]-b[0])>500);
 assert.ok(horizontal(n).some(([a])=>horizontal(r).some(([b])=>Math.abs(a[1]-b[1])<=60)));
});

test('right-wall entries are 200mm behind the outside front brick face',()=>{
 const s=defaultSettings(),m=wiringWall(s,'right'),outside=s.internalDepth+(s.brickInternalDepth-s.internalDepth)/2+s.brickThickness;
 for(const id of ['SWA-IN','DATA-IN']){const p=m.points.find(p=>p.id===id);assert.equal(outside-p.x,200);assert.equal(m.w-p.x,102.5);assert.equal(p.z,id==='SWA-IN'?250:350);}
});

test('gable service drops start inside the sloping rafters and clear the central gable stud group vertically',async()=>{
 const s=defaultSettings(),{buildModel}=await v.ssrLoadModule('/app/framing.ts');
 for(const [wall,id,fixture] of [['left','FG','G1'],['right','N1B','AP'],['right','AD','AC']]){
  const m=wiringWall(s,wall),p=m.ports.find(p=>p.id===id),a=m.points.find(p=>p.id===fixture);
  assert.ok(p.z>a.z+250);assert.ok(Math.abs(p.x-a.x)>=30);
  const studs=buildModel(m.cfg).filter(b=>/gable.*stud|ridge support stud/.test(b.type));
  for(const b of studs){const x=m.w-b.x-b.w;assert.ok(p.x<x||p.x>x+b.w,id+' runs inside vertical stud');}
  if(id==='FG'||id==='N1B')assert.ok(p.x<m.w/2-1.5*s.studFace);
  assert.ok(p.path.some(v=>v[0]===p.x&&v[1]===a.z));
 }
});

test('heater isolator and rear drop share the heater bay and its enclosure clears studs and noggins',async()=>{
 const s=defaultSettings(),m=wiringWall(s,'rear'),iso=m.points.find(p=>p.id==='WH-ISO'),wh=m.points.find(p=>p.id==='WH'),drop={x:m.runs.find(r=>r.id==='H: channel / WH-ISO').points.at(-1)[0]};
 assert.equal(drop.x,iso.x);assert.ok(iso.x<m.w-450);assert.equal(iso.z,850);
 const {buildModel}=await v.ssrLoadModule('/app/framing.ts'),members=buildModel(m.cfg);
 for(const b of members){if(!b.w||!b.h||(!/stud|noggin/.test(b.type)))continue;
  const x=m.w-b.x-b.w,z=b.y+m.cfg.frameBase-m.cfg.ffl;
  assert.ok(!(x<iso.x+43&&x+b.w>iso.x-43&&z<iso.z+41.5&&z+b.h>iso.z-41.5),b.type+' hits isolator');
  if(/stud/.test(b.type))assert.ok(!(x>Math.min(wh.x,iso.x)&&x<Math.max(wh.x,iso.x)),b.type+' splits heater and isolator bay');
 }
});

test('rafter drilling notes distinguish clearance calculations from permission to drill',async()=>{
 const {rafterDrillingAssessment}=await v.ssrLoadModule('/app/wiring.ts'),m=rafterDrillingAssessment(defaultSettings());
 assert.deepEqual(m.approvedZones,[]);assert.equal(m.depth,95);assert.equal(m.centre,47.5);assert.equal(m.exampleCover,37.5);
 assert.ok(m.battenScrewEmbed>66&&m.battenScrewEmbed<67);
});

test('network legends appear only where network cables are drawn and redundant notes are omitted',async()=>{
 const s=defaultSettings(),{drawWiringWall,drawWiringCeiling,drawWiringBathroom}=await v.ssrLoadModule('/app/pdf/wiring.ts');
 for(const id of ['front','rear','left','right']){
  const page=drawWiringWall(s,id,1,1),hasData=wiringWall(s,id).runs.some(r=>r.type==='data');
  assert.equal(/DASHED|dashed/.test(page),hasData,id);
  assert.doesNotMatch(page,/fitting positions PROVISIONAL|High-level runs rise/);
 }
 const roof=drawWiringCeiling(s,1,1),bath=drawWiringBathroom(s,1,1);
 assert.doesNotMatch(roof,/No separate lighting junction box|N5/);assert.match(roof,/dashed = network/);
 assert.doesNotMatch(bath,/DASHED|dashed|FROM SM|steel conduit/);
});

test('AC is centred between the bathroom partition and front wall at the upper plate height, and N5 is absent',async()=>{
 const s=defaultSettings(),{bathroomModel}=await v.ssrLoadModule('/app/bathroom.ts'),b=bathroomModel(s),m=wiringWall(s,'right'),ac=m.points.find(p=>p.id==='AC');
 assert.equal(ac.x,(s.internalDepth+b.frontOuter-b.dy)/2);assert.equal(ac.x,1955);assert.equal(ac.z,2220);
 const {framingConnections}=await v.ssrLoadModule('/app/wiring.ts'),c=framingConnections(s);
 assert.ok(!c.ports.some(p=>p.id.startsWith('N5')));assert.ok(!c.roofRuns.some(r=>r.id.startsWith('N5')));
});

test('bathroom permanent lighting feed follows socket zones and enters the supported partition end',async()=>{
 const s=defaultSettings(),front=wiringWall(s,'front'),right=wiringWall(s,'right'),{bathroomWiring}=await v.ssrLoadModule('/app/wiring.ts'),b=bathroomWiring(s);
 const f=front.runs.find(r=>r.id==='BL: CU / right wall'),r=right.runs.find(r=>r.id==='BL: right wall / partition');
 assert.equal(f.type,'light');assert.deepEqual(f.points.at(-1),[0,525]);assert.deepEqual(r.points[0],[right.w,525]);
 assert.deepEqual(r.points.at(-1),[b.partitionY,525]);assert.equal(b.riseX,s.internalLength-100);
 assert.ok(b.low>=437.5&&b.low<=562.5);
 // The continuous lighting cable passes through the socket/FCU backbox envelopes, without joining the ring.
 const s1=front.points.find(p=>p.id==='S1'),verticalX=f.points[0][0];assert.ok(Math.abs(verticalX-s1.x)<73);assert.ok(Math.abs(525-s1.z)<41.5);
 for(const id of ['S8','F-R','S7']){const p=right.points.find(p=>p.id===id);assert.ok(p.x>b.partitionY&&p.x<right.w);assert.ok(Math.abs(525-p.z)<41.5);}
 assert.deepEqual(b.feed.points[0],[s.internalLength,b.partitionY]);assert.deepEqual(b.feed.points.at(-1),b.pull.point);
});


test('main switch has exactly one incoming and three direct switched outgoing cables',async()=>{
 const s=defaultSettings(),m=wiringWall(s,'front'),ports=m.ports.filter(p=>p.group==='SW-M');
 assert.deepEqual(ports.map(p=>p.id),['SW0','SW1','SW2','SW3']);
 const {ceilingLighting}=await v.ssrLoadModule('/app/wiring.ts'),c=ceilingLighting(s);
 assert.equal(c.roofRuns.find(r=>r.id==='Lighting permanent').to,'SW0');
 assert.equal(c.runs.find(r=>r.group==='main').from,'SW1');assert.equal(c.runs.find(r=>r.group==='feature').from,'SW2');
 assert.equal(c.roofRuns.find(r=>r.id==='Lantern feed').from,'SW3');
 assert.equal(m.ports.find(p=>p.id==='SP').group,'CU/NET');
});

test('heater stays in low wall channel and feature circuit branches to right gable',async()=>{
 const s=defaultSettings(),{ceilingLighting}=await v.ssrLoadModule('/app/wiring.ts'),m=ceilingLighting(s);
 assert.ok(!m.roofRuns.some(r=>r.type==='heater'));assert.ok(!m.ports.some(p=>p.id==='HC'||p.id==='HW'));
 for(const id of ['front','right','rear'])assert.ok(wiringWall(s,id).runs.some(r=>r.type==='heater'&&r.points.some(p=>p[1]===470)));
 assert.equal(m.rightGableContinuation.from,'T3');assert.equal(m.rightGableContinuation.to,'G2');
 assert.ok(wiringWall(s,'right').points.some(p=>p.id==='G2'&&p.kind==='feature'));
 const ring=m.roofRuns.find(r=>r.type==='ring');assert.ok(ring.points.some(p=>p[1]===s.internalDepth-150));
 const n3=m.roofRuns.find(r=>r.id==='N3 socket');assert.ok(n3.points.some(p=>p[1]===s.internalDepth-195));
 const cam=m.roofRuns.find(r=>r.id==='N4 CAM');assert.ok(cam.points.every(p=>p[1]>=s.internalDepth-60));
});
