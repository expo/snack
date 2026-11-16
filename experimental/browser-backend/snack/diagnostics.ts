import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';

import type { ModuleGraph, ModuleRecord, Asset } from './types';
export function diagnose(error: unknown, modules: ModuleGraph = {}) {
  const detail =
    error && typeof error === 'object'
      ? (error as { stack?: unknown; name?: unknown; message?: unknown })
      : {};
  const stack = String(detail.stack || '').slice(0, 16000);
  let location;
  for (const line of stack.split('\n')) {
    const match = /rsc:(\/[^\s)]+?):(\d+):(\d+)/.exec(line);
    if (!match) continue;
    const file = decodeURI(match[1]);
    const record = modules[file];
    if (!record?.map) continue;
    const mapped = originalPositionFor(new TraceMap(record.map), {
      line: Math.max(1, Number(match[2]) - 2),
      column: Math.max(0, Number(match[3]) - 1),
    });
    if (mapped.line) {
      location = { file, line: mapped.line, column: (mapped.column ?? 0) + 1 };
      break;
    }
  }
  return {
    code:
      detail.name === 'AbortError'
        ? 'CANCELED'
        : /timed out/i.test(String(detail.message || ''))
        ? 'TIMEOUT'
        : 'ERROR',
    message: String(detail.message || error).slice(0, 4000),
    stack,
    location,
  };
}
export function sourceCode(record: ModuleRecord, file: string) {
  return record.code + '\n//# sourceURL=rsc:' + encodeURI(file) + '\n';
}
export function namespace(module: unknown) {
  if (
    module &&
    (typeof module === 'object' || typeof module === 'function') &&
    '__esModule' in module &&
    module.__esModule
  )
    return module;
  return Object.assign(
    Object.create(null),
    module && ['object', 'function'].includes(typeof module) ? module : {},
    { default: module },
  );
}
export function assetURL(record: Asset) {
  return 'data:' + record.mime + ';base64,' + record.base64;
}
