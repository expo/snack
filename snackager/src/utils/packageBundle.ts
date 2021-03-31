import enhancedResolve from 'enhanced-resolve';
import _ from 'lodash';
import MemoryFS from 'memory-fs';
import path from 'path';
import validate from 'validate-npm-package-name';
import webpack from 'webpack';

import { isExternal } from '../bundler/externals';
import getResolverConfig from '../bundler/getResolverConfig';
import makeConfig from '../bundler/makeConfig';
import logger from '../logger';
import { Package } from '../types';
import installDependencies from './installDependencies';

// TODO: find the typescript definitions for this package, `@types/sander` doesn't exists
const { stat, readFile } = require('sander');

type UnsafeOptions = {
  pkg: Package;
  cwd: string;
  deep?: string | null;
  base: string;
  externals: string[]; // array of peerDependencies. e.g. `["graphql"]`
  platforms: string[];
};

type Options = {
  pkg: Package;
  cwd: string;
  deep?: string | null;
  base: string;
  externalDependencies: { [key: string]: string | null };
  platforms: string[];
};

type ResolvedEntry = {
  platform: string;
  entry: string;
  error?: Error | null;
};

async function packageBundleUnsafe({
  pkg,
  cwd,
  deep,
  externals,
  platforms,
  base,
}: UnsafeOptions): Promise<{ [key: string]: { [key: string]: Buffer } }> {
  const content = await readFile(path.join(cwd, 'package.json'));
  const packageJson = JSON.parse(content);

  const entries = await Promise.all(
    platforms.map(
      (platform) =>
        new Promise<ResolvedEntry>((resolve) => {
          // TODO: check why the types doesn't match here
          const resolveEntry = enhancedResolve.create(getResolverConfig(platform) as any);
          resolveEntry(path.join(cwd, deep ?? ''), '', (err, res) =>
            resolve({
              platform,
              entry: err ? '' : res,
              error: err,
            })
          );
        })
    )
  );
  const validEntries = entries.filter(({ error }) => !error);
  const invalidEntries = entries.filter(({ error }) => error);

  // If we couldn't resolve any entry file, check if it's a TypeScript definition package
  if (invalidEntries.length === entries.length) {
    try {
      const file = path.join(cwd, packageJson.types || packageJson.typings || 'index');
      await stat(file.endsWith('.d.ts') ? file : `${file}.d.ts`);
      logger.warn(
        { pkg, platforms },
        `no valid entry found, assuming this is a TypeScript definition package`
      );
      return platforms.reduce(
        (acc, platform) => ({
          ...acc,
          [platform]: '',
        }),
        {}
      );
    } catch (err) {
      throw entries.length ? entries[0].error : err;
    }
  }

  // Warn about entries that could not be resolved
  if (invalidEntries.length) {
    logger.warn(
      { pkg, platforms },
      `entry for platforms "${invalidEntries
        .map(({ platform }) => platform)
        .join(', ')}" could not be found. Proceeding with platforms "${validEntries
        .map(({ platform }) => platform)
        .join(', ')}".`
    );
  }

  const configs = validEntries.map(({ entry, platform }) =>
    makeConfig({
      root: cwd,
      entry,
      output: {
        path: `/${platform}`,
        filename: 'bundle.js',
        library: `${pkg.name}${deep ? `/${deep}` : ''}`,
        publicPath: `${base}-${platform}`,
      },
      externals,
      platform,
      // The reanimated2 plugin scans the package for worklets and converts
      // them so they can be executed directly on the UI thread.
      // This is currently only done for the reanimated package itsself, but
      // in the future third-party packages may also contain worklets that would
      // need to be converted.
      reanimatedPlugin: pkg.name === 'react-native-reanimated' && pkg.version >= '2',
    })
  );

  logger.info(
    {
      pkg,
      packageJson: {
        ...packageJson,
        keywords: undefined,
        scripts: undefined,
      },
      platforms,
    },
    `creating bundle with webpack`
  );

  const compiler = webpack(configs);
  const memoryFs = new MemoryFS();

  // @ts-ignore TODO: check why this property "doesnt exists on type 'MultiCompiler'"
  compiler.outputFileSystem = memoryFs;

  let status: webpack.compilation.MultiStats;

  try {
    status = await new Promise((resolve, reject) =>
      compiler.run((err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      })
    );
  } catch (error) {
    logger.error({ error }, 'error running compiler');
    throw error;
  }

  const result = status.toJson();

  if (result.errors.length) {
    throw new Error(result.errors.join('\n'));
  }

  logger.info({ pkg }, `bundle generated`);

  const list = (
    root: string,
    items: { [key: string]: Buffer },
    replace: RegExp | string
  ): { [key: string]: Buffer } => {
    memoryFs.readdirSync(root).forEach((name) => {
      const stat = memoryFs.statSync(path.join(root, name));

      if (stat.isDirectory()) {
        list(path.join(root, name), items, replace);
      } else {
        const key = `${root}/${name}`.replace(replace, '');
        items[key] = memoryFs.readFileSync(path.join(root, name));

        // Remove internal directory paths encoded by certain plugins like reanimated2
        if (name.endsWith('.js')) {
          const code = items[key].toString('utf8');
          items[key] = Buffer.from(code.split(cwd).join(''), 'utf8');
        }
      }
    });

    return items;
  };

  const files = validEntries.reduce(
    (acc, { platform }) => ({
      ...acc,
      [platform]: list(path.join('/', platform), {}, new RegExp(`^/${platform}/`)),
    }),
    {}
  );

  return files;
}

export default (async function packageBundle({
  pkg,
  cwd,
  deep,
  externalDependencies,
  platforms,
  base,
}: Options): Promise<{ [key: string]: { [key: string]: Buffer } }> {
  let externals = Object.keys(externalDependencies);
  const logMetadata = { pkg };
  const initialPlatforms = platforms;
  let installedDependencies: string[] = [];
  for (let i = 0; i < 10; i++) {
    try {
      const files = await packageBundleUnsafe({
        pkg,
        cwd,
        deep,
        externals,
        platforms,
        base,
      });
      initialPlatforms.forEach((platform) => {
        if (!files[platform]) {
          files[platform] = { 'bundle.js': Buffer.alloc(0) };
        }
      });
      return files;
    } catch (e) {
      try {
        // A lot of packages have a missing peerDep.
        // For example 'react-native-responsive-grid@0.32.4' has a dependency
        // on prop-types but no peerDep listed in package.json. We try to catch
        // these errors and then list those dependencies as a Webpack external
        // (https://webpack.js.org/configuration/externals/). This means that it
        // waits until runtime to resolve the invalid import, which should
        // be closer to matching the behavior in a standard RN project.
        const errorMessage = e.message;
        if (errorMessage) {
          const regex = /Module not found: Error: Can't resolve '(\S+)'/g;
          let match: RegExpExecArray | null = null;
          const matches: string[] = [];
          while ((match = regex.exec(e.message)) != null) {
            if (match && match.length > 1) {
              matches.push(match[1]);
            }
          }
          const packageUsesSources: { [key: string]: boolean } = {};
          const missingPackages = _.uniq(
            _.uniq(matches).map((module) => {
              // Parse the package-name from the import (e.g. "react-native-web/src/modules" => "react-native-web")
              const comps = module.split('/');
              const packageName =
                module.startsWith('@') && comps.length >= 2 ? `${comps[0]}/${comps[1]}` : comps[0];
              const result = validate(packageName);
              if (!result.validForNewPackages && !result.validForOldPackages) {
                throw new Error(`Invalid module ${module} - ${e.message.split('\n')[0]}`);
              }

              if (installedDependencies.includes(packageName)) {
                throw new Error(
                  `Cannot resolve module ${module} after installing it as a dependency`
                );
              }

              // When the import contains more than just the package-name (e.g. "react-native-web/src/modules/normalizeColor"),
              // then we need to install the package as a dependency so the import can be resolved using the source-code of the package.
              if (comps.length > (module.startsWith('@') ? 2 : 1)) {
                packageUsesSources[packageName] = true;
              }
              return packageName;
            })
          );

          if (missingPackages.length) {
            const missingDependencies: { [key: string]: string } = {};
            externals = [...externals];
            missingPackages.forEach((packageName) => {
              // Install all missing packages that either require the source-code
              // to be present, or which are not marked as external
              if (
                packageUsesSources[packageName] ||
                (!externals.includes(packageName) && !isExternal(packageName))
              ) {
                let version = '*';
                if (pkg.dependencies?.[packageName]) {
                  version = pkg.dependencies[packageName];
                } else if (externalDependencies[packageName]) {
                  version = externalDependencies[packageName]!;
                } else if (pkg.devDependencies?.[packageName]) {
                  version = pkg.devDependencies[packageName];
                } else {
                  logger.warn(
                    logMetadata,
                    `Dependency found on "${packageName}" that is required for bundling, but its version is not defined in package.json. Using "*" instead.`
                  );
                }
                missingDependencies[packageName] = version;
              }

              // Update the externals for the webpack bundler
              if (!externals.includes(packageName) && isExternal(packageName)) {
                externals.push(packageName);
              }
            });

            // Install dependencies and re-try bundling
            if (Object.keys(missingDependencies).length) {
              await installDependencies(pkg, cwd, missingDependencies);
              installedDependencies = [
                ...installedDependencies,
                ...Object.keys(missingDependencies),
              ];
            }
          } else {
            // Bundling failed and no "Missing modules" were found
            throw e;
          }
        } else {
          // No error.message
          throw e;
        }
      } catch (err) {
        // Not all packages bundle correctly on the web platform.
        // An example is "react-native-screens/native-stack" which imports
        // "react-native/Libraries/ReactNative/AppContainer". This import depends on
        // "../../Utilities/Platform.ios.js" or "../../Utilities/Platform.android.js",
        // but fails to resolve on web. When bundling for web fails, continue with
        // the other platforms.
        if (e.message.includes('.web.') && platforms.includes('web') && platforms.length > 1) {
          platforms = platforms.filter((platform) => platform !== 'web');
          logger.warn(
            logMetadata,
            `An error occured "${
              err.message.split('\n')[0]
            }" when bundling the "web" platform. Proceeding with platforms "${platforms.join(
              ', '
            )}".`
          );
        } else {
          throw err;
        }
      }
    }
  }

  // Abort when the bundler takes many cycles to complete.
  // This is a fail-safe situation in case the installation of dependencies
  // does not resolve the "Missing modules" reported by the bundler.
  throw new Error('Bundling failed, too many cycles');
});
