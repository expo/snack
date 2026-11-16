import type { PluginObject, NodePath } from '@babel/core';
import * as Babel from '@babel/standalone';
import type * as BT from '@babel/types';
import { reactServerActionsPlugin } from 'expo-actions-transform';
import { reactUseCachePlugin } from 'expo-cache-transform';
import path from 'path-browserify';
import refreshPlugin from 'react-refresh/babel';
import { exports as resolveExports } from 'resolve.exports';
import workletsPlugin from 'worklets-transform';

import { builtinSpecifiers, rejectHostBuiltin } from './builtin-specifiers';
import { compileCSS } from './css';
import { isImage, buildImageAsset, platformImage } from './image-assets';
import { MetroResolver, metroModulePlugin } from './metro-backend';
import { targetPlatform, sourceSuffixes } from './platform';
import { runtimeNames, runtimeProfiles } from './runtime-profiles';
import {
  errorMessage,
  type BabelPlugin,
  type Platform,
  type Side,
  type ImportKind,
  type CompiledModule,
  type InstalledPackages,
  type TransformTiming,
  type Edge,
  type ModuleGraph,
  type ClientGraph,
  type PreparedGraph,
  type PackageManifest,
} from './types';
type Binding = NonNullable<ReturnType<NodePath['scope']['getBinding']>>;

function hasCatchHandler(node: BT.Node): boolean {
  return node.type === 'TryStatement' && !!node.handler;
}
const runtimeImports = new Set([
  ...builtinSpecifiers,
  'buffer',
  'node:buffer',
  'events',
  'node:events',
  'path',
  'node:path',
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native',
  'react-native-safe-area-context',
  '@expo/ui',
  'expo-font',
  'expo-image',
  'expo-audio',
  'expo-video',

  'react-native-svg',
  'expo-linear-gradient',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-worklets',
  'react-dom',
  'react-server-dom-webpack/server',
  'expo-router/cache',
  'snack:state',
]);
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  return value;
}
export async function hash(value: unknown) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(canonical(value))),
      ),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
export class Compiler {
  readonly backend: string;
  readonly metro: MetroResolver | null;
  constructor({ backend = 'custom' } = {}) {
    if (!['custom', 'metro'].includes(backend)) throw Error('Unknown compiler backend');
    this.backend = backend;
    this.metro = backend === 'metro' ? new MetroResolver() : null;
  }
  platform: Platform = 'web';
  files = new Map<string, string>();
  cache = new Map<string, CompiledModule>();
  packages: InstalledPackages | null = null;
  revision = 0;
  remember(key: string, value: CompiledModule) {
    const bytes = (v: CompiledModule) =>
      (typeof v.source === 'string' ? v.source.length * 2 : v.source?.byteLength || 0) +
      (v.code?.length || 0) * 2 +
      JSON.stringify(v.map || {}).length * 2 +
      JSON.stringify(v.asset || {}).length * 2;
    if (bytes(value) > 24 * 1024 * 1024) throw Error('Compiled module size limit exceeded');
    this.cache.set(key, value);
    while (
      this.cache.size > 600 ||
      [...this.cache.values()].reduce((n, v) => n + bytes(v), 0) > 24 * 1024 * 1024
    )
      this.cache.delete(this.cache.keys().next().value!);
  }
  edit(edits: Record<string, string | null>) {
    const next = new Map(this.files);
    for (const [name, source] of Object.entries(edits)) {
      if (!/^[\w@./-]+$/.test(name) || name.split('/').some((p) => !p || p === '.' || p === '..'))
        throw Error('Invalid project path');
      if (source === null) next.delete('/project/' + name);
      else {
        if (
          typeof source !== 'string' ||
          source.length >
            (/\.(png|jpe?g|gif|webp|svg|ttf|otf|mp3|m4a|wav|ogg|mp4|webm)$/i.test(name)
              ? 1400000
              : 200000)
        )
          throw Error('Invalid source');
        next.set('/project/' + name, source);
      }
    }
    if (next.size > 100 || [...next.values()].reduce((n, s) => n + s.length, 0) > 8000000)
      throw Error('Project limit exceeded');
    this.files = next;
    this.revision++;
    for (const key of this.cache.keys())
      if (key.includes('/project/') && !next.has(key.slice(key.indexOf('/project/'))))
        this.cache.delete(key);
  }
  workspace(spec: string, kind: ImportKind, side: Side): string | null {
    const platform = side === 'client' ? this.platform : 'web';
    const root = this.files.get('/project/package.json');
    if (!root) return null;
    const config: PackageManifest = JSON.parse(root),
      patterns = Array.isArray(config.workspaces) ? config.workspaces : config.workspaces?.packages;
    if (!Array.isArray(patterns)) return null;
    const parts = spec.split('/'),
      name = spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0],
      sub = spec.slice(name.length);
    for (const [file, source] of this.files) {
      if (file === '/project/package.json' || !file.endsWith('/package.json')) continue;
      const directory = path.dirname(file).slice(9);
      if (
        !patterns.some((pattern) => {
          if (typeof pattern !== 'string' || pattern.includes('..'))
            throw Error('Invalid workspace pattern');
          return pattern.endsWith('/*')
            ? directory.startsWith(pattern.slice(0, -1)) &&
                !directory.slice(pattern.length - 1).includes('/')
            : directory === pattern;
        })
      )
        continue;
      const manifest: PackageManifest = JSON.parse(source);
      if (manifest.name !== name) continue;
      let target;
      if (manifest.exports !== undefined) {
        target = resolveExports(manifest, sub ? '.' + sub : '.', {
          unsafe: true,
          conditions: [
            ...(side === 'server' ? ['react-server'] : []),
            platform === 'web' ? 'browser' : 'react-native',
            kind,
          ],
        })?.[0];
        if (!target?.startsWith('./')) throw Error('Unsupported workspace export');
      } else
        target = sub
          ? '.' + sub
          : typeof manifest[platform === 'web' ? 'browser' : 'react-native'] === 'string'
          ? (manifest[platform === 'web' ? 'browser' : 'react-native'] as string)
          : manifest.main || 'index.js';
      const base = path.dirname(file) + '/',
        resolved = path.resolve(base, target);
      if (!resolved.startsWith(base)) throw Error('Workspace export path escape');
      return this.resolve(file, './' + path.relative(base, resolved), kind, side);
    }
    return null;
  }
  resolve(from: string, spec: string, kind: ImportKind, side: Side): string {
    const platform = side === 'client' ? this.platform : 'web';
    const query = /\?(raw|url)$/.exec(spec);
    if (query) {
      const resolved = this.resolve(from, spec.slice(0, -query[0].length), kind, side);
      if (resolved.startsWith('@')) throw Error('Asset query cannot target runtime modules');
      return resolved + query[0];
    }
    if (builtinSpecifiers.has(spec) && from.startsWith('/packages/') && this.packages)
      return this.packages.resolve(from, spec, kind, side, platform);
    if (spec.startsWith('.') && from.startsWith('/project/')) {
      const image = path.resolve(path.dirname(from), spec);
      if (image.startsWith('/project/')) {
        const selected = platformImage(image, [...this.files.keys()], platform);
        if (selected) return selected;
      }
    }
    if (runtimeImports.has(spec)) {
      if (side === 'client' && runtimeNames.has(spec) && !runtimeProfiles[platform][spec])
        throw Error('Runtime module ' + spec + ' is unavailable on ' + platform);
      return '@' + spec;
    }
    if (!this.packages) rejectHostBuiltin(spec);
    if (this.metro) {
      const workspace = from.startsWith('/project/') ? this.workspace(spec, kind, side) : null;
      if (workspace) return workspace;
      return this.metro.resolve(this, from, spec, kind, side);
    }
    if (spec.startsWith('.') && from.startsWith('/project/')) {
      const base = path.resolve(path.dirname(from), spec);
      if (!base.startsWith('/project/')) throw Error('Project path escape');
      for (const suffix of [
        ...sourceSuffixes(platform),
        ...sourceSuffixes(platform)
          .filter(Boolean)
          .map((s) => '/index' + s),
      ])
        if (this.files.has(base + suffix)) return base + suffix;
      throw Error('Missing module ' + spec + ' from ' + from);
    }
    const workspace = from.startsWith('/project/') ? this.workspace(spec, kind, side) : null;
    if (workspace) return workspace;
    if (this.packages) return this.packages.resolve(from, spec, kind, side, platform);
    throw Error('Unsupported server dependency: ' + spec);
  }
  compile(file: string, side: Side, transforms: TransformTiming[]): CompiledModule {
    if (/\.node(?:\?|$)/i.test(file))
      throw Error(
        'Native Node addon ' +
          file +
          ' requires Node-API/native code; select a browser or WebAssembly export',
      );
    const query = /\?(raw|url)$/.exec(file)?.[1],
      physical = query ? file.slice(0, -query.length - 1) : file;
    let source =
      this.files.get(physical) ??
      this.packages?.sources.get(physical) ??
      this.packages?.assets.get(physical);
    if (!query && isImage(physical)) {
      const read = (p: string) =>
        this.files.get(p) ?? this.packages?.sources.get(p) ?? this.packages?.assets.get(p);
      const asset = buildImageAsset(
        physical,
        [...this.files.keys(), ...(this.packages?.assets.keys() || [])],
        read,
      );
      const source = JSON.stringify(asset),
        key = side + ':' + file;
      let cached = this.cache.get(key);
      if (cached?.source === source) return cached;
      cached = {
        source,
        asset,
        edges: [],
        names: ['default'],
        stars: [],
        directives: [],
        actions: [],
      };
      this.remember(key, cached);
      return cached;
    }
    if (source === undefined) throw Error('Missing module ' + file);
    if (
      typeof source === 'string' &&
      (physical.endsWith('.svg')
        ? source.startsWith('data:')
        : /\.(png|jpe?g|gif|webp|svg|ttf|otf|mp3|m4a|wav|ogg|mp4|webm)$/i.test(physical))
    ) {
      const match = /^data:[^;,]+;base64,([A-Za-z0-9+/]*={0,2})$/.exec(source);
      if (!match) throw Error('Expected a base64 asset for ' + physical);
      source = Uint8Array.from(atob(match[1]), (c) => c.charCodeAt(0));
    }
    if (query === 'raw')
      return {
        source,
        json: typeof source === 'string' ? source : new TextDecoder().decode(source),
        edges: [],
        names: ['default'],
        stars: [],
        directives: [],
        actions: [],
      };
    if (typeof source === 'string' && (query === 'url' || /\.svg$/i.test(file)))
      source = new TextEncoder().encode(source);
    const key = side + ':' + file;
    let cached = this.cache.get(key);
    if (cached?.source === source) return cached;
    const start = performance.now();
    if (source instanceof Uint8Array) {
      const ext = physical.split('.').pop()!.toLowerCase(),
        mime =
          {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            webp: 'image/webp',
            svg: 'image/svg+xml',
            mp3: 'audio/mpeg',
            m4a: 'audio/mp4',
            wav: 'audio/wav',
            ogg: 'audio/ogg',
            mp4: 'video/mp4',
            webm: 'video/webm',
            ttf: 'font/ttf',
            otf: 'font/otf',
            woff: 'font/woff',
            woff2: 'font/woff2',
            wasm: 'application/wasm',
          }[ext] || 'application/octet-stream';
      if (ext === 'node') throw Error('Native Node addons cannot run in a browser worker');
      let binary = '';
      for (let i = 0; i < source.length; i += 8192)
        binary += String.fromCharCode(...source.subarray(i, i + 8192));
      cached = {
        source,
        asset: { mime, base64: btoa(binary) },
        edges: [],
        names: ['default'],
        stars: [],
        directives: [],
        actions: [],
      };
      this.remember(key, cached);
      return cached;
    }
    if (file.endsWith('.css')) {
      cached = {
        source,
        css: source,
        edges: [],
        names: [],
        stars: [],
        directives: [],
        actions: [],
      };
      this.remember(key, cached);
      return cached;
    }
    if (file.endsWith('.txt')) {
      cached = {
        source,
        json: source,
        edges: [],
        names: ['default'],
        stars: [],
        directives: [],
        actions: [],
      };
      this.remember(key, cached);
      return cached;
    }
    if (file.endsWith('.json')) {
      cached = {
        source,
        json: JSON.parse(source),
        edges: [],
        names: [],
        stars: [],
        directives: [],
        actions: [],
      };
      this.remember(key, cached);
      return cached;
    }
    const edges: Edge[] = [],
      names: string[] = [],
      stars: string[] = [],
      directives: string[] = [];
    let asyncModule = false;
    const available = [
      ...this.files.keys(),
      ...(this.packages?.sources.keys() || []),
      ...(this.packages?.assets.keys() || []),
    ];
    const collect = ({ types: t }: { types: typeof BT }): PluginObject => ({
      visitor: {
        Program: {
          enter(program) {
            for (const d of program.node.directives) directives.push(d.value.value);
            function add(node: BT.StringLiteral, kind: ImportKind) {
              const original = node.value,
                token = kind === 'import' ? '__rsc_import__:' + original : original;
              edges.push({ spec: token, target: original, kind });
              node.value = token;
              return token;
            }
            function finiteStrings(arg: NodePath, seen = new Set<Binding>()): string[] | null {
              if (arg.isStringLiteral()) return [arg.node.value];
              if (arg.isConditionalExpression()) {
                const a = finiteStrings(arg.get('consequent'), new Set(seen)),
                  b = finiteStrings(arg.get('alternate'), new Set(seen));
                return a && b ? [...new Set([...a, ...b])] : null;
              }
              if (arg.isIdentifier()) {
                const binding = arg.scope.getBinding(arg.node.name);
                if (!binding?.constant || !binding.path.isVariableDeclarator() || seen.has(binding))
                  return null;
                seen.add(binding);
                const init = binding.path.get('init');
                return init.node ? finiteStrings(init as NodePath, seen) : null;
              }
              if (arg.isArrayExpression()) {
                const values = arg
                  .get('elements')
                  .map((item) =>
                    item.node ? finiteStrings(item as NodePath, new Set(seen)) : null,
                  );
                return values.every((value): value is string[] => value !== null)
                  ? [...new Set(values.flat())]
                  : null;
              }
              if (arg.isMemberExpression() && arg.node.computed) {
                return finiteStrings(arg.get('object'), seen);
              }
              return null;
            }
            function context(p: NodePath, arg: NodePath, kind: ImportKind) {
              if (!arg.isExpression()) throw p.buildCodeFrameError('Expected import expression');
              const finite = finiteStrings(arg);
              if (finite) {
                if (!finite.length || finite.length > 200)
                  throw p.buildCodeFrameError('Computed import context limit');
                return t.callExpression(t.identifier('__rsc_context__'), [
                  t.objectExpression(
                    finite.map((spec) => {
                      const token = add(t.stringLiteral(spec), kind);
                      edges[edges.length - 1].dynamic = true;
                      return t.objectProperty(t.stringLiteral(spec), t.stringLiteral(token));
                    }),
                  ),
                  t.cloneNode(arg.node, true),
                ]);
              }
              if (!arg.isTemplateLiteral() || !arg.node.expressions.length)
                throw p.buildCodeFrameError('Computed import requires a relative template literal');
              const fragments = arg.node.quasis.map((q) => q.value.cooked ?? q.value.raw);
              if (!fragments[0]?.startsWith('./') && !fragments[0]?.startsWith('../'))
                throw p.buildCodeFrameError('Computed import context must be relative');
              if (!/\.[a-z0-9]+$/i.test(fragments.at(-1) ?? ''))
                throw p.buildCodeFrameError(
                  'Computed import context needs a literal file extension',
                );
              const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const pattern = new RegExp('^' + fragments.map(escape).join('[^/]+') + '$');
              const matches = available
                .map((candidate) => ({
                  candidate,
                  spec:
                    (path.relative(path.dirname(file), candidate).startsWith('.') ? '' : './') +
                    path.relative(path.dirname(file), candidate),
                }))
                .filter(({ spec }) => pattern.test(spec));
              if (matches.length > 200)
                throw p.buildCodeFrameError('Computed import context limit');
              const entries = matches.map(({ spec }) => {
                const token = add(t.stringLiteral(spec), kind);
                edges[edges.length - 1].dynamic = true;
                return t.objectProperty(t.stringLiteral(spec), t.stringLiteral(token));
              });
              return t.callExpression(t.identifier('__rsc_context__'), [
                t.objectExpression(entries),
                t.cloneNode(arg.node, true),
              ]);
            }
            function dynamic(p: NodePath, arg: NodePath) {
              const evaluated = arg.evaluate();
              let token;
              if (evaluated.confident && typeof evaluated.value === 'string') {
                token = t.stringLiteral(add(t.stringLiteral(evaluated.value), 'import'));
                edges[edges.length - 1].dynamic = true;
              } else token = context(p, arg, 'import');
              p.replaceWith(t.callExpression(t.identifier('__rsc_import__'), [token]));
            }

            program.traverse({
              AwaitExpression(p) {
                if (!p.getFunctionParent()) asyncModule = true;
              },
              ForOfStatement(p) {
                if (p.node.await && !p.getFunctionParent()) asyncModule = true;
              },
              NewExpression(p) {
                const n = p.node;
                if (
                  t.isIdentifier(n.callee, { name: 'URL' }) &&
                  n.arguments.length === 2 &&
                  t.isStringLiteral(n.arguments[0]) &&
                  t.isMemberExpression(n.arguments[1]) &&
                  t.isMetaProperty(n.arguments[1].object) &&
                  t.isIdentifier(n.arguments[1].property, { name: 'url' })
                ) {
                  const spec = n.arguments[0].value;
                  if (!spec.startsWith('.'))
                    throw p.buildCodeFrameError('Asset URL must be relative');
                  const token = add(t.stringLiteral(spec), 'require');
                  p.node.arguments = [
                    t.callExpression(t.identifier('require'), [t.stringLiteral(token)]),
                  ];
                }
              },
              MemberExpression(p) {
                if (t.isMetaProperty(p.node.object) && p.node.object.meta.name === 'import') {
                  if (t.isIdentifier(p.node.property, { name: 'url' }))
                    p.replaceWith(t.stringLiteral('rsc:' + file));
                  else if (t.isIdentifier(p.node.property, { name: 'env' }))
                    p.replaceWith(
                      t.valueToNode({
                        MODE: 'production',
                        PROD: true,
                        DEV: false,
                        SSR: side === 'server',
                      }),
                    );
                  else throw p.buildCodeFrameError('Unsupported import.meta property');
                }
              },
              ImportDeclaration(p) {
                if (p.node.importKind !== 'type') add(p.node.source, 'import');
              },
              ExportNamedDeclaration(p) {
                const n = p.node;
                if (n.exportKind === 'type') return;
                if (n.source) add(n.source, 'import');
                if (n.declaration) {
                  const d = n.declaration;
                  if ('id' in d && t.isIdentifier(d.id)) names.push(d.id.name);
                  for (const v of t.isVariableDeclaration(d) ? d.declarations : []) {
                    for (const name of Object.keys(t.getBindingIdentifiers(v.id))) names.push(name);
                  }
                }
                for (const s of n.specifiers || [])
                  names.push(t.isIdentifier(s.exported) ? s.exported.name : s.exported.value);
              },
              ExportDefaultDeclaration() {
                names.push('default');
              },
              ExportAllDeclaration(p) {
                stars.push(p.node.source.value);
                add(p.node.source, 'import');
              },
              ImportExpression(p) {
                dynamic(p, p.get('source'));
              },
              CallExpression(p) {
                if (p.node.callee.type === 'Import') {
                  dynamic(p, p.get('arguments.0'));
                  return;
                }
                const c = p.node.callee;
                const isRequire = c.type === 'Identifier' && c.name === 'require',
                  isResolve =
                    c.type === 'MemberExpression' &&
                    t.isIdentifier(c.object, { name: 'require' }) &&
                    t.isIdentifier(c.property, { name: 'resolve' });
                if ((isRequire || isResolve) && !p.scope.hasBinding('require')) {
                  if (p.node.arguments.length !== 1) throw p.buildCodeFrameError('Invalid require');
                  const arg = p.get('arguments.0').evaluate();
                  if (!arg.confident || typeof arg.value !== 'string') {
                    p.node.arguments[0] = context(p, p.get('arguments.0'), 'require');
                    p.skip();
                    return;
                  }
                  p.node.arguments[0] = t.stringLiteral(arg.value);
                  add(p.node.arguments[0], 'require');
                  if (isRequire) {
                    let child: NodePath = p;
                    while (child.parentPath && !child.parentPath.isFunction()) {
                      const parent: NodePath = child.parentPath;

                      if (hasCatchHandler(parent.node) && child.key === 'block') {
                        edges[edges.length - 1].optional = true;
                        break;
                      }
                      child = parent;
                    }
                  }
                }
              },
            });
          },
        },
      },
    });
    const workletOutput =
      side === 'client'
        ? Babel.transform(source, {
            filename: file,
            sourceMaps: true,
            presets: ['typescript', ['react', { runtime: 'classic' }]],
            plugins: [[workletsPlugin, { bundleMode: false, disableSourceMaps: true }]],
          })
        : null;
    let output = Babel.transform(workletOutput?.code ?? source, {
      inputSourceMap: workletOutput?.map ?? undefined,
      filename: file,
      ast: !!this.metro,
      sourceMaps: true,
      sourceFileName: file,
      caller: {
        name: 'snack-worker',
        isReactServer: side === 'server',
        isServer: side === 'server',
        isDev: true,
        projectRoot: '/project',
      },
      presets: ['typescript', ['react', { runtime: 'classic' }]],
      plugins: [
        collect,
        ...(side === 'client'
          ? [[refreshPlugin, { skipEnvCheck: true, emitFullSignatures: true }] as BabelPlugin]
          : []),
        ...(side === 'server' && file.startsWith('/project/')
          ? [reactUseCachePlugin, reactServerActionsPlugin]
          : []),
        'transform-export-namespace-from',
        ...(this.metro ? [] : ['transform-modules-commonjs']),
      ],
    });
    if (this.metro) {
      const metadata = output.metadata;
      output = Babel.transformFromAst(output.ast, source, {
        filename: file,
        sourceMaps: true,
        sourceFileName: file,
        plugins: [metroModulePlugin],
      });
      output.metadata = metadata;
    }
    cached = {
      source,
      code: output.code,
      map: output.map,
      async: asyncModule,
      edges,
      names,
      stars,
      directives,
      actions: output.metadata.reactServerActions?.names || [],
    };
    this.remember(key, cached);
    transforms.push({
      file: file.startsWith('/project/') ? './' + file.slice(9) : file,
      side,
      ms: performance.now() - start,
    });
    return cached;
  }
  exportNames(file: string, transforms: TransformTiming[], seen = new Set<string>()): string[] {
    if (seen.has(file)) return [];
    seen.add(file);
    const info = this.compile(file, 'client', transforms);
    const names = new Set(info.names);
    for (const spec of info.stars) {
      const dep = this.resolve(file, spec, 'import', 'client');
      for (const name of this.exportNames(dep, transforms, new Set(seen)))
        if (name !== 'default') names.add(name);
    }
    return [...names].sort();
  }
  boundaryFile(file: string, platform: Platform): string {
    if (!file.startsWith('/project/')) return file;
    const previous = this.platform;
    this.platform = platform;
    try {
      const stem = path
        .basename(file)
        .replace(/\.(?:web|native|ios|android)(?=\.[cm]?[jt]sx?$)/, '')
        .replace(/\.[cm]?[jt]sx?$/, '');
      return this.resolve(file, './' + stem, 'import', 'client');
    } catch {
      if (platform !== 'web' && /\.web\.[cm]?[jt]sx?$/.test(file))
        throw Error('No ' + platform + ' implementation for client boundary ' + file);
      return file;
    } finally {
      this.platform = previous;
    }
  }
  async prepare(
    entry: string,
    name: string,
    transforms: TransformTiming[],
    platform: Platform = 'web',
  ) {
    this.platform = targetPlatform(platform);
    const clientModules: ModuleGraph = {},
      serverModules: ModuleGraph = {},
      roots: ClientGraph['roots'] = {},
      manifest: PreparedGraph['manifest'] = {};
    const visit = (file: string, side: Side): void => {
      if (file.startsWith('@')) return;
      const modules = side === 'server' ? serverModules : clientModules;
      if (Object.hasOwn(modules, file)) return;
      const info = this.compile(file, side, transforms);
      modules[file] = {
        code: info.code,
        map: info.map,
        async: info.async,
        imports: info.edges.filter((e) => e.kind === 'import' && !e.dynamic).map((e) => e.spec),
        json: info.json,
        asset: info.asset,
        css: info.css,
        deps: {},
      };
      if (info.css !== undefined) {
        Object.assign(modules[file], compileCSS(this, file, side, transforms));
        return;
      }
      if (side === 'server' && info.directives.includes('use client')) {
        const id = file.startsWith('/project/')
          ? './' + path.relative('/project', file)
          : 'npm:' + file.slice('/packages/'.length);
        const names = this.exportNames(file, transforms);
        manifest[id] = { id, chunks: [], name: '*' };
        const target = this.boundaryFile(file, this.platform);
        const targetNames = this.exportNames(target, transforms);
        if (names.some((name) => !targetNames.includes(name)))
          throw Error('Platform boundary export mismatch: ' + target);
        roots[id] = { file: target, names };
        modules[file] = { client: { id, names }, deps: {} };
        visit(target, 'client');
        return;
      }
      if (side === 'client' && info.directives.includes('use server')) {
        const serverInfo = this.compile(file, 'server', transforms);
        if (!serverInfo.actions.length)
          throw Error('Server action module has no registered actions');
        visit(file, 'server');
        modules[file] = {
          actions: serverInfo.actions.map((n) => ({
            name: n,
            id: './' + path.relative('/project', file) + '#' + n,
          })),
          deps: {},
        };
        return;
      }
      for (const e of info.edges) {
        let resolved;
        try {
          resolved = this.resolve(file, e.target ?? e.spec, e.kind, side);
        } catch (error) {
          if (
            e.optional &&
            /Module does not exist in the Haste module map|Unsupported server dependency:|Missing module |Missing package file |Unresolved package export/.test(
              errorMessage(error),
            )
          ) {
            resolved = '/optional-missing/' + encodeURIComponent(file + '|' + e.spec);
            modules[resolved] = {
              code:
                'throw Object.assign(new Error(' +
                JSON.stringify(
                  'Cannot find optional module ' + (e.target ?? e.spec) + ' from ' + file,
                ) +
                '),{code:"MODULE_NOT_FOUND"});',
              deps: {},
            };
          } else {
            throw Error(
              'Cannot resolve ' +
                (e.target ?? e.spec) +
                ' from ' +
                file +
                ': ' +
                errorMessage(error),
            );
          }
        }
        if (
          side === 'server' &&
          [
            '@react-native',
            '@react-native-safe-area-context',
            '@@expo/ui',
            '@expo-font',
            '@expo-image',
            '@expo-audio',
            '@expo-video',

            '@react-native-svg',
            '@expo-linear-gradient',
            '@react-native-gesture-handler',
            '@react-native-reanimated',
            '@react-native-worklets',
            '@react-dom',
          ].includes(resolved)
        )
          throw Error('react-native must stay behind a use-client boundary');
        if (side === 'client' && (resolved === '@expo-router/cache' || resolved === '@snack:state'))
          throw Error('Server-only dependency in client graph');
        modules[file].deps[e.spec] = resolved;
        visit(resolved, side);
      }
      // Expo injects this import after analysis.
      if (side === 'server')
        modules[file].deps['react-server-dom-webpack/server'] = '@react-server-dom-webpack/server';
    };
    visit(entry, 'server');
    const info = this.compile(entry, 'server', transforms);
    if (!info.names.includes(name) || info.directives.includes('use client'))
      throw Error('Unknown server export');
    // All client boundaries are versioned together, including newly added files.
    for (const file of this.files.keys()) {
      if (
        !/\.[cm]?[jt]sx?$/.test(file) ||
        /\.(ios|android|native)\.[cm]?[jt]sx?$/.test(file) ||
        this.boundaryFile(file, 'web') !== file
      )
        continue;
      const candidate = this.compile(file, 'server', transforms);
      if (candidate.directives.includes('use client') && this.boundaryFile(file, 'web') === file)
        visit(file, 'server');
    }
    for (const modules of [serverModules, clientModules]) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const mod of Object.values(modules))
          if (!mod.async && mod.imports?.some((spec) => modules[mod.deps[spec]]?.async)) {
            mod.async = true;
            changed = true;
          }
      }
      const checked = new Set();
      function check(file: string, visiting = new Set<string>()): void {
        if (checked.has(file)) return;
        if (visiting.has(file)) throw Error('Async import cycle unsupported: ' + file);
        const mod = modules[file];
        if (!mod?.async) return;
        visiting.add(file);
        for (const spec of mod.imports || []) check(mod.deps[spec], visiting);
        visiting.delete(file);
        checked.add(file);
      }
      for (const [file, mod] of Object.entries(modules))
        if (mod.async) {
          check(file);
          const transformed = Babel.transform(mod.code!, {
            filename: file,
            inputSourceMap: mod.map ?? undefined,
            sourceMaps: true,
            plugins: [
              ({ types: t }: { types: typeof BT }): PluginObject => ({
                visitor: {
                  CallExpression(p) {
                    if (
                      t.isIdentifier(p.node.callee) &&
                      ['require', '__metroDefault', '__metroAll'].includes(p.node.callee.name) &&
                      t.isStringLiteral(p.node.arguments[0]) &&
                      p.node.arguments[0].value.startsWith('__rsc_import__:')
                    ) {
                      const loaded = t.awaitExpression(
                        t.callExpression(t.identifier('__rsc_load__'), p.node.arguments),
                      );
                      p.replaceWith(
                        p.node.callee.name === 'require'
                          ? loaded
                          : t.callExpression(t.identifier(p.node.callee.name + 'Value'), [loaded]),
                      );
                    }
                  },
                },
              }),
            ],
          });
          mod.code = transformed.code;
          mod.map = transformed.map;
        }
    }
    this.packages?.validateTarget?.(this.platform, Object.keys(clientModules));
    const client: ClientGraph = { modules: clientModules, roots, hash: '' };
    client.hash = await hash({
      runtime: runtimeProfiles[this.platform],
      backend: this.backend,
      platform: this.platform,
      client,
    });
    return {
      serverModules,
      client,
      manifest,
      entry,
      name,
      registeredActions: info.actions,
      revision: this.revision,
    };
  }
}
