import path from 'path';

import { decodeBase64, encodeBase64 } from './base64';

/** @see https://webpack.js.org/guides/dependency-management/#requirecontext */
export type SnackRequireContextRequest = {
  /** The "target" directory of the `require.context`, relative from root */
  directory: string;
  /** If all nested files within the directory should be requested */
  isRecursive: boolean;
  /** The regular expression used to select files */
  matching: RegExp;
  /** If the modules should be loaded synchronously, or asynchronously */
  mode: 'sync' | 'async';
};

export type SnackRequireContext<Module = any> = {
  /** Load a module from the requested context */
  (module: string): Module;
  /** Get all modules from the requested context. */
  keys(): string[];
  /** Resolve a module id, instead of the module itself, from the requested context */
  resolve(module: string): string;
};

/** The basic pattern of a virtual module, containing `require.context` code */
const VIRTUAL_MODULE_PATTERN = /(.*)\?ctx=(.+)$/;

/**
 * Determine if a module path is a virtual module containing the `require.context` result.
 */
export function pathIsVirtualModule(modulePath: string) {
  return VIRTUAL_MODULE_PATTERN.test(modulePath);
}

/**
 * Create the path of a virtual module that represents a `require.context` result.
 * This embeds the context options into a base64 encoded query string, to evaluate inside the Snack Runtime.
 */
export function createVirtualModulePath(
  request: Omit<Partial<SnackRequireContextRequest>, 'directory'> &
    Pick<SnackRequireContextRequest, 'directory'>
) {
  const contextHash = JSON.stringify({
    r: request.isRecursive ?? true,
    m: request.matching?.source ?? '.*',
    o: request.mode ?? 'sync',
  });

  return `${request.directory}?ctx=${encodeBase64(contextHash)}`;
}

/**
 * Reconstruct the context request from a virtual module path.
 * This decodes the base64 query string and loads the directory from the path.
 */
export function convertVirtualModulePathToRequest(modulePath: string) {
  const [_, directory = '', contextHash] = modulePath.match(VIRTUAL_MODULE_PATTERN) ?? [];

  if (!contextHash) {
    throw new Error('Virtual module path does not contain the context hash');
  }

  const contextData = JSON.parse(decodeBase64(contextHash));
  const contextRequest: SnackRequireContextRequest = {
    directory,
    isRecursive: contextData.r ?? true,
    matching: new RegExp(contextData.m ?? '.*'),
    mode: contextData.o ?? 'sync',
  };

  return contextRequest;
}

/**
 * Resolve the requested context from existing Snack Runtime files.
 * This returns an object of modules that match the requested context.
 * Keys in this object are relative to the context directory, while values are relative to root.
 */
export function resolveContextFiles(request: SnackRequireContextRequest, files: string[]) {
  let contextFiles = files.filter((snackPath) => snackPath.startsWith(request.directory));

  if (request.isRecursive === false) {
    const maxSegments = request.directory.split('/').length + 1;
    contextFiles = contextFiles.filter((snackPath) => snackPath.split('/').length <= maxSegments);
  }

  const relativePathReplace = new RegExp(`^${request.directory}/?`);

  return Object.fromEntries(
    contextFiles
      .map((snackPath) => [`./${snackPath.replace(relativePathReplace, '')}`, snackPath])
      .filter(([relativePath]) => request.matching.test(relativePath))
  );
}

/**
 * Resolve the requested `require.context` directory, relative from root.
 * This requires the full file path of the file in which it was requested.
 */
export function resolveContextDirectory(filePath: string, requestedDir: string) {
  const fileDir = path.dirname(filePath);
  const contextDir = path.normalize(path.join(fileDir, requestedDir));
  return contextDir.replace(/\/$/, '');
}

/**
 * Create a virtual module that represents the code for `require.context()`.
 * All paths MUST be relative from root.
 */
export function createContextModuleTemplate(moduleMap: Record<string, string>) {
  const moduleList = Object.keys(moduleMap);

  if (!moduleList.length) {
    return createEmptyContextModuleTemplate();
  }

  // Create the entries for each module, from root using `module://` as prefix
  // The `module://` is a SystemJS feature used in the Snack Runtime
  const moduleProperies = moduleList.map((module) => {
    return `'${module}': { enumerable: true, get() { return require('${moduleMap[module]}'); } }`;
  });

  return `
    const moduleMap = Object.defineProperties({}, {
      ${moduleProperies.join(',\n')}
    });

    function snackRequireContext(key) {
      return moduleMap[key];
    }

    snackRequireContext.keys = function snackRequireContextKeys() {
      return Object.keys(moduleMap);
    }

    snackRequireContext.resolve = function snackRequireContextResolve(key) {
      throw new Error('Unimplemented Snack require context functionality');
    }

    module.exports = snackRequireContext;
  `;
}

export function createEmptyContextModuleTemplate() {
  return `
    function snackRequireContextEmpty() {
      const error = new Error('No modules found in require.context');
      error.code = 'MODULE_NOT_FOUND';
      throw error;
    }

    snackRequireContextEmpty.keys = function snackRequireContextEmptyKeys() {
      return [];
    }

    snackRequireContextEmpty.resolve = function snackRequireContextEmptyResolve(key) {
      throw new Error('Unimplemented Snack require context functionality');
    }

    module.exports = snackRequireContextEmpty;
  `;
}
