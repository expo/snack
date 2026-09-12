import fs from 'fs';
import path from 'path';

import { getCachedObj, cacheObj } from '../cacheSnackObj';
import { getLatestCommitDate, getLatestHash } from '../clone';
import { getGitSnackObj } from '../convertRepoToSnack';

jest.mock('@expo/spawn-async');
jest.mock('../cacheSnackObj');
jest.mock('../clone');
jest.mock('snack-sdk', () => ({ Snack: jest.fn() }));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFile: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
  jest.spyOn(fs.promises, 'mkdtemp').mockResolvedValue('clones/import-test');
  jest.spyOn(fs.promises, 'rm').mockResolvedValue(undefined);
  jest.mocked(getLatestHash).mockResolvedValue('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  (getCachedObj as jest.Mock).mockResolvedValue(undefined);
  (getLatestCommitDate as jest.Mock).mockResolvedValue('Wed Jan 1 12:00:00 2020 +0000');
});

afterEach(() => jest.restoreAllMocks());

function mockRepository(files: Record<string, string>): void {
  (fs.readFile as unknown as jest.Mock).mockImplementation((filename, encoding, callback) => {
    const contents = files[path.basename(filename)];
    callback(contents === undefined ? new Error('File not found') : null, contents);
  });
  (fs.readdirSync as jest.Mock).mockReturnValue(
    Object.keys(files).map((name) => ({ name, isFile: () => true, isDirectory: () => false })),
  );
  (fs.statSync as jest.Mock).mockReturnValue({ size: 100 });
}

it('uses the Expo dependency instead of a conflicting app SDK version', async () => {
  mockRepository({
    'package.json': JSON.stringify({ dependencies: { expo: '~50.0.20' } }),
    'app.json': JSON.stringify({ expo: { sdkVersion: '22.0.0' } }),
  });

  const result = await getGitSnackObj('https://example.invalid/repo.git', '/', 'main', 'latest');

  expect(result.sdkVersion).toBe('50.0.0');
  expect(cacheObj).toHaveBeenCalledWith(result, expect.any(String));
});

it.each(['app.config.js', 'app.config.ts', 'plugin.js'])(
  'imports %s as source without loading Expo config',
  async (filename) => {
    const source = 'throw new Error("Config must not be evaluated");';
    mockRepository({
      'package.json': JSON.stringify({ dependencies: { expo: '~50.0.20' } }),
      'app.json': JSON.stringify({ expo: { sdkVersion: '22.0.0', plugins: ['./plugin.js'] } }),
      [filename]: source,
    });

    const result = await getGitSnackObj('https://example.invalid/repo.git', '/', 'main', 'latest');

    expect(result.sdkVersion).toBe('50.0.0');
    expect(result.files[filename]).toEqual({ type: 'CODE', contents: source });
  },
);
