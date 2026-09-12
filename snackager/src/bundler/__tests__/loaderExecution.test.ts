import fs from 'fs';
import os from 'os';
import path from 'path';
import webpack from 'webpack';

import installDependencies from '../../utils/installDependencies';
import packageBundle from '../../utils/packageBundle';
import makeConfig from '../makeConfig';

jest.mock('../../utils/installDependencies');
jest.mock('node-fetch');

let root: string;
let marker: string;

function write(name: string, contents: string) {
  const filename = path.join(root, name);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, contents);
}

function manifest(values = {}) {
  write(
    'package.json',
    JSON.stringify({ name: 'fixture', version: '1.0.0', main: 'index.js', ...values }),
  );
}

function bundle(options: Partial<Parameters<typeof packageBundle>[0]> = {}) {
  return packageBundle({
    pkg: { name: 'fixture', version: '1.0.0', dist: { shasum: '', tarball: '' } },
    cwd: root,
    base: 'https://example.invalid/fixture',
    externalDependencies: {},
    platforms: ['web'],
    ...options,
  });
}

async function compile(entry: string, configure?: (config: webpack.Configuration) => void) {
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

beforeEach(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'snackager-loaders-')));
  marker = path.join(root, 'executed');
  manifest();
  write('input.js', 'module.exports = 42;');
  // Record module evaluation, pitching, and execution, across Jest/Node module contexts.
  write(
    'loader.js',
    `
    const mark = () => require('fs').appendFileSync(${JSON.stringify(marker)}, 'executed');
    mark();
    module.exports = function () { mark(); return 'module.exports = 42;'; };
    module.exports.pitch = function () { mark(); };
  `,
  );
  jest.clearAllMocks();
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

it.each(['', '!', '-!', '!!'])(
  'rejects the %s inline-loader prefix through packageBundle',
  async (prefix) => {
    write(
      'index.js',
      `module.exports = require(${JSON.stringify(`${prefix}./loader.js!./input.js`)});`,
    );
    await expect(bundle()).rejects.toThrow('Package-supplied Webpack loaders are not supported');
    expect(fs.existsSync(marker)).toBe(false);
    expect(installDependencies).not.toHaveBeenCalled();
  },
);

it.each(['absolute', 'options', 'matchResource', 'dynamic import', 'context', 'disable loaders'])(
  'rejects %s requests before executing loaders',
  async (variant) => {
    let request = './loader.js!./input.js';
    if (variant === 'absolute') request = `${path.join(root, 'loader.js')}!./input.js`;
    if (variant === 'options') request = './loader.js?value=1!./input.js';
    if (variant === 'matchResource') request = './virtual.js!=!./loader.js!./input.js';
    if (variant === 'disable loaders') request = '!!./input.js';
    write(
      'index.js',
      variant === 'context'
        ? 'module.exports = require.context("!!./loader.js!./context", false, /\\.js$/);'
        : `module.exports = ${variant === 'dynamic import' ? 'import' : 'require'}(${JSON.stringify(
            request,
          )});`,
    );
    write('context/value.js', 'module.exports = 42;');
    await expect(bundle()).rejects.toThrow('Package-supplied Webpack loaders are not supported');
    expect(fs.existsSync(marker)).toBe(false);
  },
);

it('rejects a loader in a bundled nested dependency on all platforms', async () => {
  write('index.js', 'module.exports = require("nested");');
  write('node_modules/nested/package.json', JSON.stringify({ name: 'nested', main: 'index.js' }));
  write(
    'node_modules/nested/index.js',
    'module.exports = require("!!../../loader.js!../../input.js");',
  );
  await expect(bundle({ platforms: ['ios', 'android', 'web'] })).rejects.toThrow(
    'Package-supplied Webpack loaders are not supported',
  );
  expect(fs.existsSync(marker)).toBe(false);
});

it('rejects inline loaders in an entry request', async () => {
  const errors = await compile('!!./loader.js!./input.js');
  expect(errors?.[0].message).toContain('Package-supplied Webpack loaders are not supported');
  expect(fs.existsSync(marker)).toBe(false);
});

it('rejects a configured loader substituted during resolution', async () => {
  write('index.js', 'module.exports = 42;');
  const errors = await compile('./index.js', (config) => {
    config.resolveLoader = {
      alias: { [require.resolve('babel-loader')]: path.join(root, 'loader.js') },
    };
  });
  expect(errors?.[0].message).toContain('Package-supplied Webpack loaders are not supported');
  expect(fs.existsSync(marker)).toBe(false);
});

it.each(['browser', 'react-native'])(
  'checks imports reached through the %s package mapping',
  async (field) => {
    manifest({ [field]: './mapped.js' });
    write('index.js', 'module.exports = 42;');
    write('mapped.js', 'module.exports = require("!!./loader.js!./input.js");');
    await expect(bundle({ platforms: [field === 'browser' ? 'web' : 'ios'] })).rejects.toThrow(
      'Package-supplied Webpack loaders are not supported',
    );
    expect(fs.existsSync(marker)).toBe(false);
  },
);

it('bundles TypeScript and assets with the configured loaders on all platforms', async () => {
  manifest({ main: 'index.ts' });
  write(
    'index.ts',
    'const value: number = 42; module.exports = { value, font: require("./font.ttf") };',
  );
  write('font.ttf', 'fixture font');
  const files = await bundle({ platforms: ['web', 'ios', 'android'] });
  for (const platform of ['web', 'ios', 'android']) {
    expect(files[platform]['bundle.js'].toString()).toContain('42');
    expect(Object.keys(files[platform])).toContain('assets/_font.ttf');
  }
  expect(fs.existsSync(marker)).toBe(false);
});

it('transforms Reanimated worklets with the configured Babel plugin', async () => {
  write('index.js', 'module.exports = function worklet() { "worklet"; return 42; };');
  const files = await bundle({ externalDependencies: { 'react-native-reanimated': '*' } });
  expect(files.web['bundle.js'].toString()).toContain('__workletHash');
});

it('bundles Expo Router context imports with the configured Babel plugin', async () => {
  write('index.js', 'module.exports = require.context(process.env.EXPO_ROUTER_APP_ROOT);');
  const files = await bundle({
    pkg: { name: 'expo-router', version: '1.0.0', dist: { shasum: '', tarball: '' } },
  });
  expect(files.web['bundle.js'].toString()).toContain('module://app');
});

it('rejects loader syntax introduced by resolving the package entry filename', async () => {
  manifest({ main: 'loader.js!input.js' });
  write('loader.js!input.js', 'module.exports = 0;');
  await expect(bundle()).rejects.toThrow('Package-supplied Webpack loaders are not supported');
  expect(fs.existsSync(marker)).toBe(false);
});

it('rejects package-controlled options even for a trusted loader', async () => {
  const request = `!!${require.resolve('babel-loader')}?{}!./input.js`;
  write('index.js', `module.exports = require(${JSON.stringify(request)});`);
  await expect(bundle()).rejects.toThrow('Package-supplied Webpack loaders are not supported');
});

it('bundles ordinary context imports and ignores package Babel configuration', async () => {
  write('index.js', 'module.exports = require.context("./context", false, /\\.js$/);');
  write('context/value.js', 'module.exports = "hello!";');
  const maliciousConfig = `require('fs').writeFileSync(${JSON.stringify(
    marker,
  )}, 'executed'); module.exports = {};`;
  write('babel.config.js', maliciousConfig);
  write('.babelrc.js', maliciousConfig);
  const files = await bundle();
  expect(files.web['bundle.js'].toString()).toContain('hello!');
  expect(fs.existsSync(marker)).toBe(false);
});
