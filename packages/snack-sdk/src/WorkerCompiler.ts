import type { SnackCompilationInput, SnackCompiler } from './Compiler';

/** RPC supplied by the browser worker host. No editor, account or persistence API replacement. */
export type SnackWorkerRPC = (
  message: Record<string, unknown>,
  timeout: number,
  options: { signal: AbortSignal },
) => Promise<any>;

async function loadAsset(url: string, signal: AbortSignal) {
  if (/^data:[^;,]+;base64,/.test(url)) {
    if (url.length > 1400000) throw new Error('Asset exceeds 1 MiB');
    return url;
  }
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new Error('Uploaded assets require an HTTPS URL');
  }
  const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok || !response.body) throw new Error('Asset download failed: ' + response.status);
  const reader = response.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024 * 1024) throw new Error('Asset exceeds 1 MiB');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  let binary = '';
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) binary += String.fromCharCode(chunk[i]);
  }
  return 'data:application/octet-stream;base64,' + btoa(binary);
}

export type WorkerCompilerMetric = {
  outcome: 'success' | 'error' | 'canceled';
  durationMs: number;
  sdkVersion: string;
  fileCount: number;
  dependencyCount: number;
  platformCount: number;
  artifactBytes: number;
};

/** A dedicated worker/project must be used for each instance. */
export function createWorkerCompiler(options: {
  call: SnackWorkerRPC;
  onMetric?: (metric: WorkerCompilerMetric) => void;
  readAsset?: (url: string, signal: AbortSignal) => Promise<string>;
}): SnackCompiler {
  let queue: Promise<unknown> = Promise.resolve();
  const readAsset = options.readAsset ?? loadAsset;
  return {
    name: 'browser-worker-v1',
    supports: (version) => version === '58.0.0',
    compile(input: SnackCompilationInput, signal: AbortSignal) {
      const started = Date.now();
      const task = queue
        .catch(() => {})
        .then(async () => {
          if (signal.aborted) throw new Error('Compilation canceled');
          if (input.sdkVersion !== '58.0.0') throw new Error('Worker runtime requires SDK 58');
          const files: Record<string, string | null> = {};
          for (const [name, file] of Object.entries(input.files)) {
            if (
              !/^[\w@./-]+$/.test(name) ||
              name.split('/').some((p) => !p || p === '.' || p === '..')
            )
              throw new Error('Invalid project path: ' + name);
            if (name.startsWith('__snack_internal__/'))
              throw new Error('Reserved worker path: ' + name);
            if (typeof file.contents !== 'string')
              throw new Error('Wait for asset uploads before compiling');
            files[name] =
              file.type === 'ASSET' ? await readAsset(file.contents, signal) : file.contents;
          }
          const entry = ['App.tsx', 'App.ts', 'App.jsx', 'App.js'].find(
            (name) => files[name] != null,
          );
          if (!entry) throw new Error('Project needs an App entry');
          files['__snack_internal__/Root.tsx'] =
            "'use client';export {default} from '../" + entry + "';";
          files['__snack_internal__/entry.tsx'] =
            "import React from 'react';import App from './Root';export function render(){return <App/>}";
          const call = (message: Record<string, unknown>) =>
            options.call(message, 90000, { signal });
          const previous = await call({ operation: 'snapshot' });
          for (const name of Object.keys(previous.snapshot?.files ?? {}))
            if (!(name in files)) files[name] = null;
          const dependencies = Object.fromEntries(
            Object.entries(input.dependencies).map(([name, dep]) => [name, dep.version]),
          );
          const result = await call({
            operation: 'render',
            files,
            dependencies,
            entry: '__snack_internal__/entry.tsx',
            name: 'render',
          });
          const platforms: Partial<Record<'web' | 'ios' | 'android', string>> = {};
          const errors: Partial<Record<'web' | 'ios' | 'android', string>> = {};
          for (const platform of ['web', 'ios', 'android'] as const) {
            try {
              const graph =
                platform === 'web'
                  ? result
                  : await call({
                      operation: 'client-graph',
                      platform,
                      entry: '__snack_internal__/entry.tsx',
                      name: 'render',
                    });
              if (Object.values(graph.client.modules).some((record: any) => record.actions))
                throw new Error('Server actions are not supported in ordinary Snack projects');
              platforms[platform] = JSON.stringify({ client: graph.client, flight: result.flight });
            } catch (error) {
              if (signal.aborted || platform === 'web') throw error;
              errors[platform] = error instanceof Error ? error.message : String(error);
            }
          }
          return {
            format: 'snack-worker-graph' as const,
            version: 1 as const,
            sdkVersion: input.sdkVersion,
            platforms,
            errors,
          };
        });
      queue = task;
      const report = (
        outcome: WorkerCompilerMetric['outcome'],
        platformCount = 0,
        artifactBytes = 0,
      ) => {
        try {
          options.onMetric?.({
            outcome,
            durationMs: Date.now() - started,
            sdkVersion: input.sdkVersion,
            fileCount: Object.keys(input.files).length,
            dependencyCount: Object.keys(input.dependencies).length,
            platformCount,
            artifactBytes,
          });
        } catch {
          /* Observability must not break compilation. */
        }
      };
      return task.then(
        (artifact) => {
          report(
            'success',
            Object.keys(artifact.platforms).length,
            new TextEncoder().encode(JSON.stringify(artifact)).byteLength,
          );
          return artifact;
        },
        (error) => {
          report(signal.aborted ? 'canceled' : 'error');
          throw error;
        },
      );
    },
  };
}
