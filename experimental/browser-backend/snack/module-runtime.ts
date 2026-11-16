import { Buffer, browserBuiltins, browserProcess } from './browser-builtins';
import { sourceCode, namespace, assetURL } from './diagnostics';
import { selectImageAsset } from './image-assets';
import type { ModuleGraph, ModuleRecord } from './types';
export interface RefreshRuntime {
  register(type: unknown, id: string): void;
  createSignatureFunctionForTransform(): (
    type: unknown,
    key?: string,
    forceReset?: boolean,
    getCustomHooks?: () => unknown[],
  ) => unknown;
}
export interface RuntimeModule {
  exports: unknown;
}
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
export function createLoader(
  records: ModuleGraph,
  runtime: Record<string, unknown>,
  React: unknown,
  special?: (record: ModuleRecord, module: RuntimeModule) => boolean | void,
  refresh?: RefreshRuntime,
) {
  runtime = { ...browserBuiltins, ...runtime };
  const modules = new Map<string, RuntimeModule>(),
    pending = new Map<string, Promise<unknown>>();
  function record(file: string) {
    const result = records[file];
    if (!result) throw Error('Unknown module ' + file);
    return result;
  }
  function evaluate(file: string, info: ModuleRecord, module: RuntimeModule) {
    if (special?.(info, module)) return;
    if (info.asset) {
      const asset = selectImageAsset(info.asset, globalThis.devicePixelRatio || 1),
        uri = assetURL(asset);
      module.exports =
        (asset.width || asset.mime === 'image/svg+xml' || /^(audio|video)\//.test(asset.mime)) &&
        runtime['@react-native']
          ? {
              uri,
              width: asset.width,
              height: asset.height,
              scale: asset.scale,
              toString() {
                return uri;
              },
            }
          : uri;
      return;
    }
    if (info.css !== undefined) {
      module.exports = info.classes || {};
      return;
    }
    if (info.json !== undefined) {
      module.exports = info.json;
      return;
    }
    const resolve = (spec: string) => {
      if (!Object.hasOwn(info.deps, spec)) throw Error('Undeclared import ' + spec);
      return info.deps[spec];
    };
    const require = (spec: string) => load(resolve(spec));
    require.resolve = resolve;
    const defaultValue = (value: unknown) =>
      value &&
      (typeof value === 'object' || typeof value === 'function') &&
      '__esModule' in value &&
      value.__esModule
        ? Reflect.get(value, 'default')
        : value;
    const Factory = info.async ? AsyncFunction : Function;
    return new Factory(
      '__DEV__',
      'require',
      'module',
      'exports',
      'React',
      'process',
      'global',
      '__rsc_import__',
      '__rsc_load__',
      '__rsc_context__',
      'Buffer',
      '__metroDefault',
      '__metroAll',
      '__metroDefaultValue',
      '__metroAllValue',
      '$RefreshReg$',
      '$RefreshSig$',
      sourceCode(info, file),
    )(
      false,
      require,
      module,
      module.exports,
      React,
      browserProcess,
      globalThis,
      (spec: string) => loadAsync(resolve(spec)).then(namespace),
      (spec: string) => loadAsync(resolve(spec)),
      (choices: Record<string, string>, spec: unknown) => {
        if (typeof spec !== 'string' || !Object.hasOwn(choices, spec))
          throw Error('Module is outside the compiled import context: ' + spec);
        return choices[spec];
      },
      Buffer,
      (spec: string) => defaultValue(require(spec)),
      (spec: string) => namespace(require(spec)),
      defaultValue,
      namespace,
      (type: unknown, id: string) => refresh?.register(type, file + ' ' + id),
      () => refresh?.createSignatureFunctionForTransform() || ((type: unknown) => type),
    );
  }
  function load(file: string): unknown {
    if (Object.hasOwn(runtime, file)) return runtime[file];
    const info = record(file);
    if (info.async) throw Error('Cannot require an async module; use import(): ' + file);
    if (modules.has(file)) return modules.get(file)!.exports;
    const module = { exports: {} };
    modules.set(file, module);
    try {
      evaluate(file, info, module);
      return module.exports;
    } catch (e) {
      modules.delete(file);
      throw e;
    }
  }
  function loadAsync(file: string): Promise<unknown> {
    if (Object.hasOwn(runtime, file) || !record(file).async) {
      try {
        return Promise.resolve(load(file));
      } catch (e) {
        return Promise.reject(e);
      }
    }
    if (pending.has(file)) return pending.get(file)!;
    const module = { exports: {} };
    modules.set(file, module);
    const work = Promise.resolve()
      .then(() => evaluate(file, record(file), module))
      .then(
        () => module.exports,
        (e) => {
          pending.delete(file);
          modules.delete(file);
          throw e;
        },
      );
    pending.set(file, work);
    return work;
  }
  return { load, loadAsync, modules };
}
