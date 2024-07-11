import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it(`filter internal react-native dependency TextInputState`, async () => {
  const bundle = await bundleAsync('@react-native-community/viewpager@5.0.11');
  // this version detects TextInputState as missing package on `react-native@^0.57.0`
  // validate that we can install and bundle it properly
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  expect(bundle.peerDependencies['TextInputState']).toBeUndefined();
});
