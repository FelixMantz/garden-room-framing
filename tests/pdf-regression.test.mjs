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
 assert.equal((bytes.match(/\/Type \/Page\b/g)||[]).length,17);
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
 assert.match(pdf,/1964\.5 L brick return/);
 assert.match(pdf,/1965\.5 R brick return/);
 assert.match(pdf,/courses 2-4/);
});
test('birdsmouth detail labels the heel and seat cuts and true sloping tail set-out',async()=>{
 const standard=await (await route.GET()).text();
 assert.match(standard,/275\.8 along slope .*250 horiz/);
 assert.match(standard,/Heel cut 44\.3 vertical; seat cut 95 horizontal/);
 assert.doesNotMatch(standard,/vertical from top to (outer|inner) seat corner/);
 const steeper=await post({...defaultSettings(),roofPitch:35,gableOverhang:500});
 assert.equal(steeper.status,200);
 const pdf=await steeper.text();
 assert.match(pdf,/610\.4 along slope .*500 horiz/);
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
 assert.deepEqual(rows.map(r=>[r.type,r.qty]),[['Field common rafters',26],['Outer fly rafters',4],['Tie beams',3],['Ridge beam',1],['Gable outriggers',8]]);
 assert.equal(rows[4].length,227.5);
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
 assert.match(last,/page 17 of 17/);
});

test('enlarged rafter tail dimensions the flat cut and final plan identifies butt joints',async()=>{
 const pdf=await (await route.GET()).text();
 const cuts=pdf.slice(pdf.indexOf('Gable rafters - dimensions'),pdf.indexOf('French-door front'));
 assert.equal((cuts.match(/181\.9 horizontal soffit cut/g)||[]).length,2);
 const last=pdf.slice(pdf.indexOf('Timber frame positioning on the dwarf wall'));
 assert.match(last,/FULL LENGTH - FRONT BODY 5190/);assert.match(last,/FULL LENGTH - REAR BODY 5190/);
 assert.match(last,/LEFT BODY 3010 - BUTTS BETWEEN FRONT \/ REAR/);
 assert.match(last,/RIGHT BODY 3010 - BUTTS BETWEEN FRONT \/ REAR/);
 assert.match(last,/side bodies stop 95 mm from each outer timber corner/);
});
