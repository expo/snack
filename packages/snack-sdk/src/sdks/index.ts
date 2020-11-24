import { SDKSpec } from './types';

const aliases = {
  // @expo/snack-static/react-native-logo.png is an alias that is
  // implemented in the runtime, and uses by the react-native image docs
  '@expo/snack-static/react-native-logo.png': 'image',
};

const unimodules: { [name: string]: '*' } = {
  '@unimodules/core': '*',
  '@unimodules/react-native-adapter': '*',
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
  '36.0.0': {
    version: '36.0.0',
    coreModules: {
      ...aliases,
      expo: '36.0.0',
      react: '16.9.0',
      'react-native': '0.61.4',
      'react-dom': '16.9.0',
      'react-native-web': '0.11.7',
    },
    bundledModules: {
      ...unimodules,
      '@expo/vector-icons': '*',
      'expo-asset': '*',
      'expo-auth-session': '*',
      'expo-barcode-scanner': '*',
      'expo-camera': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-font': '*',
      'expo-gl': '*',
      'expo-image-picker': '*',
      'expo-linear-gradient': '*',
      'prop-types': '*',
      'react-native-gesture-handler': '*',
    },
  },
  '37.0.0': {
    version: '37.0.0',
    coreModules: {
      ...aliases,
      expo: '37.0.0',
      react: '16.9.0',
      'react-native': '0.61.4',
      'react-dom': '16.9.0',
      'react-native-web': '0.11.7',
    },
    bundledModules: {
      ...unimodules,
      '@expo/vector-icons': '*',
      'expo-asset': '*',
      'expo-barcode-scanner': '*',
      'expo-camera': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      'expo-font': '*',
      'expo-gl': '*',
      'expo-image-picker': '*',
      'expo-linear-gradient': '*',
      'prop-types': '*',
      'react-native-gesture-handler': '*',
    },
  },
  '38.0.0': {
    version: '38.0.0',
    coreModules: {
      ...aliases,
      expo: '38.0.1',
      react: '16.11.0',
      'react-native': '0.62.2',
      'react-dom': '16.11.0',
      'react-native-web': '0.11.7',
    },
    bundledModules: {
      ...unimodules,
      // Packages that require special initialisation (see Modules.tsx)
      'expo-asset': '*',
      'react-native-gesture-handler': '*',
      //'react-native-vector-icons': '*',
      '@expo/vector-icons': '*',
      // Packages that are used internally by the runtime
      //'expo-analytics-amplitude': '*',
      'expo-barcode-scanner': '*',
      'expo-constants': '*',
      'expo-file-system': '*',
      //'expo-keep-awake': '*',
      'react-native-view-shot': '*',
      // Packages that are depended on by one of the packages above
      'expo-font': '*', // used by "expo"
      //'expo-linking': '*', // used by "expo"
      //'expo-permissions': '*', // used by "expo"
      //'expo-splash-screen': '*', // used by "expo"
      'prop-types': '*', // *
      // Packages that are not really required
      // TODO: THESE SHOULD BE REMOVED ONCE THE SNACK-SDK HANDLES ADDING/REMOVING/UPDATING DEPENDENCIES BETTER
      'expo-camera': '*',
      'expo-gl': '*',
      'expo-image-picker': '*',
      'expo-linear-gradient': '*',
    },
  },
  '39.0.0': {
    version: '39.0.0',
    coreModules: {
      ...aliases,
      expo: '39.0.2',
      react: '16.13.1',
      'react-native': '0.63.2',
      'react-dom': '16.13.1',
      'react-native-web': '0.13.12',
    },
    bundledModules: {
      ...unimodules,

      // Packages that require special initialisation (see Modules.tsx)
      'expo-asset': '*',
      'react-native-gesture-handler': '*',
      //'react-native-vector-icons': '*',
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
};

export default sdks;
