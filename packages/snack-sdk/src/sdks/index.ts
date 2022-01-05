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
  '43.0.0': {
    version: '^43.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      expo: '~43.0.0',
      react: '17.0.1',
      'react-native': '0.64.2',
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
  '44.0.0': {
    version: '^44.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      expo: '~44.0.0',
      react: '17.0.1',
      'react-dom': '*',
      'react-native': '0.64.3',
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
