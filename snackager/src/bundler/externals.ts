// Externals that are implicitly believed to be installed
// and for which the user will never be prompted to install
// them as a peer-dependency.
//
// We should strive to keep this list to a minimum and only
// include packages that are part of the core or so common
// that we don't want to bother users with installing them.
const CORE_EXTERNALS = [
  'react',
  'react-native',
  'react-native-web',
  'react-native-windows',
  'expo',
  '@unimodules/core',
  '@unimodules/react-native-adapter',
  'unimodules-permissions-interface',
  'AssetRegistry',
  'react-native-web/dist/modules/AssetRegistry',
  'react-native/Libraries/Image/AssetRegistry',
  'react-native/Libraries/Image/AssetSourceResolver',
  'react-native/Libraries/Image/resolveAssetSource',
  'react-native/Libraries/Core/ReactNativeVersion', // Used by react-native-screens
  'react-native/Libraries/BatchedBridge/BatchedBridge', // Used by react-native-webview
  'react-native/Libraries/ReactNative/AppContainer', // Used by react-native-screens
  'react-native/Libraries/Utilities/dismissKeyboard', // used by @react-native-community/viewpager@4.2.0
  'react-native/Libraries/Renderer/shims/ReactNative', // Used by moti
  // TODO: decide whether to treat prop-types as an external or not
  // previously it was always installed as a dependency and not treated as an external.
  // This however caused packages to be slightly larger than needed to be.
  // As prop-types is also included in the runtime, it would be possible to externalize it.
  // 'prop-types',
];

// List of packages that are considered to be external and
// should never be bundled into the package, but instead should
// be imported as an external. If a package uses such a dependency
// but didn't mark it as a peer-dependency, then it will be
// marked as a peer-dependency by snackager.
const PACKAGE_EXTERNALS = [
  'react-native-gesture-handler',
  'react-native-maps',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'react-native-vector-icons',
  'lottie-react-native',
  'expo-ads-admob',
  'expo-ads-facebook',
  'expo-analytics-amplitude',
  'expo-app-auth',
  'expo-asset',
  'expo-av',
  'expo-background-fetch',
  'expo-barcode-scanner',
  'expo-blur',
  'expo-calendar',
  'expo-camera',
  'expo-constants',
  'expo-contacts',
  'expo-document-picker',
  'expo-face-detector',
  'expo-facebook',
  'expo-file-system',
  'expo-font',
  'expo-gl',
  'expo-google-sign-in',
  'expo-haptics',
  'expo-image-manipulator',
  'expo-image-picker',
  'expo-intent-launcher',
  'expo-keep-awake',
  'expo-linear-gradient',
  'expo-linking',
  'expo-local-authentication',
  'expo-localization',
  'expo-location',
  'expo-mail-composer',
  'expo-media-library',
  'expo-permissions',
  'expo-print',
  'expo-processing',
  'expo-secure-store',
  'expo-sharing',
  'expo-sms',
  'expo-speech',
  'expo-task-manager',
  'expo-web-browser',
  '@expo/vector-icons',
  '@react-navigation/native',
];

export function getCoreExternals(): string[] {
  return CORE_EXTERNALS;
}

export function getPackageExternals(): string[] {
  return PACKAGE_EXTERNALS;
}

export function isExternal(spec: string): boolean {
  if (CORE_EXTERNALS.includes(spec)) {
    return true;
  }
  if (PACKAGE_EXTERNALS.includes(spec)) {
    return true;
  }
  return false;
}
