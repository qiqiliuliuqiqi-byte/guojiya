const {test}=require('node:test');
const assert=require('node:assert/strict'), http=require('node:http'), fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const listen=s=>new Promise(r=>s.listen(0,'127.0.0.1',()=>r(s.address().port)));
const close=s=>new Promise(r=>s.close(r));
test('部署版：密码、静态白名单、音频 Range、同源 AI 和模型请求',async()=>{
  let aiRequest;
  const ai=http.createServer(async(req,res)=>{
    assert.equal(req.headers.authorization,'Bearer test-ai-token');
    res.setHeader('Content-Type','application/json');
    if(req.url==='/api/tags')return res.end(JSON.stringify({models:[{name:'qwen3.5:9b-q4_K_M'}]}));
    let body='';for await(const chunk of req)body+=chunk;aiRequest=JSON.parse(body);
    res.end(JSON.stringify({done_reason:'stop',message:{content:JSON.stringify({translations:[{id:'stem',translation:'这是一句测试文本。'}],evidenceId:-1,evidenceTranslation:'',explanation:'',options:[],takeaway:'',caution:''})}}));
  });
  const aiPort=await listen(ai), reservation=http.createServer();
  const port=await listen(reservation);await close(reservation);
  const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),HOST:'127.0.0.1',PUBLIC_ORIGIN:'https://exam.example.invalid',ACCESS_USER:'test',ACCESS_PASSWORD:'test-password-only-36',AI_BASE_URL:`http://127.0.0.1:${aiPort}`,AI_TOKEN:'test-ai-token'}});
  const auth='Basic '+Buffer.from('test:test-password-only-36').toString('base64');
  const base=`http://127.0.0.1:${port}`;
  try {
    await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('server startup timeout')),5000);child.once('error',reject);child.stdout.once('data',()=>{clearTimeout(t);resolve();});});
    const req=(p,opts={})=>fetch(base+p,{...opts,headers:{Authorization:auth,...opts.headers}});
    assert.equal((await fetch(base+'/')).status,401);
    assert.equal((await req('/')).status,200);
    for(const p of ['/config.env','/server.js','/tutor-server.js','/runtime/node.exe','/.env','/data/%2e%2e%2fserver.js','/js/%00'])assert.ok([400,404].includes((await req(p)).status),p);
    assert.equal((await req('/api/portable/health')).status,200);
    const manifest=await (await req('/manifest.webmanifest')).json();assert.equal(manifest.display,'standalone');
    assert.equal((await req('/'+manifest.icons[0].src)).status,200);
    const audio=fs.readdirSync(root+'/data/cet6-audio').find(f=>/\.mp3$/.test(f));assert.ok(audio);
    let r=await req('/data/cet6-audio/'+audio,{headers:{Range:'bytes=0-99'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,100);
    r=await req('/data/cet6-audio/'+audio,{headers:{Range:'bytes=999999999999-3'}});assert.equal(r.status,416);
    assert.equal((await (await req('/api/tutor/status')).json()).available,true);
    const input={mode:'translate',source:'A test sentence.',stem:'A test sentence.',options:[]};
    const opts={method:'POST',headers:{'Content-Type':'application/json',Origin:'https://wrong.example'},body:JSON.stringify(input)};
    assert.equal((await req('/api/tutor/explain',opts)).status,403);
    opts.headers.Origin='https://exam.example.invalid';
    r=await req('/api/tutor/explain',opts);assert.equal(r.status,200);assert.equal((await r.json()).translations[0].translation,'这是一句测试文本。');
    assert.equal(aiRequest.model,'qwen3.5:9b-q4_K_M');assert.ok(aiRequest.format.properties.translations);assert.equal(aiRequest.think,false);
  } finally {child.kill();await new Promise(r=>child.once('exit',r));await close(ai);}
});
test('客户端不包含密钥、全部资源使用 v39、手机入口不替换原界面',()=>{
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.equal((html.match(/\?v=39/g)||[]).length,9);assert.match(html,/manifest.webmanifest/);
  for(const file of fs.readdirSync(root+'/js')){const text=fs.readFileSync(root+'/js/'+file,'utf8');assert.ok(!text.includes('test-ai-token'));assert.ok(!text.includes('AI_TOKEN='));}
});
