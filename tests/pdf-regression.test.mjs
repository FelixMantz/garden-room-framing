import assert from 'node:assert/strict';
import test, {after} from 'node:test';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},appType:'custom'});
const route=await vite.ssrLoadModule('/app/api/framing-pdf/route.ts');
const {defaultSettings}=await vite.ssrLoadModule('/app/framing.ts');
after(()=>vite.close());
const post=(settings,output='inline')=>{
 const body=new FormData();body.set('config',JSON.stringify(settings));body.set('output',output);
 return route.POST(new Request('http://localhost/api/framing-pdf',{method:'POST',body}));
};
test('default GET and form POST generate identical PDFs; download preserves contents',async()=>{
 const get=await route.GET(),posted=await post(defaultSettings()),download=await post(defaultSettings(),'download');
 assert.equal(posted.status,200);assert.equal(download.status,200);
 assert.match(download.headers.get('Content-Disposition'),/^attachment/);
 const bytes=await get.text();assert.equal(await posted.text(),bytes);assert.equal(await download.text(),bytes);
 assert.doesNotMatch(bytes,/NaN|Infinity/);
 assert.equal((bytes.match(/\/Type \/Page\b/g)||[]).length,22);
});
test('malformed and unsafe settings return 400 before geometry is generated',async()=>{
 for(const patch of [null,{}, {...defaultSettings(),studCentres:0},{...defaultSettings(),topPlates:3},{...defaultSettings(),brickCourses:1.5},{...defaultSettings(),layers:[{name:'bad',thickness:-10}]}])assert.equal((await post(patch)).status,400);
});
test('removed generic controls cannot alter the fixed specification',async()=>{
 const patches=[{layers:[{name:'Oak boards',thickness:20}]},{topPlates:1},{cornerType:'three-stud'},{dwarfEnabled:false},{nogginRows:'600,1200'}];
 for(const patch of patches)assert.equal((await post({...defaultSettings(),...patch})).status,400);
 const s=defaultSettings();s.walls.front.openings[1].width=1300;assert.equal((await post(s)).status,400);
});
test('zero gable projection has no negative outrigger dimension',async()=>{
 const res=await post({...defaultSettings(),roofGableOverhang:0});assert.equal(res.status,200);
 const pdf=await res.text();assert.doesNotMatch(pdf.slice(pdf.indexOf("Roof cutting and set-out"),pdf.indexOf("Gable rafters - dimensions")),/Gable outriggers/);assert.doesNotMatch(pdf,/Outrigger clear run: -/);
});
test('gable elevations dimension the ridge-centred stud grid from both edges',async()=>{
 const pdf=await (await route.GET()).text();
 assert.match(pdf,/305 first stud C\/L from left/);
 assert.match(pdf,/400 stud C\/C to ridge/);
 assert.match(pdf,/305 first stud C\/L from right/);
 assert.match(pdf,/first C\/L 305 from left and 305 from right/);
});
test('front elevation sets upper brick courses out from both outside corners to the door opening',async()=>{
 const pdf=await (await route.GET()).text();
 assert.match(pdf,/1965\.5 L brick return/);
 assert.match(pdf,/K1 438.*K2 1628.*K3 1873.*K4 3317.*K5 3562.*K6 4752/);
 assert.match(pdf,/4.5 FIT/);
 assert.match(pdf,/1264 structural opening/);
 assert.match(pdf,/1965\.5 R brick return/);
 assert.match(pdf,/courses 2-4/);
});
test('birdsmouth detail labels the heel and seat cuts and true sloping tail set-out',async()=>{
 const standard=await (await route.GET()).text();
 assert.match(standard,/251\.6 along slope .*228 horiz/);
 assert.match(standard,/Heel cut 44\.3 vertical; seat cut 95 horizontal/);
 assert.doesNotMatch(standard,/vertical from top to (outer|inner) seat corner/);
 const steeper=await post({...defaultSettings(),roofPitch:35,gableOverhang:500});
 assert.equal(steeper.status,200);
 const pdf=await steeper.text();
 assert.match(pdf,/583\.5 along slope .*478 horiz/);
 assert.match(pdf,/Heel cut 66\.5 vertical; seat cut 95 horizontal/);
});

test('default build artifact matches generator and schedules immediately follow drawings',async()=>{
 const {readFile}=await import('node:fs/promises');
 const pdf=await (await route.GET()).text();
 assert.equal(await readFile(new URL('../public/garden-room-framing-set.pdf',import.meta.url),'utf8'),pdf);
 const pages=pdf.split('stream\n').filter((_,i)=>i%2===1);
 const titles=['Front wall - dimensioned elevation','Front wall - cutting schedule','Rear wall - dimensioned elevation','Rear wall - cutting schedule','Left gable wall - dimensioned elevation','Left gable wall - cutting schedule','Right gable wall - dimensioned elevation','Right gable wall - cutting schedule','Roof framing','Roof cutting and set-out','Gable rafters - dimensions','French-door','French-door','Black-and-white'];
 let pos=-1;for(const title of titles){pos=pdf.indexOf(title,pos+1);assert.ok(pos>=0,title);}
 assert.doesNotMatch(pdf,/Board schedule - section/);
});
test('roof BOM excludes gable members already counted by walls',async()=>{
 const {roofCutSchedule}=await vite.ssrLoadModule('/app/roof.ts');
 const rows=roofCutSchedule(defaultSettings());
 assert.deepEqual(rows.map(r=>[r.type,r.qty]),[['Field common rafters',26],['Outer fly rafters',4],['Tie beams',3],['Ridge beam',1],['Gable outriggers',8],['OSB seam noggins',24],['OSB seam noggins',2],['OSB seam noggins',4],['OSB seam noggins',2]]);
 assert.equal(rows[4].length,183);
 assert.deepEqual(rows.slice(5).map(r=>[r.qty,r.length]),[[24,355],[2,187.5],[4,183],[2,67.5]]);
});
test('roof plan dimensions both shortened end bays to the first regular rafters',async()=>{
 const pdf=await (await route.GET()).text();
 assert.match(pdf,/End bays - gable end-rafter C\/L to first regular rafter C\/L: left 232\.5 mm; right 112\.5 mm/);
 assert.match(pdf,/232\.5 C\/L/);
 assert.match(pdf,/112\.5 C\/L/);
});

test('roof schedule includes the agreed mirrored chamfers and removes the unresolved clash warning',async()=>{
 const pdf=await (await route.GET()).text();
 assert.match(pdf,/TIE-END CHAMFERS - SIDE ELEVATION/);
 assert.match(pdf,/14\.5 vertical cut x 31 horizontal run/);
 assert.match(pdf,/60\.5 end/);
 assert.doesNotMatch(pdf,/TIE-END CLEARANCE|Confirm tie-end \/ roof build-up detail/);
 const square=await (await post({...defaultSettings(),tieDepth:45})).text();
 assert.match(square,/no chamfer required; square ends clear/);
 assert.doesNotMatch(square,/0 cut/);
});
test('last sheet shows the centred timber bearing and measured masonry datums',async()=>{
 const pdf=await (await route.GET()).text();
 const last=pdf.slice(pdf.indexOf('Timber frame positioning on the dwarf wall'));
 assert.match(last,/5005 x 3015/);assert.match(last,/5000 x 3010/);
 assert.match(last,/2\.5 mm internal timber overhang/);
 assert.match(last,/92\.5 mm timber bearing on brick/);
 assert.match(last,/page 19 of 22/);
});

test('enlarged rafter tail dimensions the flat cut and final plan identifies butt joints',async()=>{
 const pdf=await (await route.GET()).text();
 const cuts=pdf.slice(pdf.indexOf('Gable rafters - dimensions'),pdf.indexOf('French-door front'));
 assert.equal((cuts.match(/117\.6 horizontal soffit cut/g)||[]).length,2);
 const last=pdf.slice(pdf.indexOf('Timber frame positioning on the dwarf wall'));
 assert.match(last,/FULL LENGTH - FRONT BODY 5190/);assert.match(last,/FULL LENGTH - REAR BODY 5190/);
 assert.match(last,/LEFT BODY 3010 - BUTTS BETWEEN FRONT \/ REAR/);
 assert.match(last,/RIGHT BODY 3010 - BUTTS BETWEEN FRONT \/ REAR/);
 assert.match(last,/side bodies stop 95 mm from each outer timber corner/);
});


test('roof plan and eaves section dimension outside fascia faces',async()=>{
 const pdf=await (await route.GET()).text();
 assert.match(pdf,/5690 outer fascia to outer fascia/);
 assert.match(pdf,/3700 H fascia overall depth/);
 assert.equal((pdf.match(/250 to fascia/g)||[]).length,2);
 assert.equal((pdf.match(/250 H to fascia/g)||[]).length,2);
 assert.match(pdf,/1088\.9 H \[1201\.5 S\] noggin C\/L - ridge face/);
 assert.match(pdf,/1805\.5 H \[1992\.1 S\] tail - ridge face/);
 assert.match(pdf,/250 wall to outer fascia = 228 to tail \+ 22 fascia/);
 assert.match(pdf,/250 mm horizontal: outer wall framing to outer fascia; 228 mm to rafter tail/);
 assert.doesNotMatch(pdf,/outer-rafter C\/L to C\/L/);
});

test('OSB cross-joints have continuous blocking across both slopes including fly bays',async()=>{
 const {roofDeckNoggins,roofModel}=await vite.ssrLoadModule('/app/roof.ts');
 for(const roofPitch of [15,25,35,45]){
  const settings={...defaultSettings(),roofPitch},n=roofDeckNoggins(settings),r=roofModel(settings);
  assert.equal(n.blocks.length,32);
  const front=n.blocks.filter(b=>b.y===n.frontY),rear=n.blocks.filter(b=>b.y===n.rearY);
  assert.equal(front.length,16);assert.equal(rear.length,16);
  assert.ok(Math.abs(n.frontY+n.rearY-r.span)<1e-8);
  assert.ok(Math.abs(((r.span-settings.ridgeWidth)/2-n.frontY)/Math.cos(roofPitch*Math.PI/180)-1201.5)<1e-8);
  assert.ok(front.every(b=>b.length>0));
  assert.ok(front[0].x<0);
  assert.ok(front.at(-1).x+front.at(-1).length>r.length);
  assert.deepEqual(front.map(b=>[b.x,b.length]),rear.map(b=>[b.x,b.length]));
  for(let i=1;i<front.length;i++)assert.ok(Math.abs(front[i].x-(front[i-1].x+front[i-1].length)-settings.studFace)<1e-8);
 }
});
