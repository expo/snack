import { bundleAsync, normalizeBundleSize } from './bundleAsync';

it('creates bundle for a single platform', async () => {
  const bundle = await bundleAsync('firestorter@2.0.1', ['ios']);
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});

it('fails when no package name is specified', async () => {
  await expect(bundleAsync('', ['ios'])).rejects.toEqual(new Error(`Failed to parse request`));
});

it('externalizes dependencies that are marked as external', async () => {
  // `expo-google-app-auth` declares `expo-app-auth` as a direct dependency.
  // The `expo-app-auth` dependency should however still be externalized and
  // not linked into the bundle.
  const bundle = await bundleAsync('expo-google-app-auth@8.1.3');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  expect(bundle.files.android['bundle.js'].externals).toEqual(
    expect.arrayContaining(['expo-app-auth']),
  );
});

it('resolves external source-code references', async () => {
  // `expo-linear-gradient` imports source-code from react-native-web directly.
  // e.g. "import normalizeColor from 'react-native-web/src/modules/normalizeColor';"
  // The bundler should install `react-native-web` and resolve the import correctly.
  // All regular `react-native-web` imports should be externalized.
  const bundle = await bundleAsync('expo-linear-gradient@8.2.1');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});

it('resolves commonly missing peer-deps (prop-types)', async () => {
  // For example 'react-native-responsive-grid@0.32.4' has a dependency
  // on prop-types but no peerDep listed in package.json.
  const bundle = await bundleAsync('react-native-responsive-grid@0.32.4');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  expect(bundle.files.android['bundle.js'].externals).not.toEqual(
    expect.arrayContaining(['prop-types']),
  );
});

it('disallows bundling of core modules', async () => {
  await expect(bundleAsync('expo', ['ios'])).rejects.toEqual(
    new Error(`Bundling core module 'expo' is prohibited`),
  );
  await expect(bundleAsync('react-native', ['ios'])).rejects.toEqual(
    new Error(`Bundling core module 'react-native' is prohibited`),
  );
  await expect(bundleAsync('react-native-web', ['ios'])).rejects.toEqual(
    new Error(`Bundling core module 'react-native-web' is prohibited`),
  );
  await expect(bundleAsync('react-native-windows', ['ios'])).rejects.toEqual(
    new Error(`Bundling core module 'react-native-windows' is prohibited`),
  );
  await expect(bundleAsync('react-native/Libraries/Image/AssetRegistry', ['ios'])).rejects.toEqual(
    new Error(`Bundling core module 'react-native/Libraries/Image/AssetRegistry' is prohibited`),
  );
});
