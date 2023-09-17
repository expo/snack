import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import path from 'path';

import logger from '../logger';
import { Package } from '../types';

/**
 ***************************************************
 * ____    _    _   _  ____ _____ ____
 * |  _ \  / \  | \ | |/ ___| ____|  _ \
 * | | | |/ _ \ |  \| | |  _|  _| | |_) |
 * | |_| / ___ \| |\  | |_| | |___|  _ <
 * |____/_/   \_\_| \_|\____|_____|_| \_\
 *
 * This prevents yarn from seeing the environment variables of this process (which
 * include a bunch of secrets and stuff). Don't change the `env` config lightly.
 *
 ***************************************************
 */

export function spawnSafeAsync(
  cmd: string,
  args?: string[],
  cwd?: string
): SpawnPromise<SpawnResult> {
  // spawn handles shell escaping for us, since we can have untrusted input here
  return spawnAsync(cmd, args, {
    cwd,
    env: {
      PATH: process.env.PATH,
      // In the current CI environment, we run builds in a Nixos-like
      // container, and we use volta to install node, npm, and yarn.  The node
      // binary which volta installs is dynamically linked to hard-coded paths
      // in /lib64, which do not exist in Nixos.  Instead, the libraries are in
      // paths listed in $LD_LIBRARY_PATH
      LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH,
    },
  });
}

export async function getBunPackagerAsync(): Promise<string | undefined> {
  try {
    const whichOutput = await spawnSafeAsync('which', ['bun']);
    const bun = whichOutput.stdout.trim();
    return bun;
  } catch {
    return undefined;
  }
}

export async function getYarnPackagerAsync(): Promise<string | undefined> {
  try {
    const npmBinOutput = await spawnSafeAsync('npm', ['bin']);
    const yarn = path.resolve(npmBinOutput.stdout.trim(), 'yarn');
    return yarn;
  } catch {
    return undefined;
  }
}

async function installDependencyAsync(options: {
  bun?: string;
  yarn?: string;
  name: string;
  version: string;
  cwd: string;
  packages: string[];
}): Promise<void> {
  /**
   ***************************************************
   * ____    _    _   _  ____ _____ ____
   * |  _ \  / \  | \ | |/ ___| ____|  _ \
   * | | | |/ _ \ |  \| | |  _|  _| | |_) |
   * | |_| / ___ \| |\  | |_| | |___|  _ <
   * |____/_/   \_\_| \_|\____|_____|_| \_\
   *
   * Ignoring scripts is a key part of sandboxing this. Don't change it lightly!
   *
   ***************************************************
   */

  const flags = [
    '--ignore-scripts', // Don't want to run malicious post-install scripts.
    '--production', // Don't need to install dev dependencies.
    '--ignore-engines', // Sometimes sub-dependencies will want a specific version of Node. Don't care, try anyway.
    '--ignore-platform', // Some libraries use fsevents, which is not compatible on linux. Don't care, try anway.
    '--non-interactive', // In some cases yarn/npm will show an interactive prompt. Throw an error instead.
  ];

  if (options.bun) {
    const bunFlags = [
      '--ignore-scripts', // Don't want to run malicious post-install scripts.
    ];

    try {
      await spawnSafeAsync(options.bun, ['add', ...bunFlags, ...options.packages], options.cwd);
      return;
    } catch (error) {
      logger.warn(
        { pkg: { name, version: options.version }, error },
        `error running bun: ${error.message}. trying yarn instead.`
      );
    }
  }

  if (options.yarn) {
    try {
      await spawnSafeAsync(options.yarn, ['add', ...flags, ...options.packages], options.cwd);
      return;
    } catch (error) {
      logger.warn(
        { pkg: { name, version: options.version }, error },
        `error running yarn: ${error.message}. trying npm instead.`
      );
    }
  }

  await spawnSafeAsync('npm', ['install', ...flags, ...options.packages], options.cwd);
}

export default async function installDependencies(
  pkg: Package,
  cwd: string,
  dependencies: { [key: string]: string | null } // peerDependencies,
): Promise<void> {
  const logMetadata = {
    pkg: {
      name: pkg.name,
      version: pkg.version,
    },
  };

  const packages = Object.keys(dependencies).map(
    // babel-preset-expo aliases 'react-native-vector-icons' to '@expo/vector-icons'
    (name) => `${name}${dependencies[name] ? `@${dependencies[name]}` : ''}`
  );

  logger.info({ ...logMetadata, dependencies }, `installing dependencies: ${packages.join(', ')}`);

  const [bun, yarn] = await Promise.all([getBunPackagerAsync(), getYarnPackagerAsync()]);

  await installDependencyAsync({ bun, yarn, name: pkg.name, version: pkg.version, cwd, packages });
}
