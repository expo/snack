import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it.skip('creates bundle for @react-navigation/native', async () => {
  const bundle = await bundleAsync('@react-navigation/native@5.7.3');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // @react-navigation/core should be included in the bundle and not an external
  expect(bundle.files.android['bundle.js'].externals).not.toEqual(
    expect.arrayContaining(['@react-navigation/core']),
  );
});

it('creates bundle for @react-navigation/stack', async () => {
  const bundle = await bundleAsync('@react-navigation/stack@5.9.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // @react-navigation/native should be included as an external
  expect(bundle.files.android['bundle.js'].externals).toEqual(
    expect.arrayContaining(['@react-navigation/native']),
  );
});

it('externalizes references to react-native-gesture-handler/DrawerLayout', async () => {
  const bundle = await bundleAsync('react-navigation@3.13.0', ['ios']);
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // react-native-gesture-handler/DrawerLayout should be included as an external
  expect(bundle.files.ios['bundle.js'].externals).toEqual(
    expect.arrayContaining(['react-native-gesture-handler/DrawerLayout']),
  );
});
