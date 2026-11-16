import path from 'path-browserify';
import { exports as resolveExports, imports as resolveImports } from 'resolve.exports';
import semver from 'semver';

import { bounded, verify, unpack } from './archive';
import { ArchiveCache } from './archive-cache';
import { builtinSpecifiers, rejectHostBuiltin } from './builtin-specifiers';
import { platformImage } from './image-assets';
import { sourceSuffixes } from './platform';
import {
  runtimeNames,
  runtimeProfiles,
  supportsRuntime,
  validateRuntime,
  executorProfile,
} from './runtime-profiles';
import {
  errorMessage,
  type Platform,
  type Side,
  type ImportKind,
  type PackageManifest,
  type PackageIdentity,
  type PackageLock,
  type PackageRecord,
  type InstalledPackages,
  type ModuleGraph,
} from './types';
export { verify, unpack } from './archive';
const registry = 'https://registry.npmjs.org/';
const decoder = new TextDecoder();
// These modules are provided by the preview registry rather than downloaded from npm.

function specifier(alias: string, spec: string) {
  let name = alias,
    range = spec;
  if (typeof spec !== 'string') throw Error('Invalid dependency specification');
  if (spec.startsWith('npm:')) {
    const actual = spec.slice(4),
      at = actual.lastIndexOf('@');
    if (at <= 0) throw Error('npm alias requires a version');
    name = actual.slice(0, at);
    range = actual.slice(at + 1);
  }
  if (!/^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/.test(name) || !semver.validRange(range))
    throw Error('Unsupported dependency ' + alias + '@' + spec);
  return { name, range };
}
async function scopeHash(env: Record<string, PackageIdentity>) {
  const value = Object.keys(env)
    .sort()
    .map((k) => [k, env[k].name, env[k].version]);
  return [
    ...new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value))),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);
}
export async function installPackages(
  requested: Record<string, string>,
  previousLock?: PackageLock | null,
  { signal }: { signal?: AbortSignal } = {},
): Promise<InstalledPackages> {
  if (
    !requested ||
    typeof requested !== 'object' ||
    Array.isArray(requested) ||
    Object.keys(requested).length > 80
  )
    throw Error('Invalid dependencies or dependency count limit');
  const started = performance.now(),
    packages = new Map<string, PackageRecord>(),
    sources = new Map<string, string>(),
    assets = new Map<string, Uint8Array>(),
    roots: Record<string, string> = Object.create(null);
  const lock: PackageLock = { format: 2, roots, packages: Object.create(null) },
    archiveCache = new ArchiveCache();
  const stats = {
    downloads: 0,
    cacheHits: 0,
    compressedBytes: 0,
    expandedBytes: 0,
    cacheWarnings: archiveCache.warnings,
    ms: 0,
  };
  const metadata = new Map<
      string,
      { versions: Record<string, { dist: { tarball: string; integrity: string } }> }
    >(),
    artifacts = new Map<string, { manifest: PackageManifest; entries: Map<string, Uint8Array> }>(),
    requirements = new Map<
      string,
      { needs: Set<string>; children: string[]; provided: Set<string> }
    >();
  if (previousLock && previousLock.format !== 2)
    throw Error('Lock format changed; resolve dependencies again');
  const networkSignal = () =>
    signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000);
  async function select(alias: string, spec: string, lockedId?: string): Promise<PackageIdentity> {
    signal?.throwIfAborted();
    const { name, range } = specifier(alias, spec);
    if (previousLock) {
      const d = lockedId ? previousLock.packages[lockedId] : undefined;
      if (
        !d ||
        !lockedId ||
        d.name !== name ||
        !semver.valid(d.version) ||
        !semver.satisfies(d.version, range) ||
        !lockedId.startsWith(name + '@' + d.version + '~') ||
        !/[~][0-9a-f]{12}$/.test(lockedId)
      )
        throw Error('Lock identity/version mismatch');
      return { ...d, lockedId };
    }
    if (!metadata.has(name)) {
      const res = await fetch(registry + encodeURIComponent(name), {
        credentials: 'omit',
        signal: networkSignal(),
        headers: { Accept: 'application/vnd.npm.install-v1+json' },
      });
      metadata.set(name, JSON.parse(decoder.decode(await bounded(res, 8 * 1024 * 1024, signal))));
    }
    const meta = metadata.get(name)!,
      version = semver.maxSatisfying(Object.keys(meta.versions), range);
    if (!version) throw Error('No matching package ' + name + '@' + range);
    const v = meta.versions[version];
    return { name, version, tarball: v.dist.tarball, integrity: v.dist.integrity };
  }
  async function artifact(d: PackageIdentity) {
    const key = d.name + '@' + d.version;
    if (artifacts.has(key)) return artifacts.get(key)!;
    if (artifacts.size >= 80) throw Error('Dependency count limit');
    signal?.throwIfAborted();
    const url = new URL(d.tarball);
    if (url.origin !== new URL(registry).origin || url.username || url.password)
      throw Error('Unsupported tarball origin');
    let response = await archiveCache.get(d.integrity),
      bytes: Uint8Array | undefined;
    if (response) {
      try {
        bytes = await bounded(response, 8 * 1024 * 1024, signal);
        await verify(bytes, d.integrity);
        stats.cacheHits++;
      } catch (e) {
        signal?.throwIfAborted();
        archiveCache.warnings.push(
          'Cached archive unreadable; refetching ' + key + ': ' + errorMessage(e),
        );
        await archiveCache.remove(d.integrity);
        response = undefined;
      }
    }
    if (!response) {
      try {
        bytes = await bounded(
          await fetch(url, { credentials: 'omit', redirect: 'error', signal: networkSignal() }),
          8 * 1024 * 1024,
          signal,
        );
        await verify(bytes, d.integrity);
        stats.downloads++;
      } catch (e) {
        signal?.throwIfAborted();
        throw Error(
          'Archive fetch failed for ' +
            key +
            ': ' +
            errorMessage(e) +
            (archiveCache.warnings.length ? '; ' + archiveCache.warnings.join('; ') : ''),
        );
      }
    }
    if (!bytes) throw Error('Missing archive bytes');
    stats.compressedBytes += bytes.length;
    if (stats.compressedBytes > 20 * 1024 * 1024) throw Error('Dependency download budget');
    const expanded = await bounded(
      new Response(
        new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('gzip')),
      ),
      20 * 1024 * 1024,
      signal,
    );
    stats.expandedBytes += expanded.length;
    if (stats.expandedBytes > 40 * 1024 * 1024) throw Error('Expanded project budget');
    const entries = unpack(expanded, { binary: true }),
      manifest: PackageManifest = JSON.parse(decoder.decode(entries.get('package.json')));
    if (manifest.name !== d.name || manifest.version !== d.version)
      throw Error('Archive identity mismatch');
    if (manifest.os || manifest.cpu) {
      const portable = (value: unknown): boolean =>
        !!value &&
        typeof value === 'object' &&
        Object.entries(value).some(
          ([key, child]) => ['browser', 'react-native'].includes(key) || portable(child),
        );
      if (!manifest.browser && !manifest['react-native'] && !portable(manifest.exports))
        throw Error('Platform-restricted package has no browser/native entry: ' + key);
    }
    await archiveCache.put(d.integrity, bytes);
    const a = { manifest, entries };
    artifacts.set(key, a);
    return a;
  }
  function optionalFailure(error: unknown) {
    signal?.throwIfAborted();
    if (/integrity|Unsafe tar|checksum|identity mismatch|Duplicate tar|Lock /i.test(String(error)))
      throw error;
    return String(error);
  }
  async function visit(d: PackageIdentity, env: Record<string, PackageIdentity>): Promise<string> {
    signal?.throwIfAborted();
    const id =
      d.lockedId ||
      d.name +
        '@' +
        d.version +
        '~' +
        (await scopeHash(
          Object.fromEntries(
            Object.entries(env).filter(
              ([key]) => requirements.get(d.lockedId || d.name + '@' + d.version)?.needs.has(key),
            ),
          ),
        ));
    if (packages.has(id)) return id;
    if (packages.size >= 80) throw Error('Dependency count limit');
    const { manifest, entries } = await artifact(d);
    const base = '/packages/' + id + '/';
    const record = { id, base, manifest, dependencies: Object.create(null) };
    packages.set(id, record);
    const saved: PackageIdentity = {
      name: d.name,
      version: d.version,
      tarball: d.tarball,
      integrity: d.integrity,
      dependencies: record.dependencies,
    };
    lock.packages[id] = saved;
    for (const [file, bytes] of entries) {
      if (/\.(?:[cm]?[jt]sx?|json|css|txt|md)$/i.test(file) || !file.includes('.'))
        sources.set(base + file, decoder.decode(bytes));
      else assets.set(base + file, bytes);
    }
    const children: Record<string, PackageIdentity> = Object.create(null),
      skipped: string[] = [];
    const declared = { ...manifest.dependencies, ...manifest.optionalDependencies };
    for (const [alias, spec] of Object.entries(declared)) {
      if (runtimeNames.has(alias)) {
        if (!supportsRuntime(alias, spec))
          throw Error('Incompatible runtime ' + alias + ' required by ' + id);
        continue;
      }
      const optional = Object.hasOwn(manifest.optionalDependencies || {}, alias);
      if (optional && d.skippedOptional?.includes(alias)) {
        skipped.push(alias);
        continue;
      }
      try {
        children[alias] = await select(alias, spec, d.dependencies?.[alias]);
      } catch (e) {
        if (!optional) throw e;
        optionalFailure(e);
        skipped.push(alias);
      }
    }
    const childEnv = { ...env, ...children };
    for (const [alias, child] of Object.entries(children)) {
      const before = new Set(packages.keys());
      try {
        record.dependencies[alias] = await visit(child, childEnv);
      } catch (e) {
        if (!Object.hasOwn(manifest.optionalDependencies || {}, alias)) throw e;
        optionalFailure(e);
        for (const key of packages.keys())
          if (!before.has(key)) {
            const prefix = packages.get(key)!.base;
            packages.delete(key);
            delete lock.packages[key];
            for (const map of [sources, assets])
              for (const file of map.keys()) if (file.startsWith(prefix)) map.delete(file);
          }
        skipped.push(alias);
      }
    }
    for (const [peer, range] of Object.entries(manifest.peerDependencies || {})) {
      const builtin = runtimeNames.has(peer);
      if (builtin) {
        if (!supportsRuntime(peer, range))
          throw Error('Incompatible peer ' + peer + ' required by ' + id);
        continue;
      }
      const provider = env[peer];
      if (!provider) {
        if (manifest.peerDependenciesMeta?.[peer]?.optional) continue;
        throw Error('Missing peer ' + peer + ' required by ' + id);
      }
      if (!semver.satisfies(provider.version, range))
        throw Error('Incompatible peer ' + peer + ' required by ' + id);
      const selected = previousLock
        ? await select(peer, provider.version, d.dependencies?.[peer])
        : provider;
      record.dependencies[peer] = await visit(selected, env);
    }
    if (skipped.length) saved.skippedOptional = [...new Set(skipped)];
    return id;
  }
  const rootEnv: Record<string, PackageIdentity> = Object.create(null);
  for (const [alias, spec] of Object.entries(requested)) {
    const parsed = specifier(alias, spec);
    if (runtimeNames.has(parsed.name)) {
      if (alias !== parsed.name) throw Error('Aliases of supplied runtime modules are unsupported');
      if (!supportsRuntime(parsed.name, parsed.range))
        throw Error('Incompatible runtime ' + parsed.name + '@' + parsed.range);
      continue;
    }
    if (!semver.valid(parsed.range)) throw Error('Direct dependencies must use exact versions');
    rootEnv[alias] = await select(alias, spec, previousLock?.roots?.[alias]);
  }
  async function discover(d: PackageIdentity): Promise<string> {
    const key = d.lockedId || d.name + '@' + d.version;
    if (requirements.has(key)) return key;
    const { manifest, entries } = await artifact(d);
    const record = {
      needs: new Set(Object.keys(manifest.peerDependencies || {})),
      children: [] as string[],
      provided: new Set(
        Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies }),
      ),
    }; // Include undeclared static package imports in the inherited context. This is
    // conservative: extra names only prevent unsafe deduplication, never grant access.
    for (const [file, bytes] of entries)
      if (/\.[cm]?[jt]sx?$/.test(file))
        for (const match of decoder
          .decode(bytes)
          .matchAll(
            /\b(?:require(?:\.resolve)?\s*\(\s*|import\s*\(\s*|from\s*|import\s*)(['"])([^'"\s]+)\1/g,
          )) {
          const spec = match[2],
            name = spec.startsWith('@')
              ? spec.split('/').slice(0, 2).join('/')
              : spec.split('/')[0];
          if (
            /^(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/.test(name) &&
            !record.provided.has(name) &&
            !runtimeNames.has(name) &&
            name !== manifest.name
          )
            record.needs.add(name);
        }
    requirements.set(key, record);
    for (const [alias, spec] of Object.entries({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    })) {
      if (runtimeNames.has(alias)) continue;
      if (d.skippedOptional?.includes(alias)) continue;
      try {
        const child = await select(alias, spec, d.dependencies?.[alias]);
        record.children.push(await discover(child));
      } catch (e) {
        if (!Object.hasOwn(manifest.optionalDependencies || {}, alias)) throw e;
        optionalFailure(e);
      }
    }
    return key;
  }
  for (const d of Object.values(rootEnv)) await discover(d);
  let changed = true;
  while (changed) {
    changed = false;
    for (const record of requirements.values())
      for (const child of record.children)
        for (const peer of requirements.get(child)!.needs)
          if (!record.provided.has(peer) && !record.needs.has(peer)) {
            record.needs.add(peer);
            changed = true;
          }
  }
  for (const [alias, d] of Object.entries(rootEnv)) roots[alias] = await visit(d, rootEnv);
  stats.ms = performance.now() - started;
  function owner(file: string) {
    return [...packages.values()].find((p) => file.startsWith(p.base));
  }
  function exactOrFile(
    file: string,
    base: string,
    exact = false,
    seen = new Set<string>(),
    platform: Platform = 'web',
  ): string {
    if (file !== base.slice(0, -1) && !file.startsWith(base)) throw Error('Package path escape');
    const image = platformImage(file, [...assets.keys()], platform);
    if (image) return image;
    if (seen.has(file)) throw Error('Cyclic directory entry');
    seen.add(file);
    for (const suffix of exact || file === base.slice(0, -1) ? [''] : sourceSuffixes(platform))
      if (sources.has(file + suffix) || assets.has(file + suffix)) return file + suffix;
    if (!exact) {
      const nested = sources.get(file + '/package.json');
      if (nested) {
        const main = JSON.parse(nested).main;
        if (typeof main === 'string' && main !== '.') {
          try {
            return exactOrFile(path.resolve(file, main), base, false, seen, platform);
          } catch (e) {
            if (!String(e).includes('Missing package file')) throw e;
          }
        }
      }
      for (const suffix of sourceSuffixes(platform)
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
        .map((s) => '/index' + s))
        if (sources.has(file + suffix)) return file + suffix;
    }
    throw Error('Missing package file ' + file);
  }
  const providerCache = new Map<string, string | undefined>();
  function provider(from: string, name: string): string | undefined {
    const current = owner(from);
    if (!current) return roots[name];
    if (name === current.manifest.name) return current.id;
    if (current.dependencies[name]) return current.dependencies[name];
    const key = current.id + '|' + name;
    if (providerCache.has(key)) return providerCache.get(key);
    const visited = new Set([current.id]);
    let frontier = [current.id];
    while (frontier.length) {
      const parents = [...packages.values()].filter(
        (pkg) =>
          !visited.has(pkg.id) &&
          Object.values(pkg.dependencies).some((id) => frontier.includes(id)),
      );
      const found = new Set(
        parents
          .map((pkg) => pkg.dependencies[name])
          .filter((value): value is NonNullable<typeof value> => Boolean(value)),
      );
      if (found.size > 1)
        throw Error(
          'Ambiguous ancestor provider for ' +
            name +
            ' from ' +
            current.id +
            '; declare an explicit project dependency',
        );
      if (found.size === 1) {
        const id = [...found][0];
        providerCache.set(key, id);
        return id;
      }
      frontier = parents.map((pkg) => pkg.id);
      for (const id of frontier) visited.add(id);
    }
    providerCache.set(key, roots[name]);
    return roots[name];
  }
  function resolve(
    from: string,
    spec: string,
    kind: ImportKind = 'require',
    side: Side = 'server',
    platform: Platform = 'web',
    seen = new Set<string>(),
  ): string {
    const marker = from + '|' + spec;
    if (seen.has(marker)) throw Error('Cyclic package mapping');
    seen.add(marker);
    const parent = owner(from);
    const conditions = [
      ...(side === 'server' ? ['react-server'] : []),
      platform === 'web' ? 'browser' : 'react-native',
      kind,
    ];
    const mapping = parent?.manifest[platform === 'web' ? 'browser' : 'react-native'];
    if (
      !spec.startsWith('.') &&
      mapping &&
      typeof mapping === 'object' &&
      Object.hasOwn(mapping, spec)
    ) {
      const value = mapping[spec];
      if (value === false) return '@empty';
      if (typeof value !== 'string') throw Error('Invalid browser mapping');
      if (value !== spec)
        return resolve(parent.base + 'package.json', value, kind, side, platform, seen);
    }
    function mappedFile(pkg: PackageRecord, file: string, exact = false): string {
      const found = exactOrFile(file, pkg.base, exact, new Set(), platform);
      const map = pkg.manifest[platform === 'web' ? 'browser' : 'react-native'];
      const key = './' + found.slice(pkg.base.length);
      if (map && typeof map === 'object' && Object.hasOwn(map, key)) {
        if (map[key] === false) return '@empty';
        if (typeof map[key] !== 'string') throw Error('Invalid browser mapping');
        if (map[key] !== key)
          return resolve(pkg.base + 'package.json', map[key], kind, side, platform, seen);
      }
      return found;
    }
    if (spec.startsWith('.')) {
      if (!parent) throw Error('Relative import outside package');
      return mappedFile(parent, path.resolve(path.dirname(from), spec));
    }
    if (spec.startsWith('#')) {
      if (!parent) throw Error('Package imports outside package');
      const targets = resolveImports(parent.manifest, spec, { unsafe: true, conditions });
      if (!targets?.length) throw Error('Unresolved package import');
      return resolve(parent.base + 'package.json', targets[0], kind, side, platform, seen);
    }
    if (builtinSpecifiers.has(spec)) return '@' + spec;
    rejectHostBuiltin(spec);
    const parts = spec.split('/'),
      name = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
    const subpath = spec.slice(name.length);
    const id = provider(from, name);
    if (!id || !packages.has(id)) throw Error('Unsupported server dependency: ' + spec);
    const pkg = packages.get(id)!;
    let target;
    if (pkg.manifest.exports !== undefined) {
      const targets = resolveExports(pkg.manifest, subpath ? '.' + subpath : '.', {
        unsafe: true,
        conditions,
      });
      if (!targets?.length) throw Error('Unresolved package export');
      target = targets[0];
      if (!target.startsWith('./')) throw Error('Invalid export target');
      return mappedFile(pkg, path.resolve(pkg.base, target), true);
    }
    target = subpath
      ? '.' + subpath
      : typeof pkg.manifest[platform === 'web' ? 'browser' : 'react-native'] === 'string'
      ? (pkg.manifest[platform === 'web' ? 'browser' : 'react-native'] as string)
      : pkg.manifest.main || 'index.js';
    return mappedFile(pkg, path.resolve(pkg.base, target));
  }
  function validateTarget(platform: Platform, files: string[]) {
    for (const [name, range] of Object.entries(requested))
      if (Object.hasOwn(runtimeProfiles[platform], name))
        validateRuntime(name, range, platform, 'project');
    const owners = new Set(
      [...files].map(owner).filter((value): value is NonNullable<typeof value> => Boolean(value)),
    );
    for (const pkg of owners)
      for (const [name, range] of Object.entries({
        ...pkg.manifest.dependencies,
        ...pkg.manifest.optionalDependencies,
        ...pkg.manifest.peerDependencies,
      }))
        if (
          runtimeNames.has(name) &&
          !(pkg.manifest.peerDependenciesMeta?.[name]?.optional && !runtimeProfiles[platform][name])
        )
          validateRuntime(name, range, platform, pkg.manifest.name);
  }
  function validateServer(profileName: string, modules: ModuleGraph) {
    const profile = executorProfile(profileName);
    const check = (name: string, range: string, owner: string) => {
      const version = profile[name];
      if (!version || !semver.satisfies(version, range))
        throw Error(
          `Incompatible server runtime ${name}@${range} required by ${owner} on ${profileName} executor; supplied ${
            version || 'none'
          }`,
        );
    };
    for (const [name, range] of Object.entries(requested))
      if (Object.hasOwn(profile, name)) check(name, range, 'project');
    const owners = new Set(
      Object.entries(modules)
        .filter(([, record]) => !record.client)
        .map(([file]) => owner(file))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    );
    for (const pkg of owners)
      for (const [name, range] of Object.entries({
        ...pkg.manifest.dependencies,
        ...pkg.manifest.optionalDependencies,
        ...pkg.manifest.peerDependencies,
      }))
        if (
          runtimeNames.has(name) &&
          !(pkg.manifest.peerDependenciesMeta?.[name]?.optional && !profile[name])
        )
          check(name, range, pkg.manifest.name);
  }
  return { sources, assets, resolve, lock, stats, validateTarget, validateServer, provider };
}
