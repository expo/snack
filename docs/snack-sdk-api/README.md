**[snack-sdk](README.md)**

# snack-sdk

## Index

### Classes

* [Snack](classes/snack.md)

### Interfaces

* [SnackError](interfaces/snackerror.md)

### Type aliases

* [SDKFeature](README.md#sdkfeature)
* [SDKVersion](README.md#sdkversion)
* [SnackAssetFile](README.md#snackassetfile)
* [SnackCodeFile](README.md#snackcodefile)
* [SnackConnectedClient](README.md#snackconnectedclient)
* [SnackConnectedClientStatus](README.md#snackconnectedclientstatus)
* [SnackConnectedClients](README.md#snackconnectedclients)
* [SnackDependencies](README.md#snackdependencies)
* [SnackDependency](README.md#snackdependency)
* [SnackDependencyVersions](README.md#snackdependencyversions)
* [SnackFile](README.md#snackfile)
* [SnackFiles](README.md#snackfiles)
* [SnackListenerSubscription](README.md#snacklistenersubscription)
* [SnackLogEvent](README.md#snacklogevent)
* [SnackLogListener](README.md#snackloglistener)
* [SnackMissingDependencies](README.md#snackmissingdependencies)
* [SnackMissingDependency](README.md#snackmissingdependency)
* [SnackOptions](README.md#snackoptions)
* [SnackSaveOptions](README.md#snacksaveoptions)
* [SnackSendBeaconRequest](README.md#snacksendbeaconrequest)
* [SnackState](README.md#snackstate)
* [SnackStateListener](README.md#snackstatelistener)
* [SnackUser](README.md#snackuser)
* [SnackWindowRef](README.md#snackwindowref)

### Functions

* [getPreloadedModules](README.md#getpreloadedmodules)
* [getSupportedSDKVersions](README.md#getsupportedsdkversions)
* [isFeatureSupported](README.md#isfeaturesupported)
* [isModulePreloaded](README.md#ismodulepreloaded)
* [isValidSemver](README.md#isvalidsemver)
* [standardizeDependencies](README.md#standardizedependencies)
* [validateSDKVersion](README.md#validatesdkversion)

## Type aliases

### SDKFeature

Ƭ  **SDKFeature**: \"MULTIPLE\_FILES\" \| \"PROJECT\_DEPENDENCIES\" \| \"TYPESCRIPT\" \| \"UNIMODULE\_IMPORTS\" \| \"POSTMESSAGE\_TRANSPORT\" \| \"VERSIONED\_SNACKAGER\"

Feature that is supported by the SDK (e.g. "TYPESCRIPT").

___

### SDKVersion

Ƭ  **SDKVersion**: \"37.0.0\" \| \"38.0.0\" \| \"39.0.0\" \| \"40.0.0\"

Version of the sdk to use (e.g. "37.0.0").

___

### SnackAssetFile

Ƭ  **SnackAssetFile**: { contents: string \| File \| Blob \| FormData ; error?: [Error](interfaces/snackerror.md#error) ; type: \"ASSET\"  }

An asset file that refers to externaly available
content such as an image or font.

When resolved, the `contents` field is an URL to the
uploaded asset. A File, Blob or FormData object may
also be provided after which it is automatically uploaded
and converted into an URL.

#### Type declaration:

Name | Type |
------ | ------ |
`contents` | string \| File \| Blob \| FormData |
`error?` | [Error](interfaces/snackerror.md#error) |
`type` | \"ASSET\" |

___

### SnackCodeFile

Ƭ  **SnackCodeFile**: { contents: string ; error?: [Error](interfaces/snackerror.md#error) ; type: \"CODE\"  }

A non asset file that is included with the project.
This can be either a code file (.js/.tsx) or a support
file such as a markdown or json file.

#### Type declaration:

Name | Type |
------ | ------ |
`contents` | string |
`error?` | [Error](interfaces/snackerror.md#error) |
`type` | \"CODE\" |

___

### SnackConnectedClient

Ƭ  **SnackConnectedClient**: { error?: [SnackError](interfaces/snackerror.md) ; id: string ; name: string ; platform: string ; previewTimestamp?: undefined \| number ; previewURL?: undefined \| string ; status: [SnackConnectedClientStatus](README.md#snackconnectedclientstatus) ; transport: string  }

Client which connected to the Snack.

Clients are only able to connect when the Snack is `online`.

#### Type declaration:

Name | Type |
------ | ------ |
`error?` | [SnackError](interfaces/snackerror.md) |
`id` | string |
`name` | string |
`platform` | string |
`previewTimestamp?` | undefined \| number |
`previewURL?` | undefined \| string |
`status` | [SnackConnectedClientStatus](README.md#snackconnectedclientstatus) |
`transport` | string |

___

### SnackConnectedClientStatus

Ƭ  **SnackConnectedClientStatus**: \"ok\" \| \"error\" \| \"reloading\"

___

### SnackConnectedClients

Ƭ  **SnackConnectedClients**: { [key:string]: [SnackConnectedClient](README.md#snackconnectedclient);  }

Collection of connected clients.

___

### SnackDependencies

Ƭ  **SnackDependencies**: { [name:string]: [SnackDependency](README.md#snackdependency);  }

Dictionary of dependency names and their (resolved) versions.

___

### SnackDependency

Ƭ  **SnackDependency**: { error?: [Error](interfaces/snackerror.md#error) ; handle?: undefined \| string ; peerDependencies?: [SnackDependencyVersions](README.md#snackdependencyversions) ; version: string ; wantedVersion?: undefined \| string  }

The version, resolved handle, peer-dependencies and optional
error of a dependency.

#### Type declaration:

Name | Type |
------ | ------ |
`error?` | [Error](interfaces/snackerror.md#error) |
`handle?` | undefined \| string |
`peerDependencies?` | [SnackDependencyVersions](README.md#snackdependencyversions) |
`version` | string |
`wantedVersion?` | undefined \| string |

___

### SnackDependencyVersions

Ƭ  **SnackDependencyVersions**: { [name:string]: string;  }

Dictionary of dependencies and their version.

___

### SnackFile

Ƭ  **SnackFile**: [SnackCodeFile](README.md#snackcodefile) \| [SnackAssetFile](README.md#snackassetfile)

The content of a Snack code or asset file.

___

### SnackFiles

Ƭ  **SnackFiles**: { [path:string]: [SnackFile](README.md#snackfile);  }

Dictionary of file-names and their content that make up
the files of the Snack.

___

### SnackListenerSubscription

Ƭ  **SnackListenerSubscription**: () => any

___

### SnackLogEvent

Ƭ  **SnackLogEvent**: { connectedClient?: [SnackConnectedClient](README.md#snackconnectedclient) ; error?: [SnackError](interfaces/snackerror.md) ; message: string ; type: \"error\" \| \"warn\" \| \"log\" \| \"info\"  }

Log data for when a connected client calls one of the
`console.[log,info,warn,error]` to log information to the
console.

#### Type declaration:

Name | Type |
------ | ------ |
`connectedClient?` | [SnackConnectedClient](README.md#snackconnectedclient) |
`error?` | [SnackError](interfaces/snackerror.md) |
`message` | string |
`type` | \"error\" \| \"warn\" \| \"log\" \| \"info\" |

___

### SnackLogListener

Ƭ  **SnackLogListener**: (log: [SnackLogEvent](README.md#snacklogevent)) => any

___

### SnackMissingDependencies

Ƭ  **SnackMissingDependencies**: { [name:string]: [SnackMissingDependency](README.md#snackmissingdependency);  }

Dictionary of dependencies that are missing.

___

### SnackMissingDependency

Ƭ  **SnackMissingDependency**: { dependents: string[] ; wantedVersion?: undefined \| string  }

Wanted version of the dependency that is missing, including the
dependents which have this dependency as a peer-dependency.

#### Type declaration:

Name | Type |
------ | ------ |
`dependents` | string[] |
`wantedVersion?` | undefined \| string |

___

### SnackOptions

Ƭ  **SnackOptions**: { accountSnackId?: undefined \| string ; apiURL?: undefined \| string ; channel?: undefined \| string ; codeChangesDelay?: undefined \| number ; createTransport?: undefined \| (options: SnackTransportOptions) => SnackTransport ; dependencies?: [SnackDependencies](README.md#snackdependencies) ; description?: undefined \| string ; deviceId?: undefined \| string ; disabled?: undefined \| false \| true ; files?: [SnackFiles](README.md#snackfiles) ; host?: undefined \| string ; id?: undefined \| string ; name?: undefined \| string ; online?: undefined \| false \| true ; previewTimeout?: undefined \| number ; reloadTimeout?: undefined \| number ; sdkVersion?: [SDKVersion](README.md#sdkversion) ; snackagerURL?: undefined \| string ; snackId?: undefined \| string ; transports?: undefined \| { [id:string]: SnackTransport;  } ; user?: [SnackUser](README.md#snackuser) ; verbose?: undefined \| false \| true ; webPlayerURL?: undefined \| string ; webPreviewRef?: [SnackWindowRef](README.md#snackwindowref)  }

#### Type declaration:

Name | Type |
------ | ------ |
`accountSnackId?` | undefined \| string |
`apiURL?` | undefined \| string |
`channel?` | undefined \| string |
`codeChangesDelay?` | undefined \| number |
`createTransport?` | undefined \| (options: SnackTransportOptions) => SnackTransport |
`dependencies?` | [SnackDependencies](README.md#snackdependencies) |
`description?` | undefined \| string |
`deviceId?` | undefined \| string |
`disabled?` | undefined \| false \| true |
`files?` | [SnackFiles](README.md#snackfiles) |
`host?` | undefined \| string |
`id?` | undefined \| string |
`name?` | undefined \| string |
`online?` | undefined \| false \| true |
`previewTimeout?` | undefined \| number |
`reloadTimeout?` | undefined \| number |
`sdkVersion?` | [SDKVersion](README.md#sdkversion) |
`snackagerURL?` | undefined \| string |
`snackId?` | undefined \| string |
`transports?` | undefined \| { [id:string]: SnackTransport;  } |
`user?` | [SnackUser](README.md#snackuser) |
`verbose?` | undefined \| false \| true |
`webPlayerURL?` | undefined \| string |
`webPreviewRef?` | [SnackWindowRef](README.md#snackwindowref) |

___

### SnackSaveOptions

Ƭ  **SnackSaveOptions**: { ignoreUser?: undefined \| false \| true ; isDraft?: undefined \| false \| true  }

#### Type declaration:

Name | Type |
------ | ------ |
`ignoreUser?` | undefined \| false \| true |
`isDraft?` | undefined \| false \| true |

___

### SnackSendBeaconRequest

Ƭ  **SnackSendBeaconRequest**: { data: any ; url: string  }

Request data to be used with the `sendBeacon` API.

#### Type declaration:

Name | Type |
------ | ------ |
`data` | any |
`url` | string |

___

### SnackState

Ƭ  **SnackState**: { accountSnackId: undefined \|string ; channel: string ; connectedClients: [SnackConnectedClients](README.md#snackconnectedclients) ; dependencies: [SnackDependencies](README.md#snackdependencies) ; description: string ; deviceId?: undefined \| string ; disabled: boolean ; files: [SnackFiles](README.md#snackfiles) ; id?: undefined \| string ; missingDependencies: [SnackMissingDependencies](README.md#snackmissingdependencies) ; name: string ; online: boolean ; onlineName?: undefined \| string ; saveURL?: undefined \| string ; savedSDKVersion?: undefined \| string ; sdkVersion: [SDKVersion](README.md#sdkversion) ; sendBeaconCloseRequest?: [SnackSendBeaconRequest](README.md#snacksendbeaconrequest) ; snackId: undefined \|string ; unsaved: boolean ; url: string ; user?: [SnackUser](README.md#snackuser) ; wantedDependencyVersions?: [SnackDependencyVersions](README.md#snackdependencyversions) ; webPreviewURL?: undefined \| string  }

#### Type declaration:

Name | Type | Description |
------ | ------ | ------ |
`accountSnackId` | undefined \| string | Id of the saved Snack if it belongs to an account.
`channel` | string | Communication channel ("snackpub") through which live updates are transferred. The communication channel is only used when the Snack is "online". |
`connectedClients` | [SnackConnectedClients](README.md#snackconnectedclients) | Clients that are currently connected. |
`dependencies` | [SnackDependencies](README.md#snackdependencies) | Packages that can be used in the code files. Packages that are pre-loaded by the sdk may be ommited, but it is recommended to add them anyway. |
`description` | string | Additional description of the Snack. The description is used when saving the Snack and may also be used for searching purposes. |
`deviceId?` | undefined \| string | Device-id of the Expo client. When set causes the Snack to be visible in the "Recently in Development" section of the Expo client with that device-id. The device-id is only used when the Snack is "online". |
`disabled` | boolean | Disabled state. When the Snack is disabled it will not resolve any dependencies or upload any asset files. It also disables the ability to go online. |
`files` | [SnackFiles](README.md#snackfiles) | Files that make up the content (code & assets) of the Snack. There should always be a file called "App.js" or "App.tsx" as the main entry point. |
`id?` | undefined \| string | Full name of the saved Snack. |
`missingDependencies` | [SnackMissingDependencies](README.md#snackmissingdependencies) | Collection of dependencies that are missing but are required by one or more of the dependencies. |
`name` | string | Optional name. The name is used when saving or downloading the Snack; and is used for the onlineName property. |
`online` | boolean | When online is true, Expo clients can connect to the Snack and receive live updates when code or dependencies are changed. It also makes the Snack visible in the "Recently in Development" section of the Expo client. |
`onlineName?` | undefined \| string | Name of the Snack as shown in the "Recently in Development" section in the Expo client. The online-name will be empty when the Snack is not "online". |
`saveURL?` | undefined \| string | URL of the saved Snack. The URL is empty when no save "id" is available. |
`savedSDKVersion?` | undefined \| string | Last saved (non-draft) Expo SDK version. |
`sdkVersion` | [SDKVersion](README.md#sdkversion) | Expo SDK version. |
`sendBeaconCloseRequest?` | [SnackSendBeaconRequest](README.md#snacksendbeaconrequest) | A close request that should be send using the browser `sendBeacon` API whenever the browser session is unloaded. This gives the Snack a last opportunity to gracefully close its connections so that the "Recently in Development" section in the Expo client no longer shows the Snack. |
`snackId` | undefined \| string | Id of this version of the saved Snack.
`unsaved` | boolean | Unsaved status of the Snack. Becomes `true` when the Snack code is changed and `false` whenever the Snack is saved. |
`url` | string | Unique experience url which can be used to open the Expo client and connect to the Snack (e.g. "exp://exp.host/@snack/sdk.38.0.0-78173941"). |
`user?` | [SnackUser](README.md#snackuser) |  |
`wantedDependencyVersions?` | [SnackDependencyVersions](README.md#snackdependencyversions) | Collection of packages and versions that are compatible with the selected SDK version. This is similar to using `expo install`, which ensures the latest compatible version is installed. |
`webPreviewURL?` | undefined \| string | URL to use to when loading the web-preview in an iframe.  Web-preview is supported from SDK 40 and higher. To enable it, set the `webPreviewRef` to the contentWindow of the iframe.  |

___

### SnackStateListener

Ƭ  **SnackStateListener**: (state: [SnackState](README.md#snackstate), prevState: [SnackState](README.md#snackstate)) => any

___

### SnackUser

Ƭ  **SnackUser**: { sessionSecret?: undefined \| string  }

User that is used for communicating with the Expo servers.

#### Type declaration:

Name | Type |
------ | ------ |
`sessionSecret?` | undefined \| string |

___

### SnackWindowRef

Ƭ  **SnackWindowRef**: { current: Window \| null  }

#### Type declaration:

Name | Type |
------ | ------ |
`current` | Window \| null |

## Functions

### getPreloadedModules

▸ **getPreloadedModules**(`sdkVersion`: [SDKVersion](README.md#sdkversion), `coreModulesOnly?`: undefined \| false \| true): object

Returns the list of pre-loaded modules for the given SDK version.

#### Parameters:

Name | Type |
------ | ------ |
`sdkVersion` | [SDKVersion](README.md#sdkversion) |
`coreModulesOnly?` | undefined \| false \| true |

**Returns:** object

___

### getSupportedSDKVersions

▸ **getSupportedSDKVersions**(): [SDKVersion](README.md#sdkversion)[]

Returns the list of supported SDK versions.

**Returns:** [SDKVersion](README.md#sdkversion)[]

___

### isFeatureSupported

▸ **isFeatureSupported**(`feature`: [SDKFeature](README.md#sdkfeature), `sdkVersion`: string): boolean

Checks whether a feature is supported by the given SDK version.

#### Parameters:

Name | Type |
------ | ------ |
`feature` | [SDKFeature](README.md#sdkfeature) |
`sdkVersion` | string |

**Returns:** boolean

___

### isModulePreloaded

▸ **isModulePreloaded**(`name`: string, `sdkVersion`: [SDKVersion](README.md#sdkversion), `coreModulesOnly?`: undefined \| false \| true): boolean

Checks whether a specific module/dependency is preloaded for the given SDK version.

#### Parameters:

Name | Type |
------ | ------ |
`name` | string |
`sdkVersion` | [SDKVersion](README.md#sdkversion) |
`coreModulesOnly?` | undefined \| false \| true |

**Returns:** boolean

___

### isValidSemver

▸ **isValidSemver**(`version`: string): boolean

Verifies whether a string is a valid semver.

#### Parameters:

Name | Type |
------ | ------ |
`version` | string |

**Returns:** boolean

___

### standardizeDependencies

▸ **standardizeDependencies**(`dependencies`: any): [SnackDependencies](README.md#snackdependencies)

Converts older dependency formats into the SnackDependencies type.

#### Parameters:

Name | Type |
------ | ------ |
`dependencies` | any |

**Returns:** [SnackDependencies](README.md#snackdependencies)

___

### validateSDKVersion

▸ **validateSDKVersion**(`sdkVersion`: [SDKVersion](README.md#sdkversion)): [SDKVersion](README.md#sdkversion)

#### Parameters:

Name | Type |
------ | ------ |
`sdkVersion` | [SDKVersion](README.md#sdkversion) |

**Returns:** [SDKVersion](README.md#sdkversion)
