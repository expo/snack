import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import path from 'path';

import { clone, getLatestHash, getLatestCommitDate } from '../clone';

jest.mock('@expo/spawn-async');
// Typed mock helpers for TS to understand it has jest methods
const mockedSpawnAsync = spawnAsync as jest.Mock<SpawnPromise<SpawnResult>>;

const repository = 'git@github.com:expo/expo.git';
const hash = '16a0b90a55d887c84ca793bdc52b6a526ff1420b';
const directory = '/tmp/repository';
// TODO: check what happens for absolute paths, that might conflict with `process.cwd`
const cwd = path.join(process.cwd(), directory);

beforeEach(() => {
  mockedSpawnAsync.mockReset().mockResolvedValue({ stdout: '' } as any);
});

describe('clone', () => {
  it('clones repository with default branch', async () => {
    // TODO: it's weird that branch and hash are optional, but dir is required (last argument)
    await clone(repository, undefined, '', directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['clone', '--single-branch', '--', repository, directory],
      expect.objectContaining({ env: expect.any(Object) }), // important for git authentication
    );
  });

  it('clones repository with custom branch', async () => {
    await clone(repository, 'main', '', directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['clone', '--branch', 'main', '--', repository, directory],
      expect.objectContaining({ env: expect.any(Object) }), // important for git authentication
    );
  });

  it.each([
    hash,
    'main',
    'refs/tags/v1.0.0',
    'HEAD~1',
    'HEAD:path^{commit}',
    '--orphan=unexpected',
    '--',
    '$(unexpected-command)',
  ])('passes %s unchanged as the checkout reference', async (ref) => {
    await clone(repository, 'main', ref, directory);
    expect(mockedSpawnAsync.mock.calls[1]).toEqual([
      'git',
      ['checkout', '--detach', '--end-of-options', ref, '--'],
      { cwd },
    ]);
    expect(mockedSpawnAsync).toHaveBeenCalledTimes(2);
  });

  it('reports a repository or branch error when cloning fails', async () => {
    const cause = new Error('git clone failed');
    mockedSpawnAsync.mockRejectedValueOnce(cause);
    await expect(clone(repository, undefined, '', directory)).rejects.toMatchObject({
      message:
        'Unable to clone the repository. Check the repository URL, access permissions, and branch name.',
      cause,
    });
  });

  it.each([false, true])(
    'reports a checkout error and attempts cleanup (cleanup fails: %s)',
    async (cleanupFails) => {
      const cause = new Error('git checkout failed');
      mockedSpawnAsync.mockResolvedValueOnce({} as any).mockRejectedValueOnce(cause);
      if (cleanupFails) {
        mockedSpawnAsync.mockRejectedValueOnce(new Error('cleanup failed'));
      }
      await expect(clone(repository, 'main', 'missing-ref', directory)).rejects.toMatchObject({
        message:
          'Unable to check out the requested revision. Use a commit, branch, or tag that exists in the repository.',
        cause,
      });
      expect(mockedSpawnAsync.mock.calls[2]).toEqual(['rm', ['-rf', '--', directory]]);
    },
  );
});

describe('getLatestHash', () => {
  it('returns latest hash from git remote', async () => {
    mockedSpawnAsync.mockResolvedValue({ stdout: `${hash}\trefs/heads/main` } as any);
    expect(await getLatestHash(repository, '')).toBe(hash);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['ls-remote', '--', repository, 'HEAD'],
      expect.objectContaining({ env: expect.any(Object) }), // important for git authentication
    );
  });

  it('returns latest hash for custom branch', async () => {
    mockedSpawnAsync.mockResolvedValue({ stdout: `${hash}\trefs/heads/feature-a` } as any);
    expect(await getLatestHash(repository, 'feature-a')).toBe(hash);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['ls-remote', '--', repository, 'feature-a'],
      expect.objectContaining({ env: expect.any(Object) }), // important for git authentication
    );
  });
});

describe('remote hash validation', () => {
  it.each([hash, 'a'.repeat(64)])('accepts a full object ID: %s', async (objectId) => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: `${objectId}\tHEAD\n` } as any);
    expect(await getLatestHash(repository, '')).toBe(objectId);
  });

  it('uses the first matching remote ref', async () => {
    mockedSpawnAsync.mockResolvedValueOnce({
      stdout: `${hash}\trefs/heads/main\n${'b'.repeat(40)}\trefs/tags/main\n`,
    } as any);
    expect(await getLatestHash(repository, 'main')).toBe(hash);
  });

  it.each(['', '\n'])('reports a missing ref for empty output %p', async (stdout) => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout } as any);
    await expect(getLatestHash(repository, 'missing')).rejects.toThrow(
      'No matching commit was found. Check the branch or tag name and that the repository is not empty.',
    );
  });

  it.each([
    '--orphan=unexpected',
    'HEAD',
    'abc123',
    'z'.repeat(40),
    'a'.repeat(41),
    'a'.repeat(63),
    'a'.repeat(65),
    `${hash} extra`,
  ])('rejects an invalid remote object ID: %s', async (value) => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: `${value}\tHEAD\n` } as any);
    await expect(getLatestHash(repository, '')).rejects.toThrow(
      'The repository returned an invalid commit ID.',
    );
  });

  it('preserves the cause of a repository lookup failure', async () => {
    const cause = new Error('git ls-remote failed');
    mockedSpawnAsync.mockRejectedValueOnce(cause);
    await expect(getLatestHash(repository, '')).rejects.toMatchObject({
      message: 'Unable to read the repository. Check the repository URL and access permissions.',
      cause,
    });
  });
});

describe('getLatestCommitDate', () => {
  const timestamp = 'Thu Nov 5 06:27:50 2020 -0500';

  it('returns latest git timestamp', async () => {
    mockedSpawnAsync.mockResolvedValue({ stdout: timestamp } as any);
    expect(await getLatestCommitDate(directory)).toBe(timestamp);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['log', '-1']),
      expect.objectContaining({ cwd }),
    );
  });
});

describe('untrusted Git arguments', () => {
  const optionLikeRepository = '--upload-pack=unexpected-command';

  it.each([undefined, 'main', '--upload-pack=unexpected-command'])(
    'keeps the repository after the option boundary when cloning branch %p',
    async (branch) => {
      await clone(optionLikeRepository, branch, '', directory);
      expect(spawnAsync).toHaveBeenCalledWith(
        'git',
        branch
          ? ['clone', '--branch', branch, '--', optionLikeRepository, directory]
          : ['clone', '--single-branch', '--', optionLikeRepository, directory],
        expect.any(Object),
      );
    },
  );

  it.each(['', '--upload-pack=unexpected-command', '--', '-u', '$(unexpected-command)'])(
    'keeps the repository and branch %p after the ls-remote option boundary',
    async (branch) => {
      mockedSpawnAsync.mockResolvedValueOnce({ stdout: `${hash}\tHEAD` } as any);
      expect(await getLatestHash(optionLikeRepository, branch)).toBe(hash);
      expect(spawnAsync).toHaveBeenCalledWith(
        'git',
        ['ls-remote', '--', optionLikeRepository, branch || 'HEAD'],
        expect.any(Object),
      );
    },
  );
});
