import fetch from 'node-fetch';
import path from 'path';
import targz from 'targz';

import logger from '../logger';
import { Package } from '../types';

// TODO: find the typescript definitions for this package, `@types/sander` doesn't exists
const { createWriteStream } = require('sander');

// TODO: `version` parameter isn't doing anything here, not sure if we should keep it?
export default async function fetchAndExtract(
  pkg: Package,
  _version: string,
  dir: string
): Promise<void> {
  const url = pkg.dist.tarball;

  logger.info({ pkg, url }, `fetching tarball`);

  const request = await fetch(url, {
    timeout: 10000,
  });

  const write = createWriteStream(path.join(dir, 'package.tgz'));

  request.body.pipe(write);

  return new Promise((resolve, reject) => {
    write.on('error', reject);
    write.on('finish', async () => {
      logger.info({ pkg, dir }, `extracting`);
      targz.decompress(
        {
          src: path.join(dir, 'package.tgz'),
          dest: dir,
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            logger.info({ pkg }, `done extracting`);
            resolve();
          }
        }
      );
    });
  });
}
