import path from 'path';
import { Stream } from 'stream';
import targz from 'targz';
import { createWriteStream } from 'fs';

import logger from '../logger';
import { Package } from '../types';
import fetchWithTimeout from './fetch-timeout';

// TODO: `version` parameter isn't doing anything here, not sure if we should keep it?
export default async function fetchAndExtract(
  pkg: Package,
  _version: string,
  dir: string,
): Promise<void> {
  const url = pkg.dist.tarball;

  logger.info({ pkg, url }, `fetching tarball`);

  const request = await fetchWithTimeout(url, {
    timeout: 10000,
  });

  const write = createWriteStream(path.join(dir, 'package.tgz'));

  if (!request.body) {
    throw new Error(`No body in response of tarball request ${JSON.stringify({ pkg, url })}`);
  }

  Stream.Readable.fromWeb(request.body).pipe(write);

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
        },
      );
    });
  });
}
