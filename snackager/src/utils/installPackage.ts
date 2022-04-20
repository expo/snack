import path from 'path';

import { isExternal } from '../bundler/externals';
import logger from '../logger';
import { spawnSafeAsync, getYarnPackagerAsync } from './installDependencies';

// TODO: find the typescript definitions for this package, `@types/sander` doesn't exists
const { readFile, writeFile } = require('sander');

export default async function installPackage(
  cwd: string,
  packagerFlags: string[] = []
): Promise<void> {
  const content = await readFile(path.join(cwd, 'package.json'));
  const pkg = JSON.parse(content);

  // Remove devDependencies from package.json, as we don't want yarn to fetch them
  // https://github.com/yarnpkg/yarn/issues/3630
  delete pkg.devDependencies;

  // No need to install dependencies that are supposed to be external
  pkg.dependencies = pkg.dependencies || {};
  for (const key in pkg.dependencies) {
    if (isExternal(key)) {
      delete pkg.dependencies[key];
    }
  }

  // Add commonly used dependencies
  if (!pkg.dependencies['@babel/runtime']) {
    pkg.dependencies['@babel/runtime'] = '*';
  }

  // Rewrite file
  await writeFile(path.join(cwd, 'package.json'), JSON.stringify(pkg, undefined, 2));

  const logMetadata = {
    pkg: {
      name: pkg.name,
      version: pkg.version,
    },
  };

  const regularDependencies = Object.keys(pkg.dependencies || {}).map(
    (name) => `${name}${pkg.dependencies[name] ? `@${pkg.dependencies[name]}` : ''}`
  );
  logger.info(
    { ...logMetadata, dependencies: regularDependencies },
    `running yarn --production, dependencies: ${regularDependencies.join(', ')}`
  );

  const yarn = await getYarnPackagerAsync();
  const flags = [
    ...packagerFlags,
    '--ignore-scripts', // Don't want to run malicious post-install scripts.
    '--production', // Don't need to install dev dependencies.
    '--ignore-engines', // Sometimes sub-dependencies will want a specific version of Node. Don't care, try anyway.
    '--ignore-platform', // Some libraries use fsevents, which is not compatible on linux. Don't care, try anway.
    '--non-interactive', // In some cases yarn/npm will show an interactive prompt. Throw an error instead.
  ];
  try {
    await spawnSafeAsync(yarn, [...flags], cwd);
  } catch (e) {
    logger.warn({ pkg, error: e }, `error running yarn: ${e.message}. trying npm instead.`);
    await spawnSafeAsync('npm', ['install', ...flags], cwd);
  }
}
