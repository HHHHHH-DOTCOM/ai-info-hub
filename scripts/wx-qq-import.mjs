#!/usr/bin/env node
/**
 * 微信 / QQ 消息导入器
 *
 * 三种用法，任选其一（越靠前越省事）：
 *  1) 手动导出：把每天想看的公众号/群消息复制粘贴成 inbox/日期.txt（见 inbox/示例-格式说明.txt）
 *  2) 剪贴板：运行 `node scripts/wx-qq-import.mjs --clipboard`，把刚复制的消息直接入库
 *  3) 目录监听：把导出的 txt/json 丢进 inbox/，下次采集自动读取
 *
 * 本脚本负责：读取 → 解析 → 分类 → 直接写入 data/items.json（不必等全量采集）
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { INBOX_DIR, ensureDirs, loadItems, saveItems, mergeItems } from '../src/store.mjs';
import { ROOT } from '../src/store.mjs';
import { classifyV2 } from '../config/rules.mjs';
import { tagSchools } from '../config/schools.mjs';
import { parseDate, summarize, truncate, normalizeUrl, nowKey } from '../src/util.mjs';
import { CHANNEL_MAP } from '../config/topics.mjs';

const argv = process.argv.slice(2);
const CLIP = argv.includes('--clipboard');
const FILE = argv.find((a) => a.startsWith('--file='))?.split('=').slice(1).join('=');

/** 读取剪贴板（Windows PowerShell） */
function readClipboard() {
  try {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], {
      encoding: 'utf8', timeout: 8000,
    });
    return out ?? '';
  } catch (e) {
    console.error('读取剪贴板失败：' + e.message);
    return '';
  }
}

/** 解析一段文本为条目（与 collect.mjs 的 readInbox 同规则） */
function parseText(text, sourceLabel = '微信/QQ') {
  const out = [];
  const lines = String(text).split(/\r?\n/);
  let curDate = null;
  let curSource = sourceLabel;

  for (const line0 of lines) {
    const line = line0.trim();
    if (!line) continue;

    // 日期头：【2026-10-21】 或 ## 2026-10-21
    const head = line.match(/^[#*\-\s]*【?(20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2})】?/);
    if (head && line.length < 40) { curDate = parseDate(head[1]); continue; }

    // 来源头：公众号：量子位
    const srcHead = line.match(/^[#*\s]*(?:公众号|群聊|群|来源|频道|服务号)[:：]\s*(.{1,30})$/);
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

    const channels = classifyV2(body, 'inbox', '');
    if (!channels.length) continue; // 不相关内容直接丢

    const { tags, schools } = tagSchools(body);
    out.push({
      title: truncate(body, 110),
      summary: summarize(body, 160),
      url: url ? normalizeUrl(url) : '',
      publishedAt: date,
      channels,
      tags,
      meta: { schools: schools.slice(0, 3) },
      sourceId: 'inbox',
      sourceName: source,
      origin: 'wechat-qq',
    });
  }
  return out;
}

function saveNew(list) {
  const old = loadItems();
  const { items, added } = mergeItems(old, list, { keepDays: 120 });
  saveItems(items);
  return { total: items.length, added: added.length, addedItems: added };
}

/* ------------------------------ 执行 ------------------------------ */

ensureDirs();

let texts = [];

if (CLIP) {
  const t = readClipboard();
  if (!t.trim()) { console.error('剪贴板是空的'); process.exit(1); }
  texts.push({ text: t, label: '剪贴板' });
} else if (FILE) {
  const p = path.isAbsolute(FILE) ? FILE : path.join(ROOT, FILE);
  if (!fs.existsSync(p)) { console.error('文件不存在：' + p); process.exit(1); }
  texts.push({ text: fs.readFileSync(p, 'utf8'), label: path.parse(p).name });
} else {
  console.error(`
用法：
  node scripts/wx-qq-import.mjs --clipboard           # 导入剪贴板内容
  node scripts/wx-qq-import.mjs --file=inbox/x.txt    # 导入指定文件

也可以直接把导出的 txt 放进 inbox/ 目录，下次 npm run daily 会自动读取。
`);
  process.exit(0);
}

let parsed = [];
for (const { text, label } of texts) parsed.push(...parseText(text, label));

if (!parsed.length) {
  console.log('没有识别到可入库的内容。请检查格式，参考 inbox/示例-格式说明.txt');
  process.exit(0);
}

const { total, added, addedItems } = saveNew(parsed);
console.log(`\n解析出 ${parsed.length} 条，新增 ${added} 条，库内共 ${total} 条\n`);
for (const it of addedItems.slice(0, 15)) {
  const chs = (it.channels || []).map((c) => CHANNEL_MAP[c.id]?.short || c.id).join('/');
  console.log(`  [${chs}] ${it.title.slice(0, 50)}  ← ${it.sourceName}`);
}
if (addedItems.length > 15) console.log(`  … 还有 ${addedItems.length - 15} 条`);
console.log('\n提示：运行 npm run build 重新生成站点即可看到。');
