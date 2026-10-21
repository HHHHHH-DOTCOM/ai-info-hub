import { loadItems } from '../src/store.mjs';
import { CHANNEL_MAP } from '../config/topics.mjs';
const items = loadItems();
for (const ch of process.argv.slice(2)) {
  const list = items.filter((i) => (i.channels || []).some((c) => c.id === ch));
  console.log(`\n===== ${CHANNEL_MAP[ch]?.name || ch} (${list.length}) =====`);
  for (const it of list.slice(0, 10)) {
    console.log('· ' + it.title.slice(0, 56) + '  [' + (it.sources || []).join(',') + ']');
  }
}
