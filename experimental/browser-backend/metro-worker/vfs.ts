import path from 'path-browserify';

import type { PackageManifest } from '../snack/types';
export class VirtualFS {
  files = new Map<string, string>();
  directories = new Set<string>();
  revision = 0;
  normalize(file: string) {
    const absolute = path.resolve('/project', file);
    if (!absolute.startsWith('/project/') && !absolute.startsWith('/packages/'))
      throw Error('Path outside virtual filesystem');
    return absolute;
  }
  edit(edits: Record<string, string | null>) {
    const next = new Map(this.files);
    for (const [name, value] of Object.entries(edits)) {
      const file = this.normalize(name);
      if (value === null) next.delete(file);
      else {
        if (typeof value !== 'string' || value.length > 1000000)
          throw Error('Invalid virtual source');
        next.set(file, value);
      }
    }
    if (
      next.size > 10000 ||
      [...next.values()].reduce((n, v) => n + v.length, 0) > 32 * 1024 * 1024
    )
      throw Error('Virtual filesystem limit');
    const directories = new Set(['/project', '/packages']);
    for (const file of next.keys()) {
      let dir = path.dirname(file);
      while (dir !== '/') {
        if (next.has(dir)) throw Error('File-directory collision');
        directories.add(dir);
        dir = path.dirname(dir);
      }
    }
    this.files = next;
    this.directories = directories;
    this.revision++;
  }
  lookup(file: string) {
    const normalized = path.resolve('/project', file);
    return this.files.has(normalized)
      ? { exists: true as const, type: 'f' as const, realPath: normalized }
      : this.directories.has(normalized)
      ? { exists: true as const, type: 'd' as const, realPath: normalized }
      : { exists: false as const };
  }
  read(file: string) {
    const value = this.files.get(file);
    if (value === undefined) throw Error('Missing virtual file ' + file);
    return value;
  }
  package(file: string): PackageManifest | null {
    const source = this.files.get(file);
    return source === undefined ? null : JSON.parse(source);
  }
  scope(file: string) {
    let dir = file;
    while (dir !== '/') {
      const packageJson = this.package(dir + '/package.json');
      if (packageJson)
        return { rootPath: dir, packageJson, packageRelativePath: path.relative(dir, file) };
      if (path.basename(dir) === 'node_modules') return null;
      dir = path.dirname(dir);
    }
    return null;
  }
}
