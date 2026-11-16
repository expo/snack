import { loadSavedArtifactReference } from '../SavedArtifact';
const reference = {
  format: 'snack-worker-graph',
  version: 1,
  sdkVersion: '58.0.0',
  byteLength: 1,
  sha256: 'a'.repeat(64),
  chunks: [
    {
      url: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~code/' + 'b'.repeat(32),
      byteLength: 1,
      sha256: 'c'.repeat(64),
    },
  ],
};
const response = { manifest: { sdkVersion: '58.0.0', workerArtifact: reference } };
describe('saved native artifact bootstrap', () => {
  it('loads a named saved Snack with no channel or editor', async () => {
    const read = jest.fn(async () => JSON.stringify(response));
    const signal = new AbortController().signal;
    expect(
      await loadSavedArtifactReference('https://api.expo.dev', '@owner/project', signal, read),
    ).toEqual(reference);
    expect(read).toHaveBeenCalledWith('https://api.expo.dev/v2/snack/@owner/project', signal);
  });
  it.each(['https://evil.test/x', '../private', '@owner/../private', 'a?token=secret'])(
    'rejects invalid identifier %s before I/O',
    async (id) => {
      const read = jest.fn();
      await expect(
        loadSavedArtifactReference('https://api.expo.dev', id, new AbortController().signal, read),
      ).rejects.toThrow('identifier');
      expect(read).not.toHaveBeenCalled();
    },
  );
  it('rejects old saves and corrupt references', async () => {
    for (const manifest of [
      { sdkVersion: '57.0.0', workerArtifact: reference },
      { sdkVersion: '58.0.0' },
      { sdkVersion: '58.0.0', workerArtifact: { ...reference, sha256: 'bad' } },
    ]) {
      await expect(
        loadSavedArtifactReference(
          'https://api.expo.dev',
          'saved',
          new AbortController().signal,
          async () => JSON.stringify({ manifest }),
        ),
      ).rejects.toThrow();
    }
  });
  it('discards a response canceled during download', async () => {
    const controller = new AbortController();
    await expect(
      loadSavedArtifactReference('https://api.expo.dev', 'saved', controller.signal, async () => {
        controller.abort();
        return JSON.stringify(response);
      }),
    ).rejects.toThrow();
  });
});
