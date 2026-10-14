import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
test('proposed sheets cross both plates, fit stock and use backed seams',async()=>{
 const v=await createServer({configFile:false,server:{middlewareMode:true,hmr:false}});
 try{
 const {sheathingPlan,gableJointAxis}=await v.ssrLoadModule('/app/sheathing.ts');
 const {defaultSettings,buildModel}=await v.ssrLoadModule('/app/framing.ts');
 const plan=sheathingPlan(defaultSettings());
 for(const cfg of plan.configs.filter(c=>c.isSide)){
  const joint=gableJointAxis(cfg),panels=plan.panels.filter(p=>p.wall===cfg.id);
  assert.equal(joint,785.5);
  assert.equal(panels.length,8);
  for(const p of panels){assert.ok(p.w<=1220&&p.h<=2440);if(p.id.includes('U')){assert.ok(p.y<cfg.wallHeight-cfg.plates);assert.ok(p.y+p.h>cfg.wallHeight);}}
  const upper=panels.filter(p=>p.id.includes('U'));
  const members=buildModel(cfg);
  for(const [i,p] of upper.slice(0,-1).entries()){
   const x=(p.x+p.w+upper[i+1].x)/2;
   for(let y=p.y+20;y<cfg.wallHeight;y+=20){
    if(cfg.computedOpenings.some(o=>x>o.x&&x<o.x+o.width&&y>o.sill&&y<o.sill+o.height))continue;
    assert.ok(members.some(m=>m.shape==='rect'&&m.x<=x&&m.x+m.w>=x&&m.y<=y&&m.y+m.h>=y),`${cfg.id} seam ${x} at ${y}`);
   }
   assert.ok(members.some(m=>['gable stud','ridge support stud'].includes(m.type)&&Math.abs(m.x+m.w/2-x)<.01));
  }
 }
 }finally{await v.close();}
});

