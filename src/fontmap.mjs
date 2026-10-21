// WOFF 字体反混淆：把实习僧等站点的 PUA 码点还原成真实汉字
import zlib from 'node:zlib';

/**
 * 解析 WOFF，返回 Map<PUA码点, 真实字符>
 * 原理：字体的 post 表把每个字形命名为 uniXXXX（真实码点），cmap 表把 PUA 码点映射到字形 ID，
 * 两者一关联就能还原。
 */
export function parseWoff(buf) {
  if (buf.subarray(0, 4).toString('latin1') !== 'wOFF') return new Map();
  const numTables = buf.readUInt16BE(12);
  const t = {};
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = buf.subarray(o, o + 4).toString('latin1');
    const off = buf.readUInt32BE(o + 4);
    const compLen = buf.readUInt32BE(o + 8);
    const origLen = buf.readUInt32BE(o + 12);
    let data = buf.subarray(off, off + compLen);
    if (compLen < origLen) {
      try { data = zlib.inflateSync(data); } catch { continue; }
    }
    t[tag] = data;
  }
  if (!t.cmap || !t.post) return new Map();

  // ---- cmap（format 4）----
  const cmap = t.cmap;
  const numSub = cmap.readUInt16BE(2);
  let best = null;
  for (let i = 0; i < numSub; i++) {
    const off = cmap.readUInt32BE(8 + i * 8);
    if (cmap.readUInt16BE(off) === 4) best = off;
  }
  const map = new Map();
  if (best != null) {
    const segX2 = cmap.readUInt16BE(best + 6);
    const seg = segX2 / 2;
    const endO = best + 14;
    const startO = endO + segX2 + 2;
    const deltaO = startO + segX2;
    const rangeO = deltaO + segX2;
    for (let i = 0; i < seg; i++) {
      const end = cmap.readUInt16BE(endO + i * 2);
      const start = cmap.readUInt16BE(startO + i * 2);
      const delta = cmap.readInt16BE(deltaO + i * 2);
      const rangeOff = cmap.readUInt16BE(rangeO + i * 2);
      for (let c = start; c <= end && c !== 0xffff; c++) {
        let g;
        if (rangeOff === 0) g = (c + delta) & 0xffff;
        else {
          const gi = rangeO + i * 2 + rangeOff + (c - start) * 2;
          if (gi + 1 >= cmap.length) continue;
          g = cmap.readUInt16BE(gi);
          if (g !== 0) g = (g + delta) & 0xffff;
        }
        if (g) map.set(c, g);
      }
    }
  }

  // ---- post（version 2.0）→ 字形名 ----
  const post = t.post;
  const glyphNames = [];
  if (post.readUInt32BE(0) === 0x00020000) {
    const numGlyphs = post.readUInt16BE(32);
    const idx = [];
    for (let i = 0; i < numGlyphs; i++) idx.push(post.readUInt16BE(34 + i * 2));
    let p = 34 + numGlyphs * 2;
    const names = [];
    while (p < post.length) {
      const len = post[p];
      names.push(post.subarray(p + 1, p + 1 + len).toString('latin1'));
      p += 1 + len;
    }
    for (let i = 0; i < numGlyphs; i++) {
      const v = idx[i];
      glyphNames[i] = v < 258 ? '' : names[v - 258] || '';
    }
  }

  const out = new Map();
  for (const [code, g] of map) {
    const name = glyphNames[g] || '';
    const m = name.match(/^uni([0-9A-Fa-f]{4,5})$/);
    if (!m) continue;
    const real = parseInt(m[1], 16);
    if (real > 0x20 && real < 0x110000) {
      try { out.set(code, String.fromCodePoint(real)); } catch { /* 忽略 */ }
    }
  }
  return out;
}

/** 用映射表还原字符串中的 PUA 字符；无法还原的替换成 '' */
export function demap(text, map) {
  if (!map || !map.size) return String(text || '').replace(/[\uE000-\uF8FF]/g, '');
  return String(text || '').replace(/[\uE000-\uF8FF]/g, (c) => map.get(c.codePointAt(0)) ?? '');
}
