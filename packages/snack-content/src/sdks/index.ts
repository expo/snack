import { SDKSpec } from './types';

const assets = {
  // @expo/snack-static/react-native-logo.png is an alias that is
  // implemented in the runtime, and uses by the react-native image docs
  '@expo/snack-static/react-native-logo.png': '*',
};

const sdks: { [version: string]: SDKSpec } = {
  '45.0.0': {
    version: '^45.0.0',
    coreModules: {
      ...assets,
      expo: '~45.0.0',
      react: '17.0.1',
      'react-dom': '*',
      'react-native': '0.68.2',
      'react-native-web': '*',
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
    deprecatedModules: {
      '@react-native-community/async-storage':
        'Async Storage has moved to new organization: https://github.com/react-native-async-storage/async-storage',
      'expo-permissions':
        'Use permissions getters and requesters in specific modules instead, such as MediaLibrary.getPermissionsAsync() and MediaLibrary.requestPermissionsAsync().',
      'expo-app-loading':
        'Use expo-splash-screen directly instead: SplashScreen.preventAutoHideAsync() and SplashScreen.hideAsync().',
    },
  },
  '46.0.0': {
    version: '^46.0.0',
    coreModules: {
      ...assets,
      expo: '~46.0.0',
      react: '18.0.0',
      'react-dom': '*',
      'react-native': '0.69.3',
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
    deprecatedModules: {
      '@react-native-community/async-storage':
        'Async Storage has moved to new organization: https://github.com/react-native-async-storage/async-storage',
      'expo-permissions':
        'Use permissions getters and requesters in specific modules instead, such as MediaLibrary.getPermissionsAsync() and MediaLibrary.requestPermissionsAsync().',
      'expo-app-loading':
        'Use expo-splash-screen directly instead: SplashScreen.preventAutoHideAsync() and SplashScreen.hideAsync().',
    },
  },
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
};

export default sdks;
