import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for react-native-screens/native-stack', async () => {
  const bundle = await bundleAsync('react-native-screens/native-stack@2.11.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // react-native-webview contains a direct reference to
  // 'react-native/Libraries/ReactNative/AppContainer` and
  // should bundle correctly
});
