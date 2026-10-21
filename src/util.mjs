// 通用工具：抓取、解码、日期、哈希、清洗
import { createHash } from 'node:crypto';

export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const CHARSET_RE = /charset\s*=\s*["']?([\w-]+)/i;

/** 抓取并解码文本（自动识别 UTF-8 / GBK / GB2312 / Big5） */
export async function fetchText(url, { timeout = 20000, retry = 1, headers = {} } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retry; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: {
          'user-agent': UA,
          accept: 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          ...headers,
        },
      });
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || '';
      const head = buf.subarray(0, 2048).toString('latin1');
      let charset = (ct.match(CHARSET_RE) || head.match(CHARSET_RE) || [])[1] || 'utf-8';
      charset = charset.toLowerCase();
      if (charset === 'gb2312' || charset === 'gbk') charset = 'gbk';
      let text;
      try {
        text = new TextDecoder(charset, { fatal: false }).decode(buf);
      } catch {
        text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
      }
      return { ok: res.ok, status: res.status, text, url: res.url || url };
    } catch (e) {
      lastErr = e;
      if (attempt < retry) await sleep(600 + attempt * 900);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('fetch failed: ' + url);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function sha1(s) {
  return createHash('sha1').update(String(s)).digest('hex');
}

/** 归一化 URL：去追踪参数、去 hash、去末尾斜杠差异 */
export function normalizeUrl(raw, base) {
  if (!raw) return '';
  let u = String(raw).trim();
  u = u.replace(/^\/\//, 'https://');
  try {
    u = new URL(u, base || undefined).toString();
  } catch {
    return '';
  }
  try {
    const url = new URL(u);
    url.hash = '';
    const drop = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'spm', 'from', 'share_source', 'share_medium', 'share_plat', 'share_tag',
      'timestamp', 'share_token', 'pcm', 'query_from', 'source_id', 'resource_id',
      'creative_id', 'track_id', 'chksm', 'scene', 'subscene',
    ];
    for (const k of drop) url.searchParams.delete(k);
    let out = url.toString();
    out = out.replace(/\/$/, '');
    return out;
  } catch {
    return u;
  }
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ldquo: '“', rdquo: '”',
  lsquo: '‘', rsquo: '’', hellip: '…', mdash: '—', ndash: '–', middot: '·', copy: '©',
  reg: '®', trade: '™', times: '×', divide: '÷', deg: '°', laquo: '«', raquo: '»',
};

export function decodeEntities(s) {
  if (!s) return '';
  // 有些站点（如实习僧）的实体缺少结尾分号，且存在二次编码，这里解两轮
  let out = String(s);
  for (let pass = 0; pass < 2; pass++) {
    out = out
      .replace(/&#x([0-9a-f]+);?/gi, (m, h) => safeChar(parseInt(h, 16)) || m)
      .replace(/&#(\d{1,7});?/g, (m, d) => safeChar(parseInt(d, 10)) || m)
      .replace(/&([a-z][a-z0-9]{1,8});/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
    if (!out.includes('&#')) break;
  }
  return out;
}

/** 清掉图标字体私用区字符（U+E000–U+F8FF 及补充私用区） */
export function stripPrivateUse(s) {
  return String(s || '').replace(/[\uE000-\uF8FF]/g, '');
}

function safeChar(code) {
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** 去标签、解实体、压缩空白 */
export function stripHtml(html, { keepSpace = true, keepPua = false } = {}) {
  if (!html) return '';
  let s = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  // 清掉图标字体私用区字符（实习僧/新片场等站点用它代替汉字）
  // keepPua=true 时保留，交给字体映射表还原
  if (!keepPua) s = s.replace(/[\uE000-\uF8FF]/g, '');
  s = keepSpace ? s.replace(/[ \t\u00a0]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  return s.trim();
}
/** 摘要：取纯文本前 n 字 */
export function summarize(text, n = 110) {
  const t = stripHtml(text).replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return t.slice(0, n).replace(/[，,、\s]+$/, '') + '…';
}

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** 万能日期解析 → ISO 字符串或 null */
export function parseDate(input, now = new Date()) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input) ? null : input.toISOString();
  const s = String(input).trim();
  if (!s) return null;

  // 已经带 T 的 ISO
  const iso = Date.parse(/T\d{2}:\d{2}/.test(s) ? s : '');
  if (!isNaN(iso)) return new Date(iso).toISOString();

  // 2026-10-21 / 2026/10/21 / 2026.10.21
  let m = s.match(/(20\d{2})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    const hh = s.match(/(\d{1,2}):(\d{2})/);
    if (hh) d.setUTCHours(+hh[1], +hh[2]);
    return valid(d) ? d.toISOString() : null;
  }
  // 10-21 或 10月21日（补当前年）
  m = s.match(/(?:^|[^\d])(\d{1,2})\s*[-/月]\s*(\d{1,2})\s*日?/);
  if (m && !/周|星期/.test(s)) {
    let year = now.getUTCFullYear();
    const d = new Date(Date.UTC(year, +m[1] - 1, +m[2]));
    if (d.getTime() - now.getTime() > 1000 * 60 * 60 * 24 * 200) d.setUTCFullYear(year - 1);
    return valid(d) ? d.toISOString() : null;
  }
  // RFC822: Wed, 21 Oct 2026 02:37:39 +0000
  m = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m && MONTHS[m[2].toLowerCase()] !== undefined) {
    const d = new Date(Date.UTC(+m[3], MONTHS[m[2].toLowerCase()], +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)));
    return valid(d) ? d.toISOString() : null;
  }
  // 2 days left / 3 hours ago
  m = s.match(/(\d+)\s*(day|hour|minute)s?\s*(left|ago)/i);
  if (m) {
    const ms = { day: 864e5, hour: 36e5, minute: 6e4 }[m[2].toLowerCase()];
    return new Date(now.getTime() + (m[3].toLowerCase() === 'left' ? 1 : -1) * m[1] * ms).toISOString();
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t).toISOString();
}

function valid(d) {
  return d instanceof Date && !isNaN(d) && d.getUTCFullYear() > 1990 && d.getUTCFullYear() < 2100;
}

export function toDateKey(iso) {
  if (!iso) return '';
  try {
    // 统一按北京时间切日
    return new Date(new Date(iso).getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function nowKey(now = new Date()) {
  return new Date(now.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function hoursAgo(iso, now = new Date()) {
  if (!iso) return 1e9;
  return (now.getTime() - new Date(iso).getTime()) / 36e5;
}

export function truncate(s, n) {
  const t = String(s || '');
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

export function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

/** 简易并发池 */
export async function pool(tasks, limit = 6, onResult) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      try {
        results[idx] = await tasks[idx]();
      } catch (e) {
        results[idx] = { error: e.message };
      }
      if (onResult) onResult(results[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}
