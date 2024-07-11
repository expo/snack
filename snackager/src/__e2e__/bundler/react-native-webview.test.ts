import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for react-native-webview', async () => {
  const bundle = await bundleAsync('react-native-webview@13.7.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // react-native-webview contains a direct reference to
  // 'react-native/Libraries/BatchedBridge/BatchedBridge` and
  // should bundle correctly
});
