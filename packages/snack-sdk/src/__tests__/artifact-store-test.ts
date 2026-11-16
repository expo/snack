import { createHash } from 'crypto';

import { browserArtifactDigest, loadCompiledArtifact } from '../Artifact';
import { createSnackArtifactStore } from '../ArtifactStore';
import { fetch } from '../utils';

jest.mock('../utils', () => ({ fetch: jest.fn() }));
Object.defineProperty(globalThis, 'crypto', {
  value: require('crypto').webcrypto,
  configurable: true,
});

it('retries failed chunk publication, reuses successful chunks and preserves UTF-8 boundaries', async () => {
  const objects = new Map<string, string>();
  let fail = true;
  const mockedFetch = fetch as jest.Mock;
  mockedFetch.mockImplementation(async (_url, input) => {
    const { code } = JSON.parse(input.body);
    if (objects.size === 1 && fail) {
      fail = false;
      return { ok: false, status: 503 };
    }
    const url =
      'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~code/' +
      createHash('md5').update(code).digest('hex');
    objects.set(url, code);
    return { ok: true, json: async () => ({ url }) };
  });
  const artifact = {
    format: 'snack-worker-graph' as const,
    version: 1 as const,
    sdkVersion: '58.0.0' as const,
    platforms: { web: '😀日本語'.repeat(50000) },
  };
  const store = createSnackArtifactStore('https://api.example');
  const signal = new AbortController().signal;
  await expect(store.upload(artifact, signal)).rejects.toThrow('503');
  const reference = await store.upload(artifact, signal);
  expect(reference.chunks.length).toBeGreaterThan(1);
  await expect(
    loadCompiledArtifact(reference, {
      read: async (url) => objects.get(url)!,
      digest: browserArtifactDigest,
    }),
  ).resolves.toEqual(artifact);
  const calls = mockedFetch.mock.calls.length;
  await expect(store.upload(artifact, signal)).resolves.toEqual(reference);
  expect(mockedFetch).toHaveBeenCalledTimes(calls);
});

it('does not publish a reference when canceled during the last upload', async () => {
  const controller = new AbortController();
  (fetch as jest.Mock).mockImplementation(async () => {
    controller.abort();
    return {
      ok: true,
      json: async () => ({
        url: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~code/' + 'a'.repeat(32),
      }),
    };
  });
  await expect(
    createSnackArtifactStore('https://api.example').upload(
      { format: 'snack-worker-graph', version: 1, sdkVersion: '58.0.0', platforms: { web: '{}' } },
      controller.signal,
    ),
  ).rejects.toThrow('canceled');
});
