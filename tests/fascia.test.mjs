import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const v=await createServer({configFile:false,appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null}});
const {fasciaPlan}=await v.ssrLoadModule('/app/fascia.ts');
const {defaultSettings}=await v.ssrLoadModule('/app/framing.ts');
after(()=>v.close());
test('four 5m boards cover both eaves and four flush box-end gables including saw kerfs',()=>{
 const s=defaultSettings(),m=fasciaPlan(s),p=s.roofPitch*Math.PI/180;
 assert.ok(Math.abs(m.centreRun*Math.cos(p)-(m.ridgeFaceRun*Math.cos(p)+s.ridgeWidth/2))<1e-8);
 assert.ok(Math.abs(m.blankLength-1935.90265630)<1e-5);
 assert.equal(m.eavesHalf,2823);assert.equal(m.fits,true);
 assert.ok(m.remaining>235&&m.remaining<236);assert.ok(m.trialSpare>234&&m.trialSpare<235);
 assert.equal(m.eavesFaceDepth,192);assert.equal(m.soffitDepth,158);
 assert.ok(m.soffitStep>27&&m.soffitStep<29);assert.equal(m.boxOffcut,238);
 assert.equal(4*(m.eavesHalf+m.blankLength+6+m.remaining),20000);
 assert.equal(fasciaPlan({...s,internalLength:s.internalLength+600}).fits,false);
});
