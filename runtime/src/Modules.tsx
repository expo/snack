// Maintain JavaScript modules forming the runtime state of the user's Snack application. This
// includes modules generated by 'local' files and assets, pre-loaded modules such as 'react' and
// 'expo', and modules generated by references to npm packages.
//
// This is implemented using SystemJS, with URIs of the form `module://...` internally. SystemJS
// lets us hook in our own `fetch` (given a URI, return sources for it) and `translate` (transform
// source code to 'eval'able form) steps by creating a 'plugin' (see
// https://github.com/systemjs/systemjs/blob/master/docs/creating-plugins.md). We also hook into the
// `eval` step by polyfilling node's `vm.runInThisContext(...)`.

import escapeStringRegexp from 'escape-string-regexp';
import { Asset } from 'expo-asset';
import path from 'path';
import React from 'react';
import { Platform, PixelRatio } from 'react-native';
import * as GestureHandler from 'react-native-gesture-handler';
import * as babel from 'snack-babel-standalone';
import * as context from 'snack-require-context';
// Highest supported version of source-map is 0.6.1. As of 7.x source-map uses
// web-assembly which is not yet supported on react-native.
import { SourceMapConsumer, RawSourceMap } from 'source-map';

import ReanimatedPlugin from '../vendor/reanimated-plugin';
import System from '../vendor/system.src';
import { SNACKAGER_API_URLS } from './Constants';
import * as Files from './Files';
import * as Logger from './Logger';
import AssetRegistry from './NativeModules/AssetRegistry';
import FileSystem from './NativeModules/FileSystem';
import * as Profiling from './Profiling';
import aliases from './aliases';

type Dependencies = {
  [key: string]: { resolved?: string; version: string; handle?: string };
};

type Load = {
  source: string;
  address: string;
  skipTranslate?: boolean;
  metadata: {
    sourceMap?: RawSourceMap;
  };
};

// This is super hacky
// This avoids a bug where for some reason `react` is `undefined` in a dependency
// Adding the __esModule property basically bypasses the extra defineProperty stuff that webpack does
// And then magically it works
// The React module can be imported as both default export and named exports will still work
// @ts-ignore
React.__esModule = true;
// @ts-ignore
React.default = React;

// client caches dependency resolutions locally, increment the cachebuster to invalidate existing caches
const cacheBuster = '2';

// We access this for its side effects because it is lazily loaded.
// See https://github.com/expo/expo-asset/blob/6698f2a6dc657a0b12bf29a22e62c83c9fd8ed3a/src/Asset.js#L186-L190
Asset; // eslint-disable-line no-unused-expressions,@typescript-eslint/no-unused-vars

// Load react-native-gesture-handler, so RCTView's directEventTypes are set before bridge is fully initialized.
// See https://github.com/kmagiera/react-native-gesture-handler/blob/master/GestureHandler.js#L46
GestureHandler; // eslint-disable-line no-unused-expressions,@typescript-eslint/no-unused-vars

// Set the `__DEV__` variable to `false` because we are running a context without Metro.
// Unfortunately, this is handled by the bundler such as Metro or Webpack.
// That's not available inside the Snack Runtime itself.
// see: https://twitter.com/jamonholmgren/status/1561798978269618177
// @ts-expect-error
global['__DEV__'] = false;

// Maintain project-level dependency state in the `ExpoDependencyV2` format.
// See https://github.com/expo/universe/blob/64a2eab474d11614c5b403f09747fdb112769a39/libraries/snack-sdk/src/types.js#L114-L126.
let projectDependencies: Dependencies = {};

// This keeps track of all generated virutal modules, and the files it includes.
// Unfortunately, asking SystemJS seems to return no loaded modules.

// Keep track of any module included in a virtual module, and what virtual module is including it.
// This is a reversed map to efficiently find out which virtual modules need to be updated on change.
// The data stored in this is the `SnackFilePath -> [VirtualModulePath]` mapping.
const virtualModules: Map<string, Set<string>> = new Map();
const allVirtualModules: Set<string> = new Set();

// replacement for String.prototype.startsWith with consistent behaviour on iOS & Android
const startsWith = (base: string, search: string) => String(base).indexOf(String(search)) === 0;

export const updateProjectDependencies = async (newProjectDependencies: Dependencies) => {
  // Flush loaded modules that map to dependencies whose resolved version changed
  const removedOrChangedDependencies = Object.keys(projectDependencies).filter(
    (name) =>
      !newProjectDependencies[name] ||
      newProjectDependencies[name].resolved !== projectDependencies[name].resolved
  );
  const addedDependencies = Object.keys(newProjectDependencies).filter(
    (name) => !projectDependencies[name]
  );
  const changedDependencies = removedOrChangedDependencies.concat(addedDependencies);
  if (changedDependencies.length) {
    Logger.module(
      'Changed dependencies',
      changedDependencies.map(
        (name) =>
          `${name} (${
            newProjectDependencies[name]
              ? projectDependencies[name]
                ? `${projectDependencies[name].resolved} -> ${newProjectDependencies[name].resolved}`
                : newProjectDependencies[name].resolved
              : 'removed'
          })`
      )
    );
  }
  const removedOrChangedUris = removedOrChangedDependencies.map((name) => `module://${name}`);
  await flush({ changedUris: removedOrChangedUris });
  projectDependencies = newProjectDependencies;
  return changedDependencies.map(sanitizeModule);
};

// SystemJS fetch pipeline
const _get = (header: { [key: string]: string }, value: string) =>
  header?.hasOwnProperty(value) ? header[value] : null;

const fetchPipeline = async (load: Load) => {
  return await Profiling.section(`\`Modules.fetchPipeline('${load.address}')\``, async () => {
    const uri = load.address;

    if (!startsWith(uri, 'module://')) {
      throw new Error(`Invalid module URI '${uri}', must start with 'module://'`);
    }

    // Handle virtual modules that enable `require.context` usage
    if (context.pathIsVirtualModule(uri)) {
      const contextUri = context.sanitizeFilePath(uri.replace(/(\.js)+$/, ''));
      const contextRequest = context.convertVirtualModulePathToRequest(contextUri);
      const contextFiles = context.resolveContextFiles(contextRequest, Files.list());

      // The `require.context` package returns evaluatable JS code
      load.skipTranslate = true;
      // Register the virtual module to flush it later on file changes
      virtualModules.set(uri, new Set(Object.values(contextFiles)));
      allVirtualModules.add(uri);

      // To load modules by absolute path, we need to add `module://` before importing them
      for (const fileName in contextFiles) {
        // Add the `module://` prefix for system js, to indicate an absolute path
        contextFiles[fileName] = `module://${contextFiles[fileName]}`;

        // Register the dependent of the virtual module
        if (virtualModules.has(contextFiles[fileName])) {
          virtualModules.get(contextFiles[fileName])!.add(uri);
        } else {
          virtualModules.set(contextFiles[fileName], new Set([uri]));
        }
      }

      return context.createContextModuleTemplate(contextFiles);
    }

    try {
      // The resolver always adds a JS extension
      // We strip it out to get the correct path
      const path = uri.replace(/^module:\/\//, '').replace(/\.js$/, '');
      const file = Files.get(path);

      if (file) {
        const { isAsset, isBundled, s3Url, contents } = file;
        const isJson = /\.json$/i.test(path);

        if (isAsset && s3Url) {
          const isImage = /\.(bmp|png|jpg|jpeg|gif|svg|webp|tiff|webp)$/i.test(path.toLowerCase());

          // Non image assets (eg fonts, audio/video files) are served directly from s3 on web
          if (!isImage && Platform.OS === 'web') {
            return `module.exports = ${JSON.stringify(s3Url)};`;
          }

          // Asset? Register its metadata with React Native's `AssetRegistry`, which gives us a
          // numeric `assetId`, then resolve to a module that exports that `assetId`.
          const hash = s3Url.replace(/.*(~|%7E)asset\//, '');

          let metaData: { [key: string]: string | null } | null = null;
          let type, width, height;

          // Fetch meta-data like type, width and height
          try {
            const cacheUri = `${FileSystem.cacheDirectory}snack-asset-metadata-${cacheBuster}-${hash}.json`;
            const { exists } = await FileSystem.getInfoAsync(cacheUri);
            if (exists) {
              const contents = await FileSystem.readAsStringAsync(cacheUri);
              metaData = JSON.parse(contents);
              Logger.module(
                'Loaded asset metadata',
                s3Url,
                `from cache ${contents ? contents.length : undefined} bytes`
              );
            } else {
              Logger.module('Fetching asset metadata', s3Url, '...');
              const response = await fetch(s3Url, {
                method: 'HEAD',
                mode: Platform.OS === 'web' ? 'cors' : 'no-cors',
              });

              if (response.headers?.hasOwnProperty('map')) {
                // @ts-expect-error: expression of type '"map"' can't be used to index type 'Headers'
                const mapHeaders = response.headers['map'];
                if (mapHeaders) {
                  metaData = {
                    type: _get(mapHeaders, 'x-amz-meta-type'),
                    width: _get(mapHeaders, 'x-amz-meta-width'),
                    height: _get(mapHeaders, 'x-amz-meta-height'),
                  };
                }
              } else if (response.headers.get('x-amz-meta-type')) {
                metaData = {
                  type: response.headers.get('x-amz-meta-type'),
                  width: response.headers.get('x-amz-meta-width'),
                  height: response.headers.get('x-amz-meta-height'),
                };
              }
              if (metaData) {
                FileSystem.writeAsStringAsync(cacheUri, JSON.stringify(metaData)).then(
                  undefined,
                  (error) => {
                    Logger.error('Failed to store asset metadata in cache', error);
                  }
                );
              }
            }
          } catch (e) {
            Logger.error('Error fetching metadata', e.message);
          }

          if (metaData) {
            // Get the mimetype from the file extension
            type = metaData.type || path.split('.').pop(); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing

            // Get the dimensions of the image from the headers
            width = parseFloat(metaData.width ?? '');
            height = parseFloat(metaData.height ?? '');

            // If the filename has a scale, adjust the height and width
            const match = path.match(/^.+@(\d+(\.\d+)?)x(\.[a-z]+)?\.[^.]+$/);

            if (match) {
              const scale = parseFloat(match[1]);

              // Divide the dimensions by specified scale
              // For example, if the image is named file@3x.png, divide by 3
              width /= scale;
              height /= scale;
            }
          }

          const assetId = AssetRegistry.registerAsset({
            hash,
            name: hash,
            scales: [1],
            fileHashes: [hash],
            httpServerLocation: 'https://snack-code-uploads.s3-us-west-1.amazonaws.com/~asset',
            uri: s3Url,
            ...(metaData
              ? {
                  width,
                  height,
                  // Specifying the type causes the url to be malformed using `react-native-web`
                  // Also see patches/react-native-web+0.13.13.patch
                  type: Platform.OS === 'web' ? undefined : type,
                }
              : null),
          });
          Logger.module('Registered asset', s3Url, 'as number', assetId);
          return `module.exports = ${assetId};`;
        } else if (isJson) {
          return `module.exports = ${contents}`;
        } else {
          // Regular JavaScript file? Just return the code!
          load.skipTranslate = isBundled;
          return contents;
        }
      }

      // Project-level dependency?
      if (projectDependencies[path]) {
        const dependency = projectDependencies[path];

        // Based on https://github.com/expo/universe/blob/055b1f83685a0c4dd45c3b27a99114de0233c1b6/apps/snack/src/modules/ModuleManager.js#L191-L210
        const name = path[0] + path.slice(1).replace(/@[^@]+$/, '');
        const version = dependency.resolved ?? dependency.version;

        // The handle may not exist for old snacks. In that case, construct it from name and version
        const handle = dependency.handle ?? `${name}@${version}`.replace(/\//g, '~');

        // Download bundle, keeping a local cache
        let bundle: string | undefined;
        const cacheHandle = handle.replace(/\//g, '~');
        const cacheUri = `${FileSystem.cacheDirectory}snack-bundle-${cacheBuster}-${cacheHandle}-${Platform.OS}.js`;
        const { exists } = await FileSystem.getInfoAsync(cacheUri);
        if (exists) {
          bundle = await FileSystem.readAsStringAsync(cacheUri);
          Logger.module(
            'Loaded dependency',
            cacheHandle,
            `from cache ${bundle ? bundle.length : undefined} bytes`
          );
        } else {
          for (const [i, url] of SNACKAGER_API_URLS.entries()) {
            // Determine if there is another URL to try on fetch failures
            const hasNextUrl = i < SNACKAGER_API_URLS.length - 1;
            const fetchFrom = `${url}/${handle}-${Platform.OS}/bundle.js`;

            try {
              Logger.module('Fetching dependency', fetchFrom, '...');

              const res = await fetch(fetchFrom);

              if (res.ok) {
                bundle = await res.text();
              } else {
                throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
              }
            } catch (e) {
              if (hasNextUrl) {
                Logger.error('Error fetching bundle', fetchFrom, e);
                throw e;
              } else {
                Logger.warn(
                  'Dependency could not be loaded from staging, trying production ...',
                  handle
                );
              }
            }

            if (bundle) {
              Logger.module(
                'Fetched dependency',
                fetchFrom,
                `storing in cache ${bundle.length} bytes`
              );
              break;
            }
          }

          if (!bundle) {
            throw new Error(`Unable to fetch module ${handle} for ${Platform.OS}.`);
          }

          FileSystem.writeAsStringAsync(cacheUri, bundle).then(undefined, (error) => {
            Logger.error('Failed to store dependency in cache', error);
          });
        }

        // The package server uses webpack's 'commonjs' format which puts root module exports in
        // `exports[<packageName>]`, so re-export in a way understood by SystemJS. Also, the bundle is
        // already transformed, so have our SystemJS translate pipeline skip it.
        load.skipTranslate = true;
        return `var __SNACK_PACKAGE_EXPORTS = {};
              var __SNACK_PACKAGE_MODULE = { exports: __SNACK_PACKAGE_EXPORTS };
              (function (module, exports) { ${bundle} })(
                __SNACK_PACKAGE_MODULE,
                __SNACK_PACKAGE_EXPORTS
              );
              module.exports = __SNACK_PACKAGE_EXPORTS[${JSON.stringify(path)}];`;
      }

      // Nothing worked...
      throw new Error(`Unable to resolve module '${uri}'`);
    } catch (e) {
      // SystemJS still wants us to return something, so return an empty module that just throws the
      // error...
      return `throw new Error(${JSON.stringify(e.message)});`;
    }
  });
};

// SystemJS translate pipeline

const sourceMapConsumers: { [key: string]: SourceMapConsumer } = {};
const transformCache: {
  [key: string]: { source: string; result: ReturnType<typeof babel.transform> | null };
} = {};

const translatePipeline = async (load: Load) => {
  return await Profiling.section(`\`Modules.translatePipeline('${load.address}')\``, async () => {
    if (load.skipTranslate) {
      return load.source;
    }

    // The resolver always adds a JS extension
    // We strip it out to so Babel can transpile TS files
    const filename = load.address.replace(/\.js$/, '');

    try {
      const transformed = Profiling.sectionSync(
        `\`Modules.translatePipeline('${load.address}')\` \`babel.transform()\``,
        () => {
          const cached = transformCache[filename];

          if (cached && cached.source === load.source) {
            return cached.result;
          }

          Logger.module('Transpiling', sanitizeModule(filename), '...');

          const result = babel.transform(load.source, {
            presets: ['module:metro-react-native-babel-preset'],
            plugins: [
              ['@babel/plugin-transform-async-to-generator'],
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-syntax-dynamic-import'],
              ['@babel/plugin-proposal-dynamic-import'],
              ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
              [
                context.snackRequireContextVirtualModuleBabelPlugin,
                // We need to resolve the requested context directory in the user-provided code
                { directoryResolution: 'relative' },
              ],
              ...(load.source.includes('react-native-reanimated') || load.source.includes('worklet')
                ? [ReanimatedPlugin]
                : []),
            ],
            moduleIds: false,
            sourceMaps: true,
            compact: false,
            filename,
            sourceFileName: filename,
          });

          transformCache[filename] = { source: load.source, result };

          Logger.module(
            'Transpiled',
            sanitizeModule(filename),
            `${result?.code ? result.code.length : '???'} bytes`
          );

          return result;
        }
      );
      // @ts-ignore
      load.metadata.sourceMap = transformed.map;
      sourceMapConsumers[load.address] = await Profiling.section(
        `\`Modules.translatePipeline('${load.address}')\` \`new SourceMapConsumer()\``,
        async () =>
          await new SourceMapConsumer(
            // @ts-ignore
            transformed.map
          )
      );
      return transformed!.code;
    } catch (e) {
      // SystemJS still wants us to return something, so return an empty module that just throws
      // the error...
      return `throw new Error(${JSON.stringify(e.message)});`;
    }
  });
};

export const unmap = ({
  sourceURL,
  line,
  column,
}: {
  sourceURL: string;
  line: number;
  column: number;
}) => {
  // SystemJS may add '!transpiled' at the end of the URL
  const consumer = sourceMapConsumers[sourceURL.replace(/!transpiled$/, '')];
  if (consumer) {
    const result = consumer.originalPositionFor({ line, column });
    if (result) {
      return {
        ...result,
        path: sourceURL
          .replace(/!transpiled$/, '')
          .replace(/^module:\/\//, '')
          .replace(/.([a-z]+).js$/, '.$1'),
      };
    }
  }

  return undefined;
};

// SystemJS eval pipeline
// @ts-ignore
global.evaluate = (src, options: { filename?: string } = {}) => {
  return Profiling.section(`\`Modules.evalPipeline('${options.filename}')\``, () => {
    // @ts-ignore
    if (global.globalEvalWithSourceUrl) {
      // This function will let JavaScriptCore know about the URL of the source code so that errors
      // and stack traces are annotated. Thanks, React Native devs! We do need a top-level try/catch
      // to prevent a native crash if `eval`ing throws an exception though...
      // @ts-ignore
      global.__SNACK_EVAL_EXCEPTION = null;
      src = `(function () { try { ${src}\n } catch (e) { this.__SNACK_EVAL_EXCEPTION = e; } })();`;

      // @ts-ignore
      const r = global.globalEvalWithSourceUrl(src, options.filename);

      // @ts-ignore
      if (global.__SNACK_EVAL_EXCEPTION) {
        // @ts-ignore
        const e = global.__SNACK_EVAL_EXCEPTION;

        // @ts-ignore
        global.__SNACK_EVAL_EXCEPTION = null;

        throw e;
      }
      return r;
    }
    // eslint-disable-next-line no-eval
    return (0, eval)(src);
  });
};

// Initialize the module system. This basically consists of initializing and configuring SystemJS.
const _initialize = async () => {
  // SystemJS config. Create and use a plugin with our pipeline, turn on default '.js' extensions
  // and tracing (makes SystemJS collect dependency info).
  await System.set(
    'systemjs-expo-snack-plugin',
    System.newModule({ translate: translatePipeline, fetch: fetchPipeline })
  );
  await System.config({
    packages: {
      '.': {
        defaultExtension: 'js',
      },
    },
    meta: {
      '*.js': {
        format: 'cjs',
        loader: 'systemjs-expo-snack-plugin', // Defined above
      },
    },
  });

  System.trace = true; // Dependency tracking

  // Pre-loaded modules
  await Promise.all(
    Object.keys(aliases).map(
      async (key) =>
        await System.set(key, System.newModule({ default: aliases[key], __useDefault: true }))
    )
  );

  // Special handling for vector-icons to allow deep imports
  const vectorIcons = require('@expo/vector-icons');
  const vectorIconsModule = System.newModule(vectorIcons);

  await System.set('@expo/vector-icons', vectorIconsModule);
  await System.set('react-native-vector-icons', vectorIconsModule);

  await Promise.all(
    Object.keys(vectorIcons).map(async (name) => {
      const iconSet = vectorIcons[name];
      iconSet.default = iconSet.default ?? iconSet;
      const iconSetModule = System.newModule({ default: iconSet, __useDefault: true });

      await System.set(`@expo/vector-icons/${name}`, iconSetModule);
      await System.set(`react-native-vector-icons/${name}`, iconSetModule);
    })
  );

  // Fix SystemJS path normalization to handle Snack-related special cases
  const oldResolve = System.resolve;

  System.resolve = async function (url: string, baseUrl?: string) {
    // Relative URI? Use 'path.normalize(...)' to deal with '..'s properly.
    if (baseUrl && startsWith(url, '.')) {
      const basePath = baseUrl.replace(/^module:\/\//, '');
      url = 'module://' + path.normalize(`${path.dirname(basePath)}/${url}`);
    }

    // TODO(cedric): figure out why importing `module://components` results in
    // `module:/components`, and is resolved as `module://omponents`.
    // This is a dirty workaround to make sure its always resolved correctly.
    if (context.pathIsVirtualModule(url)) {
      return await oldResolve.call(this, url.replace(/^module:\/\/?/, 'module://'), baseUrl);
    }

    if (/^module:\/\//.test(url)) {
      // List of supported extensions in priority order
      const extensions = ['.tsx', '.ts', '.js'];

      // List of supported platforms in priority order
      // The item that comes last has the highest priority
      const platforms =
        Platform.OS === 'web'
          ? [Platform.OS, `${Platform.OS}.expo`]
          : // We should resolve `.native` only for native platforms and not for web
            ['native', Platform.OS, 'native.expo', `${Platform.OS}.expo`];

      // The resolved path after checking the list of files
      let resolved;

      const basename = url.replace(/^module:\/\//, '');

      // Check the files with and without an extension
      // This is necessary because it's possible to import JS files without the extension
      for (const suffix of [...extensions, '']) {
        const filename = basename + suffix;
        const ext = filename.split('.').pop() as string;

        // We also take the scale into account for images
        const isImage = /^(bmp|gif|jpg|jpeg|png|psd|tiff|webp|svg)$/i.test(ext);

        const regex = new RegExp(
          `^${escapeStringRegexp(filename.replace(/\.[^.]+$/i, ''))}(${
            isImage ? '@\\d+(\\.\\d+)?x' : '()'
          })?(\\.([a-z]+(\.expo)?))?\\.${ext}$` // eslint-disable-line no-useless-escape
        );

        // Build a map of files according to the scale and platform
        // The map will look something like this:
        // {
        //   1: { path: image.png, platform: 'android' },
        //   1.5: { path: image@1.5x.png, platform: 'android' },
        //   2: { path: image@2x.png, platform: 'android' },
        // }
        const map = Files.list().reduce((acc, curr) => {
          const match = curr.match(regex);

          if (match) {
            // eslint-disable-next-line no-unused-vars
            const [, scaleString, , , platform] = match;

            // If file doesn't have a scale, default to 1
            // This can happen for asset files without scale, or JS files
            const scale = scaleString ? parseFloat(scaleString.substr(1)) : 1;

            if (platform && !platforms.includes(platform)) {
              // If the file has a platform, but it's not the current platform,
              // return what we had
              return acc;
            }

            if (
              acc[scale] &&
              platforms.indexOf(acc[scale].platform) > platforms.indexOf(platform)
            ) {
              // If we have already found the platform with a higher priority than current platform,
              // return what we had
              return acc;
            }

            return { ...acc, [scale]: { path: curr, platform } };
          }

          return acc;
        }, {} as { [key: string]: { path: string; platform: string } });

        if (Object.keys(map).length) {
          // Get the device's pixel density and find the closest bigger matching scale
          const scale = PixelRatio.get();
          const closest = Object.keys(map)
            .map((x) => Number(x))
            .sort((a, b) => a - b)
            .reduce((result, curr) => (result >= scale ? result : curr));

          if (map[closest] && Files.get(map[closest].path)) {
            resolved = map[closest].path;
            break;
          }
        }

        // Check if file matching the exact path exist
        if (!resolved && Files.get(filename)) {
          // Local file, extension given
          resolved = filename;
          break;
        }
      }

      // If we couldn't resolve the file normally, check in directories
      if (!resolved) {
        let index = 'index';
        let ext = '';

        // If the directory contains a package.json file, get it's main field
        // Otherwise use index as the fallback name
        if (Files.get(basename + '/package.json')) {
          try {
            const pack = JSON.parse(
              (Files.get(basename + '/package.json') ?? { contents: '' }).contents || '{}' // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
            );
            index = pack['react-native'] || pack['main'] || 'index';
            ext = index.split('.').pop()!;

            // Remove any leading './' from the file path
            index = index.replace(/^\.\//, '');
          } catch {
            // Ignore error
          }
        }

        // If the main file has an extension, try to resolve with it first
        if (ext) {
          for (const platform of platforms) {
            const f = basename + '/' + index.replace(/\.[^.]$/, '') + '.' + platform + '.' + ext;

            if (Files.get(f)) {
              resolved = f;
              break;
            }
          }
        }

        // If it's still not resolved, try to resolve the exact name
        if (!resolved) {
          const f = basename + '/' + index;

          if (Files.get(f)) {
            resolved = f;
          }

          for (const suffix of extensions) {
            const f = basename + '/' + index + suffix;

            if (Files.get(f)) {
              resolved = f;
              break;
            }
          }
        }

        // If it's still not resolved, try to resolve with predefined extensions
        if (!resolved) {
          for (const suffix of extensions) {
            for (const platform of platforms) {
              const f = basename + '/' + index + '.' + platform + suffix;

              if (Files.get(f)) {
                resolved = f;
                break;
              }
            }
          }
        }
      }

      if (resolved) {
        url = 'module://' + resolved;
      }

      // Add a '.js' extension so that the SystemJS plugin handles this file
      // This extra extension will be stripped in the fetch and transform pipeline
      url += '.js';
    }

    return await oldResolve.call(this, url, baseUrl);
  };

  // Find dependents of modules with given names -- modules are dependents of themselves, skips
  // modules that aren't loaded
  System.dependents = async function (rootModuleNames: string[]): Promise<string[]> {
    // No trace yet? No dependent info...
    if (!this.loads) {
      return [];
    }

    // Construct map such that `dependsOn[x][y] === true` iff. module with fully resolved url `y` is
    // an immediate dependency of that with `x`, for all pairs of fully resolved module urls
    const dependsOn: { [key: string]: { [key: string]: boolean } } = {};

    await Promise.all(
      Object.keys(this.loads).map((url) => {
        dependsOn[url] = {};
        return this.loads[url].deps.map(
          async (dep: string) => (dependsOn[url][await this.resolve(dep, url)] = true)
        );
      })
    );

    // Visit immediate dependents of `rootModuleNames` by post-order DFS, skipping modules that
    // aren't loaded
    const visited: { [key: string]: boolean } = {};
    const order: string[] = [];

    const visit = (url: string) => {
      if (!visited[url]) {
        visited[url] = true;
        Object.keys(this.loads).forEach((other) => {
          if (dependsOn[other][url]) {
            visit(other);
          }
        });
        order.push(url);
      }
    };

    if (!Array.isArray(rootModuleNames)) {
      rootModuleNames = [rootModuleNames];
    }
    const resolvedRootUrls = await Promise.all(rootModuleNames.map((name) => this.resolve(name)));
    resolvedRootUrls.forEach(visit);

    return order;
  };

  System.keys = function () {
    return this.registry.keys();
  };
};

export function sanitizeModule(moduleName: string): string {
  return moduleName.substring(
    moduleName.startsWith('module://') ? 9 : 0,
    moduleName.endsWith('.js.js') ? moduleName.length - 3 : moduleName.length
  );
}

// Notify the system of changes that would affect modules -- currently accepts `changedPaths` (an
// array of paths to files in `Files` that have changed), and `changedUris` (an array of URIs to
// modules that have changed), returns URIs of all modules that have been flushed
let awaitLastFlush = Promise.resolve(); // Makes sure flushes happen serially
export const flush = async ({
  changedPaths = [],
  changedUris = [],
}: {
  changedPaths?: string[];
  changedUris?: string[];
}) => {
  awaitLastFlush = awaitLastFlush.then(async () => {
    // Flush modules and their dependents -- skips modules that aren't loaded, returns URIs of all
    // modules that have been flushed
    const paths = [
      ...changedUris,
      ...changedPaths.map((path) => `module://${path}${path.endsWith('.js') ? '' : '.js'}`),
    ];

    // Handle virtual module updates
    const virtualModulePaths: Set<string> = new Set();
    for (const path of paths) {
      // Add affected virtual module paths for new files
      // Note(cedric): it's a best effort check, it does not include transpiled-skipped files
      if (!transformCache[`module://${path}${path.endsWith('.js') ? '' : '.js'}`]) {
        Logger.module('New file detected, clearing all virtual modules.', path);
        allVirtualModules.forEach((path) => virtualModulePaths.add(path));
        break;
      }

      // Add affected virtual module paths for changed existing files
      virtualModules.get(path)?.forEach((path) => virtualModulePaths.add(path));
    }

    const dependents = await System.dependents(paths);
    let modules = [...dependents, ...virtualModulePaths, ...paths];
    modules = modules.filter((name, index) => System.has(name) && modules.indexOf(name) >= index);
    if (modules.length) {
      Logger.module('Unloading modules', modules.map(sanitizeModule));
    }
    modules.forEach((dep: string) => System.delete(dep));

    changedPaths.forEach(
      (path) => delete transformCache[`module://${path}${path.endsWith('.js') ? '' : '.js'}`]
    );
  });

  return awaitLastFlush;
};

// Wrap initialize and guard that it is initialized once only
let waitForInitialize: Promise<void>;
export const initialize = async () => {
  waitForInitialize = waitForInitialize || _initialize();
  return waitForInitialize;
};

// Whether a module has been loaded, given its full URI
export const has = async (uri: string) => {
  // Wait for any current flushes to complete
  await awaitLastFlush;
  return System.has(uri);
};

// Load a module
export const load = async (name: string, relativeTo?: string) => {
  Logger.module('Loading root', sanitizeModule(name), '...');
  const res = await System.import(name, relativeTo);
  Logger.module(
    'Loaded modules',
    Array.from<string>(System.keys())
      .filter((name) => name.toLowerCase().indexOf('app.js') >= 0 || name.indexOf('module://') >= 0)
      .map(sanitizeModule)
  );
  return res;
};
