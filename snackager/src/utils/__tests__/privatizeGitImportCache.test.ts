const { privatizeGitImportCache } = require('../../../scripts/privatizeGitImportCache');

function createClient() {
  return {
    listObjectVersions: jest
      .fn()
      .mockReturnValueOnce({
        promise: async () => ({
          Versions: [{ Key: 'legacy-import', VersionId: 'old' }],
          IsTruncated: true,
          NextKeyMarker: 'legacy-import',
          NextVersionIdMarker: 'old',
        }),
      })
      .mockReturnValueOnce({
        promise: async () => ({
          Versions: [
            { Key: 'legacy-import', VersionId: 'current' },
            { Key: 'git-v2:import', VersionId: 'null' },
          ],
          IsTruncated: false,
        }),
      }),
    putObjectAcl: jest.fn(() => ({ promise: async () => ({}) })),
  };
}

it.each([false, true])('paginates import ACL changes with apply=%s', async (apply) => {
  const client = createClient();
  expect(await privatizeGitImportCache(client, 'imports', apply, jest.fn())).toBe(3);
  expect(client.listObjectVersions).toHaveBeenLastCalledWith({
    Bucket: 'imports',
    KeyMarker: 'legacy-import',
    VersionIdMarker: 'old',
  });
  expect(client.putObjectAcl.mock.calls).toEqual(
    apply
      ? [
          [{ Bucket: 'imports', Key: 'legacy-import', VersionId: 'old', ACL: 'private' }],
          [{ Bucket: 'imports', Key: 'legacy-import', VersionId: 'current', ACL: 'private' }],
          [{ Bucket: 'imports', Key: 'git-v2:import', VersionId: 'null', ACL: 'private' }],
        ]
      : [],
  );
});

it('stops when an ACL change fails', async () => {
  const client = createClient();
  client.putObjectAcl.mockReturnValueOnce({
    promise: async () => {
      throw new Error('Access denied');
    },
  });
  await expect(privatizeGitImportCache(client, 'imports', true, jest.fn())).rejects.toThrow(
    'Access denied',
  );
  expect(client.listObjectVersions).toHaveBeenCalledTimes(1);
});

it('continues past pages containing only delete markers', async () => {
  const client = createClient();
  client.listObjectVersions
    .mockReset()
    .mockReturnValueOnce({
      promise: async () => ({
        DeleteMarkers: [{ Key: 'removed-import', VersionId: 'deleted' }],
        IsTruncated: true,
        NextKeyMarker: 'removed-import',
        NextVersionIdMarker: 'deleted',
      }),
    })
    .mockReturnValueOnce({
      promise: async () => ({ Versions: [{ Key: 'legacy-import', VersionId: 'old' }] }),
    });
  expect(await privatizeGitImportCache(client, 'imports', true, jest.fn())).toBe(1);
  expect(client.putObjectAcl).toHaveBeenCalledTimes(1);
  expect(client.putObjectAcl).toHaveBeenCalledWith({
    Bucket: 'imports',
    Key: 'legacy-import',
    VersionId: 'old',
    ACL: 'private',
  });
});
