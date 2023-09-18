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
  cwd?: string,
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

export async function getYarnPackagerAsync(): Promise<string> {
  const npmBinOutput = await spawnSafeAsync('npm', ['bin']);
  const yarn = path.resolve(npmBinOutput.stdout.trim(), 'yarn');
  return yarn;
}

async function installDependencyAsync(
  yarn: string,
  name: string,
  version: string,
  cwd: string,
  packages: string[],
): Promise<void> {
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

  try {
    await spawnSafeAsync(yarn, ['add', ...flags, ...packages], cwd);
  } catch (e) {
    logger.warn(
      { pkg: { name, version }, error: e },
      `error running yarn: ${e.message}. trying npm instead.`,
    );
    await spawnSafeAsync('npm', ['install', ...flags, ...packages], cwd);
  }
}

export default async function installDependencies(
  pkg: Package,
  cwd: string,
  dependencies: { [key: string]: string | null }, // peerDependencies,
): Promise<void> {
  const logMetadata = {
    pkg: {
      name: pkg.name,
      version: pkg.version,
    },
  };

  const packages = Object.keys(dependencies).map(
    // babel-preset-expo aliases 'react-native-vector-icons' to '@expo/vector-icons'
    (name) => `${name}${dependencies[name] ? `@${dependencies[name]}` : ''}`,
  );

  logger.info({ ...logMetadata, dependencies }, `installing dependencies: ${packages.join(', ')}`);

  const yarn = await getYarnPackagerAsync();

  await installDependencyAsync(yarn, pkg.name, pkg.version, cwd, packages);
}
