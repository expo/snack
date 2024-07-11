import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('externalizes package-externals of dependencies', async () => {
  const bundle = await bundleAsync('@draftbit/ui@40.34.4');
  // @drafbit/ui depends on @drafbit/core, which in turn depends
  // on `react-native-safe-area-context`. `react-native-safe-area-context` is
  // a package dependency which should be excluded from the bundle, even
  // if the import happens in a dependency of the requested package
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  ['ios', 'android', 'web'].forEach((platform) => {
    expect(bundle.files[platform]['bundle.js'].externals).toEqual(
      expect.arrayContaining(['react-native-safe-area-context']),
    );
  });
});
