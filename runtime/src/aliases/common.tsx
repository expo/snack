import AssetRegistry from '../NativeModules/AssetRegistry';
import * as SkiaWeb from '../NativeModules/ReactNativeSkia';

const aliases: { [key: string]: any } = {
  expo: require('expo'),
  react: require('react'),
  'react/jsx-runtime': require('react/jsx-runtime'),

  // Needed for loading assets from packages bundled by snackager
  AssetRegistry,

  // Packages that require special initialisation (see Modules.tsx)
  'expo-asset': require('expo-asset'),
  'expo-font': require('expo-font'),
  'react-native-gesture-handler': require('react-native-gesture-handler'),
  'react-native-safe-area-context': require('react-native-safe-area-context'),
  'react-native-vector-icons': require('@expo/vector-icons'),
  '@expo/vector-icons': require('@expo/vector-icons'),

  // Packages that are used internally by the runtime
  'expo-constants': require('expo-constants'),
  'expo-file-system': require('expo-file-system'),
  'expo-updates': require('expo-updates'),
  '@react-native-async-storage/async-storage': require('@react-native-async-storage/async-storage'),

  // Renamed `@react-native-community` packages
  '@react-native-community/async-storage': require('@react-native-async-storage/async-storage'),

  // Common packages that are included for easy of use
  'prop-types': require('prop-types'),

  // Aliases for the image examples in react native docs
  '@expo/snack-static/react-native-logo.png': require('../react-native-logo.png'),

  // Use the fixed react native reanimated shipped in the snack runtime
  // It's a workaround for issues we encountered with the newer babel plugin for SDK 44
  'react-native-reanimated': require('react-native-reanimated'),

  // Used by @shopify/react-native-skia, on web only
  '@shopify/react-native-skia/lib/module/web': SkiaWeb,

  // Used by expo-router
  '@react-navigation/bottom-tabs': require('@react-navigation/bottom-tabs'),
  '@react-navigation/core': require('@react-navigation/core'),
  '@react-navigation/drawer': require('@react-navigation/drawer'),
  '@react-navigation/native': require('@react-navigation/native'),
  '@react-navigation/native/src/useBackButton': require('@react-navigation/native/src/useBackButton'),
  '@react-navigation/native/src/useDocumentTitle': require('@react-navigation/native/src/useDocumentTitle'),
  '@react-navigation/native/src/useThenable': require('@react-navigation/native/src/useThenable'),
  '@react-navigation/native/lib/module/useLinking': require('@react-navigation/native/lib/module/useLinking'),
  '@react-navigation/native-stack': require('@react-navigation/native-stack'),
  '@react-navigation/routers': require('@react-navigation/routers'),
};

export default aliases;
