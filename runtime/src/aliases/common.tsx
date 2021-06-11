import AssetRegistry from '../NativeModules/AssetRegistry';

const aliases: { [key: string]: any } = {
  expo: require('expo'),
  react: require('react'),

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
  'expo-permissions': require('expo-permissions'), // TODO, remove this for SDK 42
  'expo-updates': require('expo-updates'),
  '@react-native-async-storage/async-storage': require('@react-native-async-storage/async-storage'),

  // Renamed `@react-native-community` packages
  '@react-native-community/async-storage': require('@react-native-async-storage/async-storage'),

  // Common packages that are included for easy of use
  'prop-types': require('prop-types'),
  '@unimodules/core': require('@unimodules/core'),
  '@unimodules/react-native-adapter': require('@unimodules/react-native-adapter'),
  'unimodules-barcode-scanner-interface': require('unimodules-barcode-scanner-interface'),
  'unimodules-camera-interface': require('unimodules-camera-interface'),
  'unimodules-constants-interface': require('unimodules-constants-interface'),
  'unimodules-face-detector-interface': require('unimodules-face-detector-interface'),
  'unimodules-file-system-interface': require('unimodules-file-system-interface'),
  'unimodules-font-interface': require('unimodules-font-interface'),
  'unimodules-image-loader-interface': require('unimodules-image-loader-interface'),
  'unimodules-permissions-interface': require('unimodules-permissions-interface'),
  'unimodules-sensors-interface': require('unimodules-sensors-interface'),
  'unimodules-task-manager-interface': require('unimodules-task-manager-interface'),

  // Aliases for the image examples in react native docs
  '@expo/snack-static/react-native-logo.png': require('../react-native-logo.png'),
};

export default aliases;
