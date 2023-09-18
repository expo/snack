import fs from 'fs';
import path from 'path';

import config from '../../config';
import { spawnSafeAsync, getYarnPackagerAsync } from '../installDependencies';
import installPackage from '../installPackage';

jest.mock('../installDependencies');

const tmpDir = path.join(config.tmpdir, '__tests__', 'installPackage');
const tmpPkg = path.join(tmpDir, 'package.json');

// TODO: implement memfs for these tests
function readPackage(): any {
  return JSON.parse(fs.readFileSync(tmpPkg, 'utf-8'));
}
// TODO: implement memfs for these tests
function writePackage(content: any): void {
  fs.writeFileSync(tmpPkg, JSON.stringify(content));
}

beforeEach(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
  (spawnSafeAsync as jest.Mock).mockClear();
});

it('removes devDependencies from package file', async () => {
  writePackage({ name: 'test', devDependencies: { 'expo-cli': 'latest' } });
  await installPackage(tmpDir);

  expect(readPackage()).toMatchObject({
    name: 'test',
  });
});

it('removes external `expo` dependency from package file', async () => {
  writePackage({ name: 'test', dependencies: { expo: 'latest', mobx: 'latest' } });
  await installPackage(tmpDir);

  expect(readPackage()).toMatchObject({
    name: 'test',
    dependencies: { mobx: 'latest' },
  });
});

it('adds `@babel/runtime` by default', async () => {
  writePackage({ name: 'test' });
  await installPackage(tmpDir);

  expect(readPackage()).toMatchObject({
    name: 'test',
    dependencies: { '@babel/runtime': '*' },
  });
});

it('executes yarn install with everything ignored', async () => {
  (getYarnPackagerAsync as jest.Mock).mockReturnValue('yarn');

  writePackage({ name: 'test', dependencies: { expo: 'latest' } });
  await installPackage(tmpDir);

  expect(spawnSafeAsync).toBeCalledWith(
    'yarn',
    expect.arrayContaining([
      '--production', // Don't need to install dev dependencies.
      '--ignore-scripts', // Don't want to run malicious post-install scripts.
      '--ignore-engines', // Sometimes sub-dependencies will want a specific version of Node. Don't care, try anyway.
      '--non-interactive', // In some cases yarn/npm will show an interactive prompt. Throw an error instead.
    ]),
    tmpDir,
  );
});

it('retries with NPM when Yarn fails', async () => {
  (spawnSafeAsync as jest.Mock)
    .mockRejectedValueOnce(new Error('test')) // yarn execution
    .mockResolvedValueOnce({}); // npm execution

  writePackage({ name: 'test', dependencies: { expo: 'latest' } });
  await installPackage(tmpDir);

  expect(spawnSafeAsync).toBeCalledWith(
    'npm',
    expect.arrayContaining([
      'install',
      '--production', // Don't need to install dev dependencies.
      '--ignore-scripts', // Don't want to run malicious post-install scripts.
      '--ignore-engines', // Sometimes sub-dependencies will want a specific version of Node. Don't care, try anyway.
      '--non-interactive', // In some cases yarn/npm will show an interactive prompt. Throw an error instead.
    ]),
    tmpDir,
  );
});
