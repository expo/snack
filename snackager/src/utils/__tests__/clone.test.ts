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

afterEach(() => {
  mockedSpawnAsync.mockClear();
});

describe('clone', () => {
  it('clones repository with default branch', async () => {
    // TODO: it's weird that branch and hash are optional, but dir is required (last argument)
    await clone(repository, undefined, '', directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['clone', repository, directory, '--single-branch']),
      expect.objectContaining({ env: expect.any(Object) }) // important for git authentication
    );
  });

  it('clones repository with custom branch', async () => {
    await clone(repository, 'main', '', directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['clone', repository, directory, '--branch', 'main']),
      expect.objectContaining({ env: expect.any(Object) }) // important for git authentication
    );
  });

  it('clones repository with custom custom commit hash', async () => {
    await clone(repository, 'main', hash, directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['checkout', hash]),
      expect.objectContaining({ cwd }) // important for pointing to proper repo
    );
  });

  it('throws when cloning failed', async () => {
    mockedSpawnAsync.mockRejectedValueOnce(new Error('test'));
    await expect(clone(repository, undefined, '', '')).rejects.toThrow('test');
  });

  it('throws and cleans up when cloning commit hash failed', async () => {
    mockedSpawnAsync
      .mockResolvedValueOnce({} as any) // git clone <repo>
      .mockRejectedValueOnce(new Error('test')) // git checkout <hash>
      .mockResolvedValueOnce({} as any); // clean up
    await expect(clone(repository, 'main', hash, directory)).rejects.toThrow('test');
    expect(spawnAsync).toBeCalledWith('rm', expect.arrayContaining(['-rf', directory]));
  });
});

describe('getLatestHash', () => {
  it('returns latest hash from git remote', async () => {
    mockedSpawnAsync.mockResolvedValue({ stdout: `${hash}\trefs/heads/main` } as any);
    expect(await getLatestHash(repository, '')).toBe(hash);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['ls-remote', repository, 'HEAD']),
      expect.objectContaining({ env: expect.any(Object) }) // important for git authentication
    );
  });

  it('returns latest hash for custom branch', async () => {
    mockedSpawnAsync.mockResolvedValue({ stdout: `${hash}\trefs/heads/feature-a` } as any);
    expect(await getLatestHash(repository, 'feature-a')).toBe(hash);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['ls-remote', repository, 'feature-a']),
      expect.objectContaining({ env: expect.any(Object) }) // important for git authentication
    );
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
      expect.objectContaining({ cwd })
    );
  });
});
