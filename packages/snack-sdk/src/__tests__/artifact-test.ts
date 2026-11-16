import { createHash } from 'crypto';

import {
  loadCompiledArtifact,
  SnackArtifactReference,
  validateArtifactReference,
} from '../Artifact';

const digest = async (text: string) => createHash('sha256').update(text).digest('hex');
const artifact = {
  format: 'snack-worker-graph',
  version: 1,
  sdkVersion: '58.0.0',
  platforms: { ios: '日本語😀' },
};
async function fixture() {
  const text = JSON.stringify(artifact);
  const sha256 = await digest(text);
  const byteLength = Buffer.byteLength(text);
  const reference: SnackArtifactReference = {
    format: 'snack-worker-graph',
    version: 1,
    sdkVersion: '58.0.0',
    sha256,
    byteLength,
    chunks: [
      {
        url: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~code/' + 'a'.repeat(32),
        sha256,
        byteLength,
      },
    ],
  };
  return { text, reference };
}
it('verifies UTF-8 bytes and hashes before returning compiled code', async () => {
  const { text, reference } = await fixture();
  await expect(
    loadCompiledArtifact(reference, { read: async () => text, digest }),
  ).resolves.toEqual(artifact);
});
it('rejects substituted code and truncated downloads', async () => {
  const { text, reference } = await fixture();
  for (const body of [text.replace('ios', 'web'), text.slice(0, -1)]) {
    await expect(
      loadCompiledArtifact(reference, { read: async () => body, digest }),
    ).rejects.toThrow('integrity');
  }
});
it('rejects untrusted locations and malformed sizes before fetching', async () => {
  const { reference } = await fixture();
  const read = jest.fn();
  for (const url of ['https://example.com/code', reference.chunks[0].url + '?redirect=1']) {
    await expect(
      loadCompiledArtifact(
        { ...reference, chunks: [{ ...reference.chunks[0], url }] },
        { read, digest },
      ),
    ).rejects.toThrow('Invalid');
  }
  expect(read).not.toHaveBeenCalled();
  expect(() =>
    validateArtifactReference({ ...reference, byteLength: reference.byteLength + 1 }),
  ).toThrow('Invalid');
});
it('rejects a manifest digest inconsistent with valid chunks', async () => {
  const { text, reference } = await fixture();
  await expect(
    loadCompiledArtifact(
      { ...reference, sha256: '0'.repeat(64) },
      { read: async () => text, digest },
    ),
  ).rejects.toThrow('integrity');
});
