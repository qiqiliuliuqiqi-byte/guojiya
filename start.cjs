// 脚本启动器：先加载配置，确认网站已就绪，再打开浏览器。
const config = require('./portable-config');
const {spawn} = require('node:child_process');
const url = `http://127.0.0.1:${config.port}/?t=38`;
const open = () => {
  if (process.env.GJY_NO_OPEN === '1') return;
  const child = process.platform === 'darwin' ? spawn('open',[url]) : process.platform === 'win32' ? spawn('rundll32.exe',['url.dll,FileProtocolHandler',url]) : spawn('xdg-open',[url]);
  child.on('error',()=>console.log('请在浏览器打开：'+url));
};
(async()=>{
  try {
    const r = await fetch(url.split('?')[0]+'api/portable/health',{signal:AbortSignal.timeout(1500)});
    if (r.ok && (await r.json()).app === 'guojiya-portable') { open(); return; }
  } catch {}
  require('./server');
  const timer=setInterval(async()=>{
    try { const r=await fetch(url.split('?')[0]+'api/portable/health',{signal:AbortSignal.timeout(1000)}); if(r.ok || r.status===401){clearInterval(timer);open();} } catch {}
  },300);
  setTimeout(()=>clearInterval(timer),10000).unref();
})();
