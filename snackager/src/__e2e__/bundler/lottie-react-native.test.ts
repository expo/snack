import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for lottie-react-native@6.7.0', async () => {
  const bundle = await bundleAsync('lottie-react-native@6.7.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // react-native/Libraries/NativeComponent/ViewConfigIgnore should be included as an external
  expect(bundle.files.ios['bundle.js'].externals).toEqual(
    expect.arrayContaining(['react-native/Libraries/NativeComponent/ViewConfigIgnore']),
  );
  // react-native/Libraries/ReactNative/RendererProxy should be included as an external
  expect(bundle.files.ios['bundle.js'].externals).toEqual(
    expect.arrayContaining(['react-native/Libraries/ReactNative/RendererProxy']),
  );
});
