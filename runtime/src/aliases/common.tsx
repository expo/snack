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
  'expo-updates': require('expo-updates'),
  '@react-native-async-storage/async-storage': require('@react-native-async-storage/async-storage'),

  // Renamed `@react-native-community` packages
  '@react-native-community/async-storage': require('@react-native-async-storage/async-storage'),

  // Common packages that are included for easy of use
  'prop-types': require('prop-types'),
  '@unimodules/core': require('@unimodules/core'),
  '@unimodules/react-native-adapter': require('@unimodules/react-native-adapter'),
  'expo-modules-core': require('expo-modules-core'),
  'unimodules-task-manager-interface': require('unimodules-task-manager-interface'),

  // Aliases for the image examples in react native docs
  '@expo/snack-static/react-native-logo.png': require('../react-native-logo.png'),
};

export default aliases;
