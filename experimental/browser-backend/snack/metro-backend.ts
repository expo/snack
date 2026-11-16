import { resolve } from 'metro-resolver';
import metroModules from 'metro-transform-plugins/private/import-export-plugin';
import path from 'path-browserify';

import { rejectHostBuiltin } from './builtin-specifiers';
import type { Compiler } from './compiler';
import { isImage, imageFamily, platformImage } from './image-assets';
import type { PackageManifest, InstalledPackages, ImportKind, Side, BabelPlugin } from './types';
export const metroModulePlugin: BabelPlugin = [
  metroModules,
  { importDefault: '__metroDefault', importAll: '__metroAll' },
];
export class MetroResolver {
  files?: Map<string, string>;
  packages?: InstalledPackages | null;
  sources = new Map<string, string | Uint8Array>();
  dirs = new Set<string>();
  sync(compiler: Compiler) {
    if (this.files === compiler.files && this.packages === compiler.packages) return;
    this.files = compiler.files;
    this.packages = compiler.packages;
    this.sources = new Map<string, string | Uint8Array>([
      ...(compiler.packages?.sources || []),
      ...(compiler.packages?.assets || []),
      ...compiler.files,
    ]);
    this.dirs = new Set(['/project', '/packages']);
    for (const file of this.sources.keys()) {
      let dir = path.dirname(file);
      while (dir !== '/') {
        this.dirs.add(dir);
        dir = path.dirname(dir);
      }
    }
  }
  package(file: string): PackageManifest | null {
    const source = this.sources.get(path.resolve(file));
    return typeof source === 'string' ? JSON.parse(source) : null;
  }
  scope(file: string) {
    file = path.resolve(file);
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
  resolve(compiler: Compiler, from: string, spec: string, kind: ImportKind, side: Side): string {
    this.sync(compiler);
    const platform = side === 'client' ? compiler.platform : 'web';
    const lock = compiler.packages?.lock,
      owner =
        lock && Object.keys(lock.packages).find((id) => from.startsWith('/packages/' + id + '/'));
    const deps = { ...lock?.roots, ...(owner ? lock.packages[owner].dependencies : {}) };
    const extraNodeModules = Object.fromEntries(
      Object.entries(deps || {}).map(([name, id]) => [name, '/packages/' + id]),
    );
    if (!spec.startsWith('.') && !spec.startsWith('#') && !spec.startsWith('/')) {
      const name = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0];
      const id = compiler.packages?.provider?.(from, name);
      if (id) extraNodeModules[name] = '/packages/' + id;
    }
    try {
      const result = resolve(
        {
          originModulePath: from,
          allowHaste: false,
          assetExts: new Set(),
          sourceExts: ['js', 'jsx', 'json', 'ts', 'tsx', 'mjs', 'cjs'],
          mainFields: platform === 'web' ? ['browser', 'main'] : ['react-native', 'main'],
          nodeModulesPaths: [],
          extraNodeModules,
          disableHierarchicalLookup: false,
          preferNativePlatform: platform !== 'web',
          dev: false,
          isESMImport: kind === 'import',
          customResolverOptions: {},
          getPackage: (p) => this.package(p),
          getPackageForModule: (p) => this.scope(p),
          fileSystemLookup: (p) => {
            p = path.resolve(p);
            const image = platformImage(p, [...this.sources.keys()], platform);
            if (image) return { exists: true, type: 'f', realPath: image };
            return this.sources.has(p) ||
              (isImage(p) && imageFamily(p, [...this.sources.keys()]).length)
              ? { exists: true, type: 'f', realPath: p }
              : this.dirs.has(p)
              ? { exists: true, type: 'd', realPath: p }
              : { exists: false };
          },
          resolveAsset: () => null,
          resolveHasteModule: () => null,
          resolveHastePackage: () => null,
          unstable_enablePackageExports: true,
          unstable_applyBrowserSpecAfterExports: true,
          unstable_resolveExportsFromPackageRoot: true,
          unstable_conditionNames:
            side === 'server' ? ['react-server'] : platform === 'web' ? [] : ['react-native'],
          unstable_conditionsByPlatform: { web: ['browser'] },
          unstable_logWarning: () => {},
        },
        spec,
        platform,
      );
      if (result.type === 'empty') return '@empty';
      if (result.type !== 'sourceFile') throw Error('Unsupported Metro resolution ' + result.type);
      if (
        !this.sources.has(result.filePath) &&
        !(isImage(result.filePath) && imageFamily(result.filePath, [...this.sources.keys()]).length)
      )
        throw Error('Resolved file outside virtual source map');
      return result.filePath;
    } catch (error) {
      rejectHostBuiltin(spec);
      throw error;
    }
  }
}
