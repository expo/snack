import * as SplashScreen from 'expo-splash-screen';
import { PureComponent } from 'react';

import * as Logger from './Logger';

// This is a drop-in replacement for `expo-app-loading`
// see: https://github.com/expo/expo/blob/1f31c08351ab66a3d27db0898ffd8c5b20f1bf5a/packages/expo-app-loading/src/AppLoadingNativeWrapper.tsx
export class AppLoading extends PureComponent {
  constructor(props: any) {
    super(props);

    // TODO: solve this non-promise returning function on native
    const result = SplashScreen.preventAutoHideAsync();
    if (result) {
      result.catch((error) => {
        Logger.error('Failed to prevent auto-hide on splash screen', error);
      });
    }
  }

  componentWillUnmount() {
    SplashScreen.hideAsync().catch((error) => {
      Logger.error('Failed to hide splash screen', error);
    });
  }

  render() {
    return null;
  }
}
