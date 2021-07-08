import AssetRegistry from '../NativeModules/AssetRegistry';
import common from './common';

const aliases: { [key: string]: any } = {
  ...common,
  'react-native-view-shot': require('react-native-view-shot'),
  'react-native': require('react-native'),
  'react-native/Libraries/Image/AssetRegistry': AssetRegistry,
  'react-native/Libraries/Image/AssetSourceResolver': require('react-native/Libraries/Image/AssetSourceResolver'),
  'react-native/Libraries/Image/resolveAssetSource': require('react-native/Libraries/Image/resolveAssetSource'),
  'react-native/Libraries/Core/ReactNativeVersion': require('react-native/Libraries/Core/ReactNativeVersion'),
  'react-native/Libraries/BatchedBridge/BatchedBridge': require('react-native/Libraries/BatchedBridge/BatchedBridge'),
  'react-native/Libraries/ReactNative/AppContainer': require('react-native/Libraries/ReactNative/AppContainer'),
  'react-native/Libraries/Utilities/dismissKeyboard': require('react-native/Libraries/Utilities/dismissKeyboard'), // for @react-native-community/viewpager
  'react-native/Libraries/Renderer/shims/ReactNative': require('react-native/Libraries/Renderer/shims/ReactNative'), // for react-native-reanimated
  'react-native/Libraries/Components/UnimplementedViews/UnimplementedView': require('react-native/Libraries/Components/UnimplementedViews/UnimplementedView'), // for @react-native-picker/picker@1.9.11
};

export default aliases;
