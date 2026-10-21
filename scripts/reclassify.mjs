import { loadItems, saveItems } from '../src/store.mjs';
import { classifyV2 } from '../config/rules.mjs';
import { CHANNEL_MAP } from '../config/topics.mjs';

const items = loadItems();
const kept = [];
for (const it of items) {
  const ch = classifyV2(it.title, (it.sources || [])[0] || '', it.summary || '', (it.tags || []).join(' '));
  if (!ch.length) continue;
  kept.push({ ...it, channels: ch });
}
saveItems(kept);
console.log(`重算：${kept.length} 条`);
const by = {};
for (const it of kept) for (const c of it.channels) by[c.id] = (by[c.id] || 0) + 1;
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + (CHANNEL_MAP[k]?.name || k).padEnd(16) + String(v).padStart(5));
}
