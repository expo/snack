import type { SDKVersion, SnackDependencies, SnackFiles } from 'snack-content';

/** Project data passed to a compiler, without account or transport credentials. */
export type SnackCompilationInput = {
  files: SnackFiles;
  dependencies: SnackDependencies;
  sdkVersion: SDKVersion;
};

/** Serialized graphs for runtimes that support the worker graph protocol. */
export type SnackCompiledArtifact = {
  format: 'snack-worker-graph';
  version: 1;
  sdkVersion: SDKVersion;
  /** Omitted platforms must not receive an update. */
  platforms: Partial<Record<'web' | 'ios' | 'android', string>>;
  errors?: Partial<Record<'web' | 'ios' | 'android', string>>;
};

/**
 * A caller-owned compiler. Implementations must not mutate the input and should
 * stop work when the signal is aborted. Callers must discard stale results even
 * when an implementation cannot cancel its underlying work.
 */
export interface SnackCompiler {
  readonly name: string;
  /** A synchronous capability check; it must not start compilation. */
  supports(sdkVersion: SDKVersion): boolean;
  compile(input: SnackCompilationInput, signal: AbortSignal): Promise<SnackCompiledArtifact>;
}

/** Experimental selection configuration; not yet accepted by the Snack constructor. */
export type SnackCompilerOptions = {
  /** Supplying a compiler opts in for the SDK versions it supports. */
  compiler?: SnackCompiler;
};

/** Selection does not construct a worker, resolve dependencies, or compile code. */
export type SnackCompilerSelection =
  | { backend: 'snackager' }
  | { backend: 'compiler'; compiler: SnackCompiler };

/**
 * Select for the current SDK each time it changes. Omitted compilers and
 * unsupported SDKs retain Snackager. Capability errors propagate to the caller;
 * they must not silently route an opted-in project to a different backend.
 */
export function selectSnackCompiler(
  sdkVersion: SDKVersion,
  options: SnackCompilerOptions = {},
): SnackCompilerSelection {
  const compiler = options.compiler;
  return compiler?.supports(sdkVersion)
    ? { backend: 'compiler', compiler }
    : { backend: 'snackager' };
}
