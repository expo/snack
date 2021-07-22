# Snack SDK Documentation <!-- omit in toc -->

The Expo Snack SDK. Use this to create a custom web interface for https://snack.expo.dev/. 


## Index <!-- omit in toc -->

- [Basic usage](#basic-usage)
- [Files, dependencies and the state](#files-dependencies-and-the-state)
  - [Updating files](#updating-files)
  - [Using assets](#using-assets)
  - [Using dependencies](#using-dependencies)
  - [Changing the SDK version](#changing-the-sdk-version)
  - [Getting the state](#getting-the-state)
  - [Missing dependencies](#missing-dependencies)
- [Going online, debounced updates and connected clients](#going-online-debounced-updates-and-connected-clients)
  - [Going online](#going-online)
  - [Sending code changes manually or debounced](#sending-code-changes-manually-or-debounced)
  - [DeviceId's and connected accounts](#deviceids-and-connected-accounts)
  - [Connected clients](#connected-clients)
  - [Requesting previews](#requesting-previews)
- [Saving the Snack](#saving-the-snack)
  - [Downloading as a Zip file](#downloading-as-a-zip-file)
- [Transports](#transports)
  - [Previewing the Snack on Web](#previewing-the-snack-on-web)
- [Example App](#example-app)
- [API Reference](#api-reference)

# Basic usage

```sh
yarn add snack-sdk
```

```ts
import { Snack } from 'snack-sdk';

// Create Snack
const snack = new Snack({
  files: {
    'App.js': {
      type: 'CODE',
      contents: `
import * as React from 'react';
import { View, Text } from 'react-native';

export default () => (
  <View style={{flex: 1, justifyContent: 'center'}}>
    <Text style={{fontSize: 20, textAlign: 'center'}}>
      Hello Snack!
    </Text>
  </View>
);
`
    }
  }
});

// Make the Snack available online
snack.setOnline(true);
const { url } = await snack.getStateAsync();

// You can now use the url and show it as a QR code
// to open the Snack in the Expo client.

// Stop Snack when done
snack.setOnline(false);
```

# Files, dependencies and the state

A Snack consists of a collection of files and dependencies which make up the code of the application. You can choose to use either JavaScript or TypeScript by using one of the following filenames as the entry-point for the Snack.

- `App.js` (JavaScript)
- `App.tsx` (TypeScript)

## Updating files

When the code is updated, any connected clients will be automatically updated as well.

To add or update a file, use:

```ts
snack.updateFiles({
  'App.js': {
    type: 'CODE',
    contents: `console.log("Hello Snack");`,
  },
  'README.md': {
    type: 'CODE',
    contents: `# MyAwesomeSnack`,
  },
});
```

To delete a file, specify `null` as the value:

```ts
snack.updateFiles({
  'README.md': null,
});
```

## Using assets

Assets are resources that are available through a url, for instance images or fonts. Just as code-files, assets can be set using the constructor or the `updateFiles` method.

```ts
snack.updateFiles({
  'assets/logo.png': {
    type: 'ASSET',
    contents: 'https://mysite/logo.png',
  },
});
```

Assets can also be added as a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) or [File](https://developer.mozilla.org/en-US/docs/Web/API/File) object, after which they are automatically uploaded and converted into a URL.

```ts
const blob = new Blob(...);

snack.updateFiles({
  'assets/logo.png': {
    type: 'ASSET',
    contents: blob
  }
});

// Wait for the upload to complete
const { files } = await snack.getStateAsync();
console.log(files['assets/logo.png'].contents); // string -> "https://..."
```

## Using dependencies

When using Snack, various common dependencies are already included such as `react-native` and `expo`. Other dependencies need to be added before those packages can be used. It is advised to add all the dependencies that are used in the code. Snack will automatically ignore the dependency if it is already preloaded into the snack-runtime.

```ts
import { Snack } from 'snack-sdk';

// Create Snack
const snack = new Snack({
  dependencies: {
    'expo-linear-gradient': {
      version: '8.2.1'
    }
  },
  files: {
    'App.js': {
      type: 'CODE',
      contents: `
import * as React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

export default () => (
  <LinearGradient style={{flex: 1}} colors={['red', 'white', 'blue']} />
);
`
    }
  }
});
```

Similar to `updateFiles`, dependencies can be added or removed using the `updateDependencies` method.

```ts
snack.updateDependencies({
  'expo-haptics': { version: '8.2.1' }, // Add haptics
  'expo-linear-gradient': null // Remove linear gradient
});
```

When dependencies are added, Snack will resolve the semantic version on NPM and create a pre-bundled version of that package. In some cases this can take a while, for instance when a new version of a package has been released. You can wait for the resolving/bundling to complete using the `getStateAsync` method. Once a dependency has been resolved, you may store and re-use the `handle` so the package doesn't need to be resolved/bundled again.

```ts
const snack = new Snack({
  dependencies: {
    'expo-font': { version: '8.2.1' }
  }
});

// Wait for the dependencies to be resolved
const { dependencies } = await snack.getStateAsync();
console.log(`expo-font handle ${dependencies['expo-font'].handle}`); // string -> https://...

// Create a Snack with pre-resolved dependencies
const newSnack = new Snack({
  dependencies
});
```

## Changing the SDK version

A specific SDK version can be specified in the constructor or through the `setSDKVersion` method.

```ts
import { Snack } from 'snack-sdk';

const snack = new Snack({
  sdkVersion: '36.0.0' // Optional SDK version to use
});

// Upgrade to a newer sdk
snack.setSDKVersion('38.0.0');
```

> Note that when the SDK version is changed, the `url` is also changed and any connected clients need to reconnect to the new `url`.

## Getting the state

The current state of the Snack can be accessed through the `getState()` method. The state contains all the code, assets, dependencies, SDK version, etc; and can be used to access the contents of the Snack. The returned state is readonly and should **never** be changed externally.

```ts
const snack = new Snack({
  name: 'Wonderful orange',
  description: `It's a wonderful world`,
  sdkVersion: '37.0.0'
});

const { name, description, sdkVersion } = snack.getState();
console.log(name, description, sdkVersion);
```

When adding dependencies that need to be resolved, or asset files that need to be uploaded, you can wait for these kinds of operations to complete by using the `getStateAsync()` method. It waits for any pending operations to complete before returning the state.

```ts
// Add dependencies and assets for upload
snack.updateDependencies({
  'expo-contacts': { version: '9.0.0' }
});
snack.updateFiles({
  'assets/logo.png': {
    type: 'CODE',
    contents: new Blob(...)
  }
});

// Wait for the operations to complete
const { dependencies, files } = await snack.getStateAsync();
```

## Missing dependencies

When Snack detects that dependencies are missing, it reports these in the `missingDependencies` field of the state.
For instance, dependency `@react-navigation/stack` has peer-dependencies on `@react-navigation/native` and `react-native-screens`. When adding this dependency, `missingDependencies` will contain these missing peer dependencies as well as their "wanted" versions.

```ts
const snack = new Snack({
  '@react-navigation/stack': { version: '*' }
});
const state = await snack.getStateSsync();
console.log(state.missingDependencies);
/* {
  "@react-navigation/native": {
    dependents: ["@react-navigation/stack"],
    wantedVersion: 'x.x.x'
  },
  "react-native-screens": {
    dependents: ["@react-navigation/stack"],
    wantedVersion: 'x.x.x'
  },
  ...
} */
```

To fix missing dependencies, simply add them to the dependencies.

```ts
const { missingDependencies } = snack.getState();
const dependencies: SnackDependencies = {};
for (const name in snack.getState().missingDependencies) {
  dependencies[name] = {
    version: snack.getState().missingDependencies[name].wantedVersion
  };
}
snack.updateDependencies(dependencies);
```


# Going online, debounced updates and connected clients

## Going online

When a Snack is created, it is by default not online and clients are not able to connect. By setting the Snack to `online`, it advertises itself and Expo clients are able to connect. Use the `online` option in the constructor or the `setOnline` method to turn the online mode on or off.

```ts
const snack = new Snack({
  files: { ... }
  // online: true/false
});

snack.setOnline(true);

// console.log('URL' + snack.getState().url);
```

Once online, the `url` contains the unique address of the Snack and can be used to generate a QR code. This url stays the same for the lifetime of the Snack session, with exception of when the SDK version is changed. Changing the SDK version requires a different version of the snack-runtime to be loaded and will generate a different `url`.

## Sending code changes manually or debounced

By default, code changes are sent to the connected clients as quickly as possible. When editing code, this may however lead to a lot of communication and unwanted errors. When editing, it is therefore recommended to wait a short while (debounce) before sending the code changes; or to send them manually.

Set `codeChangesDelay` to a positive value to enable debounced code updates:

```ts
const snack = new Snack({
  online: true,
  files: { ... },
  codeChangesDelay: 1000 // milliseconds
});

snack.updateFiles({ ... });

// code changes are send after 1 second
```

Automatic code changes can also be turned off and triggered explicitely:

```ts
const snack = new Snack({
  online: true,
  files: { ... },
  codeChangesDelay: -1 // disable automatic code changes
});

// Updating files will not trigger any updates in the connected clients
snack.updateFiles({ ... });

// Send the code changes to the connected clients
snack.sendCodeChanges();
```

## DeviceId's and connected accounts

Instead of using the `url` and a QR-code, it is also possible to associate the Snack with a particular device-id or a user account. This will cause the Snack to automatically show up in the "Recently in Development" section of the Expo client.

To advertise the Snack on a specific device, use the `deviceId` field in the constructor or the `setDeviceId` method.

```ts
snack.setDeviceId('4321-1234');
```

Or set the account credentials to advertise it on all Expo clients using that account.

```ts
snack.setUser({ sessionSecret: '...' });
```

## Connected clients

Any clients that connect to the Snack will show up in the `connectedClients` field of the state.

```ts
snack.addStateListener((state, prevState) => {
  if (state.connectedClients !== prevState.connectedClients) {
    for (const key in state.connectedClients) {
      if (!prevState.connectedClients[key]) {
        console.log('A client has connected! ' + state.connectedClients[key].platform);
      }
    }
  }
});
```

## Requesting previews

When one or more clients are connected, the `getPreviewAsync` method can be used to request a visual preview of the Snack app.

```ts
const connectedClients = await snack.getPreviewAsync();

Object.values(connectedClients).forEach(client => {
  console.log(
    `Preview ${client.platform}, url: ${client.previewURL}, time: ${client.previewTimestamp}`
  );
});
```

# Saving the Snack

To save a Snack use the `saveAsync` method. It saves the Snack to the Expo servers and returns the Snack `id` and `url`.

```ts
const snack = new Snack({
  files: { ... },
  dependencies: { ... }
});

const { id, url } = await snack.saveAsync();
console.log(url); // "exp://exp.host/@jsghakdshgs"
```

To save the Snack to your user account, set the user in the constructor or using `setUser`.

```ts
const snack = new Snack({ user: { sessionSecret: '...' } });
snack.setUser({ sessionSecret: '...' });

// The snack will be automatically saved to the user account
await snack.saveAsync();

// To save an anonymously, specify the `ignoreUser` option
await snack.saveAsync({
  ignoreUser: true
});
```

To save a draft, use:

```ts
await snack.saveAsync({
  isDraft: true
});
```

## Downloading as a Zip file

Once a Snack has been saved, it can be downloaded as a Zip file. The `getDownloadURLAsync` method returns the URL through which the Snack can be downloaded. It also automatically save the Snack if it has any unsaved changes.

```ts
const url = snack.getDownloadURLAsync();
console.log('Download URL: ' + url); // https://exp.host/--/api/v2/snack/download/12345678
```

# Transports

The snack-sdk communicates with the Expo Runtime using Transports. When setting `online` to true, the default PubNub based transport is enabled and it is possible to connect to the Snack using the Expo Client. Additionally, a "web-preview" transport may be created, which communicates with the Snack web-player. The web-player is the Expo Runtime running on the web using [react-native-web](https://github.com/necolas/react-native-web).

## Previewing the Snack on Web

To use web-preview, create an iframe and pass it's `contentWindow` ref to the Snack. This creates a `webplayer` transport and `webPreviewURL` will be updated with the URL for the iframe. This URL may change, for instance when changing the SDK version, so make sure to update the iframe source.

> Web-preview is supported as of SDK 40. On older SDKs, `webPreviewURL` will always be `undefined`.

```jsx
import * as React from 'react';
import { Snack } from 'snack-sdk';

export default () => {
  const webPreviewRef = React.useRef(null);
  const [snack] = React.useState(() =>
    new Snack({
      ...
      webPreviewRef,
    })
  );
  const { webPreviewURL } = snack.getState();
  return (
    <div>
      ...
      <iframe
        ref={(c) => (webPreviewRef.current = c?.contentWindow ?? null)}
        src={webPreviewURL}
        allow="geolocation; camera; microphone"
      />
    </div>
  );
};
```

See the [Example App](/packages/snack-sdk/example) for a working demo.


# Example App

Head over to the [/packages/snack-sdk/example](../packages/snack-sdk/example) App for a live demo.

To run it, use:

```
yarn build
cd ./example
yarn
yarn start
```

# API Reference

[API Reference documentation](./snack-sdk-api/README.md)
