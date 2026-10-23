import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import tar from 'tar-fs';
import { createGunzip } from 'zlib';

import logger from '../logger';
import { Package } from '../types';

const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 100 * 1024 * 1024;
const MAX_ENTRIES = 100000;
const EXPANSION_ERROR = 'Package archive exceeds the 100 MiB expanded size limit.';

function limitBytes(maximum: number, message: string): Transform {
  let bytes = 0;
  return new Transform({
    transform(chunk, _encoding, callback) {
      bytes += chunk.length;
      callback(bytes > maximum ? new Error(message) : null, chunk);
    },
  });
}

export default async function fetchAndExtract(pkg: Package, dir: string): Promise<void> {
  await fs.promises.mkdir(dir, { recursive: true });
  const url = pkg.dist.tarball;
  logger.info({ pkg, url }, 'fetching tarball');
  const response = await fetch(url, { timeout: 10000 });
  if (!response.ok) {
    (response.body as Readable | null)?.destroy();
    throw new Error(
      `Failed to fetch tarball from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  let entries = 0;
  const roots = new Set(['package', pkg.name.split('/').pop()!]);
  const extract = tar.extract(dir, {
    ignore(_filename, header) {
      if (++entries > MAX_ENTRIES) {
        extract.destroy(new Error('Package archive exceeds the 100,000 entry limit.'));
        return true;
      }
      if (!header) {
        extract.destroy(new Error('Package archive contains an invalid header.'));
        return true;
      }
      const components = header.name.split(/[\\/]/).filter((part) => part && part !== '.');
      if (header.type === 'directory' && !components.length) return true;
      if (
        !['file', 'directory'].includes(header.type) ||
        path.isAbsolute(header.name) ||
        components.includes('..') ||
        !roots.has(components[0])
      ) {
        extract.destroy(new Error('Package archive contains an unsupported link or path.'));
        return true;
      }
      if (header.size > MAX_EXPANDED_BYTES) {
        extract.destroy(new Error(EXPANSION_ERROR));
        return true;
      }
      return false;
    },
  });

  await pipeline(
    response.body,
    limitBytes(MAX_ARCHIVE_BYTES, 'Package archive exceeds the 100 MiB download limit.'),
    createGunzip(),
    limitBytes(MAX_EXPANDED_BYTES, EXPANSION_ERROR),
    extract,
  );
  logger.info({ pkg }, 'done extracting');
}
