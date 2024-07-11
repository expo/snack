import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('compiles reanimated2 worklets', async () => {
  const bundle = await bundleAsync('react-native-reanimated@2.0.0-rc.3', undefined, true);
  // verify that the number of expected worklet instances appear in the
  // generated bundle.
  expect(bundle.files['ios']['bundle.js'].code!.match(/worklet/g)!.length).toBe(151);
  expect(bundle.files['android']['bundle.js'].code!.match(/worklet/g)!.length).toBe(151);
});

it('creates bundle for react-native-reanimated@2.9.1', async () => {
  // This version needs the `@babel/plugin-proposal-export-namespace-from` to bundle
  const bundle = await bundleAsync('react-native-reanimated@2.9.1');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});

it('creates bundle for react-native-reanimated@3.14.0', async () => {
  // This version needs the `@babel/plugin-proposal-export-namespace-from` to bundle
  const bundle = await bundleAsync('react-native-reanimated@3.14.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});
