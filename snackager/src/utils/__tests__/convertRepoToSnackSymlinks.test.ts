import fs from 'fs';
import os from 'os';
import path from 'path';

import { cacheObj } from '../cacheSnackObj';
import { clone, getLatestHash, getLatestCommitDate } from '../clone';
import { getGitSnackObj } from '../convertRepoToSnack';

jest.mock('../cacheSnackObj');
jest.mock('../clone');
jest.mock('snack-sdk', () => ({ Snack: jest.fn() }), { virtual: true });

let root: string;
let outside: string;
const commit = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const mkdtemp = fs.promises.mkdtemp;

beforeEach(() => {
  jest.clearAllMocks();
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'snackager-symlinks-'));
  outside = path.join(root, 'outside');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'package.json'), '{"dependencies":{"expo":"~50.0.20"}}');
  fs.writeFileSync(path.join(outside, 'private.js'), 'dummy private server data');
  jest
    .spyOn(fs.promises, 'mkdtemp')
    .mockImplementation(() =>
      mkdtemp(path.join(root, 'import-')).then((dirname) => path.relative(process.cwd(), dirname)),
    );
  jest.mocked(getLatestHash).mockResolvedValue(commit);
  jest.mocked(getLatestCommitDate).mockResolvedValue('Wed Jan 1 12:00:00 2020 +0000');
  jest.mocked(clone).mockImplementation(async (_repo, _branch, _hash, dirname) => {
    fs.mkdirSync(dirname, { recursive: true });
    fs.writeFileSync(path.join(dirname, 'package.json'), '{"dependencies":{"expo":"~50.0.20"}}');
    fs.writeFileSync(path.join(dirname, 'App.js'), 'export default 42;');
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

function addToClone(create: (dirname: string) => void) {
  const original = jest.mocked(clone).getMockImplementation()!;
  jest.mocked(clone).mockImplementation(async (...args) => {
    await original(...args);
    create(args[3]);
  });
}

it.each([
  ['escape', 'outside'],
  ['nested/escape', 'outside'],
  ['escape', 'sibling with clone prefix'],
])('rejects subpath %s linked to %s', async (subpath, destination) => {
  addToClone((dirname) => {
    const target = destination === 'outside' ? outside : path.resolve(dirname + '-outside');
    if (target !== outside) {
      fs.mkdirSync(target);
      fs.copyFileSync(path.join(outside, 'package.json'), path.join(target, 'package.json'));
    }
    const link = path.join(dirname, subpath);
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link);
  });
  await expect(
    getGitSnackObj('https://example.invalid/repo.git', subpath, '', 'latest', true),
  ).rejects.toThrow('outside the cloned repository');
  expect(cacheObj).not.toHaveBeenCalled();
  expect(fs.readdirSync(root).sort()).toEqual(['outside']);
});

it('rejects a package.json symlink outside the clone', async () => {
  addToClone((dirname) => {
    fs.unlinkSync(path.join(dirname, 'package.json'));
    fs.symlinkSync(path.join(outside, 'package.json'), path.join(dirname, 'package.json'));
  });
  await expect(
    getGitSnackObj('https://example.invalid/repo.git', '/', '', 'latest', true),
  ).rejects.toThrow('outside the cloned repository');
});

it('allows internal directory and manifest symlinks and skips file symlinks', async () => {
  addToClone((dirname) => {
    fs.mkdirSync(path.join(dirname, 'app'));
    fs.renameSync(path.join(dirname, 'package.json'), path.join(dirname, 'manifest.json'));
    fs.symlinkSync('../manifest.json', path.join(dirname, 'app/package.json'));
    fs.writeFileSync(path.join(dirname, 'app/App.js'), 'export default 42;');
    fs.symlinkSync(path.join(outside, 'private.js'), path.join(dirname, 'app/private.js'));
    fs.symlinkSync('app', path.join(dirname, 'alias'));
  });
  const result = await getGitSnackObj(
    'https://example.invalid/repo.git',
    'alias',
    '',
    'latest',
    true,
  );
  expect(result.dependencies).toEqual({ expo: '~50.0.20' });
  expect(result.files).toEqual({ 'App.js': { type: 'CODE', contents: 'export default 42;' } });
});
