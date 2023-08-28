import common from './common';
import AssetRegistry from '../NativeModules/AssetRegistry';

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
  'react-native/Libraries/Components/TextInput/TextInputState': require('react-native/Libraries/Components/TextInput/TextInputState'), // for @stripe/stripe-react-native
  'react-native/Libraries/Core/Devtools/parseErrorStack': require('react-native/Libraries/Core/Devtools/parseErrorStack'), // Used by @sentry/react-native@3.4.2
  'react-native/Libraries/Core/Devtools/symbolicateStackTrace': require('react-native/Libraries/Core/Devtools/symbolicateStackTrace'), // Used by @sentry/react-native@3.4.2
  'react-native/Libraries/Core/Devtools/getDevServer': require('react-native/Libraries/Core/Devtools/getDevServer'), // Used by @sentry/react-native@3.4.2
  'react-native/Libraries/Utilities/PolyfillFunctions': require('react-native/Libraries/Utilities/PolyfillFunctions'), // Used by @sentry/react-native@3.4.2
  'react-native/Libraries/Utilities/codegenNativeCommands': require('react-native/Libraries/Utilities/codegenNativeCommands'), // Used by react-native-webview@11.23.0
};

export default aliases;
