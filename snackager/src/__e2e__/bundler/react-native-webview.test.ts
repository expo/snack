import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for react-native-webview@13.7.0', async () => {
  const bundle = await bundleAsync('react-native-webview@13.7.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // react-native-webview@13.7.0 contains a direct reference to
  // 'react-native/Libraries/BatchedBridge/BatchedBridge` and
  // should bundle correctly
});

it('creates bundle for react-native-webview@13.12.5', async () => {
  const bundle = await bundleAsync('react-native-webview@13.12.5');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // react-native-webview@13.12.5 imports the vendored event emitter
  // from react-native, which is using the `[key in keyof TEventToArgsMap]`
  // syntax and requires newer flow parsers.
});
