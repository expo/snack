# Migration Guide

This guide helps with migration from snack-sdk@2 to snack-sdk@3.

Conceptually, v3 is similar to v2 and exposes a Snack Session class which can be used to create Snacks, save them and connect to them using the Expo client.
The API and types have however been overhauled to provide a leaner and more consistent API. V3 also supports first class TypeScript support, but the flow typings have been removed.

## Imports

Before (using flow)

```js
import { SnackSession } from 'snack-sdk'; // 2.x.x
import type { ExpoSnackFiles } from 'snack-sdk'; // 2.x.x

const files: ExpoSnackFiles = {
  'App.js': {
    type: 'CODE',
    contents: `console.log('Hello Snack!');`,
  },
};
const session = new SnackSession({
  ...
});
session.sendCodeAsync(files);
```

After (using TypeScript)

```tsx
import { Snack, SnackFiles } from 'snack-sdk'; // 3.x.x

const files: SnackFiles = {
  'App.js': {
    type: 'CODE',
    contents: `console.log('Hello Snack!');`,
  },
};
const snack = new Snack({
  files,
});
```

## Snack class comparison

| Version 2                              | Version 3                | Description                                                                                                                                                                                                                                                            |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `startAsync`                           |                          | Method was removed, use `setOnline(true)` instead.                                                                                                                                                                                                                     |
| `stopAsync`                            |                          | Method was removed, use `setOnline(false)` instead.                                                                                                                                                                                                                    |
| `setPubNubEnabled`                     |                          | Method was removed, use `setOnline` instead.                                                                                                                                                                                                                           |  |
| `getUrlAsync`                          |                          | Method has been removed, use `getState().url` instead.                                                                                                                                                                                                           |
| `getChannel`                           |                          | Method was removed, use `getState().channel` instead.                                                                                                                                                                                                                  |
|                                        | `setOnline`              | `startAsync` and `setPubNubEnabled` were tightly coupled and could result in invalid behavior when used incorrectly. These APIs have been merged into the `setOnline` method which starts both the PubNub transport and the DevSession advertisement as the same time. |
| `sendCodeAsync`                        |                          | Method was removed, use `updateFiles` instead.                                                                                                                                                                                                                         |
|                                        | `updateFiles`            | Updates the code/asset files after which they are automatically sent to the connected clients whenever ready. This method replaces `sendCodeAsync`.                                                                                                                    |
| `addModuleAsync`                       |                          | Method was removed, use `updateDependencies` instead.                                                                                                                                                                                                                  |
| `removeModuleAsync`                    |                          | Method was removed, use `updateDependencies` instead.                                                                                                                                                                                                                  |
| `syncDependenciesAsync`                |                          | Method was removed, use `updateDependencies` instead.                                                                                                                                                                                                                  |
|                                        | `updateDependencies`     | Updates the dependencies and starts the resolving process if needed. This method replaces `addModuleAsync`, `removeModuleAsync` and `syncDependenciesAsync`.                                                                                                           |
| `reloadSnack`                          | `reloadConnectedClients` | Method was renamed to `reloadConnectedClients`. In contrast to `reloadSnack`, `reloadConnectedClients` waits for all clients to be reloaded before resolving the returned Promise.                                                                                     |
| `setSdkVersion`                        | `setSDKVersion`          | Method was renamed to `setSDKVersion`.                                                                                                                                                                                                                                 |
| `setFocus(true/false)`                 | `setFocus()`             | Method signature has changed and the boolean argument was removed. It is now only possible to indicate that the Snack has received the focus.                                                                                                                          |
| `saveAsync`                            | `saveAsync`              | No changes.                                                                                                                                                                                                                                                            |
| `downloadAsync`                        | `getDownloadURLAsync`    | Method was renamed to `getDownloadURLAsync` and allows options for `saveAsync` to be passed to it.                                                                                                                                                                     |
| `uploadAssetAsync`                     | `uploadAssetAsync`       | No changes.                                                                                                                                                                                                                                                            |
| `setName`                              | `setName`                | No changes.                                                                                                                                                                                                                                                            |
| `setDescription`                       | `setDescription`         | No changes.                                                                                                                                                                                                                                                            |
| `setDeviceId`                          | `setDeviceId`            | No changes.                                                                                                                                                                                                                                                            |
| `setUser`                              | `setUser`                | No changes.                                                                                                                                                                                                                                                            |
| `setSessionSecret` _(deprecated)_      |                          | Method was removed, use `setUser` instead.                                                                                                                                                                                                                             |
| `setAuthorizationToken` _(deprecated)_ |                          | Method was removed, use `setUser` instead.                                                                                                                                                                                                                             |
| `getState`                             | `getState`               | Returns the new `SnackState` object.                                                                                                                                                                                                                                   |
|                                        | `getStateAsync`          | Waits for any async operations such as asset uploads and dependency resolvers to complete before returning the state.                                                                                                                                                  |
| `addStateListener`                     | `addStateListener`       | Method signature was changed.                                                                                                                                                                                                                                          |
| `addLogListener`                       | `addLogListener`         | Method signature was changed.                                                                                                                                                                                                                                          |
| `addErrorListener`                     |                          | Method was removed, use `addStateListener` instead and compare whether the errors have changed.                                                                                                                                                                        |
| `addPresenceListener`                  |                          | Method was removed, use `addStateListener` instead and compare the `connectedClients` field.                                                                                                                                                                           |
| `supportsFeature`                      |                          | Method was removed.                                                                                                                                                                                                                                                    |
|                                        | `getPreviewAsync`        | New method that requests a preview from the connected devices and returns an image URL.                                                                                                                                                                                |
|                                        | `setCodeChangesDelay`    | New method that sets the wait time before notifying the connected clients of any code updates.                                                                                                                                                                         |
|                                        | `sendCodeChanges`        | New method that triggers an immediate send of any pending code changes to the connected clients.                                                                                                                                                                       |
|                                        | `setDisabled`            | New method that disables the Snack entirely, effectively disabling any asynchronous asset uploads and dependency resolutions.                                                                                                                                          |

## Globals comparison

| Version 2             | Version 3                   | Description                                          |
| --------------------- | --------------------------- | ---------------------------------------------------- |
| `SDKVersions`         | `getSupportedSDKVersions`   | Updated to method called `getSupportedSDKVersions`.  |
| `preloadedModules`    | `getPreloadedModules`       | Updated to method called `getPreloadedModules`.      |
| `dependencyUtils`     |                             | Field has been removed                               |
| `supportedModules`    |                             | Field has been removed.                              |
| `isModulePreloaded`   | `isModulePreloaded`         | No changes.                                          |
| `getSupportedVersion` | `getPreloadedModuleVersion` | Renamed to `getPreloadedModuleVersion`.              |
|                       | `isValidSemver`             | Checks whether a string is a valid semantic version. |

## Types

Nearly all type names have changed. Most notably, the `Expo` prefix has been removed from the types and all types now start with `Snack`.

The formats for the files and dependencies has remained the same compared to v2. The V1 compact files format has however been dropped and all files should be explicitely listed in the `SnackFiles` collection.
