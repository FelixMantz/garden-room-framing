import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
const {roofEnvelope}=await v.ssrLoadModule('/app/roof-envelope.ts');
const {defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
after(()=>v.close());
test('roof OSB nests fit stock, joints have backing, broad end panels bridge gables and eaves',()=>{
 const m=roofEnvelope(defaultSettings());assert.equal(m.osbSheets,10);assert.equal(m.osbReserve,1);assert.equal(m.fits,true);
 assert.ok(m.columns.every(q=>q.w<=1220&&q.w>800));
 for(let i=1;i<m.columns.length;i++){const a=m.columns[i-1],b=m.columns[i];assert.ok(Math.abs(b.x-a.x-a.w-3)<1e-6);assert.ok(m.roof.rafters.includes(a.x+a.w+1.5));}
 assert.ok(m.columns[0].x<0&&m.columns[0].x+m.columns[0].w>0);
 assert.ok(m.columns.at(-1).x<m.roof.length&&m.columns.at(-1).x+m.columns.at(-1).w>m.roof.length);
 assert.ok(1200+3+m.lower<=2440);assert.equal(m.deck.fromRidgeSlope,1201.5);
 assert.equal(m.blocking.length,32);
 assert.ok(m.blocking.every(b=>b.y===1201.5));
});
test('PIR covers ridge-to-eaves with staggered joints, plumb bevels and a rebate enclosing the ridge corner',()=>{
 const s=defaultSettings(),m=roofEnvelope(s),p=s.roofPitch*Math.PI/180;
 assert.equal(m.pirSheets,10);assert.equal(m.pirReserve,0);
 assert.ok(m.pirLower<1200&&m.pirLower>800);assert.ok(2*(m.width-4800)+3<=2400);
 for(const row of [m.upper,m.eaves])assert.equal(row.reduce((a,q)=>a+q.w,0),m.width);
 assert.ok(m.upper.slice(1).every(a=>m.eaves.slice(1).every(b=>a.x!==b.x)));
 assert.ok(Math.abs(m.upper[0].y+1200-m.eaves[0].y)<1e-8);
 assert.ok(Math.abs(m.eaves[0].y+m.eaves[0].h-m.pirEnd)<1e-8);
 assert.ok(Math.abs(m.bevel-100*Math.tan(p))<1e-8);
 const world=([u,n])=>({x:-11*Math.sin(p)+u*Math.cos(p)-n*Math.sin(p),z:11*Math.cos(p)+u*Math.sin(p)+n*Math.cos(p)});
 const foot=world(m.ridgeSideFoot),side=world(m.ridgeSideTop),centre=world(m.ridgeCentreTop);
 assert.ok(Math.abs(foot.x)<1e-8);assert.ok(Math.abs(side.x)<1e-8);
 assert.ok(Math.abs(side.z-m.ridgeAboveRafter)<1e-8);assert.ok(Math.abs(centre.z-side.z)<1e-8);
 assert.ok(Math.abs(centre.x-s.ridgeWidth/2)<1e-8);
 // Square OSB cut: its bottom corner touches x=0; its upper corner stays outside.
 assert.ok(Math.abs(world([0,-11]).x)<1e-8);assert.ok(Math.abs(world([0,-11]).z)<1e-8);
 assert.ok(world([0,0]).x<0);
 assert.ok(Math.abs(m.osb[0].h+m.lower+3-m.deck.deckSlope)<1e-8);

});
test('batten overlay matches the agreed fixing counts',()=>{
 const m=roofEnvelope(defaultSettings());assert.equal(m.structural.length,17);assert.equal(m.intermediate.length,13);assert.equal(m.longScrews,98);assert.equal(m.shortScrews,52);
});

