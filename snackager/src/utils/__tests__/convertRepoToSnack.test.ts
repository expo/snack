import fs from 'fs';

import { getCachedObj } from '../cacheSnackObj';
import { clone, getCurrentHash, getLatestHash, getLatestCommitDate } from '../clone';
import { getGitSnackObj } from '../convertRepoToSnack';

jest.mock('../cacheSnackObj');
jest.mock('../clone');
const commit = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const cached = { files: {}, dependencies: {}, sdkVersion: '', date: '' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
  jest.spyOn(fs.promises, 'mkdtemp').mockResolvedValue('clones/import-random');
  jest.spyOn(fs.promises, 'rm').mockResolvedValue(undefined);
  jest.mocked(getCurrentHash).mockResolvedValue(commit);
  jest.mocked(getCachedObj).mockResolvedValue(cached);
});
afterEach(() => jest.restoreAllMocks());

it('uses the resolved commit for cache keys and keeps the raw revision out of paths', async () => {
  const ref = '../outside';
  expect(await getGitSnackObj('https://github.com/expo/example', '/', '', ref)).toBe(cached);
  expect(clone).toHaveBeenCalledWith(
    'https://github.com/expo/example',
    '',
    ref,
    'clones/import-random/repository',
  );
  expect(getCurrentHash).toHaveBeenCalledWith('clones/import-random/repository');
  expect(getCachedObj).toHaveBeenCalledWith(`github.com%2Fexpo%2Fexample:%2F@master!${commit}`);
  expect(fs.promises.rm).toHaveBeenCalledWith('clones/import-random', {
    recursive: true,
    force: true,
  });
});

it('cleans up when resolution fails', async () => {
  jest.mocked(getCurrentHash).mockRejectedValueOnce(new Error('invalid revision'));
  await expect(getGitSnackObj('https://github.com/expo/example', '/', '', 'bad')).rejects.toThrow(
    'invalid revision',
  );
  expect(getCachedObj).not.toHaveBeenCalled();
  expect(fs.promises.rm).toHaveBeenCalled();
});

it.each(['../outside', 'src/../outside', 'src/..\\outside'])(
  'rejects unsafe subpath %s before doing work',
  async (subpath) => {
    await expect(getGitSnackObj('https://github.com/expo/example', subpath)).rejects.toThrow(
      'must not be ".."',
    );
    expect(clone).not.toHaveBeenCalled();
    expect(getCachedObj).not.toHaveBeenCalled();
    expect(fs.promises.mkdir).not.toHaveBeenCalled();
  },
);

it('preserves the original error if cleanup fails', async () => {
  jest.mocked(getCurrentHash).mockRejectedValueOnce(new Error('invalid revision'));
  jest.mocked(fs.promises.rm).mockRejectedValueOnce(new Error('cleanup failed'));
  await expect(getGitSnackObj('https://github.com/expo/example', '/', '', 'bad')).rejects.toThrow(
    'invalid revision',
  );
});

it.each(['src/foo..bar', 'src/..hidden'])(
  'allows dots within a subpath component: %s',
  async (subpath) => {
    expect(await getGitSnackObj('https://github.com/expo/example', subpath, '', 'HEAD')).toBe(
      cached,
    );
    expect(getCachedObj).toHaveBeenCalled();
  },
);

it.each([
  [getLatestHash, 'latest', 'Error getting latest hash'],
  [clone, 'HEAD', 'Error cloning repo'],
  [getCurrentHash, 'HEAD', 'Error resolving repo revision'],
  [getLatestCommitDate, 'latest', 'Error getting repo date'],
] as const)(
  'adds context and preserves the cause of %p failures',
  async (operation, revision, context) => {
    const cause = new Error('underlying failure');
    jest.mocked(getLatestHash).mockResolvedValue(commit);
    jest.mocked(operation).mockRejectedValueOnce(cause);
    await expect(
      getGitSnackObj('https://github.com/expo/example', '/', '', revision, true),
    ).rejects.toMatchObject({
      message: `${context}: underlying failure`,
      cause,
    });
  },
);
