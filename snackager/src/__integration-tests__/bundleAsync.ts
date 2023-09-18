import fs from 'fs';
import glob from 'glob';
import mapValues from 'lodash/mapValues';
import os from 'os';
import path from 'path';
import util from 'util';

import { getCoreExternals } from '../bundler/externals';
import fetchAndExtract from '../utils/fetchAndExtract';
import fetchMetadata from '../utils/fetchMetadata';
import findVersion from '../utils/findVersion';
import getBundleInfo, { BundleInfo } from '../utils/getBundleInfo';
import installPackage from '../utils/installPackage';
import packageBundle from '../utils/packageBundle';
import parseRequest from '../utils/parseRequest';
import resolveDependencies from '../utils/resolveDependencies';

// TODO: replace rimraf with fs.rm once node 14.40 lands
const rimraf = util.promisify(require('rimraf'));

const DEFAULT_PLATFORMS = ['ios', 'android', 'web'];

type BundledPackage = {
  name: string;
  version: string;
  // TODO: fix possible null dependency and replace with `Package['peerDependencies']`
  peerDependencies: { [dependency: string]: string | null };
  files: { [platform: string]: { [file: string]: BundleInfo } };
};

// Keep track of all tested packages, to clean the lockfiles if they aren't tested anymore
const testedPackages: string[] = [];

export default async function bundleAsync(
  packageSpec: string,
  bundlePlatforms: string[] = DEFAULT_PLATFORMS,
  includeCode?: boolean,
): Promise<BundledPackage> {
  const { qualified, id, tag, scope, deep, platforms } = parseRequest(
    `/${packageSpec}?platforms=${bundlePlatforms.join(',')}`,
  );
  const workdir = path.join(
    fs.realpathSync(os.tmpdir()),
    'snackager',
    '__integration-tests__',
    qualified,
  );
  try {
    await rimraf(workdir);
  } catch {}
  const packagedir = path.join(workdir, 'package');

  const meta = await fetchMetadata(qualified, { scope, id });
  const { version, isLatest } = findVersion(qualified, meta, tag);
  const { pkg, dependencies } = resolveDependencies(meta, version, isLatest, deep);

  await fetchAndExtract(pkg, version, workdir);

  // keep track of the used lockfiles, and try to restore the lockfile
  // this represents the package + nested dependency "state" that was used in the bundle snapshot
  testedPackages.push(packageSpec);
  const cacheHit = await restoreLockfile(packageSpec, packagedir);
  if (cacheHit) {
    await installPackage(packagedir, [
      // CI is running Linux, while we develop on MacOS/Windows.
      // Don't quit when there is a platform mismatch
      '--ignore-platform',
      '--frozen-lockfile',
    ]);
  } else {
    await installPackage(packagedir);
    await saveLockfile(packageSpec, packagedir);
  }

  const files = await packageBundle({
    pkg,
    cwd: packagedir,
    platforms,
    base: 'nonsense',
    deep,
    externalDependencies: dependencies,
  });

  return {
    name: qualified,
    version,
    files: mapValues(files, (file, platform) =>
      mapValues(file, (buffer, filename) => {
        const metadata = getBundleInfo(filename, buffer, includeCode);
        (metadata.externals ?? []).forEach((external) => {
          if (!getCoreExternals().includes(external) && !dependencies[external]) {
            console.warn(
              `Bundle "${qualified}@${version}/${platform}-${filename}" contains external "${external}" which is not listed as a peer dependency in package.json`,
            );
          }
        });
        return metadata;
      }),
    ),
    peerDependencies: dependencies,
  };
}

// Location of the lockfiles to store them in, they should be considered similar to snapshots
const lockfileStorage = path.join(__dirname, '__snapshots__', 'lockfiles');

async function restoreLockfile(packageSpec: string, directory: string): Promise<boolean> {
  const packagePath = path.join(directory, 'yarn.lock');
  const storagePath = path.join(lockfileStorage, `${packageSpec}.lock`);

  try {
    await fs.promises.copyFile(storagePath, packagePath);
    // Lockfile is restored successfully (cache hit)
    return true;
  } catch {
    // Lockfile couldn't be restored (no cache hit)
    return false;
  }
}

async function saveLockfile(packageSpec: string, directory: string): Promise<void> {
  const packagePath = path.join(directory, 'yarn.lock');
  const storagePath = path.join(lockfileStorage, `${packageSpec}.lock`);

  await fs.promises.mkdir(path.dirname(storagePath), { recursive: true });
  // Always keep the lockfile up to date after an install
  await fs.promises.copyFile(packagePath, storagePath);

  console.warn(`Added lockfile for ${packageSpec}, commit this to the repository.`);
}

export async function cleanUnusedLockfiles(): Promise<void> {
  const existingPackages = await new Promise<string[]>((resolve, reject) => {
    glob('**/*.lock', { cwd: lockfileStorage }, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files.map((filename) => filename.replace('.lock', '')));
      }
    });
  });

  const unusedPackages = existingPackages.filter(
    (packageSpec) => !testedPackages.includes(packageSpec),
  );

  // remove unused package lockfiles from the repo
  for (const packageSpec of unusedPackages) {
    await fs.promises.unlink(path.join(lockfileStorage, `${packageSpec}.lock`));
    console.warn(`Removed obsolete lockfile for ${packageSpec}, commit this to the repository.`);
  }
}
