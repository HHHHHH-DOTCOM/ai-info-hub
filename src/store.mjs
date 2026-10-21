// 数据存储：items 库、状态、每日快照
import fs from 'node:fs';
import path from 'node:path';
import { sha1, toDateKey, nowKey, hoursAgo, uniq } from './util.mjs';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
export const STATE_FILE = path.join(DATA_DIR, 'status.json');
export const INBOX_DIR = path.join(ROOT, 'inbox');

export function ensureDirs() {
  for (const d of [DATA_DIR, INBOX_DIR, path.join(DATA_DIR, 'daily')]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 1), 'utf8');
}

export function loadItems() {
  const d = readJson(ITEMS_FILE, { items: [] });
  return Array.isArray(d.items) ? d.items : [];
}

export function saveItems(items) {
  writeJson(ITEMS_FILE, { updatedAt: new Date().toISOString(), count: items.length, items });
}

export function loadStatus() {
  return readJson(STATE_FILE, { sources: {}, runs: [] });
}

export function saveStatus(s) {
  writeJson(STATE_FILE, s);
}

/** 生成条目 id */
export function itemId(url, title) {
  const key = (url || '').trim() || (title || '').trim();
  return sha1(key).slice(0, 16);
}

/** 归一化标题用于跨源去重 */
export function titleKey(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[【】\[\]（）()「」『』《》"'"'、，,。.：:；;！!？?\-—_~·|/\\]/g, '')
    .slice(0, 60);
}

/**
 * 合并新旧条目：保留历史、更新 lastSeen、跨源同题合并
 */
export function mergeItems(oldItems, newItems, { keepDays = 120 } = {}) {
  const byId = new Map();
  const byTitle = new Map();
  for (const it of oldItems) {
    byId.set(it.id, it);
    byTitle.set(titleKey(it.title), it.id);
  }

  const now = Date.now();
  const added = [];
  const updated = [];

  for (const raw of newItems) {
    if (!raw || !raw.title) continue;
    const id = itemId(raw.url, raw.title);
    const tk = titleKey(raw.title);
    const existingId = byId.has(id) ? id : byTitle.get(tk);
    const existing = existingId ? byId.get(existingId) : null;

    if (existing) {
      existing.lastSeenAt = new Date(now).toISOString();
      if (!existing.summary && raw.summary) existing.summary = raw.summary;
      if (!existing.publishedAt && raw.publishedAt) existing.publishedAt = raw.publishedAt;
      if (raw.deadline && !existing.deadline) existing.deadline = raw.deadline;
      existing.sources = uniq([...(existing.sources || []), raw.sourceId]);
      existing.channels = mergeChannels(existing.channels, raw.channels);
      existing.hitCount = (existing.hitCount || 1) + 1;
      updated.push(existing);
    } else {
      const it = {
        id,
        title: raw.title,
        url: raw.url,
        summary: raw.summary || '',
        sourceIds: [raw.sourceId],
        sourceName: raw.sourceName || '',
        sources: [raw.sourceId],
        origin: raw.origin || 'web',
        publishedAt: raw.publishedAt || null,
        firstSeenAt: new Date(now).toISOString(),
        lastSeenAt: new Date(now).toISOString(),
        deadline: raw.deadline || null,
        channels: raw.channels || [],
        tags: raw.tags || [],
        meta: raw.meta || {},
        hitCount: 1,
      };
      byId.set(id, it);
      byTitle.set(tk, id);
      added.push(it);
    }
  }

  // 清理过期（保留有频道归属且在保留期内）
  const cutoff = now - keepDays * 864e5;
  const kept = [];
  for (const it of byId.values()) {
    const ts = new Date(it.publishedAt || it.firstSeenAt).getTime();
    const seen = new Date(it.lastSeenAt).getTime();
    if (ts > cutoff || seen > cutoff) kept.push(it);
  }

  kept.sort((a, b) => tsOf(b) - tsOf(a));
  return { items: kept, added, updated };
}

function mergeChannels(a = [], b = []) {
  const m = new Map();
  for (const c of [...a, ...b]) {
    const prev = m.get(c.id);
    if (!prev || prev.score < c.score) m.set(c.id, { id: c.id, score: +c.score.toFixed(2) });
  }
  return [...m.values()].sort((x, y) => y.score - x.score);
}

export function tsOf(it) {
  return new Date(it.publishedAt || it.firstSeenAt || 0).getTime() || 0;
}

/** 重要度：频道权重 + 新鲜度 + 多源印证 */
export function importance(it, now = new Date()) {
  const h = hoursAgo(it.publishedAt || it.firstSeenAt, now);
  const fresh = Math.max(0, 1 - h / (24 * 14)); // 两周线性衰减
  const chScore = (it.channels || []).reduce((s, c) => s + c.score, 0);
  const multi = Math.min(3, (it.sources?.length || 1) - 1);
  const deadlineBoost = it.deadline && new Date(it.deadline) > now ? 1.5 : 0;
  return +(fresh * 10 + Math.min(chScore, 12) + multi * 1.2 + deadlineBoost).toFixed(2);
}

/** 写当天快照 */
export function writeDailySnapshot(items, dateKey = nowKey()) {
  const ofDay = items.filter((it) => toDateKey(it.publishedAt || it.firstSeenAt) === dateKey || toDateKey(it.firstSeenAt) === dateKey);
  writeJson(path.join(DATA_DIR, 'daily', dateKey + '.json'), {
    date: dateKey,
    generatedAt: new Date().toISOString(),
    count: ofDay.length,
    items: ofDay,
  });
}
