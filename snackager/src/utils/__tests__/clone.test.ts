import spawnAsync, { SpawnPromise, SpawnResult } from '@expo/spawn-async';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

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

  it('clones repository with custom custom commit hash', async () => {
    await clone(repository, 'main', hash, directory);
    expect(spawnAsync).toBeCalledWith(
      'git',
      expect.arrayContaining(['checkout', hash]),
      expect.objectContaining({ cwd }), // important for pointing to proper repo
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

// Exercise Git's actual argument parsing without network access or service credentials.
describe('repository arguments with real Git', () => {
  const realSpawnAsync: typeof spawnAsync = jest.requireActual('@expo/spawn-async');
  let tempDir: string;
  let localRepository: string;
  let marker: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snackager-git-'));
    localRepository = path.join(tempDir, 'remote.git');
    marker = path.join(tempDir, 'marker');
    mockedSpawnAsync.mockImplementation((command, args, options) =>
      realSpawnAsync(command, args, {
        ...options,
        cwd: options?.cwd ?? tempDir,
        env: { PATH: process.env.PATH, HOME: tempDir, GIT_CONFIG_NOSYSTEM: '1' },
      }),
    );
    await spawnAsync('git', ['init', '--initial-branch=main', localRepository]);
    const options = {
      cwd: localRepository,
      env: {
        PATH: process.env.PATH,
        HOME: tempDir,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'Test',
        GIT_AUTHOR_EMAIL: 'test@example.invalid',
        GIT_COMMITTER_NAME: 'Test',
        GIT_COMMITTER_EMAIL: 'test@example.invalid',
      },
      input: '',
      encoding: 'utf8' as const,
    };
    const tree = execFileSync('git', ['mktree'], options).trim();
    const commit = execFileSync(
      'git',
      ['commit-tree', tree, '-m', 'Initial commit'],
      options,
    ).trim();
    await spawnAsync('git', ['update-ref', 'refs/heads/main', commit], { cwd: localRepository });
  });

  afterEach(() => {
    mockedSpawnAsync.mockReset();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('resolves the default and named branch of a valid repository', async () => {
    const latest = await getLatestHash(localRepository, '');
    expect(latest).toMatch(/^[a-f0-9]{40}$/);
    expect(await getLatestHash(localRepository, 'main')).toBe(latest);
  });

  it.each([undefined, 'main'])('clones a valid repository with branch %s', async (branch) => {
    const destination = path.join(tempDir, 'clone');
    await clone(localRepository, branch, '', destination);
    expect(fs.existsSync(path.join(destination, '.git'))).toBe(true);
  });

  it('does not execute an option supplied as the ls-remote repository', async () => {
    await expect(
      getLatestHash(`--upload-pack=touch "${marker}"`, localRepository),
    ).rejects.toThrow();
    expect(fs.existsSync(marker)).toBe(false);
  });

  it.each([undefined, 'main'])(
    'does not execute an option supplied as the clone repository with branch %s',
    async (branch) => {
      // Before the fix, Git treats the destination as the repository and runs upload-pack.
      await expect(
        clone(`--upload-pack=touch "${marker}"`, branch, '', pathToFileURL(localRepository).href),
      ).rejects.toThrow();
      expect(fs.existsSync(marker)).toBe(false);
    },
  );
});
