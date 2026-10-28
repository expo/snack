import fs from 'fs';
import path from 'path';

export default function resolvePackageFile(canonicalRoot: string, filename: string): string {
  const resolved = fs.realpathSync(filename);
  const relative = path.relative(canonicalRoot, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Package files must remain inside the package directory.');
  }
  return resolved;
}
