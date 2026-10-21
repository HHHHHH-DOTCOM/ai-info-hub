// 站点自检：链接完整性、资源引用、HTML 结构、数据完整性
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadItems } from '../src/store.mjs';
import { CHANNELS } from '../config/topics.mjs';

const DIST = path.join(ROOT, 'dist');
let errors = 0;
let warns = 0;
const err = (m) => { console.log('  ✗ ' + m); errors++; };
const warn = (m) => { console.log('  ! ' + m); warns++; };
const ok = (m) => console.log('  ✓ ' + m);

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

if (!fs.existsSync(DIST)) { console.error('dist/ 不存在'); process.exit(1); }
const files = walk(DIST);
const htmls = files.filter((f) => f.endsWith('.html'));

console.log('\n═══ 站点自检 ═══\n');

// 1. 资源存在
for (const f of htmls) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map((m) => m[1]);
  for (const r of refs) {
    if (/^(https?:|data:|mailto:|javascript:)/.test(r)) continue;
    const target = path.resolve(path.dirname(f), r);
    if (!fs.existsSync(target)) err(`${rel} → 失效引用 ${r}`);
  }
}
ok(`资源引用检查完成（${htmls.length} 个页面）`);

// 2. 必需结构
for (const f of htmls) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  for (const [needle, label] of [
    ['<html lang="zh-CN"', 'html lang'],
    ['<meta name="viewport"', 'viewport'],
    ['class="topbar"', '顶部导航'],
    ['assets/style.css', '样式表'],
    ['assets/app.js', '脚本'],
    ['</html>', '闭合'],
  ]) {
    if (!html.includes(needle)) err(`${rel} 缺少 ${label}`);
  }
  // 标签数大致平衡
  const open = (html.match(/<div\b/g) || []).length;
  const close = (html.match(/<\/div>/g) || []).length;
  if (open !== close) warn(`${rel} div 数量不匹配 ${open}/${close}`);
}
ok('HTML 结构检查完成');

// 3. 12 个频道页齐全
for (const ch of CHANNELS) {
  const p = path.join(DIST, ch.id, 'index.html');
  if (!fs.existsSync(p)) err(`缺少频道页 ${ch.id}`);
  else {
    const html = fs.readFileSync(p, 'utf8');
    if (!html.includes(ch.name)) warn(`${ch.id} 页面不含频道名`);
  }
}
ok('频道页检查完成');

// 4. 数据完整性
const items = loadItems();
if (!items.length) err('items.json 为空');
const badUrl = items.filter((i) => i.url && !/^https?:/i.test(i.url));
if (badUrl.length) warn(`${badUrl.length} 条 URL 异常：${badUrl[0].url}`);
const noChannel = items.filter((i) => !(i.channels || []).length);
if (noChannel.length) warn(`${noChannel.length} 条没有频道归属`);
const dupTitles = new Set(), dups = [];
for (const i of items) {
  const k = i.title.replace(/\s+/g, '');
  if (dupTitles.has(k)) dups.push(k);
  dupTitles.add(k);
}
if (dups.length) warn(`${dups.length} 条重复标题，例如「${dups[0].slice(0, 30)}」`);
ok(`数据检查完成：${items.length} 条`);

// 5. 搜索索引
const home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const m = home.match(/window\.__INDEX__ = (\[[\s\S]*?\]);<\/script>/);
if (!m) err('首页缺少搜索索引');
else {
  try {
    const idx = JSON.parse(m[1]);
    if (idx.length < 10) err(`搜索索引过少：${idx.length}`);
    else ok(`搜索索引 ${idx.length} 条`);
  } catch (e) { err('搜索索引 JSON 解析失败：' + e.message); }
}

console.log(`\n结果：${errors} 个错误，${warns} 个警告\n`);
process.exit(errors ? 1 : 0);
