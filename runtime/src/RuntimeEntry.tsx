import Constants from 'expo-constants';
import React from 'react';
import { Text } from 'react-native';

import { SNACK_API_URL, SNACKPUB_URL } from './Constants';
import LoadingView from './LoadingView';
import EXDevLauncher from './NativeModules/EXDevLauncher';
import Linking from './NativeModules/Linking';
import { getWorkerLaunch, type WorkerLaunch } from './worker/launch';

/** Load only the selected engine; legacy global module hooks must not affect worker graphs. */
export default function RuntimeEntry() {
  const [selected, setSelected] = React.useState<{
    launch: WorkerLaunch | null;
    error?: string;
  }>();
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const initialURL =
          process.env.EXPO_PUBLIC_SNACK_URL ??
          EXDevLauncher.manifestURL ??
          (await Linking.getInitialURL());
        const launch = getWorkerLaunch(Constants.expoConfig, initialURL, {
          url: SNACKPUB_URL,
          apiURL: SNACK_API_URL,
        });
        if (active)
          setSelected({
            launch,
          });
      } catch (error) {
        if (active) setSelected({ launch: null, error: String(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  if (!selected) return <LoadingView />;
  if (selected.error) return <Text>{selected.error}</Text>;
  if (selected.launch) {
    const WorkerApp = require('./worker/SdkApp').default;
    return <WorkerApp {...selected.launch} />;
  }
  const LegacyApp = require('./App').default;
  return <LegacyApp />;
}
