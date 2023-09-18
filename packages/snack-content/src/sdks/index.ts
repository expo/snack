import { SDKSpec } from './types';

const assets = {
  // @expo/snack-static/react-native-logo.png is an alias that is
  // implemented in the runtime, and uses by the react-native image docs
  '@expo/snack-static/react-native-logo.png': '*',
};

const sdks: { [version: string]: SDKSpec } = {
  '47.0.0': {
    version: '^47.0.0',
    coreModules: {
      ...assets,
      expo: '~47.0.0-beta.3',
      react: '18.1.0',
      'react-dom': '*',
      'react-native': '0.70.4',
      'react-native-web': '*',
      // Used by @shopify/react-native-skia, on web only
      // See runtime/src/NativeModules/ReactNativeSkia.tsx for more info
      '@shopify/react-native-skia/lib/module/web': '*',
    },
    bundledModules: {
      'expo-asset': '*',
      'expo-font': '*',
      'react-native-gesture-handler': '*',
      'react-native-safe-area-context': '*',
      '@expo/vector-icons': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-updates': '*',
      '@react-native-async-storage/async-storage': '*',
    },
    deprecatedModules: {},
  },
  '48.0.0': {
    version: '^48.0.0',
    coreModules: {
      ...assets,
      expo: '~48.0.17',
      react: '18.2.0',
      'react-dom': '*',
      'react-native': '0.71.8',
      'react-native-web': '*',
      // Used by @shopify/react-native-skia, on web only
      // See runtime/src/NativeModules/ReactNativeSkia.tsx for more info
      '@shopify/react-native-skia/lib/module/web': '*',
    },
    bundledModules: {
      'expo-asset': '*',
      'expo-font': '*',
      'react-native-gesture-handler': '*',
      'react-native-safe-area-context': '*',
      '@expo/vector-icons': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-updates': '*',
      '@react-native-async-storage/async-storage': '*',
      'react-native-reanimated': '*',
      'expo-router': '*',
      'expo-router/stack': '*',
      'expo-router/tabs': '*',
      'expo-router/drawer': '*',
      'expo-router/html': '*',
      'expo-router/head': '*',
      'expo-router/entry': '*',
      'react-native-pager-view': '*',
    },
    deprecatedModules: {},
  },
  '49.0.0': {
    version: '^49.0.0',
    coreModules: {
      ...assets,
      expo: '~49.0.10',
      react: '18.2.0',
      'react-dom': '*',
      'react-native': '0.72.4',
      'react-native-web': '*',
      // Used by @shopify/react-native-skia, on web only
      // See runtime/src/NativeModules/ReactNativeSkia.tsx for more info
      '@shopify/react-native-skia/lib/module/web': '*',
    },
    bundledModules: {
      'expo-asset': '*',
      'expo-font': '*',
      'react-native-gesture-handler': '*',
      'react-native-safe-area-context': '*',
      '@expo/vector-icons': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-updates': '*',
      '@react-native-async-storage/async-storage': '*',
      'react-native-reanimated': '*',
      'expo-router': '*',
      'expo-router/stack': '*',
      'expo-router/tabs': '*',
      'expo-router/drawer': '*',
      'expo-router/html': '*',
      'expo-router/head': '*',
      'expo-router/entry': '*',
      'react-native-pager-view': '*',
    },
    deprecatedModules: {},
  },
};

export default sdks;
