# snack-runtime

The core system to load and open Snacks within React Native apps.

> ⚠️ **Warning**:
> This package consumes Snack infrastructure and **requires** a license from Expo. If you are interested, [contact us](https://expo.dev/contact) and ask about the Snack custom runtime.

## Installation

```bash
$ yarn add snack-runtime
```

## Usage

```js
import * as Updates from 'expo-updates';
import {
  type SnackConfig,
  type SnackState,
  defaultSnackModules,
  SnackRuntimeProvider,
  SnackRuntime,
} from 'snack-runtime';

const config: SnackConfig = {
  modules: {
    // Inherit the default set of modules from Snack
    ...defaultSnackModules,
    // Add modules that are available through imports within Snacks
    'react-native-blurhash': require('react-native-blurhash'),
  }
};

export function Snack() {
  return (
    <SnackRuntimeProvider config={config}>
      <SnackRuntime
        onSnackState={onStateChange}
        onSnackReload={onReloadRequested}
        snackUrl="<snackUrl>"
      />
    </SnackRuntimeProvider>
  );
}

// Requested through the Snack website
function onReloadRequested() {
  return Updates.reloadAsync();
}

// When the lifecycle of a Snack changes
function onStateChange(state: SnackState) {
  if (state === 'loading') console.log('Snack is initializing the code...');
  if (state === 'finished') console.log('Snack is ready and rendered!');
  if (state === 'error') console.error('Snack failed to initialize, check the logs for more info.');

  throw new Error(`Unexpected Snack state received "${state}"`);
}
```

## Patches required

Snack virtualizes the whole bundling and module systems, and because of that, requires a few patches to some libraries:

- [`react-native`](../../runtime-shell/patches/react-native+0.71.8.patch) → To avoid "ViewManager is already loaded" errors
- [`react-native-web`](../../runtime-shell/patches/react-native+0.71.8.patch) → To make sure the assets from Snack are loaded properly

## Contributing

This package has a few commands to help contributing to this package.

- `yarn lint` → Ensures a unified code styling across the code base.
- `yarn test` → Runs all unit tests to ensure functionality remains as-expected.
