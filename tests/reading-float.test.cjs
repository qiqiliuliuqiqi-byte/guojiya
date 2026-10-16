const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({document:{readyState:'loading',addEventListener(){}}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/reading-float.js'),'utf8')+'\nglobalThis.api=ReadingFloat;',ctx);
test('悬浮框不能拖到屏幕边缘或导航条外导致无法找回',()=>{
  const view={width:820,height:1180,top:72};
  const p=ctx.api.constrain(-1000,-1000,600,300,view);assert.equal(p.x,8);assert.equal(p.y,72);
  const q=ctx.api.constrain(9999,9999,600,300,view);assert.equal(q.x,212);assert.equal(q.y,872);
});
test('手机横屏高度不足时，拖动把手仍留在可访问区域',()=>{
  const p=ctx.api.constrain(800,900,374,500,{width:390,height:300,top:72});
  assert.equal(p.x,8);assert.equal(p.y,72);
});
test('坏掉的存储位置不接受字符串、非有限数或负宽度',()=>{
  for(const p of [null,{}, {x:'1',y:2,width:300},{x:Infinity,y:2,width:300},{x:1,y:NaN,width:300},{x:1,y:2,width:-1}])assert.ok(!ctx.api.validPosition(p));
  assert.equal(ctx.api.validPosition({x:1,y:2,width:300}),true);
});
