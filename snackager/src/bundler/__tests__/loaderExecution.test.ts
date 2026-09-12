import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import webpack from 'webpack';

import installDependencies from '../../utils/installDependencies';
import packageBundle from '../../utils/packageBundle';
import RestrictLoadersPlugin from '../RestrictLoadersPlugin';
import makeConfig from '../makeConfig';

jest.mock('../../utils/installDependencies');
jest.mock('node-fetch');

let root: string;
const executionEvent = 'snackager:test:untrusted-execution';
const recordExecution = jest.fn();

it.each(['', '!', '-!', '!!'])(
  'rejects the %s inline-loader prefix through packageBundle',
  async (prefix) => {
    writeFixtureFile(
      'index.js',
      `module.exports = require(${JSON.stringify(`${prefix}./loader.js!./input.js`)});`,
    );
    await expect(bundleFixturePackage()).rejects.toThrow(
      'Package-supplied Webpack loaders are not supported',
    );
    expect(recordExecution).not.toHaveBeenCalled();
    expect(installDependencies).not.toHaveBeenCalled();
  },
);

it.each<[string, () => string]>([
  ['absolute', () => `require(${JSON.stringify(`${path.join(root, 'loader.js')}!./input.js`)})`],
  ['options', () => 'require("./loader.js?value=1!./input.js")'],
  ['matchResource', () => 'require("./virtual.js!=!./loader.js!./input.js")'],
  ['dynamic import', () => 'import("./loader.js!./input.js")'],
  ['context', () => 'require.context("!!./loader.js!./context", false, /\\.js$/)'],
  ['disable loaders', () => 'require("!!./input.js")'],
])('rejects %s requests before executing loaders', async (_description, createImportExpression) => {
  writeFixtureFile('index.js', `module.exports = ${createImportExpression()};`);
  writeFixtureFile('context/value.js', 'module.exports = 42;');
  await expect(bundleFixturePackage()).rejects.toThrow(
    'Package-supplied Webpack loaders are not supported',
  );
  expect(recordExecution).not.toHaveBeenCalled();
});

it('rejects a loader in a bundled nested dependency on all platforms', async () => {
  writeFixtureFile('index.js', 'module.exports = require("nested");');
  writeFixtureFile(
    'node_modules/nested/package.json',
    JSON.stringify({ name: 'nested', main: 'index.js' }),
  );
  writeFixtureFile(
    'node_modules/nested/index.js',
    'module.exports = require("!!../../loader.js!../../input.js");',
  );
  await expect(bundleFixturePackage({ platforms: ['ios', 'android', 'web'] })).rejects.toThrow(
    'Package-supplied Webpack loaders are not supported',
  );
  expect(recordExecution).not.toHaveBeenCalled();
});

it('rejects inline loaders in an entry request', async () => {
  const errors = await compileFixtureEntry('!!./loader.js!./input.js');
  expect(errors?.[0].message).toContain('Package-supplied Webpack loaders are not supported');
  expect(recordExecution).not.toHaveBeenCalled();
});

it('rejects a configured loader substituted during resolution', async () => {
  writeFixtureFile('index.js', 'module.exports = 42;');
  const errors = await compileFixtureEntry('./index.js', (config) => {
    config.resolveLoader = {
      alias: { [require.resolve('babel-loader')]: path.join(root, 'loader.js') },
    };
  });
  expect(errors?.[0].message).toContain('Package-supplied Webpack loaders are not supported');
  expect(recordExecution).not.toHaveBeenCalled();
});

it.each([
  ['browser', 'web'],
  ['react-native', 'ios'],
])('checks imports reached through the %s package mapping', async (field, platform) => {
  writePackageManifest({ [field]: './mapped.js' });
  writeFixtureFile('index.js', 'module.exports = 42;');
  writeFixtureFile('mapped.js', 'module.exports = require("!!./loader.js!./input.js");');
  await expect(bundleFixturePackage({ platforms: [platform] })).rejects.toThrow(
    'Package-supplied Webpack loaders are not supported',
  );
  expect(recordExecution).not.toHaveBeenCalled();
});

it('bundles TypeScript and assets with the configured loaders on all platforms', async () => {
  writePackageManifest({ main: 'index.ts' });
  writeFixtureFile(
    'index.ts',
    'const value: number = 42; module.exports = { value, font: require("./font.ttf") };',
  );
  writeFixtureFile('font.ttf', 'fixture font');
  const files = await bundleFixturePackage({ platforms: ['web', 'ios', 'android'] });
  for (const platform of ['web', 'ios', 'android']) {
    expect(files[platform]['bundle.js'].toString()).toContain('42');
    expect(Object.keys(files[platform])).toContain('assets/_font.ttf');
  }
  expect(recordExecution).not.toHaveBeenCalled();
});

it('transforms Reanimated worklets with the configured Babel plugin', async () => {
  writeFixtureFile('index.js', 'module.exports = function worklet() { "worklet"; return 42; };');
  const files = await bundleFixturePackage({
    externalDependencies: { 'react-native-reanimated': '*' },
  });
  expect(files.web['bundle.js'].toString()).toContain('__workletHash');
});

it('bundles Expo Router context imports with the configured Babel plugin', async () => {
  writeFixtureFile(
    'index.js',
    'module.exports = require.context(process.env.EXPO_ROUTER_APP_ROOT);',
  );
  const files = await bundleFixturePackage({
    pkg: { name: 'expo-router', version: '1.0.0', dist: { shasum: '', tarball: '' } },
  });
  expect(files.web['bundle.js'].toString()).toContain('module://app');
});

it('rejects loader syntax introduced by resolving the package entry filename', async () => {
  writePackageManifest({ main: 'loader.js!input.js' });
  writeFixtureFile('loader.js!input.js', 'module.exports = 0;');
  await expect(bundleFixturePackage()).rejects.toThrow(
    'Package-supplied Webpack loaders are not supported',
  );
  expect(recordExecution).not.toHaveBeenCalled();
});

it('rejects package-controlled options even for a trusted loader', async () => {
  const request = `!!${require.resolve('babel-loader')}?{}!./input.js`;
  writeFixtureFile('index.js', `module.exports = require(${JSON.stringify(request)});`);
  await expect(bundleFixturePackage()).rejects.toThrow(
    'Package-supplied Webpack loaders are not supported',
  );
});

it('bundles ordinary context imports and ignores package Babel configuration', async () => {
  writeFixtureFile('index.js', 'module.exports = require.context("./context", false, /\\.js$/);');
  writeFixtureFile('context/value.js', 'module.exports = "hello!";');
  const untrustedConfig = `require('process').emit(${JSON.stringify(
    executionEvent,
  )}, 'configure'); module.exports = {};`;
  writeFixtureFile('babel.config.js', untrustedConfig);
  writeFixtureFile('.babelrc.js', untrustedConfig);
  const files = await bundleFixturePackage();
  expect(files.web['bundle.js'].toString()).toContain('hello!');
  expect(recordExecution).not.toHaveBeenCalled();
});

it('observes loader evaluation, pitching, and execution when the guard is disabled', async () => {
  const errors = await compileFixtureEntry('!!./loader.js!./input.js', (config) => {
    config.plugins = config.plugins?.filter((plugin) => !(plugin instanceof RestrictLoadersPlugin));
  });
  expect(errors).toEqual([]);
  expect(recordExecution.mock.calls).toEqual([['evaluate'], ['pitch'], ['execute']]);
});

it('observes Babel configuration execution when discovery is enabled', async () => {
  const untrustedConfig = `require('process').emit(${JSON.stringify(
    executionEvent,
  )}, 'configure'); module.exports = {};`;
  writeFixtureFile('babel.config.js', untrustedConfig);
  writeFixtureFile('.babelrc.js', untrustedConfig);
  const errors = await compileFixtureEntry('./input.js', (config) => {
    const babelRule = config.module!.rules![1] as webpack.RuleSetRule;
    const babelUse = babelRule.use as { options: Record<string, unknown> };
    babelUse.options.configFile = path.join(root, 'babel.config.js');
    babelUse.options.babelrc = true;
    babelUse.options.babelrcRoots = root;
  });
  expect(errors).toEqual([]);
  expect(recordExecution.mock.calls).toEqual([['configure'], ['configure']]);
});

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'snackager-loaders-')));
  process.on(executionEvent, recordExecution);
  writePackageManifest();
  writeFixtureFile('input.js', 'module.exports = 42;');
  // Record module evaluation, pitching, and execution, across Jest/Node module contexts.
  writeFixtureFile(
    'loader.js',
    `
    const recordExecution = (phase) => require('process').emit(${JSON.stringify(
      executionEvent,
    )}, phase);
    recordExecution('evaluate');
    module.exports = function () { recordExecution('execute'); return 'module.exports = 42;'; };
    module.exports.pitch = function () { recordExecution('pitch'); };
  `,
  );
  jest.clearAllMocks();
});

afterEach(() => {
  process.removeListener(executionEvent, recordExecution);
  fs.rmSync(root, { recursive: true, force: true });
});

function bundleFixturePackage(options: Partial<Parameters<typeof packageBundle>[0]> = {}) {
  return packageBundle({
    pkg: { name: 'fixture', version: '1.0.0', dist: { shasum: '', tarball: '' } },
    cwd: root,
    base: 'https://example.invalid/fixture',
    externalDependencies: {},
    platforms: ['web'],
    ...options,
  });
}

async function compileFixtureEntry(
  entry: string,
  configure?: (config: webpack.Configuration) => void,
) {
  const config = makeConfig({
    root,
    entry,
    platform: 'web',
    externals: [],
    output: { path: path.join(root, 'output'), filename: 'bundle.js', library: 'fixture' },
  });
  configure?.(config);
  const compiler = webpack(config);
  try {
    const stats = await new Promise<webpack.Stats>((resolve, reject) => {
      compiler.run((error, stats) => (error ? reject(error) : resolve(stats!)));
    });
    return stats.toJson({ all: false, errors: true }).errors;
  } finally {
    await new Promise<void>((resolve) => compiler.close(() => resolve()));
  }
}

function writePackageManifest(values = {}) {
  writeFixtureFile(
    'package.json',
    JSON.stringify({ name: 'fixture', version: '1.0.0', main: 'index.js', ...values }),
  );
}

function writeFixtureFile(name: string, contents: string) {
  const filename = path.join(root, name);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, contents);
}
