import fs from 'fs';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import zlib from 'zlib';

import { Package } from '../../types';
import fetchAndExtract from '../fetchAndExtract';

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');
const tar = require('tar-stream');
const tarHeaders = require('tar-stream/headers');
let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'snackager-archive-'));
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

async function archive(header: Record<string, unknown>) {
  const pack = tar.pack();
  const chunks: Buffer[] = [];
  pack.on('data', (chunk: Buffer) => chunks.push(chunk));
  const complete = new Promise<Buffer>((resolve) => {
    pack.on('end', () => resolve(zlib.gzipSync(Buffer.concat(chunks))));
  });
  pack.entry(header, header.type === 'file' ? 'fixture' : undefined);
  pack.finalize();
  jest.mocked(fetch).mockResolvedValueOnce(new Response(Readable.from([await complete])));
}

const pkg = {
  name: 'fixture',
  dist: { tarball: 'https://example.invalid/package.tgz' },
} as Package;

it.each([
  { name: 'package/link', type: 'symlink', linkname: '/outside' },
  { name: 'package/link', type: 'link', linkname: 'package/file' },
  { name: 'package/../../outside', type: 'file' },
  { name: '/absolute', type: 'file' },
])('rejects unsupported archive entry %j', async (header) => {
  await archive(header);
  await expect(fetchAndExtract(pkg, root)).rejects.toThrow(
    'Package archive contains an unsupported link or path',
  );
  expect(fs.readdirSync(root)).toEqual([]);
});

it('extracts regular package files', async () => {
  await archive({ name: 'package/index.js', type: 'file' });
  await fetchAndExtract(pkg, root);
  expect(fs.readFileSync(path.join(root, 'package/index.js'), 'utf8')).toBe('fixture');
});

it('preserves the HTTP error when the response has no body', async () => {
  jest
    .mocked(fetch)
    .mockResolvedValueOnce(new Response(null, { status: 404, statusText: 'Not Found' }));
  await expect(fetchAndExtract(pkg, root)).rejects.toThrow('404 Not Found');
});

it.each([
  ['symlink', 0, 'Package archive contains an unsupported link or path'],
  ['file', 100 * 1024 * 1024 + 1, 'Package archive exceeds the 100 MiB expanded size limit'],
])(
  'aborts a rejected %s header without waiting for the response to end',
  async (type, size, message) => {
    const compressed = zlib.gzipSync(
      tarHeaders.encode({
        name: 'package/rejected',
        type,
        size,
        linkname: '../outside',
        mode: 0o600,
        uid: 0,
        gid: 0,
        mtime: new Date(0),
      }),
    );
    let sent = false;
    const body = new Readable({
      read() {
        if (!sent) {
          sent = true;
          this.push(compressed);
        }
      },
    });
    jest.mocked(fetch).mockResolvedValueOnce(new Response(body));
    await expect(fetchAndExtract(pkg, root)).rejects.toThrow(String(message));
    expect(body.destroyed).toBe(true);
    expect(fs.readdirSync(root)).toEqual([]);
  },
);
