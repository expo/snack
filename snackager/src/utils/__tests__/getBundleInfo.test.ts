import getBundleInfo from '../getBundleInfo';

it('returns buffer size only for .map file', () => {
  const content = Buffer.from('android-bundle-mapping');
  expect(getBundleInfo('index.android.js.map', content)).toMatchObject({
    size: content.length,
  });
});

it('returns info for simple .js file', () => {
  const content = Buffer.from(`console.log('android-bundle-code')`);
  expect(getBundleInfo('index.android.js', content)).toMatchObject({
    size: content.length,
    externals: [],
  });
});

it('returns info for double-quote importing .js file', () => {
  const content = Buffer.from(`const path = require("path");`);
  expect(getBundleInfo('code.js', content)).toMatchObject({
    size: content.length,
    externals: ['path'],
  });
});

it('returns info for scoped package importing .js file', () => {
  const content = Buffer.from(`const spawnAsync = require("@expo/spawn-async")`);
  expect(getBundleInfo('code.js', content)).toMatchObject({
    size: content.length,
    externals: ['@expo/spawn-async'],
  });
});

it('returns info for multi-importing .js file', () => {
  const content = Buffer.from(
    `const spawnAsync = require("@expo/spawn-async")\nconst path = require("path")`,
  );
  expect(getBundleInfo('code.js', content)).toMatchObject({
    size: content.length,
    externals: ['@expo/spawn-async', 'path'],
  });
});
