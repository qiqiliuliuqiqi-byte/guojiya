// Static file server with HTTP Range support (needed for audio seek)
const http = require("http");
const fs = require("fs");
const path = require("path");

const config = require('./portable-config');
const ROOT = __dirname;
const PORT = config.port;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
};

// 词典代理：浏览器直连有道 JSON 接口会被跨域拦截，改由本地服务转发
const YD_CACHE = new Map();
function handleDict(res, q) {
  const key = String(q || "").toLowerCase().trim();
  const send = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
    res.end(JSON.stringify(obj));
  };
  if (!key) return send(400, { error: "empty query" });
  if (YD_CACHE.has(key)) return send(200, YD_CACHE.get(key));
  const target = "https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&le=en&q=" + encodeURIComponent(key);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  fetch(target, {
    signal: controller.signal,
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", Accept: "application/json" },
  })
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      const raw = d && d.ec && d.ec.word;
      const w = raw ? (Array.isArray(raw) ? raw[0] : raw) : null;
      const out = {
        word: key,
        ukphone: (w && w.ukphone) || "",
        usphone: (w && w.usphone) || "",
        trs: w && Array.isArray(w.trs) ? w.trs.map(t => [t.pos, t.tran].filter(Boolean).join(" ")).join("；") : "",
      };
      if (!out.trs && !out.ukphone && !out.usphone) throw new Error("empty dict result");
      YD_CACHE.set(key, out);
      send(200, out);
    })
    .catch(() => send(502, { word: key, error: "dict unavailable" }))
    .finally(() => clearTimeout(timer));
}

const tutor = require("./tutor-server");
tutor.startLocal().catch(error => console.error("AI 服务：" + error.message));
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!config.authorize(req, res)) return;

  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split("?")[0]); } catch { res.writeHead(400); res.end(); return; }
  if (urlPath === '/api/portable/health') {
    res.writeHead(200, {'Content-Type':'application/json','Cache-Control':'no-store'});
    res.end(JSON.stringify({app:'guojiya-portable',version:37})); return;
  }
  if (await tutor.handle(req, res, urlPath)) return;
  if (urlPath === "/api/yd") {
    const qs = new URLSearchParams(req.url.split("?")[1] || "");
    handleDict(res, qs.get("q"));
    return;
  }
  // 只公开网页资源，配置、启动脚本、模型及服务端源码都不能经 HTTP 下载。
  const publicPath = urlPath === '/' ? '/index.html' : urlPath;
  const allowed = ['/index.html','/manifest.webmanifest'].includes(publicPath) || /^\/(css|js|data|icons)\//.test(publicPath);
  if (!allowed || publicPath.includes('\\') || publicPath.includes('\0') || publicPath.split('/').some(p => p.startsWith('.'))) {
    res.writeHead(404); res.end('404 Not Found'); return;
  }
  let filePath = path.join(ROOT, publicPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }
  if (!fs.realpathSync(filePath).startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
  const stat = fs.statSync(filePath);
  const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const m = range.match(/^bytes=(\d*)-(\d*)$/);
    let start = m && m[1] ? Number(m[1]) : 0;
    let end = m && m[2] ? Number(m[2]) : stat.size - 1;
    if (m && !m[1] && m[2]) { start = Math.max(0, stat.size - Number(m[2])); end = stat.size - 1; }
    end = Math.min(end, stat.size - 1);
    if (!m || (!m[1] && !m[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
      res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); res.end(); return;
    }
    res.writeHead(206, {
      "Content-Type": type,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `端口 ${PORT} 已被占用；请关闭原服务，或在 config.env 中修改 PORT。` : error.message);
  process.exitCode = 1;
});
server.listen(PORT, config.host, () => console.log(`过级鸭便携版 v37 已启动：http://127.0.0.1:${PORT}/?t=37\n关闭此终端将停止网站。`));
