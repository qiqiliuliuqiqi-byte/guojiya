const assert = require('node:assert/strict');
const {Readable} = require('node:stream');
const {EventEmitter} = require('node:events');
const tutor = require('../tutor-server');
const input = {mode:'explain',source:'This is a complete original sentence.',stem:'Which sentence?',options:[{label:'A',text:'A complete option'}],answer:'A',chosen:'B',question:'为什么不能选择 B？'};
const answer = {translations:[],evidenceId:0,evidenceTranslation:'这是一个完整的原句。',explanation:'原文对应 A。',options:[{label:'A',reason:'同义替换'}],takeaway:'核对原文',caution:''};
function request(body=input, headers={}) {
 const buffer=Buffer.from(typeof body==='string'?body:JSON.stringify(body));
 // Deliberately split UTF-8 bytes to exercise streaming body decoding.
 const r=Readable.from(Array.from(buffer, byte=>Buffer.from([byte])));
 r.method='POST'; r.headers={'content-type':'application/json',origin:'http://127.0.0.1:8888',...headers}; return r;
}
function response() {
 const r=new EventEmitter();r.destroyed=false;r.writableEnded=false;
 r.writeHead=(code)=>{r.status=code;};r.end=s=>{r.body=JSON.parse(s);r.writableEnded=true;};return r;
}
(async()=>{
 let captured;
 global.fetch=async(url, options)=>{assert.equal(url,'http://127.0.0.1:11434/api/chat');captured=JSON.parse(options.body);return {ok:true,json:async()=>({message:{content:JSON.stringify(answer)},done_reason:'stop'})};};
 let res=response();assert.equal(await tutor.handle(request(),res,'/api/tutor/explain'),true);assert.equal(res.status,200);assert.equal(res.body.evidence.quote,input.source);
 assert.equal(JSON.parse(captured.messages[1].content).question,input.question);
 res=response();await tutor.handle(request('{bad'),res,'/api/tutor/explain');assert.equal(res.status,400);
 res=response();await tutor.handle(request(input,{origin:'https://external.example'}),res,'/api/tutor/explain');assert.equal(res.status,403);
 res=response();await tutor.handle(request({...input,source:''}),res,'/api/tutor/explain');assert.equal(res.status,400);
 res=response();await tutor.handle(request('x'.repeat(180001)),res,'/api/tutor/explain');assert.equal(res.status,400);
 let started;
 const ready=new Promise(resolve=>started=resolve);
 global.fetch=async(url,options)=>{started();return await new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('abort'),{name:'AbortError'})),{once:true}));};
 const first=response();const pending=tutor.handle(request(),first,'/api/tutor/explain');await ready;
 res=response();await tutor.handle(request(),res,'/api/tutor/explain');assert.equal(res.status,429);
 first.destroyed=true;first.emit('close');await pending;
 global.fetch=async()=>{throw new Error('offline');};
 res=response();await tutor.handle(request(),res,'/api/tutor/explain');assert.equal(res.status,503);
 const status=request();status.method='GET';res=response();await tutor.handle(status,res,'/api/tutor/status');assert.equal(res.body.available,false);assert.equal(res.body.busy,false);
 const prepared=tutor.groundInput({...input,mode:'translate',focus:input.source,sourceTranslation:'这是一个完整的原句。'});
 const grounded=tutor.groundOutput({evidenceId:0,evidenceTranslation:input.source,translations:[{id:'focus-0',translation:'这是一个完整的原句。'},{id:'made-up',translation:'假造的译句'}]},prepared);
 assert.equal(grounded.evidence.quote,input.source);assert.equal(grounded.evidence.translation,'这是一个完整的原句。');assert.equal(grounded.explanation,'');assert.equal(grounded.options.length,0);assert.equal(grounded.translations.length,1);assert.equal(grounded.translations[0].text,input.source);
 console.log('Tutor API: UTF-8, success, invalid body, origin, size, concurrency, cancellation, offline — passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
