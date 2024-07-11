import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('filter aliased react-native dependencies', async () => {
  const bundle = await bundleAsync('@react-native-community/datetimepicker@3.0.3');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // datetimepicker contains a peer-dependency on `react-native-windows`
  // which causes the snack-sdk to try and bundle that dependency as it is not
  // listed as a preloaded module. 'react-native-windows' is considered a special
  // alias for 'react-native` and it therefore removed as a peer dependency
  expect(bundle.peerDependencies['react-native-windows']).toBeUndefined();
});
