// 采集主程序
import fs from 'node:fs';
import path from 'node:path';
import { fetchText, pool, summarize, truncate, parseDate, normalizeUrl, nowKey } from './util.mjs';
import { parseFeed, parseHtmlList, parseDevpost, parseDataFountain, parseGcores } from './parse.mjs';
import { parseWoff, demap } from './fontmap.mjs';
import { SOURCES, CONCURRENCY, MAX_PER_SOURCE } from '../config/sources.mjs';
import { classifyV2 } from '../config/rules.mjs';
import { tagSchools } from '../config/schools.mjs';
import {
  ensureDirs, loadItems, saveItems, mergeItems, loadStatus, saveStatus,
  writeDailySnapshot, tsOf, INBOX_DIR,
} from './store.mjs';

const argv = process.argv.slice(2);
const ONLY = argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
const QUIET = argv.includes('--quiet');
const log = (...a) => { if (!QUIET) console.log(...a); };

/* ------------------------------ 采集 ------------------------------ */

const UNSAFE = /[\uE000-\uF8FF]/;

/** 抓取并缓存字体反混淆映射（只有需要时才抓） */
const fontCache = new Map();
async function getFontMap(src, html) {
  if (!src.font) return null;
  if (fontCache.has(src.id)) return fontCache.get(src.id);
  const m = String(html).match(/url\((['"]?)([^)'"]*iconfonts\/file[^)'"]*)\1\)/);
  if (!m) { fontCache.set(src.id, null); return null; }
  let u = m[2];
  if (u.startsWith('/')) u = new URL(u, src.url).toString();
  try {
    const res = await fetch(u, {
      headers: { 'user-agent': 'Mozilla/5.0', referer: src.url },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const map = parseWoff(buf);
    console.log(`    ↳ 字体映射 ${src.name}: ${map.size} 个字`);
    fontCache.set(src.id, map);
    return map;
  } catch {
    fontCache.set(src.id, null);
    return null;
  }
}

const BAD_HEAD = /^(更多|查看|返回|首页|上一页|下一页|登录|注册|English|APP下载|官方|关于|联系|网站地图|XML|RSS|订阅|分享|评论|点赞|收藏|广告|推广)/i;

/** 标题有效性：过滤图标字体残留、纯符号、导航词 */
function isGoodTitle(title) {
  if (!title) return false;
  const t = String(title).trim();
  if (t.length < 4) return false;
  if (BAD_HEAD.test(t)) return false;
  if (/&#x?[0-9a-f]+;/i.test(t)) return false;      // 未解干净的实体（图标字体）
  if (t.includes('&#')) return false;
  const cjk = (t.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latin = (t.match(/[A-Za-z]/g) || []).length;
  // 至少 2 个汉字，或 6 个以上英文字母
  if (cjk < 2 && latin < 6) return false;
  // 汉字占比过低（混着大量符号）
  const meaningful = cjk + latin;
  if (meaningful / t.length < 0.35) return false;
  return true;
}

async function collectSource(src) {
  const started = Date.now();
  const res = await fetchText(src.url, { timeout: src.timeout || 20000, retry: 1 });
  let raw = [];
  if (src.type === 'rss') raw = parseFeed(res.text, src.url);
  else if (src.type === 'html') {
    // 有字体混淆的站点，先拿映射表再解析
    const fmap = src.font ? await getFontMap(src, res.text) : null;
    raw = parseHtmlList(res.text, src.url, {
      include: src.include,
      exclude: src.exclude || /\.(css|js|png|jpg|jpeg|gif|zip|rar|pdf|docx?|xlsx?)$/i,
      minLen: src.minLen || 8,
      maxLen: 120,
      demap: fmap,
    });
  } else if (src.type === 'devpost') raw = parseDevpost(JSON.parse(res.text));
  else if (src.type === 'datafountain') raw = parseDataFountain(res.text, src.url);
  else if (src.type === 'gcores') raw = parseGcores(JSON.parse(res.text), src.url);

  raw = raw.filter((r) => isGoodTitle(r.title));
  return { raw: raw.slice(0, MAX_PER_SOURCE), ms: Date.now() - started, status: res.status };
}

function classify(rawItem, src) {
  const channels = classifyV2(
    rawItem.title,
    src.id,
    rawItem.summary || '',
    (rawItem.categories || []).join(' ')
  );
  // 兜底：垂直源没有强命中时，归入该源默认频道
  const final = channels.length ? channels : (src.hint ? [{ id: src.hint, score: 1, strong: false }] : []);
  const { tags, schools } = tagSchools(rawItem.title + ' ' + (rawItem.summary || ''));
  return {
    ...rawItem,
    channels: final,
    tags,
    meta: { ...(rawItem.meta || {}), schools: schools.slice(0, 3) },
    sourceId: src.id,
    sourceName: src.name,
    origin: 'web',
  };
}

/* --------------------- 微信 / QQ 导出目录 --------------------- */

function readInbox() {
  const out = [];
  if (!fs.existsSync(INBOX_DIR)) return out;
  const files = fs.readdirSync(INBOX_DIR).filter((f) => /\.(txt|md|json|csv)$/i.test(f));

  for (const f of files) {
    const full = path.join(INBOX_DIR, f);
    if (fs.statSync(full).size > 8 * 1024 * 1024) continue;
    const text = fs.readFileSync(full, 'utf8');
    const base = path.parse(f).name;

    if (f.toLowerCase().endsWith('.json')) {
      let data;
      try { data = JSON.parse(text); } catch { continue; }
      const list = Array.isArray(data) ? data : data.items || [];
      const dflt = data.source || base;
      for (const d of list) {
        const title = String(d.title || d.content || d.text || '').trim();
        if (!title) continue;
        out.push({
          title: truncate(title.split('\n')[0], 120),
          summary: summarize(d.summary || d.content || d.text || '', 160),
          url: d.url || '',
          publishedAt: parseDate(d.date || d.time || d.publishedAt),
          sourceName: String(d.source || dflt),
          categories: [],
        });
      }
      continue;
    }

    const lines = text.split(/\r?\n/);
    let curDate = null;
    let curSource = base;
    for (const line0 of lines) {
      const line = line0.trim();
      if (!line) continue;
      const head = line.match(/^[#*\-\s]*【?(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2})】?/);
      if (head && line.length < 40) { curDate = parseDate(head[1]); continue; }
      const srcHead = line.match(/^[#*\s]*(?:公众号|群聊|群|来源|频道)[:：]\s*(.{1,30})$/);
      if (srcHead) { curSource = srcHead[1].trim(); continue; }
      if (/^#{1,6}\s/.test(line)) continue;

      let body = line.replace(/^[-*+•·]\s*/, '').replace(/^\d+[.)]\s*/, '');
      if (body.length < 6) continue;

      let date = curDate;
      let source = curSource;
      let url = '';
      const m1 = body.match(/^\[?(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2})?)\]?\s*/);
      if (m1) { date = parseDate(m1[1]) || date; body = body.slice(m1[0].length); }
      const m2 = body.match(/^([\u4e00-\u9fa5A-Za-z0-9·\-_（）()]{1,20})[:：]\s+/);
      if (m2 && !/^https?/.test(m2[1])) { source = m2[1]; body = body.slice(m2[0].length); }
      const m3 = body.match(/(https?:\/\/\S+)\s*$/);
      if (m3) { url = m3[1]; body = body.slice(0, m3.index).trim(); }
      if (body.length < 6) continue;

      out.push({
        title: truncate(body, 110),
        summary: summarize(body, 160),
        url: url ? normalizeUrl(url) : '',
        publishedAt: date,
        sourceName: source,
        categories: [],
      });
    }
  }
  return out;
}

/* ------------------------------ 主流程 ------------------------------ */

async function main() {
  ensureDirs();
  const startedAt = new Date();
  const t0 = Date.now();

  let sources = SOURCES;
  if (ONLY?.length) sources = SOURCES.filter((s) => ONLY.includes(s.id));

  log(`\n═══ AI 情报聚合 · ${nowKey()} ═══`);
  log(`信息源 ${sources.length} 个 · 并发 ${CONCURRENCY}\n`);

  const status = loadStatus();
  status.sources ||= {};

  const tasks = sources.map((src) => async () => {
    try {
      const r = await collectSource(src);
      const items = r.raw.map((it) => classify(it, src)).filter((i) => i.channels.length);
      return { src, items, ms: r.ms, total: r.raw.length, error: null };
    } catch (e) {
      return { src, items: [], ms: 0, total: 0, error: e.message };
    }
  });

  const results = await pool(tasks, CONCURRENCY, (r) => {
    if (!r) return;
    const name = r.src.name.padEnd(24);
    if (r.error) log(`  ✗ ${name} ${String(r.error).slice(0, 50)}`);
    else log(`  ✓ ${name} ${String(r.total).padStart(3)} → ${String(r.items.length).padStart(3)} 命中  (${r.ms}ms)`);
  });

  const fresh = [];
  for (const r of results) {
    if (!r) continue;
    if (r.error) {
      status.sources[r.src.id] = { name: r.src.name, error: r.error, ok: false, at: new Date().toISOString() };
      continue;
    }
    fresh.push(...r.items);
    status.sources[r.src.id] = { name: r.src.name, count: r.items.length, total: r.total, ms: r.ms, ok: true, at: new Date().toISOString() };
  }

  const inbox = readInbox();
  const inboxItems = inbox
    .map((it) => {
      const channels = classifyV2(it.title, 'inbox', it.summary, (it.categories || []).join(' '));
      const { tags, schools } = tagSchools(it.title + ' ' + (it.summary || ''));
      return { ...it, channels, tags, meta: { schools: schools.slice(0, 3) } };
    })
    .filter((i) => i.channels.length)
    .map((it) => ({ ...it, sourceId: 'inbox', origin: 'wechat-qq' }));
  if (inbox.length) log(`\n  ✓ 微信/QQ 导入 ${inbox.length} 条 → 命中 ${inboxItems.length} 条`);
  fresh.push(...inboxItems);

  const old = loadItems();
  const { items, added } = mergeItems(old, fresh, { keepDays: 120 });
  saveItems(items);
  writeDailySnapshot(items);

  status.lastRun = {
    at: startedAt.toISOString(), sources: sources.length, fetched: fresh.length,
    added: added.length, total: items.length, ms: Date.now() - t0,
  };
  status.runs = [...(status.runs || []).slice(-29), status.lastRun];
  saveStatus(status);

  const byChannel = {};
  for (const it of items) for (const c of it.channels || []) (byChannel[c.id] ||= []).push(it);

  log(`\n${'─'.repeat(62)}`);
  log(`新增 ${added.length} 条 · 库内 ${items.length} 条 · 耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  for (const [id, list] of Object.entries(byChannel).sort((a, b) => b[1].length - a[1].length)) {
    const recent = list.filter((x) => Date.now() - tsOf(x) < 72 * 3600e3).length;
    log(`  ${id.padEnd(20)} ${String(list.length).padStart(4)} 条 (近72h ${String(recent).padStart(3)})`);
  }
  log('');
}

main().catch((e) => { console.error('采集失败:', e); process.exit(1); });
