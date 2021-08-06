import {
  SnackState,
  SnackFile,
  SnackCodeFile,
  SnackAssetFile,
  SnackFiles,
  SnackDependencies,
  SnackDependency,
  SnackMissingDependencies,
  SnackConnectedClient,
  SnackConnectedClients,
  SDKVersion,
} from 'snack-sdk';

export type {
  SnackState,
  SnackFile,
  SnackCodeFile,
  SnackAssetFile,
  SnackFiles,
  SnackDependencies,
  SnackDependency,
  SnackMissingDependencies,
  SnackConnectedClient,
  SnackConnectedClients,
  SDKVersion,
};

export type SnackManifest = {
  name: string;
  description: string;
  sdkVersion?: SDKVersion;
};

export type SavedSnack = {
  id: string;
  created: string;
  code?: string | SnackFiles;
  manifest: SnackManifest;
  dependencies?: SnackDependencies;
  history?: SaveHistory;
  isDraft?: boolean;
};

export type SaveHistory = {
  hashId: string;
  savedAt: string;
  isDraft?: boolean;
}[];

/* export type SnackDefaults = {
  name: string;
  channel: string;
}; */

export type RouterData =
  | {
      type: 'success';
      id: string;
      snack?: SavedSnack;
      // defaults: SnackDefaults;
    }
  | {
      type: 'error';
      id: string;
      error: { message: string };
      // defaults: SnackDefaults;
    };
