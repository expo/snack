import { SDKSpec } from './types';

const assets = {
  // @expo/snack-static/react-native-logo.png is an alias that is
  // implemented in the runtime, and uses by the react-native image docs
  '@expo/snack-static/react-native-logo.png': '*',
};

const unimodules: { [name: string]: '*' } = {
  '@unimodules/core': '*',
  '@unimodules/react-native-adapter': '*',
};
const legacyUnimoduleInterfaces: { [name: string]: '*' } = {
  'unimodules-barcode-scanner-interface': '*',
  'unimodules-camera-interface': '*',
  'unimodules-constants-interface': '*',
  'unimodules-face-detector-interface': '*',
  'unimodules-file-system-interface': '*',
  'unimodules-font-interface': '*',
  'unimodules-image-loader-interface': '*',
  'unimodules-permissions-interface': '*',
  'unimodules-sensors-interface': '*',
  'unimodules-task-manager-interface': '*',
};

const sdks: { [version: string]: SDKSpec } = {
  '39.0.0': {
    version: '^39.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      ...legacyUnimoduleInterfaces,
      expo: '39.0.5',
      react: '16.13.1',
      'react-native': '0.63.2',
      'react-dom': '*',
      'react-native-web': '*',
    },
    bundledModules: {
      // Packages that require special initialisation (see Modules.tsx)
      'expo-asset': '*',
      'react-native-gesture-handler': '*',
      // 'react-native-vector-icons': '*',
      '@expo/vector-icons': '*',

      // Packages that are used internally by the runtime
      'expo-analytics-amplitude': '*',
      'expo-barcode-scanner': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-keep-awake': '*',
      'expo-updates': '*',
      'react-native-view-shot': '*',
      '@react-native-community/async-storage': '*',

      // Packages that are depended on by the "expo" package
      'expo-font': '*',
      'expo-linking': '*',
      'expo-permissions': '*',
      'expo-splash-screen': '*',
      'prop-types': '*',
      'react-native-safe-area-context': '*',

      // Packages that are not really required
      // TODO: THESE SHOULD BE REMOVED ONCE THE SNACK-SDK HANDLES ADDING/REMOVING/UPDATING DEPENDENCIES BETTER
      'expo-camera': '*',
      'expo-gl': '*',
      'expo-image-picker': '*',
      'expo-linear-gradient': '*',
    },
  },
  '40.0.0': {
    version: '^40.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      ...legacyUnimoduleInterfaces,
      expo: '40.0.1',
      react: '16.13.1',
      'react-native': '0.63.2',
      'react-dom': '*',
      'react-native-web': '*',
    },
    bundledModules: {
      // Packages that require special initialisation (see Modules.tsx)
      'expo-asset': '*',
      'expo-font': '*',
      'react-native-gesture-handler': '*',
      'react-native-safe-area-context': '*',
      // 'react-native-vector-icons': '*',
      '@expo/vector-icons': '*',

      // Packages that are used internally by the runtime
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-permissions': '*',
      'expo-updates': '*',
      '@react-native-community/async-storage': '*',

      // Common packages that are included for easy of use
      'prop-types': '*',
    },
  },
  '41.0.0': {
    version: '^41.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      ...legacyUnimoduleInterfaces,
      expo: '41.0.0',
      react: '16.13.1',
      'react-native': '0.63.2',
      'react-dom': '*',
      'react-native-web': '*',
    },
    bundledModules: {
      // Packages that require special initialisation (see Modules.tsx)
      'expo-asset': '*',
      'expo-font': '*',
      'react-native-gesture-handler': '*',
      'react-native-safe-area-context': '*',
      // 'react-native-vector-icons': '*',
      '@expo/vector-icons': '*',

      // Packages that are used internally by the runtime
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-permissions': '*',
      'expo-updates': '*',
      '@react-native-async-storage/async-storage': '*',

      // Common packages that are included for easy of use
      'prop-types': '*',
    },
    deprecatedModules: {
      '@react-native-community/async-storage':
        'Async Storage has moved to new organization: https://github.com/react-native-async-storage/async-storage',
      'expo-permissions':
        'Use permissions getters and requesters in specific modules instead, such as MediaLibrary.getPermissionsAsync() and MediaLibrary.requestPermissionsAsync().',
    },
  },
  '42.0.0': {
    version: '^42.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      expo: '42.0.0',
      react: '16.13.1',
      'react-native': '0.63.4',
      'react-dom': '*',
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
      'prop-types': '*',
    },
    deprecatedModules: {
      '@react-native-community/async-storage':
        'Async Storage has moved to new organization: https://github.com/react-native-async-storage/async-storage',
      'expo-permissions':
        'Use permissions getters and requesters in specific modules instead, such as MediaLibrary.getPermissionsAsync() and MediaLibrary.requestPermissionsAsync().',
    },
  },
};

export default sdks;
