import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for subpath', async () => {
  const bundle = await bundleAsync('react-native-gesture-handler/DrawerLayout@1.6.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});

it('created bundle for react-native-gesture-handler', async () => {
  const bundle = await bundleAsync('react-native-gesture-handler@1.6.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});
