import { reloadAsync } from 'expo-updates';
import { Platform } from 'react-native';
import {
  type SnackConfig,
  defaultSnackModules,
  SnackRuntimeProvider,
  SnackRuntime,
} from 'snack-runtime';

const platformModules: SnackConfig['modules'] = Platform.select({
  default: {},
  native: {
    // Does not work in Snackager, likely due to Webpack / Codegen
    'react-native-pager-view': require('react-native-pager-view'),
    // Does not work in Snackager, likely due to Webpack / Codegen
    'react-native-screens': require('react-native-screens'),
  },
});

const config: SnackConfig = {
  modules: {
    ...defaultSnackModules,
    ...platformModules,
    // Only works when vendored into the runtime (expo-router@1.5.3)
    'expo-router': require('expo-router'),
    'expo-router/stack': require('expo-router/stack'),
    'expo-router/tabs': require('expo-router/tabs'),
    'expo-router/drawer': require('expo-router/drawer'),
    'expo-router/html': require('expo-router/html'),
    'expo-router/head': require('expo-router/head'),
    'expo-router/entry': () => {}, // noop
  },
  experimental: {
    expoRouterEntry: require('./NativeModules/ExpoRouter').ExpoRouterApp,
  },
};

export default function Snack() {
  return (
    <SnackRuntimeProvider config={config}>
      <SnackRuntime onSnackReload={reloadAsync} />
    </SnackRuntimeProvider>
  );
}
