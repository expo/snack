export const aliases = {
  // @expo/snack-static/react-native-logo.png is an alias that is
  // implemented in the runtime, and uses by the react-native image docs
  '@expo/snack-static': '0.0.1',
  '@expo/snack-static/react-native-logo.png': '0.0.1',
};

export const dependencies = {
  '37.0.0': {
    ...aliases,
    '@expo/vector-icons': '10.0.0',
    '@unimodules/core': '5.1.0',
    '@unimodules/react-native-adapter': '5.1.1',
    expo: '37.0.0',
    'expo-asset': '8.1.1',
    'expo-barcode-scanner': '8.1.0',
    'expo-camera': '8.2.0',
    'expo-constants': '9.0.0',
    'expo-file-system': '8.1.0',
    'expo-font': '8.1.0',
    'expo-gl': '8.1.0',
    'expo-image-picker': '8.1.0',
    'expo-linear-gradient': '8.1.0',
    react: '16.9.0',
    'react-native': '0.61.4',
    'prop-types': '15.7.2',
    'react-dom': '16.9.0',
    'react-native-web': '0.11.7',
    'react-native-gesture-handler': '1.6.0',
    'unimodules-permissions-interface': '5.1.0',
  },
  // The outcommented dependencies are also preloaded in the runtime, however we don't mark them
  // as such, so that the snack-sdk will allow adding them to the package.json dependencies.
  // When any of these dependencies is sent to the runtime, the version is ignored and the
  // runtime uses the version that was bundled into the runtime instead.
  '38.0.0': {
    ...aliases,
    expo: '38.0.1',
    react: '16.11.0',
    'react-native': '0.62.2',
    'react-dom': '16.11.0',
    'react-native-web': '0.11.7',
    // Packages that require special initialisation (see Modules.tsx)
    'expo-asset': '8.1.7',
    'react-native-gesture-handler': '1.6.0',
    //'react-native-vector-icons': '10.0.0',
    '@expo/vector-icons': '10.0.0',
    // Packages that are used internally by the runtime
    //'expo-analytics-amplitude': '8.2.1',
    'expo-barcode-scanner': '8.2.1',
    'expo-constants': '9.1.1',
    'expo-file-system': '9.0.1',
    //'expo-keep-awake': '8.2.1',
    'react-native-view-shot': '3.1.2',
    // Packages that are depended on by one of the packages above
    'expo-font': '8.2.1', // used by "expo"
    //'expo-linking': '1.0.3', // used by "expo"
    //'expo-permissions': '9.0.1', // used by "expo"
    //'expo-splash-screen': '0.3.1', // used by "expo"
    'prop-types': '15.7.2', // *
    '@unimodules/core': '5.3.0', // used by "expo"
    '@unimodules/react-native-adapter': '5.4.0', // used by "expo"
    'unimodules-permissions-interface': '5.2.1', // used by "expo"
    // Packages that are not really required
    // TODO: THESE SHOULD BE REMOVED ONCE THE SNACK-SDK HANDLES ADDING/REMOVING/UPDATING DEPENDENCIES BETTER
    'expo-camera': '8.3.1',
    'expo-gl': '8.3.1',
    'expo-image-picker': '8.3.0',
    'expo-linear-gradient': '8.2.1',
  },
  // The outcommented dependencies are also preloaded in the runtime, however we don't mark them
  // as such, so that the snack-sdk will allow adding them to the package.json dependencies.
  // When any of these dependencies is sent to the runtime, the version is ignored and the
  // runtime uses the version that was bundled into the runtime instead.
  '39.0.0': {
    ...aliases,
    expo: '39.0.2',
    react: '16.13.1',
    'react-native': '0.63.2',
    'react-dom': '16.13.1',
    'react-native-web': '0.13.12',
    // Packages that require special initialisation (see Modules.tsx)
    'expo-asset': '8.2.0',
    'react-native-gesture-handler': '1.7.0',
    //'react-native-vector-icons': '10.0.0',
    '@expo/vector-icons': '10.0.0',
    // Packages that are used internally by the runtime
    'expo-barcode-scanner': '9.0.0',
    'expo-constants': '9.2.0',
    'expo-file-system': '9.2.0',
    'react-native-view-shot': '3.1.2',
    // Packages that are depended on by one of the packages above
    'expo-font': '8.3.0', // used by "expo"
    'prop-types': '15.7.2', // *
    '@unimodules/core': '5.5.0', // used by "expo"
    '@unimodules/react-native-adapter': '5.6.0', // used by "expo"
    'unimodules-permissions-interface': '5.3.0', // used by "expo"
    // Packages that are not really required
    // TODO: THESE SHOULD BE REMOVED ONCE THE SNACK-SDK HANDLES ADDING/REMOVING/UPDATING DEPENDENCIES BETTER
    'expo-camera': '9.0.0',
    'expo-gl': '9.1.1',
    'expo-image-picker': '9.1.1',
    'expo-linear-gradient': '8.3.0',
  },
  '40.0.0': {
    ...aliases,
    expo: '40.0.0',
    react: '16.13.1',
    'react-native': '0.63.2',
    'react-dom': '16.13.1',
    'react-native-web': '0.13.12',

    // Packages that require special initialisation (see Modules.tsx)
    'expo-asset': '8.2.1',
    'expo-font': '8.4.0',
    'react-native-gesture-handler': '1.8.0',
    'react-native-safe-area-context': '3.1.9',
    //'react-native-vector-icons': '10.0.0',
    '@expo/vector-icons': '12.0.0',

    // Packages that are used internally by the runtime
    'expo-constants': '9.3.3',
    'expo-file-system': '9.3.0',
    'expo-permissions': '10.0.0',
    'expo-updates': '0.4.1',
    '@react-native-community/async-storage': '1.12.0',

    // Common packages that are included for easy of use
    'prop-types': '15.7.2',
    '@unimodules/core': '6.0.0',
    '@unimodules/react-native-adapter': '5.7.0',
    'unimodules-permissions-interface': '5.4.0',
  },
};
