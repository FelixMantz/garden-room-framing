import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
const {fasciaPlan}=await v.ssrLoadModule('/app/fascia.ts');
const {defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
after(()=>v.close());
test('four 5m boards cover both eaves and four complete plumb-cut gables including saw kerfs',()=>{
 const s=defaultSettings(),m=fasciaPlan(s),p=s.roofPitch*Math.PI/180;
 assert.ok(Math.abs(m.centreRun*Math.cos(p)-(m.ridgeFaceRun*Math.cos(p)+s.ridgeWidth/2))<1e-8);
 assert.ok(Math.abs(m.blankLength-2139.54810565)<1e-5);
 assert.equal(m.eavesHalf,2823);assert.equal(m.fits,true);
 assert.ok(m.remaining>31&&m.remaining<32);assert.ok(m.trialSpare>30&&m.trialSpare<31);
 assert.equal(m.totalDepth,231);assert.equal(m.uncovered,6);
 assert.equal(4*(m.eavesHalf+m.blankLength+6+m.remaining),20000);
 assert.equal(fasciaPlan({...s,internalLength:s.internalLength+200}).fits,false);
});
