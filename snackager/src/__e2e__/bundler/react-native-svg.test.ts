import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('bundles packages with json imports', async () => {
  const bundle = await bundleAsync('react-native-svg@12.1.1');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});
