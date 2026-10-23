import fs from 'fs';
import os from 'os';
import path from 'path';

import { getYarnPackagerAsync, spawnSafeAsync } from '../installDependencies';

it('ignores package-supplied Yarn executables', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'snackager-yarn-config-'));
  try {
    const marker = path.join(root, 'executed');
    fs.writeFileSync(path.join(root, 'package.json'), '{"name":"fixture","version":"1.0.0"}');
    fs.writeFileSync(path.join(root, '.yarnrc'), 'yarn-path "./package-manager.js"\n');
    fs.writeFileSync(
      path.join(root, 'package-manager.js'),
      `require('fs').writeFileSync(${JSON.stringify(marker)}, 'executed');`,
    );
    const yarn = await getYarnPackagerAsync();
    const result = await spawnSafeAsync(yarn, ['--version'], root);
    expect(result.stdout.trim()).toMatch(/^1\./);
    expect(fs.existsSync(marker)).toBe(false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
