import fs from 'fs';
import path from 'path';

import config from '../../config';
import findPath from '../findPath';

const tmpDir = path.join(config.tmpdir, '__tests__', 'findPath');
// TODO: implement memfs for these tests
const mkdirSync = (...segments): void => {
  fs.mkdirSync(path.join(...segments), { recursive: true });
};

afterEach(() => {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

it('returns no paths for non existing package', () => {
  expect(findPath('flutter', tmpDir)).toEqual([]);
});

it('returns paths for `expo`', () => {
  mkdirSync(tmpDir, 'package');
  mkdirSync(tmpDir, 'expo');
  expect(findPath('expo', tmpDir)).toEqual(expect.arrayContaining(['package', 'expo']));
});

it('returns paths for `@react-navigation/native`', () => {
  mkdirSync(tmpDir, 'package');
  mkdirSync(tmpDir, 'native');
  expect(findPath('@react-navigation/native', tmpDir)).toEqual(
    expect.arrayContaining(['package', 'native'])
  );
});
