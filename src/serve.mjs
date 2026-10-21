// 本地预览服务器（零依赖）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/store.mjs';

const DIST = path.join(ROOT, 'dist');
const PORT = +(process.env.PORT || 5180);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.xml': 'application/xml',
};

if (!fs.existsSync(DIST)) {
  console.error('dist/ 不存在，请先运行: node src/build.mjs');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  let full = path.join(DIST, p);
  if (!full.startsWith(DIST)) { res.writeHead(403).end('forbidden'); return; }
  if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    const alt = path.join(DIST, p, 'index.html');
    if (fs.existsSync(alt)) full = alt;
    else { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end('<h1>404</h1><p><a href="/">回到首页</a></p>'); return; }
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(full)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(full).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  ▸ 本地预览: http://127.0.0.1:${PORT}\n  按 Ctrl+C 停止\n`);
});
