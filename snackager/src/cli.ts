import fs from 'fs';
import os from 'os';
import path from 'path';
import util from 'util';

import logger, { setLogFormat } from './logger';
import fetchAndExtract from './utils/fetchAndExtract';
import fetchMetadata from './utils/fetchMetadata';
import findVersion from './utils/findVersion';
import getBundleInfo from './utils/getBundleInfo';
import installPackage from './utils/installPackage';
import packageBundle from './utils/packageBundle';
import parseRequest from './utils/parseRequest';
import resolveDependencies from './utils/resolveDependencies';

// TODO: replace rimraf with fs.rm once node 14.40 lands
const rimraf = util.promisify(require('rimraf'));

// Disable the Google log-style format when using the CLI, so the bunyan formatter
// can be used, e.g. "yarn bundle expo-auth-session | ./node_modules/.bin/bunyan"
setLogFormat('bunyan');

async function main(): Promise<void> {
  // always leave files in place for this
  process.env.DEBUG_LOCAL_FILES = '1';

  const packageSpec = process.argv[2];
  if (!packageSpec) {
    throw new Error('failed to provide package spec');
  }

  logger.info(`working on ${packageSpec}`);

  let platformArgs = process.argv[3];
  if (platformArgs) {
    platformArgs = `?platforms=${platformArgs}`;
  } else {
    platformArgs = '';
  }

  const { qualified, scope, id, tag, deep, platforms } = parseRequest(
    `/${packageSpec}${platformArgs}`
  );

  const workdir = path.join(fs.realpathSync(os.tmpdir()), qualified);
  const cwd = path.join(workdir, 'package');

  logger.info(`output will be written to ${workdir}`);

  try {
    await rimraf(workdir);
  } catch (e) {}

  fs.mkdirSync(workdir, { recursive: true });

  const meta = await fetchMetadata(qualified, { scope, id });
  const { version, isLatest } = findVersion(qualified, meta, tag);
  const { pkg, dependencies } = resolveDependencies(meta, version, isLatest, deep);

  await fetchAndExtract(pkg, version, workdir);
  await installPackage(cwd);

  const files = await packageBundle({
    pkg,
    cwd,
    platforms,
    base: 'nonsense', // TODO find out if this is actually a problem?
    deep,
    externalDependencies: dependencies,
  });

  logger.info({ pkg }, 'writing files');
  Object.keys(files).forEach((platform) => {
    Object.keys(files[platform]).forEach((file) => {
      const filePath = path.join(workdir, `${platform}-${file}`);
      const buffer = files[platform][file];
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath));
      }
      fs.writeFileSync(filePath, buffer);
      const info = getBundleInfo(filePath, buffer);
      logger.info({ file: filePath, ...info }, `wrote file to ${path.basename(filePath)}`);
    });
  });
}

main()
  .then(() => console.log('ok!'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
