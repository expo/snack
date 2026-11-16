/* eslint-env node */
const fs = require('fs');
const babel = require('snack-babel-standalone');
const vm = require('vm');

// Load the same plugin shipped to devices, without Node filesystem/process APIs.
function loadPlugin() {
  const context = {
    module: { exports: {} },
    exports: {},
    process: { env: {} },
    require(name) {
      expect(['snack-babel-standalone', 'path', 'assert', 'convert-source-map']).toContain(name);
      return require(name);
    },
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve('../vendor/worklets-plugin'), 'utf8'),
    context,
  );
  return context.module.exports;
}

function compile(source, options = {}, envName = 'development') {
  return babel.transform(source, {
    filename: '/App.tsx',
    configFile: false,
    babelrc: false,
    envName,
    presets: ['@react-native/babel-preset'],
    plugins: [[loadPlugin(), options]],
  }).code;
}

const source =
  'const offset = 3; const work = (value: number) => { "worklet"; return offset + value; };';

test.each(['development', 'production'])('runs closure worklets in %s', (environment) => {
  const code = compile(source, {}, environment);
  const work = vm.runInNewContext(`${code}; work`, { global: { Error } });
  // Simulate the UI runtime evaluating the serialized function with its closure.
  const uiWorklet = vm.runInNewContext(work.__initData.code);
  expect(uiWorklet.call({ __closure: work.__closure }, 4)).toBe(7);
  if (environment === 'development') {
    expect(work.__pluginVersion).toBe(require('react-native-worklets/package.json').version);
  }
});

test('uses source strings when hermesc is unavailable', () => {
  const work = vm.runInNewContext(
    `${compile(source, { hermesBytecode: true }, 'production')}; work`,
  );
  expect(work.__initData.code).toEqual(expect.any(String));
  expect(work.__initData.bytecode).toBeUndefined();
});

test('rejects filesystem-based bundle mode', () => {
  expect(() => compile(source, { bundleMode: true })).toThrow(
    'Snack does not support Worklets bundle mode',
  );
});
