import AssetRegistry from '../../NativeModules/AssetRegistry';
import * as SkiaWeb from '../../NativeModules/ReactNativeSkia';
import { SnackConfig } from '../SnackConfig';

export const allPlatformModules: SnackConfig['modules'] = {
  // React core modules
  react: require('react'),
  'react/jsx-runtime': require('react/jsx-runtime'),

  // Expo core modules
  expo: require('expo'),
  'expo-constants': require('expo-constants'), // Internally used by Snack Runtime
  'expo-file-system': require('expo-file-system'), // Internally used by Snack Runtime
  '@react-native-async-storage/async-storage': require('@react-native-async-storage/async-storage'), // Internally used by Snack Runtime
  'expo-asset': require('expo-asset'), // Requires special initialisation (see Modules.tsx)
  'expo-font': require('expo-font'), // Requires special initialisation (see Modules.tsx)
  'react-native-vector-icons': require('@expo/vector-icons'), // Requires special initialisation (see Modules.tsx)
  '@expo/vector-icons': require('@expo/vector-icons'), // Requires special initialisation (see Modules.tsx)

  // Snack Runtime vendored modules
  AssetRegistry, // Needed for loading assets from packages bundled by snackager
  '@shopify/react-native-skia/lib/module/web': SkiaWeb, // Used by @shopify/react-native-skia, defined here for types, but used on web only
  'react-native-gesture-handler': require('react-native-gesture-handler'),
  'react-native-reanimated': require('react-native-reanimated'),
  'react-native-safe-area-context': require('react-native-safe-area-context'),

  // Asset modules
  '@expo/snack-static/react-native-logo.png': require('../../react-native-logo.png'),
};
