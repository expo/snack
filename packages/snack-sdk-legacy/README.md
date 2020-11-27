# snack-sdk-legacy (v2)

This package contains the code and documentation for the legacy snack-sdk v2.

## DEPRECATED This package has been superceded by [packages/snack-sdk (v3)](../snack-sdk).

Users of `snack-sdk@2` are required to upgrade to `snack-sdk@3` by **MID 2021**. After that `snack-sdk@2` will no longer be updated and no new Expo SDK versions will be supported. The V3 package has new cleaner API and upgrading can be done using the [Migration Guide](../../docs/snack-sdk-migration.md).

## Documentation

- [API](API.md)

## User Guide

### Creating a new session
```javascript
import { SnackSession } from 'snack-sdk';

let session = new SnackSession({
  files?: ExpoSnackFiles,
  sdkVersion?: SDKVersion,
  sessionId?: string,
  verbose?: boolean,
});

await session.startAsync();
```

`files` is a map of all of the files included in the project.  The filenames should be the full path from the project root.

`sdkVersion` determines what version of React Native is used on the mobile client. Defaults to `15.0.0` which maps to React Native 0.42.0. If you specify a different version, make sure to save that version along with the code. Code from one SDK version is not guaranteed to work on others. To use multiple files, you must use SDK 21 or above.

`sessionId` can be specified if you want a consistent url. This is a global namespace so make sure to use a UUID or scope it somehow if you use this.

### Connecting to your user's phone

#### Getting the URL for the mobile client
```javascript
let url = await session.getUrlAsync();
```
This url will open the current Snack Session in the Expo client when opened on a phone. You can create a QR code from this link or send it to the phone in another way. See `example/` for how to turn this into a QR code.


#### Recently in Development
The Expo App includes an ID displayed at the bottom of the Projects tab.  Once this ID has been reported to the session, your project will appear in the "Recently in Development" section on the Projects tab for as long as the session remains active.

Example:
```javascript
session.setDeviceId('XXXX-XXXX')
```

### Updating the code
```javascript
const files = {
	'App.js': { contents: 'code here, this is entry point', type: 'CODE'},
	'folder/file.js': { contents: 'this file is in /folder', type: 'CODE'},
	'image.png': { content: 'remote location of asset', type: 'ASSET'},
}
await session.sendCodeAsync(files: Object);
```

This will push the new code to each connected mobile client. Any new clients that connect will also get the new code.

For SDK 21 and above, you can have multiple files in a Snack. This includes support for folders and relative path imports. See the example above on sending data. The entry point for running a Snack is `app.js`, which is required to be included in any project provided to the SnackSession constructor or sendCodeAsync calls.

You'll also be able to send Assets (images, fonts, etc.). To do this include the asset in the files object, with key being file name and value being the remote location where this asset is stored.

### Uploading assets
```javascript
const remoteAddressOfAssetFile = await session.uploadAssetAsync(file);
```
where file is a Javascript `File` object.

### Dependencies

When using Exp SDK 25 and above, you'll be able to specify arbitrary NPM modules to use with your app.

Example:
```
await session.addDependencies({"lodash": "4.17.10"}); // add a specific version
await session.addDependencies({"lodash": "*"});       // or resolve to the most recent
```

To detect all dependencies needed to evaluate a file,

Example:
```
import { dependencyUtils } from 'snack-sdk';

let dependencies = Object.keys(dependencyUtils.findModuleDependencies('import lodash from "lodash";'));
// ['lodash']
```

#### Differences between dependencies in Snack and npm

When developing a project on your local file system, you are probably used to:
- Adding the dependency you want to you package.json
- Running `npm install` which will copy the published package to your local filesystem
- Importing or requiring any files included with that package into your project
- Trusting your bundler to remove any unneeded code before publishing your project
- Evaluating the project, along with any code from referenced dependencies, on a device

which means that once we add lodash to our dependencies these are the same
`import zip from 'lodash/zip';` 
`import { zip } from 'lodash';`

With Snack, we have prioritized taking an arbitrary dependency and have it available in the running experience as quickly as possible. To achieve that, only the parts of the package that are exported in the module's main entry point are available.  Tthe process looks like:
- Adding the dependency to snack's : `session.addDependency({'my-package': 'version'})`
- Bundling and minimizing the dependency
- Evaluating the project code, along side any referenced dependencies

which means that 
`import zip from 'lodash/zip';` 
is not available once you import `lodash` You will need to import 'lodash/zip' to a new package, which will give you a package identical to `lodash-zip`


### Saving the code to Expo's servers
```javascript
let saveResult = await session.saveAsync();

console.log(saveResult);
// This will print: `{"id":"abc123","url":"https://expo.io/@snack/abc123"}`
```
This will upload the current code to Expo's servers and return a url that points to that version of the code.


### Downloading Code

```javascript
const downloadURL = await session.downloadAsync();

console.log(downloadURL);
// This will print: { url: "https://exp.host/--/api/v2/snack/download/snackIDHere" }
```

This will return a link to our server with a `.zip` of your Snack project. You'll be able to run this exported project using `exp` or XDE.

### Listening for events
Here are the Flow types for the error, log, and presence listeners:
```javascript
type SnackSession = {
  addErrorListener: (listener: ExpoErrorListener) => ExpoSubscription,
  addLogListener: (listener: ExpoLogListener) => ExpoSubscription,
  addPresenceListener: (listener: ExpoPresenceListener) => ExpoSubscription,
};

type ExpoSubscription = {
  remove: () => void,
};

// Called with empty array if errors have been resolved
type ExpoErrorListener = (errors: Array<ExpoError>) => void;

type ExpoLogListener = (log: ExpoDeviceLog) => void;

type ExpoPresenceListener = (event: ExpoPresenceEvent) => void;

type ExpoError = {
  device?: ExpoDevice,
  startLine?: number,
  endLine?: number,
  startColumn?: number,
  endColumn?: number,
  message: string,
  stack?: string,
};

// `console.log`, `console.warn`, `console.error`
type ExpoDeviceLog = {
  device: ExpoDevice,
  method: 'log' | 'warn' | 'error',
  message: string,
  arguments: any, // the raw fields that were passed to the console.* call
};

type ExpoDevice = {
  name: string,
  id: string,
};

type ExpoPresenceStatus = 'join' | 'leave';

type ExpoPresenceEvent = {
  device: ExpoDevice,
  status: ExpoPresenceStatus,
};
```

Each of these listeners is optional. Here's an example of using a log listener:
```javascript
let logSubscription = session.addLogListener((log) => {
  console.log(JSON.stringify(log));

  // This will print: `{"device":{"id":"b9384faf-504f-4c41-a7ab-6344f0102456","name":"SM-G930U"},"method":"log","message":"hello!","arguments":["hello!"]}`
  // on the web if `console.log('hello!')` is run from the code on the phone.
});

// later on...
logSubscription.remove();
// future `console.log`s on the phone will not trigger the listener
```

An error listener:
```javascript
let errorSubscription = session.addErrorListener((error) => {
  console.log(JSON.stringify(error));

  // This will print:
  // `[]`
  // when there is no error and
  // `[{"message":"unknown: Unexpected token (7:7)...","endLine":7,"startLine":7,"endColumn":7,"startColumn":7}]`
  // when there is an error. The `message` field is truncated in this document.
});

// later on...
errorSubscription.remove();
```

A presence listener:
```javascript
let presenceSubscription = session.addPresenceListener((presence) => {
  console.log(JSON.stringify(presence));

  // This will print:
  // `{"device":{"id":"b9384faf-504f-4c41-a7ab-6344f0102456","name":"SM-G930U"},"status":"join"}`
  // when a device is connected and
  // `{"device":{"id":"b9384faf-504f-4c41-a7ab-6344f0102456","name":"SM-G930U"},"status":"leave"}`
  // when a device disconnects.
});

// later on...
presenceSubscription.remove();
```

Please read the Flow types above for all possible fields returned in these listeners.

### Stopping the session
```javascript
await session.stopAsync();
```
This will shut down the PubNub connection.
