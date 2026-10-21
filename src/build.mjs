// 静态站点生成器
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadItems, loadStatus, tsOf, importance, readJson } from './store.mjs';
import { CHANNELS, CHANNEL_MAP } from '../config/topics.mjs';
import { toDateKey, nowKey, hoursAgo, stripHtml, truncate } from './util.mjs';

const OUT = path.join(ROOT, 'dist');
const SITE_NAME = 'AI 情报站';
const SITE_DESC = '每日聚合 AIGC 前沿、剪辑技巧、全球 AI 黑客松、残障大学生升学就业、实习、考公考编、戏影考研、大厂赛事、AI 应用/3D 游戏/影游竞赛';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function rmrf(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    // 预览服务器正在读文件时会 EPERM/EBUSY，逐个删，删不掉的后面直接覆盖
    console.warn('  提示：dist 有文件被占用，改为增量覆盖（' + e.code + '）');
    const walk = (d) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        try {
          if (fs.statSync(p).isDirectory()) { walk(p); fs.rmdirSync(p); }
          else fs.unlinkSync(p);
        } catch { /* 跳过被占用的文件 */ }
      }
    };
    try { walk(dir); } catch { /* 忽略 */ }
  }
}

function write(rel, content) {
  const full = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

/* ------------------------------ 数据准备 ------------------------------ */

function buildIndex(items) {
  return items.slice(0, 4000).map((it) => {
    const ch = it.channels?.[0];
    const meta = ch ? CHANNEL_MAP[ch.id] : null;
    return {
      t: it.title,
      s: truncate(stripHtml(it.summary || ''), 110),
      u: it.url || '#',
      o: it.sourceName || (it.sources || [])[0] || '',
      p: it.publishedAt ? it.publishedAt.slice(0, 10) : '',
      k: meta?.color || '#6ea8fe',
      n: meta?.name || '',
      g: (it.tags || []).join(' '),
    };
  });
}

function daysAgoOf(it) {
  return hoursAgo(it.publishedAt || it.firstSeenAt) / 24;
}

/* ------------------------------ 组件 ------------------------------ */

function layout({ title, desc, body, active = '', base = '', script = '' }) {
  const nav = [
    ['', '首页'],
    ...CHANNELS.map((c) => [c.id + '/', c.short]),
    ['briefing/', '晨报'],
    ['archive/', '归档'],
  ];
  return `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || SITE_DESC)}">
<meta name="theme-color" content="#0b0e14">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc || SITE_DESC)}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛰</text></svg>">
<link rel="stylesheet" href="${base}assets/style.css">
</head>
<body>
<header class="topbar"><div class="topbar-in">
  <a class="logo" href="${base}./"><i class="dot"></i><span class="t">${SITE_NAME}</span></a>
  <nav class="topnav">
    ${nav.map(([href, label]) => `<a href="${base}${href}"${active === href ? ' class="act"' : ''}>${esc(label)}</a>`).join('')}
  </nav>
  <button class="iconbtn" id="themebtn" title="切换主题">☀</button>
</div></header>
<main class="wrap">${body}</main>
<footer>
  <div>${SITE_NAME} · 每天自动更新 · 数据来自各站点公开 RSS / API / 页面</div>
  <div>内容版权归原作者，此处仅作个人学习聚合 · 生成时间 <span data-rel="${new Date().toISOString()}">刚刚</span></div>
</footer>
<script>window.__INDEX__ = ${script || '[]'};</script>
<script src="${base}assets/app.js"></script>
</body>
</html>`;
}

function itemHtml(it, { showChannel = true, now = new Date() } = {}) {
  const ch = it.channels?.[0];
  const meta = ch ? CHANNEL_MAP[ch.id] : null;
  const color = meta?.color || '#6ea8fe';
  const isNew = hoursAgo(it.publishedAt || it.firstSeenAt, now) < 24;
  const dl = it.deadline && new Date(it.deadline).getTime() > now.getTime();
  const isInbox = it.origin === 'wechat-qq';
  const src = it.sourceName || (it.sources || [])[0] || '';
  const schools = it.meta?.schools || [];
  return `<a class="item" href="${esc(it.url || '#')}" target="_blank" rel="noopener" style="--c:${color}">
  <div class="tit"><i class="pdot"></i><span>${esc(it.title)}</span></div>
  ${it.summary ? `<div class="sm">${esc(truncate(stripHtml(it.summary), 130))}</div>` : ''}
  <div class="mt">
    ${showChannel && meta ? `<span class="cbadge" style="--c:${color}">${esc(meta.name)}</span>` : ''}
    ${isInbox ? '<span class="cbadge" style="--c:#4ade80">微信/QQ</span>' : ''}
    ${src ? `<span class="src">${esc(src)}</span>` : ''}
    ${schools.length ? `<span class="src">${esc(schools.join(' / '))}</span>` : ''}
    ${isNew ? '<span class="new">NEW</span>' : ''}
    ${it.publishedAt ? `<span>${esc(it.publishedAt.slice(0, 10))}</span>` : ''}
    ${dl ? `<span class="dl" data-dl="${esc(it.deadline)}">报名中</span>` : ''}
    ${(it.sources?.length || 0) > 1 ? `<span>${it.sources.length} 源</span>` : ''}
  </div>
</a>`;
}

/* ------------------------------ 页面 ------------------------------ */

function pageHome(items, status) {
  const now = new Date();
  const recent = items.filter((it) => hoursAgo(it.publishedAt || it.firstSeenAt, now) < 24 * 7);
  const byChannel = {};
  for (const it of items) for (const c of it.channels || []) (byChannel[c.id] ||= []).push(it);

  const hot = [...recent].sort((a, b) => importance(b) - importance(a)).slice(0, 30);

  // 今日新增
  const todayKey = nowKey(now);
  const todays = items.filter((it) => toDateKey(it.firstSeenAt) === todayKey);

  // 报名截止（14 天内）
  const closing = items
    .filter((it) => it.deadline && new Date(it.deadline) > now && (new Date(it.deadline) - now) / 864e5 <= 14)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 8);

  const chCards = CHANNELS.map((c) => {
    const list = byChannel[c.id] || [];
    const fresh = list.filter((x) => hoursAgo(x.publishedAt || x.firstSeenAt, now) < 72).length;
    return `<a class="chcard" href="./${c.id}/" style="--c:${c.color}">
      <div class="ic">${c.icon}</div>
      <div class="nm">${esc(c.name)}</div>
      <div class="ds">${esc(c.desc)}</div>
      <div class="ct"><span><b>${list.length}</b> 条</span><span>近72h ${fresh}</span></div>
    </a>`;
  }).join('');

  const run = status.lastRun;
  const body = `
<section class="hero">
  <h1>你每天要看的 <em>${CHANNELS.length} 类情报</em><br>已经替你抓好了</h1>
  <p>AIGC 前沿与实操技巧 · 全球 AI 黑客松 · 剪辑技巧 · 残障大学生职业成长与实习 · 考公考编央国企 · 戏影考研 985 · 大厂活动赛事 · AI 应用 / 3D 游戏 / 影游竞赛。每天自动更新，打开即是最新。</p>
  <div class="hero-meta">
    <span class="chip live"><b>●</b> 每日自动同步</span>
    <span class="chip">共 <b>${items.length}</b> 条情报</span>
    <span class="chip">今日新增 <b>${todays.length}</b></span>
    <span class="chip">最近更新 <b data-rel="${run?.at || ''}">—</b></span>
    <span class="chip">信息源 <b>${Object.keys(status.sources || {}).length}</b> 个</span>
  </div>
</section>

<div class="searchbar">
  <span class="si">🔍</span>
  <input id="q" type="search" placeholder="搜索全部情报：模型 / 黑客松 / 剪辑 / 考研 / 实习 / 考公 …" autocomplete="off">
  <button class="sc" onclick="document.getElementById('q').value='';document.getElementById('q').dispatchEvent(new Event('input'))">清除</button>
</div>
<div id="qcount" style="font-size:12.5px;color:var(--fg3);margin-bottom:6px"></div>
<div class="feed" id="qfeed"></div>
<button id="loadmore">加载更多</button>

${closing.length ? `<div class="section-h"><h2>⏰ 即将截止的报名</h2><div class="line"></div></div>
<div class="feed">${closing.map((it) => itemHtml(it)).join('')}</div>` : ''}

<div class="section-h"><h2>12 个频道</h2><div class="line"></div></div>
<div class="chgrid">${chCards}</div>

<div class="section-h"><h2>近 7 天重点</h2><div class="line"></div><a class="more" href="./archive/">全部归档 →</a></div>
<div class="feed">${hot.map((it) => itemHtml(it)).join('')}</div>
`;
  return layout({ title: `${SITE_NAME} · 每日情报聚合`, body, active: '', script: JSON.stringify(buildIndex(items)) });
}

function pageChannel(ch, items) {
  const list = items.filter((it) => (it.channels || []).some((c) => c.id === ch.id));
  const now = new Date();

  // 标签页：全部 / 近3天 / 近7天 / 报名中 / 985 / 戏影
  const last3 = list.filter((x) => hoursAgo(x.publishedAt || x.firstSeenAt, now) < 72);
  const last7 = list.filter((x) => hoursAgo(x.publishedAt || x.firstSeenAt, now) < 168);
  const withDl = list.filter((x) => x.deadline && new Date(x.deadline) > now);
  const s985 = list.filter((x) => (x.tags || []).includes('985'));
  const xiju = list.filter((x) => (x.tags || []).includes('xiju'));

  const tab = (key, label, n) => `<div class="tab${key === 'all' ? ' on' : ''}" data-filter="${key}">${label} ${n}</div>`;
  const strip = `<div class="tabs">
    ${tab('all', '全部', list.length)}
    ${tab('d3', '近 3 天', last3.length)}
    ${tab('d7', '近 7 天', last7.length)}
    ${withDl.length ? tab('dl', '报名中', withDl.length) : ''}
    ${s985.length ? tab('985', '985 院校', s985.length) : ''}
    ${xiju.length ? tab('xiju', '戏影专业', xiju.length) : ''}
  </div>`;

  const tagOf = (it) => {
    const tags = [];
    if (hoursAgo(it.publishedAt || it.firstSeenAt, now) < 72) tags.push('d3');
    if (hoursAgo(it.publishedAt || it.firstSeenAt, now) < 168) tags.push('d7');
    if (it.deadline && new Date(it.deadline) > now) tags.push('dl');
    for (const t of it.tags || []) tags.push(t);
    return tags.join(',');
  };

  // 按天分组
  const groups = new Map();
  for (const it of list) {
    const key = toDateKey(it.publishedAt || it.firstSeenAt) || '未知';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }
  const sortedKeys = [...groups.keys()].filter((k) => /^\d{4}-/.test(k)).sort().reverse().slice(0, 30);

  const feedHtml = sortedKeys.map((k) => {
    const arr = groups.get(k);
    return `<div class="section-h" style="margin:22px 0 8px"><h2 style="font-size:13.5px;color:var(--fg3);font-weight:600">${k}</h2><div class="line"></div><span class="more">${arr.length} 条</span></div>
      <div class="feed">${arr.slice(0, 40).map((it) => `<div data-tags="${tagOf(it)}">${itemHtml(it, { showChannel: false })}</div>`).join('')}</div>`;
  }).join('');

  const body = `
<div class="pagehead">
  <div class="kicker">${ch.icon} 频道</div>
  <h1>${esc(ch.name)}</h1>
  <p>${esc(ch.desc)} · 共 ${list.length} 条 · 近 3 天 ${last3.length} 条</p>
</div>
${strip}
${list.length ? feedHtml : '<div class="empty"><div class="e1">◌</div><div>该频道暂时没有内容，下一次采集会自动补充。</div></div>'}
`;
  return layout({
    title: `${ch.name} · ${SITE_NAME}`,
    desc: ch.desc,
    body,
    active: ch.id + '/',
    base: '../',
    script: JSON.stringify(buildIndex(list.slice(0, 800))),
  });
}

function pageArchive(items, dates) {
  const byDay = new Map();
  for (const it of items) {
    const k = toDateKey(it.publishedAt || it.firstSeenAt) || '未知';
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(it);
  }
  const keys = [...byDay.keys()].sort().reverse();
  const body = `
<div class="pagehead">
  <div class="kicker">ARCHIVE</div>
  <h1>全部归档</h1>
  <p>共 ${items.length} 条情报，按日期倒序。每日快照保存在 <code>data/daily/</code>。</p>
</div>
<div class="tabs" style="margin-bottom:18px">
  ${keys.slice(0, 20).map((k, i) => `<a class="tab${i === 0 ? ' on' : ''}" href="#d-${k}">${k}</a>`).join('')}
</div>
${keys.slice(0, 60).map((k) => {
  const arr = byDay.get(k);
  return `<div id="d-${k}" class="section-h"><h2>${k}</h2><div class="line"></div><span class="more">${arr.length} 条</span></div>
  <div class="feed">${arr.slice(0, 60).map((it) => itemHtml(it)).join('')}</div>`;
}).join('')}
`;
  return layout({ title: `归档 · ${SITE_NAME}`, body, active: 'archive/', base: '../' });
}

function pageBriefing() {
  const briefDir = path.join(ROOT, 'data', 'briefing');
  const files = fs.existsSync(briefDir)
    ? fs.readdirSync(briefDir).filter((f) => f.endsWith('.md')).sort().reverse()
    : [];
  const latest = files[0];
  const md = latest ? fs.readFileSync(path.join(briefDir, latest), 'utf8') : '# 暂无晨报\n\n运行 `npm run daily` 生成。';

  // 极简 Markdown → HTML（标题、列表、引用、粗体、链接）
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg3);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent)">$1</a>');

  const html = md.split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    if (b.startsWith('# ')) return `<h1 style="font-size:22px;margin:16px 0 10px">${inline(b.slice(2))}</h1>`;
    if (b.startsWith('## ')) return `<h2 style="font-size:16px;margin:22px 0 8px">${inline(b.slice(3))}</h2>`;
    if (b.startsWith('> ')) return `<blockquote style="border-left:3px solid var(--accent);padding-left:12px;color:var(--fg2);font-size:13px;margin:10px 0">${inline(b.slice(2))}</blockquote>`;
    if (/^- /m.test(b)) {
      return `<ul style="margin:8px 0 8px 18px;font-size:14px;line-height:1.9">${b
        .split(/\n/)
        .filter((l) => l.trim().startsWith('- '))
        .map((l) => `<li>${inline(l.trim().slice(2))}</li>`)
        .join('')}</ul>`;
    }
    return `<p style="margin:8px 0;color:var(--fg2);font-size:14px">${inline(b)}</p>`;
  }).join('');

  const archive = files.slice(0, 20).map((f) => `<a class="tab${f === latest ? ' on' : ''}" href="./${f.replace('.md', '')}/">${f.replace('.md', '')}</a>`).join('');

  const body = `
<div class="pagehead">
  <div class="kicker">BRIEFING</div>
  <h1>每日晨报</h1>
  <p>每天自动汇总的要点清单，可直接复制转发到微信 / QQ。</p>
</div>
<div class="tabs">${archive}</div>
<div class="card" style="margin-top:14px">${html}</div>
`;
  return layout({ title: `每日晨报 · ${SITE_NAME}`, body, active: 'briefing/', base: '../' });
}

function pageBriefingDay(day, md) {
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg3);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent)">$1</a>');
  const html = md.split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    if (b.startsWith('# ')) return `<h1 style="font-size:22px;margin:16px 0 10px">${inline(b.slice(2))}</h1>`;
    if (b.startsWith('## ')) return `<h2 style="font-size:16px;margin:22px 0 8px">${inline(b.slice(3))}</h2>`;
    if (b.startsWith('> ')) return `<blockquote style="border-left:3px solid var(--accent);padding-left:12px;color:var(--fg2);font-size:13px;margin:10px 0">${inline(b.slice(2))}</blockquote>`;
    if (/^- /m.test(b)) {
      return `<ul style="margin:8px 0 8px 18px;font-size:14px;line-height:1.9">${b.split(/\n/).filter((l) => l.trim().startsWith('- ')).map((l) => `<li>${inline(l.trim().slice(2))}</li>`).join('')}</ul>`;
    }
    return `<p style="margin:8px 0;color:var(--fg2);font-size:14px">${inline(b)}</p>`;
  }).join('');
  const body = `
<div class="pagehead">
  <div class="kicker">BRIEFING</div>
  <h1>${esc(day)} 晨报</h1>
  <p><a href="../" style="color:var(--accent)">← 返回最新晨报</a></p>
</div>
<div class="card" style="margin-top:14px">${html}</div>
`;
  return layout({ title: `${day} 晨报 · ${SITE_NAME}`, body, active: 'briefing/', base: '../../' });
}

/* ------------------------------ 生成 ------------------------------ */

export function build() {
  const items = loadItems();
  const status = loadStatus();
  if (!items.length) {
    console.warn('没有数据，先运行 collect');
  }
  rmrf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  // 静态资源
  write('assets/style.css', fs.readFileSync(path.join(ROOT, 'assets/style.css'), 'utf8'));
  write('assets/app.js', fs.readFileSync(path.join(ROOT, 'assets/app.js'), 'utf8'));

  write('index.html', pageHome(items, status));
  for (const ch of CHANNELS) write(`${ch.id}/index.html`, pageChannel(ch, items));
  write('archive/index.html', pageArchive(items));
  write('briefing/index.html', pageBriefing());

  // 每日晨报单页
  const briefDir = path.join(ROOT, 'data', 'briefing');
  if (fs.existsSync(briefDir)) {
    for (const f of fs.readdirSync(briefDir).filter((x) => x.endsWith('.md'))) {
      const day = f.replace('.md', '');
      write(`briefing/${day}/index.html`, pageBriefingDay(day, fs.readFileSync(path.join(briefDir, f), 'utf8')));
    }
  }

  // 数据接口（供其它工具/小程序读取）
  write('api/latest.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: items.length,
    channels: CHANNELS.map((c) => ({ id: c.id, name: c.name, count: items.filter((i) => (i.channels || []).some((x) => x.id === c.id)).length })),
    items: items.slice(0, 500),
  }, null, 1));

  // 每日快照同时放到站点（永久可访问）
  const dailyDir = path.join(ROOT, 'data', 'daily');
  if (fs.existsSync(dailyDir)) {
    for (const f of fs.readdirSync(dailyDir).filter((x) => x.endsWith('.json'))) {
      write(`api/daily/${f}`, fs.readFileSync(path.join(dailyDir, f), 'utf8'));
    }
  }

  // 站点地图 + robots
  const urls = ['', ...CHANNELS.map((c) => c.id + '/'), 'archive/', 'briefing/'];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>https://example.github.io/${u}</loc><lastmod>${nowKey()}</lastmod></url>`).join('\n')}
</urlset>`);
  write('robots.txt', 'User-agent: *\nAllow: /\n');
  write('.nojekyll', '');

  const total = CHANNELS.reduce((s, c) => s + items.filter((i) => (i.channels || []).some((x) => x.id === c.id)).length, 0);
  console.log(`\n✓ 站点已生成 → dist/`);
  console.log(`  首页 + ${CHANNELS.length} 个频道 + 归档 = ${CHANNELS.length + 2} 个页面`);
  console.log(`  条目 ${items.length} 条（频道归属合计 ${total}）\n`);
  return { pages: CHANNELS.length + 2, items: items.length };
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (direct) build();
