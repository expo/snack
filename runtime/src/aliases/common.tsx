import * as AssetRegistry from '../NativeModules/AssetRegistry';
import * as SkiaWeb from '../NativeModules/ReactNativeSkia';

const aliases: { [key: string]: any } = {
  expo: require('expo'),
  react: require('react'),
  'react/jsx-runtime': require('react/jsx-runtime'),

  // Needed for loading assets from packages bundled by snackager
  AssetRegistry,
  '@react-native/assets-registry/registry': AssetRegistry,

  // Packages that require special initialisation (see Modules.tsx)
  'expo-asset': require('expo-asset'),
  'expo-font': require('expo-font'),
  'react-native-gesture-handler': require('react-native-gesture-handler'),
  'react-native-safe-area-context': require('react-native-safe-area-context'),
  'react-native-vector-icons': require('@expo/vector-icons'),
  '@expo/vector-icons': require('@expo/vector-icons'),

  // Packages that are used internally by the runtime
  'expo-constants': require('expo-constants'),
  'expo-updates': require('expo-updates'),
  '@react-native-async-storage/async-storage': require('@react-native-async-storage/async-storage'),

  // Snackager can't bundle expo-modules-core, so we vendor it instead
  'expo-modules-core': require('expo-modules-core'),

  // Renamed `@react-native-community` packages
  '@react-native-community/async-storage': require('@react-native-async-storage/async-storage'),

  // Common Expo packages preloaded for immediate use (no snackager fetch needed)
  'expo-image': require('expo-image'),
  'expo-linear-gradient': require('expo-linear-gradient'),
  'expo-status-bar': require('expo-status-bar'),
  'expo-video': require('expo-video'),
  '@shopify/react-native-skia': require('@shopify/react-native-skia'),

  // Common packages that are included for easy of use
  'prop-types': require('prop-types'),

  // Aliases for the image examples in react native docs
  '@expo/snack-static/react-native-logo.png': require('../react-native-logo.png'),

  // Use the fixed react native reanimated shipped in the snack runtime
  // It's a workaround for issues we encountered with the newer babel plugin for SDK 44
  'react-native-reanimated': require('react-native-reanimated'),
  'react-native-worklets': require('react-native-worklets'),

  // Used by @shopify/react-native-skia, on web only
  '@shopify/react-native-skia/lib/module/web': SkiaWeb,

  // Only works when vendored into the runtime (expo-router@1.5.3)
  'expo-router': require('expo-router'),
  'expo-router/stack': require('expo-router/stack'),
  'expo-router/tabs': require('expo-router/tabs'),
  'expo-router/drawer': require('expo-router/drawer'),
  'expo-router/html': require('expo-router/html'),
  'expo-router/head': require('expo-router/head'),
  'expo-router/entry': () => {}, // noop
};

export default aliases;
