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

const sdks: { [version: string]: SDKSpec } = {
  '43.0.0': {
    version: '^43.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
      expo: '~43.0.0',
      react: '17.0.1',
      'react-dom': '*',
      'react-native': '0.64.2',
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
  '45.0.0': {
    version: '^45.0.0',
    coreModules: {
      ...assets,
      ...unimodules,
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
