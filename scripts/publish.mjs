/**
 * 一键发布到 GitHub（第二版：逐个文件走 Contents API，最稳）
 * 不需要安装 git，不需要懂命令行。
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output, env } from 'node:process';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const API = 'https://api.github.com';
const UA = 'ai-info-hub-publisher';
const DEMO = process.argv.includes('--demo');

const rl = readline.createInterface({ input, output });
const ask = (q) => rl.question(q);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const AUTO = !!env.GH_TOKEN || !!env.GITHUB_TOKEN;
const askOr = async (q, fb) => (AUTO ? (console.log(q + fb), fb) : await ask(q));

/* ---------------------------- 要上传的文件 ---------------------------- */
const INCLUDE_DIRS = ['src', 'config', 'assets', 'scripts', '.github', '.vscode'];
const INCLUDE_FILES = ['package.json', 'README.md', '.gitignore'];
const SKIP = [
  /^(tools|data|dist|inbox)\//,
  /^TODAY\.md$/,
  /^我的网站地址\.txt$/,
  /^我要发布网站\.cmd$/,
  /^我要看网站\.cmd$/,
  /^scripts\/(selftest-publish|debug-api|debug-api2|find-git|install-git|download-git|test-hosts)\.mjs$/,
];

function collectFiles() {
  const out = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const rel = path.relative(ROOT, full).replace(/\\/g, '/');
      if (SKIP.some((re) => re.test(rel))) continue;
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (st.size < 900 * 1024) out.push({ rel, full, size: st.size });
    }
  };
  for (const d of INCLUDE_DIRS) { const p = path.join(ROOT, d); if (fs.existsSync(p)) walk(p); }
  for (const f of INCLUDE_FILES) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) out.push({ rel: f, full: p, size: fs.statSync(p).size });
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

/* ------------------------------ API ------------------------------ */
async function api(token, method, urlPath, body) {
  const res = await fetch(API + urlPath, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': UA,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const e = new Error(`${res.status} ${data?.message || text.slice(0, 140)}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

async function apiRetry(token, method, urlPath, body, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await api(token, method, urlPath, body); }
    catch (e) {
      last = e;
      if (e.status && e.status >= 400 && e.status < 500 && e.status !== 429) throw e;
      await sleep(800 * (i + 1));
    }
  }
  throw last;
}

/** 从剪贴板 / 环境变量 / 本地记录 取令牌 */
function readToken() {
  if (env.GH_TOKEN || env.GITHUB_TOKEN) return { token: (env.GH_TOKEN || env.GITHUB_TOKEN).trim(), from: '环境变量' };
  const saved = path.join(ROOT, '.github-token');
  if (fs.existsSync(saved)) {
    const t = fs.readFileSync(saved, 'utf8').trim();
    if (t) return { token: t, from: '上次记录' };
  }
  try {
    const t = execFileSync('powershell.exe', ['-NoProfile', '-Command', 'Get-Clipboard -Raw'], { encoding: 'utf8', timeout: 8000 });
    const m = String(t || '').match(/(ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})/);
    if (m) return { token: m[1], from: '剪贴板' };
  } catch { /* 忽略 */ }
  return { token: '', from: '' };
}

/* ------------------------------ 主流程 ------------------------------ */
async function main() {
  console.log('');
  console.log('============================================================');
  console.log('   AI 情报站  ·  一键发布到 GitHub（永久网址）');
  console.log('============================================================');
  console.log('');

  if (DEMO) {
    const files = collectFiles();
    console.log(`演示模式：将上传 ${files.length} 个文件，共 ${(files.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)}KB`);
    for (const f of files) console.log('  ' + f.rel);
    console.log('\n演示结束，流程正常。');
    rl.close();
    return;
  }

  console.log('需要一串 GitHub 令牌。没有的话看这里（点几下就有）：');
  console.log('');
  console.log('   https://github.com/settings/tokens/new?scopes=repo,workflow&description=ai-info-hub');
  console.log('');
  console.log('   页面拉到最底 → 点绿色 Generate token → 复制 ghp_ 开头那串');
  console.log('');

  let { token, from } = readToken();
  if (token) console.log(`✓ 已从${from}拿到令牌`);
  while (!token) {
    const a = (await ask('粘贴令牌后回车（直接回车取消）：')).trim();
    if (!a) break;
    if (!/^(ghp_|github_pat_)/.test(a)) { console.log('  ✗ 应以 ghp_ 或 github_pat_ 开头，再试一次。'); continue; }
    token = a;
  }
  if (!token) { console.log('\n已取消。'); rl.close(); return; }

  console.log('\n正在验证身份 …');
  let me;
  try { me = await apiRetry(token, 'GET', '/user'); }
  catch (e) {
    console.log('✗ 令牌无效：' + e.message);
    console.log('  重新生成时请勾选 repo 和 workflow 两项权限。');
    rl.close(); process.exit(1);
  }
  console.log(`✓ 你好，${me.login}`);
  try { fs.writeFileSync(path.join(ROOT, '.github-token'), token, 'utf8'); } catch { /* 忽略 */ }

  const defName = 'ai-info-hub';
  console.log('');
  const answer = (await askOr(`仓库名（直接回车用 ${defName}）：`, defName)).trim() || defName;
  const repo = answer.replace(/[^\w.-]/g, '-').replace(/^[-.]+|[-.]+$/g, '') || defName;

  let exists = false;
  try { await apiRetry(token, 'GET', `/repos/${me.login}/${repo}`); exists = true; }
  catch (e) { if (e.status !== 404) throw e; }

  let branch = 'main';
  if (!exists) {
    console.log(`\n正在创建公开仓库 ${me.login}/${repo} …`);
    try {
      await apiRetry(token, 'POST', '/user/repos', {
        name: repo,
        description: '每日聚合：AIGC 前沿与技巧 / 全球 AI 黑客松 / 剪辑技巧 / 残障大学生就业实习 / 考公考编央国企 / 戏影考研 985 / 大厂赛事 / AI 应用·3D 游戏·影游竞赛',
        private: false, has_issues: false, has_wiki: false, auto_init: true,
      });
      console.log('✓ 仓库已创建（公开）');
      await sleep(2000);
    } catch (e) {
      console.log('\n✗ 创建失败：' + e.message);
      console.log('  可手动打开 https://github.com/new 建一个公开仓库叫 ' + repo + '，再重新运行。');
      rl.close(); process.exit(1);
    }
  } else {
    console.log(`\n  仓库 ${me.login}/${repo} 已存在，将更新其中文件。`);
    try { branch = (await apiRetry(token, 'GET', `/repos/${me.login}/${repo}`)).default_branch || 'main'; } catch { /* main */ }
  }
  console.log(`  分支：${branch}`);

  /* ---------- 逐个文件上传（Contents API，最兼容） ---------- */
  const files = collectFiles();
  console.log(`\n准备上传 ${files.length} 个文件 …`);

  const failed = [];
  let ok = 0;
  for (const f of files) {
    const content = fs.readFileSync(f.full).toString('base64');
    const apiPath = `/repos/${me.login}/${repo}/contents/${f.rel.split('/').map(encodeURIComponent).join('/')}`;

    // 已有文件需要 sha
    let sha = null;
    try {
      const cur = await apiRetry(token, 'GET', `${apiPath}?ref=${encodeURIComponent(branch)}`, undefined, 2);
      sha = cur.sha;
    } catch (e) { if (e.status !== 404) { /* 当作新文件 */ } }

    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      try {
        await api(token, 'PUT', apiPath, {
          message: `${sha ? 'update' : 'add'}: ${f.rel}`,
          content,
          branch,
          ...(sha ? { sha } : {}),
        });
        done = true;
      } catch (e) {
        if (attempt === 2) failed.push({ rel: f.rel, err: e.message });
        else await sleep(700 * (attempt + 1));
      }
    }
    if (done) ok++;
    process.stdout.write(`\r  ${ok}/${files.length} ${done ? '✓' : '✗'} ${f.rel.slice(0, 52).padEnd(52)}`);
  }
  console.log('');

  if (failed.length) {
    console.log(`\n  ⚠ ${failed.length} 个文件未成功：`);
    for (const x of failed.slice(0, 10)) console.log(`     ${x.rel}  (${x.err})`);
  }

  /* ---------- 开启 Pages ---------- */
  console.log('\n正在开启 GitHub Pages …');
  let pagesOk = false;
  try {
    await apiRetry(token, 'GET', `/repos/${me.login}/${repo}/pages`);
    pagesOk = true;
    try { await apiRetry(token, 'PUT', `/repos/${me.login}/${repo}/pages`, { build_type: 'workflow' }); } catch { /* 已正确 */ }
  } catch (e) {
    if (e.status === 404) {
      try {
        await apiRetry(token, 'POST', `/repos/${me.login}/${repo}/pages`, { build_type: 'workflow' });
        pagesOk = true;
      } catch (e2) { console.log('  ! 自动开启失败：' + e2.message); }
    }
  }
  if (pagesOk) console.log('✓ Pages 已就绪');
  else console.log('! Pages 需要手动开启（见最后说明）');

  /* ---------- 触发构建 ---------- */
  await sleep(1500);
  console.log('\n正在触发第一次构建 …');
  let triggered = false;
  for (let i = 0; i < 5 && !triggered; i++) {
    try {
      await api(token, 'POST', `/repos/${me.login}/${repo}/actions/workflows/daily.yml/dispatches`, { ref: branch });
      triggered = true;
    } catch { await sleep(2500); }
  }
  console.log(triggered ? '✓ 构建已开始（约 2-4 分钟）' : '! 未自动触发，可在网页上手动点 Run workflow');

  const webUrl = `https://${me.login.toLowerCase()}.github.io/${repo}/`;
  const repoUrl = `https://github.com/${me.login}/${repo}`;

  console.log('');
  console.log('============================================================');
  console.log('   完成！');
  console.log('============================================================');
  console.log('');
  console.log('   永久网址（等 2-4 分钟）：');
  console.log('');
  console.log('      ' + webUrl);
  console.log('');
  console.log('   构建进度：' + repoUrl + '/actions');
  console.log('');
  console.log('   每天北京时间 06:30 自动更新，你什么都不用做。');
  console.log('');
  if (!pagesOk) {
    console.log('   ⚠ 请手动开启一次 Pages（只需一次）：');
    console.log('     1. 打开 ' + repoUrl + '/settings/pages');
    console.log('     2. Source 选 "GitHub Actions"');
    console.log('     3. 回到 Actions 页点 Run workflow');
    console.log('');
  }
  console.log('   令牌可删：https://github.com/settings/tokens');
  console.log('');

  try {
    fs.writeFileSync(path.join(ROOT, '我的网站地址.txt'), [
      'AI 情报站 · 访问信息',
      '',
      `永久网址：${webUrl}`,
      `仓库地址：${repoUrl}`,
      `构建状态：${repoUrl}/actions`,
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      '',
      '每天北京时间 06:30 自动更新。',
      '',
    ].join('\r\n'), 'utf8');
    console.log('   已保存到：我的网站地址.txt');
  } catch { /* 忽略 */ }

  rl.close();
}

main().catch((e) => {
  console.error('\n出错了：' + e.message);
  rl.close();
  process.exit(1);
});
