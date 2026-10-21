// 每日流程：采集 → 构建站点 → 生成晨报 → 本地提醒
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, loadItems, loadStatus, tsOf, importance, writeJson, DATA_DIR } from './store.mjs';
import { CHANNELS, CHANNEL_MAP } from '../config/topics.mjs';
import { hoursAgo, nowKey, toDateKey, stripHtml, truncate } from './util.mjs';

function run(file, args = []) {
  return new Promise((resolve, reject) => {
    // 用 spawn 直接跑 node（process.execPath 在某些 Electron 运行时下不可靠）
    const p = spawn(process.execPath, [path.join(ROOT, file), ...args], {
      stdio: 'inherit',
      cwd: ROOT,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${file} 退出码 ${code}`))));
    p.on('error', reject);
  });
}

/** 生成晨报（Markdown） */
export function buildBriefing(items, dateKey = nowKey()) {
  const now = new Date();
  const dayItems = items.filter((it) => {
    const k = toDateKey(it.firstSeenAt);
    return k === dateKey || (hoursAgo(it.publishedAt || it.firstSeenAt, now) < 24);
  });

  const lines = [];
  lines.push(`# 每日情报晨报 · ${dateKey}`);
  lines.push('');
  lines.push(`> 共 ${dayItems.length} 条更新，覆盖 ${CHANNELS.length} 类关注点。生成于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  lines.push('');

  // 报名/截止提醒放最前
  const closing = items
    .filter((it) => it.deadline && new Date(it.deadline) > now && (new Date(it.deadline) - now) / 864e5 <= 14)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  if (closing.length) {
    lines.push('## ⏰ 即将截止');
    lines.push('');
    for (const it of closing.slice(0, 10)) {
      const days = Math.ceil((new Date(it.deadline) - now) / 864e5);
      lines.push(`- **${days} 天后截止** · [${it.title}](${it.url || '#'}) — ${it.sourceName || ''}`);
    }
    lines.push('');
  }

  for (const ch of CHANNELS) {
    const list = dayItems
      .filter((it) => (it.channels || []).some((c) => c.id === ch.id))
      .sort((a, b) => importance(b, now) - importance(a, now))
      .slice(0, 8);
    if (!list.length) continue;
    lines.push(`## ${ch.icon} ${ch.name}`);
    lines.push('');
    for (const it of list) {
      const sm = truncate(stripHtml(it.summary || ''), 90);
      lines.push(`- [${it.title}](${it.url || '#'})${sm ? ' — ' + sm : ''}  \`${it.sourceName || ''}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** 今日速览表（放 TODAY.md 顶部，一眼看全 12 类） */
function buildSummaryTable(items, dateKey) {
  const now = new Date();
  const fresh = items.filter((it) => hoursAgo(it.publishedAt || it.firstSeenAt, now) < 48);
  const rows = [];
  for (const ch of CHANNELS) {
    const list = fresh.filter((it) => (it.channels || []).some((c) => c.id === ch.id));
    if (!list.length) {
      rows.push(`| ${ch.icon} ${ch.name} | 0 | — |`);
      continue;
    }
    const top = list.sort((a, b) => importance(b, now) - importance(a, now))[0];
    const link = top.url ? `[${truncate(top.title, 42)}](${top.url})` : truncate(top.title, 42);
    rows.push(`| ${ch.icon} ${ch.name} | ${list.length} | ${link} |`);
  }

  const closing = items
    .filter((it) => it.deadline && new Date(it.deadline) > now && (new Date(it.deadline) - now) / 864e5 <= 14)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  return [
    `# 今日速览 · ${dateKey}`,
    '',
    `> 自动更新于 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} · 近 48 小时共 ${fresh.length} 条`,
    '',
    '| 频道 | 条目 | 最值得看的一条 |',
    '|---|---|---|',
    ...rows,
    '',
    closing.length
      ? '**⏰ 两周内截止：**' + closing.map((c) => ` ${Math.ceil((new Date(c.deadline) - now) / 864e5)} 天后「${truncate(c.title, 24)}」`).join('；')
      : '',
    '',
    `本地站点：http://127.0.0.1:5180 ｜ 完整晨报见下方`,
  ].join('\n');
}

/** Windows 本地提醒：优先用 PowerShell 弹窗 + 通知 */
function notify(title, message) {
  if (process.platform !== 'win32') return;
  const ps = `
$ErrorActionPreference='SilentlyContinue'
try {
  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType=WindowsRuntime] > $null
  $t = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
  $n = $t.GetElementsByTagName('text')
  $n.Item(0).AppendChild($t.CreateTextNode(${JSON.stringify(title)})) > $null
  $n.Item(1).AppendChild($t.CreateTextNode(${JSON.stringify(message)})) > $null
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('AI 情报站').Show([Windows.UI.Notifications.ToastNotification]::new($t))
} catch {}
`;
  const p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { stdio: 'ignore', detached: true });
  p.unref();
}

async function main() {
  const t0 = Date.now();
  await run('src/collect.mjs', []);
  await run('src/build.mjs', []);

  const items = loadItems();
  const status = loadStatus();
  const dateKey = nowKey();
  const brief = buildBriefing(items, dateKey);

  const outDir = path.join(DATA_DIR, 'briefing');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${dateKey}.md`), brief, 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'briefing-latest.md'), brief, 'utf8');

  // DSH / 本地一眼可见的今日速览
  const summaryTop = buildSummaryTable(items, dateKey);
  fs.writeFileSync(path.join(ROOT, 'TODAY.md'), summaryTop + '\n\n---\n\n' + brief, 'utf8');

  // 供站点读取的最新简报
  const distDir = path.join(ROOT, 'dist', 'api');
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'briefing.md'), brief, 'utf8');

  const added = status.lastRun?.added || 0;
  notify('AI 情报站已更新', `${dateKey}：新增 ${added} 条，库内 ${items.length} 条`);

  console.log(`\n════ 每日流程完成 ════`);
  console.log(`  新增 ${added} 条 · 库内 ${items.length} 条`);
  console.log(`  站点：dist/`);
  console.log(`  晨报：data/briefing/${dateKey}.md`);
  console.log(`  耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (direct) main().catch((e) => { console.error(e); process.exit(1); });
