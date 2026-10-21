// 解析器：RSS/Atom、通用 HTML 列表、专用 API
import { decodeEntities, normalizeUrl, parseDate, stripHtml, summarize, truncate } from './util.mjs';
import { demap } from './fontmap.mjs';

/* ------------------------------ RSS / Atom ------------------------------ */

function pickTag(xml, tags) {
  for (const tag of tags) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = xml.match(re);
    if (m) return m[1];
  }
  return '';
}

function cdata(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .trim();
}

function attrOf(tagXml, attr) {
  const m = String(tagXml || '').match(new RegExp(`\\b${attr}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return m ? decodeEntities(m[1]) : '';
}

/** 解析 RSS 2.0 / Atom / RDF，返回条目数组 */
export function parseFeed(xml, sourceUrl) {
  if (!xml) return [];
  const isAtom = /<feed[\s>]/i.test(xml.slice(0, 3000));
  const blocks = isAtom
    ? [...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map((m) => m[0])
    : [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);

  if (!blocks.length) {
    // RDF: <item rdf:about="..."> 已被 /<item[\s>]/ 覆盖，这里兜底
    const rdf = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((m) => m[0]);
    if (!rdf.length) return [];
    blocks.push(...rdf);
  }

  const out = [];
  for (const b of blocks) {
    let title = cdata(pickTag(b, ['title']));
    title = stripHtml(title).replace(/\s+/g, ' ').trim();
    if (!title) continue;

    let link = '';
    const linkTag = b.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    if (linkTag) {
      const inner = cdata(linkTag[1]).trim();
      link = inner || attrOf(linkTag[0], 'href');
    }
    if (!link) link = attrOf(b.match(/<link[^>]*\/?>/i)?.[0] || '', 'href');
    if (!link) {
      const guid = b.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      if (guid) {
        const g = cdata(guid[1]).trim();
        if (/^https?:/i.test(g)) link = g;
      }
    }

    const rawDate =
      pickTag(b, ['pubDate', 'published', 'updated', 'dc:date', 'date', 'lastBuildDate']) || '';
    const date = parseDate(cdata(rawDate));

    const descRaw =
      pickTag(b, ['content:encoded', 'description', 'summary', 'content']) || '';
    const desc = summarize(cdata(descRaw), 160);

    const cats = [...b.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) =>
      stripHtml(cdata(m[1])).trim()
    ).filter(Boolean);

    const author = stripHtml(cdata(pickTag(b, ['dc:creator', 'author', 'name']))).trim();

    out.push({
      title,
      url: normalizeUrl(link, sourceUrl),
      summary: desc,
      publishedAt: date,
      categories: cats.slice(0, 5),
      author: truncate(author, 40),
    });
  }
  return out;
}

/* --------------------------- 通用 HTML 列表解析 --------------------------- */

/** 从相对 URL 猜测网站根 base */
export function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

/**
 * 通用列表页解析：抽取 a[href] + 邻近文本 + 邻近日期
 * @param {string} html
 * @param {string} pageUrl
 * @param {object} opt { include: RegExp, exclude: RegExp, wantDate: boolean }
 */
export function parseHtmlList(html, pageUrl, opt = {}) {
  const { include, exclude, minLen = 8, maxLen = 120, demap: fmap } = opt;
  const out = [];
  const seen = new Set();
  // 去掉脚本与导航噪音
  const body = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');

  const re = /<a\b([^>]*)>([\s\S]{0,400}?)<\/a>/gi;
  let m;
  while ((m = re.exec(body))) {
    const attrs = m[1];
    const href = attrOf(attrs, 'href');
    if (!href || /^(javascript:|#|mailto:|tel:)/i.test(href)) continue;

    // 有字体映射时保留 PUA 字符，稍后还原
    let text = stripHtml(m[2], { keepPua: !!fmap }).replace(/\s+/g, ' ').trim();
    const titleAttr = stripHtml(attrOf(attrs, 'title'), { keepPua: !!fmap }).replace(/\s+/g, ' ').trim();
    // 正文被图标字体切割时（如实习僧），title 属性是完整干净的，优先用它
    if (titleAttr.length >= minLen && titleAttr.length <= maxLen) {
      const cjkText = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const cjkTitle = (titleAttr.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (cjkTitle > cjkText) text = titleAttr;
    }
    if (text.length < minLen && titleAttr.length >= minLen) text = titleAttr;
    // 字体反混淆（实习僧等）：先还原再判长度
    if (fmap && fmap.size) text = demap(text, fmap) || text;
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length < minLen || text.length > maxLen) continue;

    const url = normalizeUrl(href, pageUrl);
    if (!url || !/^https?:/i.test(url)) continue;
    if (include && !include.test(url)) continue;
    if (exclude && exclude.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    // 在链接后方 300 字符内找日期
    const tail = body.slice(m.index + m[0].length, m.index + m[0].length + 300);
    const dm =
      tail.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/) ||
      tail.match(/(\d{1,2})[-/月](\d{1,2})(?!\d)/) ||
      tail.match(/(\d+)\s*(天|小时|分钟)前/);
    let published = null;
    if (dm) {
      if (dm[2] === '天' || dm[2] === '小时' || dm[2] === '分钟') {
        const ms = dm[2] === '天' ? 864e5 : dm[2] === '小时' ? 36e5 : 6e4;
        published = new Date(Date.now() - +dm[1] * ms).toISOString();
      } else {
        published = parseDate(dm[0]);
      }
    }
    out.push({
      title: text,
      url,
      summary: '',
      publishedAt: published,
      categories: [],
      author: '',
    });
  }
  return out;
}

/* ------------------------------- 专用解析器 ------------------------------- */

/** Devpost 黑客松 API */
export function parseDevpost(json, kind = 'hackathon') {
  const list = json?.hackathons || [];
  return list.map((h) => {
    const loc = h.displayed_location?.location || '';
    const prize = stripHtml(h.prize_amount || '');
    const themes = (h.themes || []).map((t) => t.name).join(' / ');
    return {
      title: h.title,
      url: normalizeUrl(h.url, 'https://devpost.com'),
      summary: [
        loc && `地点：${loc}`,
        h.submission_period_dates && `赛期：${h.submission_period_dates}`,
        prize && `奖金：${prize}`,
        h.registrations_count && `报名：${h.registrations_count} 人`,
        themes && `主题：${themes}`,
        h.organization_name && `主办：${h.organization_name}`,
      ].filter(Boolean).join(' · '),
      // 用 "还剩 N 天" 换算成截止日
      publishedAt: parseDate(h.time_left_to_submission),
      deadline: deadlineFromLeft(h.time_left_to_submission),
      categories: (h.themes || []).map((t) => t.name),
      author: h.organization_name || '',
      meta: { location: loc, prize, kind },
    };
  });
}

function deadlineFromLeft(left) {
  const m = String(left || '').match(/(\d+)\s*day/i);
  if (!m) return null;
  return new Date(Date.now() + +m[1] * 864e5).toISOString();
}

/** DataFountain 赛题列表（HTML） */
export function parseDataFountain(html, pageUrl) {
  const out = [];
  const seen = new Set();
  for (const m of String(html).matchAll(/<a[^>]*href="(\/competitions\/\d+)"[^>]*>([\s\S]{0,220}?)<\/a>/gi)) {
    const title = stripHtml(m[2]).replace(/\s+/g, ' ').trim();
    if (title.length < 4 || seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push({
      title,
      url: normalizeUrl(m[1], pageUrl),
      summary: 'DataFountain 数据竞赛平台赛题',
      publishedAt: null,
      categories: ['数据竞赛'],
    });
  }
  return out;
}

/** 机核 GCORES JSON API */
export function parseGcores(json, pageUrl) {
  const list = json?.data || [];
  return list.map((x) => {
    const a = x.attributes || {};
    const pub = a['published-at'] || a.publishedAt || null;
    // 从 content 里抽第一段纯文本
    let summary = '';
    try {
      const c = typeof a.content === 'string' ? JSON.parse(a.content) : a.content;
      const first = (c?.blocks || []).find((b) => b.text && b.text.length > 12);
      summary = first ? truncate(first.text.replace(/\s+/g, ' '), 120) : '';
    } catch { /* 忽略 */ }
    const type = x.type === 'radios' ? 'radios' : 'articles';
    return {
      title: stripHtml(a.title || ''),
      url: normalizeUrl(`https://www.gcores.com/${type}/${x.id}`, pageUrl),
      summary,
      publishedAt: parseDate(pub),
      categories: [a['category-name'] || '游戏'].filter(Boolean),
    };
  }).filter((x) => x.title);
}

/** 通用 JSON 数组解析（itch.io / 其他 API 备用） */
export function parseJsonList(json, pageUrl, mapper) {
  const arr = Array.isArray(json) ? json : json?.data || json?.items || json?.list || [];
  return arr.map((x) => mapper(x)).filter((x) => x && x.title && x.url);
}
