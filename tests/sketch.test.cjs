const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(process.env.GJY_APP_ROOT || path.resolve(__dirname, '..'), 'js/sketch.js'), 'utf8');
function setup() {
  const frames = [], timers = new Map(), storage = new Map(), calls = [], events = {}, viewportEvents = {};
  let timer = 0, writes = 0;
  const context2d = () => new Proxy({}, { get: (o,k) => o[k] || ((...args) => calls.push([k,...args])), set: (o,k,v) => (o[k]=v,true) });
  function canvas() {
    const events = {}, captured = new Set();
    return { dataset:{}, style:{}, ctx:context2d(), events,
      addEventListener: (name,fn) => (events[name] ||= []).push(fn),
      setPointerCapture: id => captured.add(id), releasePointerCapture:id=>captured.delete(id),
      hasPointerCapture:id=>captured.has(id),
      fire(type, extra={}) { const e = { type, button:0, pointerId:1, isPrimary:true, pointerType:'mouse', timeStamp:100, clientX:10, clientY:10, preventDefault(){}, ...extra }; for(const f of events[type] || []) f(e); }
    };
  }
  const classes = new Set();
  const classList = {toggle(name,value){if(value)classes.add(name);else classes.delete(name);},contains:name=>classes.has(name)};
  const bar={classList:{toggle(){}},querySelectorAll:()=>[]};
  const document = { readyState:'loading', addEventListener(){}, querySelector(){return null},
    getElementById:id=>id==='skBar'?bar:null, body:{classList:{toggle(){}}},
    documentElement:{ scrollHeight:100000 }, hidden:false };
  const sandbox = { document, window:{innerWidth:1200,innerHeight:800,devicePixelRatio:2,scrollX:0,scrollY:0,addEventListener:(name,fn)=>(events[name] ||= []).push(fn),visualViewport:{addEventListener:(name,fn)=>(viewportEvents[name] ||= []).push(fn)}}, location:{hash:'#/practice/test'},
    localStorage:{ getItem:k=>storage.get(k), setItem:(k,v)=>{ writes++;storage.set(k,v); } },
    requestAnimationFrame:fn=>(frames.push(fn),frames.length), setTimeout:fn=>(timers.set(++timer,fn),timer),clearTimeout:id=>timers.delete(id), console };
  vm.createContext(sandbox);
  vm.runInContext(source+'\nglobalThis.skState = SK;',sandbox);
  const sk = sandbox.skState, cv=canvas();
  Object.assign(sk,{on:true,canvas:cv,ctx:cv.ctx,baseCanvas:canvas(),baseCtx:context2d(),key:'sketch_test_0',rough:false,layer:{classList}});
  sandbox.skBindCanvas(cv);sandbox.skResize();
  function flush() { const batch=frames.splice(0);batch.forEach(fn=>fn()); }
  function fire(type,x,y,extra={}){cv.fire(type,{clientX:x,clientY:y,...extra});}
  return { sandbox, sk, cv, calls, frames, storage, timers, fire, flush, events, viewportEvents, classes, writes:()=>writes };
}

test('快速移动的合并采样保留弧线；一帧只绘制一次，松笔补齐终点',()=>{
  const t=setup();t.flush();t.calls.length=0;
  t.fire('pointerdown',10,10);
  t.fire('pointermove',90,10,{getCoalescedEvents:()=>[
    {clientX:30,clientY:50,timeStamp:110,pointerType:'mouse'},
    {clientX:50,clientY:80,timeStamp:120,pointerType:'mouse'},
    {clientX:70,clientY:50,timeStamp:130,pointerType:'mouse'},
    {clientX:90,clientY:10,timeStamp:140,pointerType:'mouse'}],timeStamp:140});
  assert.equal(t.sk.cur.pts.length,5);
  assert.equal(t.calls.length,0,'pointer handlers must not paint');
  assert.equal(t.frames.length,1);
  t.flush();assert.ok(t.calls.some(c=>c[0]==='quadraticCurveTo' && c[2]===80));
  t.fire('pointerup',100,5,{timeStamp:150});t.flush();
  assert.equal(t.sk.strokes[0].pts.length,6);
  assert.deepEqual(Array.from(t.sk.strokes[0].pts.at(-1)).slice(0,2),[100,5]);
  assert.equal(t.sk.cur,null);
});
test('无合并采样 API 时普通鼠标仍能画曲线，并排除第二指针',()=>{
  const t=setup();t.fire('pointerdown',10,10);t.fire('pointermove',20,50);
  t.fire('pointerdown',500,500,{pointerId:2});t.fire('pointermove',600,600,{pointerId:2});t.fire('pointerup',600,600,{pointerId:2});
  assert.equal(t.sk.cur.pts.length,2);t.fire('pointermove',30,10);t.fire('pointerup',30,10);
  assert.equal(t.sk.strokes.length,1);assert.equal(t.sk.strokes[0].pts.length,3);
});
test('捕获指针出边缘不截断，失去捕获或取消不追加错误原点',()=>{
  const t=setup();t.fire('pointerdown',10,10);t.fire('pointermove',20,20);t.fire('pointerleave',30,30);
  assert.ok(t.sk.cur);t.fire('pointermove',40,40);t.fire('lostpointercapture',0,0);
  assert.equal(t.sk.cur,null);assert.equal(t.sk.strokes[0].pts.length,3);
  t.fire('pointerdown',50,50);t.fire('pointercancel',0,0);assert.equal(t.sk.strokes[1].pts.length,1);
});
test('十万像素长文只分配视口画布；滚动坐标与旧笔迹保持一致',()=>{
  const t=setup();assert.equal(t.cv.width,2400);assert.equal(t.cv.height,1600);
  t.sandbox.window.scrollY=9000;t.fire('pointerdown',10,20);t.fire('pointermove',30,40);t.fire('pointerup',30,40);t.flush();
  assert.equal(t.sk.strokes[0].pts[0][1],9020);
  assert.ok(t.calls.some(c=>c[0]==='setTransform' && c[6]===-18000));
  assert.equal(t.sandbox.skVisible(t.sk.strokes[0],0,0,1200,800),false);
});
test('连续采样只重画当前笔迹，已完成笔迹使用缓存',()=>{
  const t=setup();t.fire('pointerdown',10,10);t.fire('pointermove',20,20);t.fire('pointerup',20,20);t.flush();
  const drawn=[];const original=t.sandbox.skDrawStroke;t.sandbox.skDrawStroke=(ctx,st)=>{drawn.push(st);return original(ctx,st);};
  t.fire('pointerdown',30,30);t.fire('pointermove',40,50);t.flush();t.fire('pointermove',50,30);t.flush();
  assert.equal(drawn.length,2);assert.ok(drawn.every(st=>st===t.sk.cur));
});
test('画笔和连续擦除不会逐点写存储；保存格式、整笔擦除和撤销兼容',()=>{
  const t=setup();t.fire('pointerdown',10,10);t.fire('pointermove',20,50);t.fire('pointerup',30,10);t.flush();
  assert.equal(t.writes(),0);t.sandbox.skSave();assert.equal(t.writes(),1);
  const saved=JSON.parse(t.storage.get('sketch_test_0'));
  assert.deepEqual(Object.keys(saved.s[0]).sort(),['c','pts','r','t','w']);
  t.sk.tool='eraser';t.fire('pointerdown',20,50);assert.equal(t.sk.strokes.length,0);t.fire('pointerup',20,50);
  assert.equal(t.writes(),1);t.sandbox.skUndo();assert.equal(t.sk.strokes.length,1);
  assert.equal(t.sk.strokes[0].pts.length,3);
});

test('关闭画笔后已有笔迹仍显示，滚动会重绘并保持文档坐标',()=>{
  const t=setup();t.fire('pointerdown',10,300);t.fire('pointermove',100,300);t.fire('pointerup',100,300);t.flush();
  t.sandbox.skToggle(false);
  assert.equal(t.sk.on,false);assert.equal(t.classes.has('active'),true);assert.equal(t.classes.has('drawing'),false);
  const points=JSON.stringify(t.sk.strokes[0].pts);
  t.sandbox.skInit();t.calls.length=0;t.sandbox.window.scrollY=200;t.events.scroll[0]();t.flush();
  assert.equal(t.sk.viewY,200);
  assert.equal(JSON.stringify(t.sk.strokes[0].pts),points);
  assert.ok(t.calls.some(c=>c[0]==='setTransform'&&c[6]===-400));
  assert.ok(t.calls.some(c=>c[0]==='quadraticCurveTo'||c[0]==='lineTo'));
});
test('单指书写保留；双指手势恢复第一指之前的笔迹，不留下圆点',()=>{
  const t=setup();
  t.fire('pointerdown',10,50,{pointerType:'touch'});t.fire('pointermove',80,70,{pointerType:'touch'});t.fire('pointerup',80,70,{pointerType:'touch'});
  const original=t.sk.strokes[0];assert.equal(t.sk.strokes.length,1);
  t.fire('pointerdown',100,200,{pointerType:'touch'});
  t.fire('pointerdown',200,200,{pointerType:'touch',pointerId:2,isPrimary:false});
  assert.equal(t.sk.strokes.length,1);assert.equal(t.sk.strokes[0],original);assert.equal(t.sk.pointerId,null);
  t.fire('pointermove',100,100,{pointerType:'touch'});t.fire('pointercancel',100,100,{pointerType:'touch'});
  assert.equal(t.sk.strokes.length,1);
});
test('双指滚动不会误擦已有笔迹，也不会产生撤销垃圾记录',()=>{
  const t=setup();t.fire('pointerdown',10,50);t.fire('pointerup',10,50);
  const original=t.sk.strokes[0];t.sk.tool='eraser';
  t.fire('pointerdown',10,50,{pointerType:'touch'});assert.equal(t.sk.strokes.length,0);
  t.fire('pointerdown',100,50,{pointerType:'touch',pointerId:2,isPrimary:false});
  assert.equal(t.sk.strokes.length,1);assert.equal(t.sk.strokes[0],original);assert.equal(t.sk.trash.length,0);
});
test('浏览器原生手势取消触摸时回滚；触控笔取消仍保留已写的一笔',()=>{
  const t=setup();t.fire('pointerdown',10,50,{pointerType:'touch'});t.fire('pointercancel',0,0,{pointerType:'touch'});
  assert.equal(t.sk.strokes.length,0);
  t.fire('pointerdown',10,50,{pointerType:'pen'});t.fire('pointermove',40,80,{pointerType:'pen'});t.fire('pointercancel',0,0,{pointerType:'pen'});
  assert.equal(t.sk.strokes.length,1);assert.equal(t.sk.strokes[0].pts.length,2);
});
test('滚动工具不拦截触摸、不创建笔迹，原有标注保持可见',()=>{
  const t=setup();t.fire('pointerdown',10,50);t.fire('pointerup',10,50);
  t.sandbox.skSetTool('pan');assert.equal(t.classes.has('browsing'),true);
  let blocked=false;t.fire('pointerdown',100,200,{pointerType:'touch',preventDefault(){blocked=true;}});
  t.fire('pointermove',100,100,{pointerType:'touch',preventDefault(){blocked=true;}});
  assert.equal(blocked,false);assert.equal(t.sk.strokes.length,1);assert.equal(t.sk.pointerId,null);
});
test('触摸文字工具单指轻点才新增便签，双指翻页不误建便签',()=>{
  const t=setup();t.sk.tool='text';t.fire('pointerdown',10,50,{pointerType:'touch'});
  assert.equal(t.sk.notes.length,0);t.fire('pointerdown',100,50,{pointerType:'touch',pointerId:2,isPrimary:false});
  assert.equal(t.sk.notes.length,0);
  t.fire('pointerdown',10,50,{pointerType:'touch'});t.fire('pointerup',10,50,{pointerType:'touch'});
  assert.equal(t.sk.notes.length,1);assert.equal(t.sk.notes[0].y,50);
});
test('只读标注在板块切换时加载对应存储，手机视口事件也触发重绘',()=>{
  const t=setup();t.sandbox.skSave();t.sandbox.skInit();t.sk.on=false;
  t.storage.set('sketch_test_reading',JSON.stringify({s:[{t:'pen',c:'#f00',w:3,pts:[[100,500],[200,500]]}],n:[]}));
  t.sandbox.document.querySelector=selector=>selector.includes('.practice-tab')?{dataset:{section:'reading'}}:null;
  t.sandbox.skSyncSection();assert.equal(t.sk.key,'sketch_test_reading');assert.equal(t.sk.strokes.length,1);
  t.flush();t.sandbox.window.scrollY=400;t.viewportEvents.scroll[0]();t.flush();
  assert.equal(t.sk.viewY,400);assert.equal(t.classes.has('active'),true);
});
