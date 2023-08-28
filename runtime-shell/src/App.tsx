import { reloadAsync } from 'expo-updates';
import {
  defaultSnackModules,
  type SnackConfig,
  SnackRuntimeProvider,
  SnackRuntime,
} from 'snack-runtime';

const config: SnackConfig = {
  modules: {
    ...defaultSnackModules,

    // Only works when vendored into the runtime (expo-router@1.5.3)
    'expo-router': require('expo-router'),
    'expo-router/stack': require('expo-router/stack'),
    'expo-router/tabs': require('expo-router/tabs'),
    'expo-router/drawer': require('expo-router/drawer'),
    'expo-router/html': require('expo-router/html'),
    'expo-router/head': require('expo-router/head'),
    'expo-router/entry': () => {}, // noop
  },
};

export default function Snack() {
  return (
    <SnackRuntimeProvider config={config}>
      <SnackRuntime onSnackReload={reloadAsync} />
    </SnackRuntimeProvider>
  );
}
