**[snack-sdk](../README.md)**

# Class: Snack

## Hierarchy

* **Snack**

## Index

### Constructors

* [constructor](snack.md#constructor)

### Methods

* [addLogListener](snack.md#addloglistener)
* [addStateListener](snack.md#addstatelistener)
* [getDownloadURLAsync](snack.md#getdownloadurlasync)
* [getPreviewAsync](snack.md#getpreviewasync)
* [getState](snack.md#getstate)
* [getStateAsync](snack.md#getstateasync)
* [reloadConnectedClients](snack.md#reloadconnectedclients)
* [saveAsync](snack.md#saveasync)
* [sendCodeChanges](snack.md#sendcodechanges)
* [setCodeChangesDelay](snack.md#setcodechangesdelay)
* [setDescription](snack.md#setdescription)
* [setDeviceId](snack.md#setdeviceid)
* [setDisabled](snack.md#setdisabled)
* [setFocus](snack.md#setfocus)
* [setName](snack.md#setname)
* [setOnline](snack.md#setonline)
* [setSDKVersion](snack.md#setsdkversion)
* [setUser](snack.md#setuser)
* [updateDependencies](snack.md#updatedependencies)
* [updateFiles](snack.md#updatefiles)
* [uploadAssetAsync](snack.md#uploadassetasync)

## Constructors

### constructor

\+ **new Snack**(`options`: [SnackOptions](../README.md#snackoptions)): [Snack](snack.md)

#### Parameters:

Name | Type |
------ | ------ |
`options` | [SnackOptions](../README.md#snackoptions) |

**Returns:** [Snack](snack.md)

## Methods

### addLogListener

▸ **addLogListener**(`listener`: [SnackLogListener](../README.md#snackloglistener)): [SnackListenerSubscription](../README.md#snacklistenersubscription)

Adds a callback for listening for any client generated log messages.

**`example`** 
```
const unsubscribe = Snack.addLogListener((log) => {
  console.log('log message received: ', log);
});

unsubscribe(); // Remove listener
```

#### Parameters:

Name | Type |
------ | ------ |
`listener` | [SnackLogListener](../README.md#snackloglistener) |

**Returns:** [SnackListenerSubscription](../README.md#snacklistenersubscription)

___

### addStateListener

▸ **addStateListener**(`listener`: [SnackStateListener](../README.md#snackstatelistener)): [SnackListenerSubscription](../README.md#snacklistenersubscription)

Adds a callback for listening for any state changes.

**`example`** 
```
const unsubscribe = Snack.addStateListener((state, prevState) => {
  if (state.name !== prevState.name) {
    console.log('name changed: ', state.name);
  }
});

Snack.setName('unforgiven orange'); // // Make a change to the state

unsubscribe(); // Remove listener
```

#### Parameters:

Name | Type |
------ | ------ |
`listener` | [SnackStateListener](../README.md#snackstatelistener) |

**Returns:** [SnackListenerSubscription](../README.md#snacklistenersubscription)

___

### getDownloadURLAsync

▸ **getDownloadURLAsync**(`saveOptions?`: [SnackSaveOptions](../README.md#snacksaveoptions)): Promise\<string>

Gets the URL at which the Snack can be downloaded as a zip file. Will automatically
save the Snack if it contains unsaved changes.

#### Parameters:

Name | Type |
------ | ------ |
`saveOptions?` | [SnackSaveOptions](../README.md#snacksaveoptions) |

**Returns:** Promise\<string>

___

### getPreviewAsync

▸ **getPreviewAsync**(): Promise\<[SnackConnectedClients](../README.md#snackconnectedclients)>

Requests a preview from the connected clients.

The previews are returned in the `previewURL` field of each connectedClient.

**Returns:** Promise\<[SnackConnectedClients](../README.md#snackconnectedclients)>

___

### getState

▸ **getState**(): [SnackState](../README.md#snackstate)

Returns the current state of the Snack. This includes files, dependencies
and other meta-data about the Snack.

**Returns:** [SnackState](../README.md#snackstate)

___

### getStateAsync

▸ **getStateAsync**(): Promise\<[SnackState](../README.md#snackstate)>

Waits for any pending operations such as running dependencies resolutions
before returning the state.

**Returns:** Promise\<[SnackState](../README.md#snackstate)>

___

### reloadConnectedClients

▸ **reloadConnectedClients**(): void

Reloads all connected clients.

Note: During the reload proces, clients may get disconnected which
causes the connectedClient to disappear and re-appear. The `reloadTimeout`
option in the constructor can be used to keep connectedClients "alive"
during the reload process.

**Returns:** void

___

### saveAsync

▸ **saveAsync**(`options?`: [SnackSaveOptions](../README.md#snacksaveoptions)): Promise\<{ hashId: undefined \| string ; id: string ; url: string = saveURL }>

Uploads the current code to Expo's servers and return a url that points to that version of the code.

#### Parameters:

Name | Type |
------ | ------ |
`options?` | [SnackSaveOptions](../README.md#snacksaveoptions) |

**Returns:** Promise\<{ hashId: undefined \| string ; id: string ; url: string = saveURL }>

___

### sendCodeChanges

▸ **sendCodeChanges**(): void

Sends any pending code changes to the connected clients.
No changes are send if all clients are already up to date.

**Returns:** void

___

### setCodeChangesDelay

▸ **setCodeChangesDelay**(`delay`: number): void

Sets the delay that is used before sending code updates to the connected clients.
Use this method to set the "debounce" timeout to use for sending code changes
over pubnub.

```
  -1 = Disable automatic sending of code changes (use `sendCodeChanges` to trigger the send)
   0 = Code changes are sent immediately to the connected clients
1..n = Code changes are debounced and sent after the wait time
```

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`delay` | number | Timeout in milliseconds (or -1 to disable automatic code updates)  |

**Returns:** void

___

### setDescription

▸ **setDescription**(`description`: string): void

Sets the description of the Snack.

#### Parameters:

Name | Type |
------ | ------ |
`description` | string |

**Returns:** void

___

### setDeviceId

▸ **setDeviceId**(`deviceId?`: undefined \| string): void

Sets the device-id of an Expo client. When set and `online` is true, causes this
Snack to appear on the "Recently in Development" section of that Expo client.

#### Parameters:

Name | Type |
------ | ------ |
`deviceId?` | undefined \| string |

**Returns:** void

___

### setDisabled

▸ **setDisabled**(`disabled`: boolean): void

Enables or disables the Snack.

When disabled, no uploads or dependency resolve operations
are performed.

#### Parameters:

Name | Type |
------ | ------ |
`disabled` | boolean |

**Returns:** void

___

### setFocus

▸ **setFocus**(): void

Sets the focus to this Snack.

Causes this Snack to be moved to the top of the "Recently in Development" list
in the Expo client.

**Returns:** void

___

### setName

▸ **setName**(`name`: string): void

Sets the name of the Snack.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`name` | string | E.g. "conspicious orange"  |

**Returns:** void

___

### setOnline

▸ **setOnline**(`enabled`: boolean): void

Makes the Snack available online.

When online, a pubnub channel is created to which clients can
connect.

#### Parameters:

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** void

___

### setSDKVersion

▸ **setSDKVersion**(`sdkVersion`: [SDKVersion](../README.md#sdkversion)): void

Sets the Expo SDK version.

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`sdkVersion` | [SDKVersion](../README.md#sdkversion) | Valid SDK version (e.g. "38.0.0")  |

**Returns:** void

___

### setUser

▸ **setUser**(`user?`: [SnackUser](../README.md#snackuser)): void

Sets the associated user account.

When set and `online` is true, causes this Snack to appear on the
"Recently in Development" section of all Expo clients that are signed
in with that account.

#### Parameters:

Name | Type |
------ | ------ |
`user?` | [SnackUser](../README.md#snackuser) |

**Returns:** void

___

### updateDependencies

▸ **updateDependencies**(`dependencies`: { [name:string]: [SnackDependency](../README.md#snackdependency) \| null;  }): void

Updates dependencies.

Use this method to add/remove/update dependencies.
To remove a dependency specify `null` as the value of the key/value pair.

**`example`** 
```ts
const Snack = new Snack({
  dependencies: {
    'react-native-paper': '~2.0.0'
  }
});

// Add dependency
Snack.updateDependencies({
  'expo-font': '9.0.0'
});

// Remove dependency
Snack.updateDependencies({
  'expo-font': null
});
```

#### Parameters:

Name | Type |
------ | ------ |
`dependencies` | { [name:string]: [SnackDependency](../README.md#snackdependency) \| null;  } |

**Returns:** void

___

### updateFiles

▸ **updateFiles**(`files`: { [path:string]: [SnackFile](../README.md#snackfile) \| null;  }): void

Updates code or asset files.

Use this method to add/remove/update files and upload assets.
To remove a file specify `null` as the value of the file.

**`example`** 
```ts
const Snack = new Snack({
  files: {
    'App.js': { type: 'CODE', contents: 'console.log("hello world!");' },
    'data.json': { type: 'CODE', contents: '{}' },
  }
});

// Add or update files
Snack.updateFiles({
  'App.js': {
    type: 'CODE',
    contents: 'console.log("Hello Snack!");'
  }
});

// Upload an asset
Snack.updateFiles({
  'assets/logo.png': {
    type: 'ASSET',
    contents: file // File, Blob or FormData
  }
});

// Add a pre-uploaded asset
Snack.updateFiles({
  'assets/expo.jpg': {
    type: 'ASSET',
    contents: 'https://mysite/expo.jpg'
  }
});

// Remove files
Snack.updateFiles({
  'data.json': null,
  'assets/expo.jpg': null
});
```

#### Parameters:

Name | Type |
------ | ------ |
`files` | { [path:string]: [SnackFile](../README.md#snackfile) \| null;  } |

**Returns:** void

___

### uploadAssetAsync

▸ **uploadAssetAsync**(`contents`: File \| Blob \| FormData): Promise\<string>

Helper function that uploads an asset and returns its url.

#### Parameters:

Name | Type |
------ | ------ |
`contents` | File \| Blob \| FormData |

**Returns:** Promise\<string>
