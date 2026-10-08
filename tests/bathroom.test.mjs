import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
const vite=await createServer({configFile:false,appType:'custom',server:{middlewareMode:true,hmr:false}});
const {defaultSettings}=await vite.ssrLoadModule('/app/framing.ts');
const {bathroomModel}=await vite.ssrLoadModule('/app/bathroom.ts');
after(()=>vite.close());
test('finished bathroom clear space and divider butt lengths close exactly',()=>{
 const b=bathroomModel(defaultSettings());
 assert.equal(b.rightFinish-b.leftFinish,1500);assert.equal(b.frontFinish-b.rearFinish,800);
 assert.equal(b.frontLength,1600);assert.equal(b.sideLength,825);
 assert.equal(b.packing+2*b.timberThickness,b.floorPir);
 assert.equal(b.soleTop+b.studCut+b.timberThickness,b.top);
});
test('floor PIR panels and timber supports cover slab infill without panel overlaps',()=>{
 const s=defaultSettings(),b=bathroomModel(s);
 for(const [i,p] of b.panels.entries()){
 assert.ok(p.w>0&&p.w<=2400&&p.h>0&&p.h<=1200);
 for(const q of b.panels.slice(i+1))assert.ok(Math.min(p.x+p.w,q.x+q.w)<=Math.max(p.x,q.x)||Math.min(p.y+p.h,q.y+q.h)<=Math.max(p.y,q.y));
 }
 const area=b.panels.reduce((a,p)=>a+p.w*p.h,0)+75*b.doorStart+75*(b.frontInner-b.doorEnd)+75*(s.brickInternalLength-b.leftOuter);
 assert.equal(area,s.brickInternalLength*s.brickInternalDepth);
});
test('686 door lining and full-width corner posts fit the short-wall junction',()=>{
 const b=bathroomModel(defaultSettings());
 assert.equal(b.roughWidth,757);assert.equal(b.centreOffset,13);
 assert.equal(b.doorStart-b.rearStud,47);
 assert.ok(b.doorEnd+47<=b.frontOuter);
 assert.equal(b.jambCut+b.soleTop,b.roughHead);
 assert.equal(b.roughHead+47+b.crippleCut,b.plateBottom);
});
