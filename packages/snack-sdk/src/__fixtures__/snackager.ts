export type SnackagerConfig = {
  bundles: {
    [key: string]: {
      version?: string;
      pending?: boolean;
      peerDependencies: {
        [key: string]: string | null;
      };
    };
  };
};

const peerDependencies = {
  react: '*',
  'react-native': '*',
};

const config: SnackagerConfig = {
  bundles: {
    'firestorter@2.0.1': {
      peerDependencies: {
        mobx: '^4.0.0',
      },
    },
    'firestorter@*': {
      version: '2.0.1',
      peerDependencies: {
        mobx: '^4.0.0',
      },
    },
    'expo-firebase-analytics@2.4.1': {
      peerDependencies,
    },
    'expo-av@~9.2.3': {
      version: '9.2.3',
      peerDependencies,
    },
    'expo-av@~10.1.0': {
      version: '10.1.0',
      peerDependencies,
    },
    '@react-navigation/native@5.1.1': {
      peerDependencies,
    },
    'react-native-paper@3.10.1': {
      peerDependencies: {
        ...peerDependencies,
        '@expo/vector-icons': null,
      },
    },
    'react-native-gesture-handler/DrawerLayout@1.6.0': {
      peerDependencies: {
        'react-native-gesture-handler': '1.6.0',
      },
    },
  },
};

export default config;
