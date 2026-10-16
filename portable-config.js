const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
// Node 自带 env 文件解析器；进程环境变量优先于文件。
const file = path.join(__dirname, 'config.env');
if (fs.existsSync(file)) process.loadEnvFile(file);
const port = Number(process.env.PORT || 8888);
const host = process.env.HOST || '127.0.0.1';
const publicOrigin = process.env.PUBLIC_ORIGIN || '';
const user = process.env.ACCESS_USER || 'student';
const password = process.env.ACCESS_PASSWORD || '';
const aiBase = (process.env.AI_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须为 1 至 65535 的整数。');
if (!['http:','https:'].includes(new URL(aiBase).protocol)) throw new Error('AI_BASE_URL 必须为 HTTP(S) 地址。');
if (publicOrigin && (new URL(publicOrigin).origin !== publicOrigin || !publicOrigin.startsWith('https://'))) throw new Error('PUBLIC_ORIGIN 请填写 HTTPS 域名，不带末尾斜杠。');
if (!['127.0.0.1','localhost','::1'].includes(host) && password.length < 12) throw new Error('网络部署需设置至少 12 位 ACCESS_PASSWORD。');
function authorize(req, res) {
  if (!password) return true;
  const expected = Buffer.from(user + ':' + password);
  let got = Buffer.alloc(0);
  if (req.headers.authorization?.startsWith('Basic ')) got = Buffer.from(req.headers.authorization.slice(6), 'base64');
  if (got.length === expected.length && crypto.timingSafeEqual(got, expected)) return true;
  res.writeHead(401, {'WWW-Authenticate':'Basic realm="GuoJiYa", charset="UTF-8"', 'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'});
  res.end('请输入部署时设置的访问用户名和密码。'); return false;
}
module.exports = {port, host, aiBase, model:process.env.AI_MODEL || 'qwen3.5:9b-q4_K_M', aiToken:process.env.AI_TOKEN || '',
  origins:[`http://127.0.0.1:${port}`,`http://localhost:${port}`,publicOrigin].filter(Boolean), authorize};
