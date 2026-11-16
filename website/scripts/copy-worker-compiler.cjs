const fs = require('node:fs'),
  path = require('node:path');
const source = path.resolve(__dirname, '../../experimental/browser-backend/snack/dist'),
  target = path.resolve(__dirname, '../worker-compiler');
fs.mkdirSync(target, { recursive: true });
for (const file of [
  'worker.js',
  'executor.js',
  'isolation.html',
  'preview.html',
  'policies.json',
  'sdk-player.html',
  'sdk-player.js',
])
  fs.copyFileSync(path.join(source, file), path.join(target, file));
