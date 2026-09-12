import { getLatestHash } from '../utils/clone';

it.each([
  'file:///tmp/repo',
  'ssh://git@github.com/expo/snack',
  'git://github.com/expo/snack',
  'http://github.com/expo/snack',
  'ext::unexpected-command',
])('Git rejects transport for %s without connecting', async (repo) => {
  await expect(getLatestHash(repo, '')).rejects.toMatchObject({
    cause: { stderr: expect.stringMatching(/transport .* not allowed/) },
  });
});
