import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

xit('creates native bundles when web entry point is not found', async () => {
  const bundle = await bundleAsync('react-native-reanimated@2.0.0-alpha.6');
  // entry point cannot be found for the web platform for this package.
  // this should not cause the bundler to fail but continue with the native
  // platforms instead.
  expect(bundle.files['ios']['bundle.js'].size).toBeGreaterThanOrEqual(10000);
  expect(bundle.files['android']['bundle.js'].size).toBeGreaterThanOrEqual(10000);
  expect(bundle.files['web']['bundle.js'].size).toBe(0);
});

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
