import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import path from 'path';

import { clone, getLatestHash, getLatestCommitDate, getCurrentHash } from '../clone';

jest.mock('@expo/spawn-async');
const mockedSpawnAsync = spawnAsync as jest.Mock<SpawnPromise<SpawnResult>>;

const repository = 'https://github.com/expo/expo.git';
const hash = '16a0b90a55d887c84ca793bdc52b6a526ff1420b';
const directory = '/tmp/repository';
const cwd = path.join(process.cwd(), directory);

beforeEach(() => {
  mockedSpawnAsync.mockReset().mockResolvedValue({ stdout: '' } as any);
});

describe('clone', () => {
  it('clones repository with default branch', async () => {
    await clone(repository, undefined, '', directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['clone', '--single-branch', '--', repository, directory],
      expect.objectContaining({ env: expect.objectContaining({ GIT_ALLOW_PROTOCOL: 'https' }) }),
    );
  });

  it('clones repository with custom branch', async () => {
    await clone(repository, 'main', '', directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['clone', '--branch', 'main', '--', repository, directory],
      expect.objectContaining({ env: expect.objectContaining({ GIT_ALLOW_PROTOCOL: 'https' }) }),
    );
  });

  it.each([hash, 'refs/tags/v1.0.0', '--orphan=unexpected'])(
    'passes %s unchanged as the checkout reference',
    async (ref) => {
      await clone(repository, 'main', ref, directory);
      expect(mockedSpawnAsync.mock.calls[1]).toEqual([
        'git',
        ['checkout', '--detach', '--end-of-options', ref, '--'],
        { cwd, env: expect.objectContaining({ GIT_ALLOW_PROTOCOL: 'https' }) },
      ]);
      expect(mockedSpawnAsync).toHaveBeenCalledTimes(2);
    },
  );

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
      expect.objectContaining({ env: expect.objectContaining({ GIT_ALLOW_PROTOCOL: 'https' }) }),
    );
  });

  it('returns latest hash for custom branch', async () => {
    mockedSpawnAsync.mockResolvedValue({ stdout: `${hash}\trefs/heads/feature-a` } as any);
    expect(await getLatestHash(repository, 'feature-a')).toBe(hash);
    expect(spawnAsync).toBeCalledWith(
      'git',
      ['ls-remote', '--', repository, 'feature-a'],
      expect.objectContaining({ env: expect.objectContaining({ GIT_ALLOW_PROTOCOL: 'https' }) }),
    );
  });
});

describe('remote hash validation', () => {
  it('accepts a SHA-256 object ID', async () => {
    const objectId = 'a'.repeat(64);
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

  it.each([undefined, '--upload-pack=unexpected-command'])(
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

  it('keeps option-like repository and branch values after the ls-remote option boundary', async () => {
    const branch = '--upload-pack=unexpected-command';
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: `${hash}\tHEAD` } as any);
    expect(await getLatestHash(optionLikeRepository, branch)).toBe(hash);
    expect(spawnAsync).toHaveBeenCalledWith(
      'git',
      ['ls-remote', '--', optionLikeRepository, branch || 'HEAD'],
      expect.any(Object),
    );
  });
});

describe('getCurrentHash', () => {
  it('reads the checked out commit ID', async () => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: `${hash}\n` } as any);
    expect(await getCurrentHash(directory)).toBe(hash);
    expect(spawnAsync).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'HEAD^{commit}'], {
      cwd,
      env: expect.objectContaining({ GIT_ALLOW_PROTOCOL: 'https' }),
    });
  });
  it('rejects output that cannot be used as a commit ID', async () => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '../outside' } as any);
    await expect(getCurrentHash(directory)).rejects.toThrow('invalid commit ID');
  });
});
