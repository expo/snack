import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for subpath of core package', async () => {
  const bundle = await bundleAsync('react-native-web/src/modules/normalizeColor@0.14.4');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});
