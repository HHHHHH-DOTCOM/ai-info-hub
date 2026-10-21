// 全量重跑：清空历史后重新采集（用于调试分类规则）
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../src/store.mjs';

for (const f of ['items.json', 'status.json']) {
  const p = path.join(ROOT, 'data', f);
  if (fs.existsSync(p)) fs.rmSync(p);
}
const dir = path.join(ROOT, 'data', 'daily');
if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
console.log('已清空 data/');
