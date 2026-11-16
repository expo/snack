import type { InputOptions, FileResult } from '@babel/core';
export type Platform = 'web' | 'ios' | 'android';
export type Side = 'client' | 'server';
export type ImportKind = 'import' | 'require';
export type SourceMap = NonNullable<FileResult['map']>;
export type TransformTiming = { file: string; side: Side; ms: number };
export type Edge = {
  spec: string;
  target?: string;
  kind: ImportKind;
  dynamic?: boolean;
  optional?: boolean;
};
export interface Asset {
  mime: string;
  base64: string;
  width?: number;
  height?: number;
  scale?: number;
  variants?: Asset[];
}
export interface ModuleRecord {
  code?: string;
  map?: SourceMap | null;
  async?: boolean;
  imports?: string[];
  json?: unknown;
  asset?: Asset;
  css?: string;
  classes?: Record<string, string>;
  deps: Record<string, string>;
  client?: { id: string; names: string[] };
  actions?: { name: string; id: string }[];
}
export type ModuleGraph = Record<string, ModuleRecord>;
export interface CompiledModule extends Omit<ModuleRecord, 'deps' | 'actions' | 'client'> {
  source: string | Uint8Array;
  edges: Edge[];
  names: string[];
  stars: string[];
  directives: string[];
  actions: string[];
}
export interface ClientGraph {
  modules: ModuleGraph;
  roots: Record<string, { file: string; names: string[] }>;
  hash: string;
}
export interface PreparedGraph {
  serverModules: ModuleGraph;
  client: ClientGraph;
  manifest: Record<string, { id: string; chunks: string[]; name: string }>;
  entry: string;
  name: string;
  registeredActions: string[];
  revision: number;
}
export interface PackageManifest {
  name: string;
  version: string;
  main?: string;
  browser?: string | Record<string, string | false>;
  'react-native'?: string | Record<string, string | false>;
  exports?: NonNullable<
    ReturnType<import('metro-resolver').ResolutionContext['getPackage']>
  >['exports'];
  imports?: NonNullable<
    ReturnType<import('metro-resolver').ResolutionContext['getPackage']>
  >['imports'];
  os?: string[];
  cpu?: string[];
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  workspaces?: string[] | { packages: string[] };
}
export interface PackageIdentity {
  name: string;
  version: string;
  tarball: string;
  integrity: string;
  lockedId?: string;
  dependencies?: Record<string, string>;
  skippedOptional?: string[];
}
export interface PackageLock {
  format: 2;
  roots: Record<string, string>;
  packages: Record<string, PackageIdentity>;
}
export interface PackageRecord {
  id: string;
  base: string;
  manifest: PackageManifest;
  dependencies: Record<string, string>;
}
export interface InstalledPackages {
  sources: Map<string, string>;
  assets: Map<string, Uint8Array>;
  lock: PackageLock;
  stats: {
    downloads: number;
    cacheHits: number;
    compressedBytes: number;
    expandedBytes: number;
    cacheWarnings: string[];
    ms: number;
  };
  resolve(
    from: string,
    spec: string,
    kind?: ImportKind,
    side?: Side,
    platform?: Platform,
    seen?: Set<string>,
  ): string;
  provider(from: string, name: string): string | undefined;
  validateTarget(platform: Platform, files: string[]): void;
  validateServer(profileName: string, modules: ModuleGraph): void;
}
export type BabelPlugin = NonNullable<InputOptions['plugins']>[number];
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
