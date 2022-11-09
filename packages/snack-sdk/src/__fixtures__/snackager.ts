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
    'expo-firebase-analytics@~6.0.0': {
      peerDependencies,
    },
    'expo-av@~10.2.0': {
      version: '10.2.0',
      peerDependencies,
    },
    'expo-av@~11.2.3': {
      version: '11.2.3',
      peerDependencies,
    },
    'expo-av@~12.0.2': {
      version: '12.0.2',
      peerDependencies,
    },
    'expo-av@~13.0.1': {
      version: '13.0.1',
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
