import * as React from 'react';
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

import { UserData } from './auth/authManager';
import { AppetizeDeviceAndroid, AppetizeDeviceIos } from './components/DevicePreview/AppetizeFrame';
import { ThemeName } from './components/Preferences/withThemeName';

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
  ThemeName,
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
  accountSnackId?: string;
};

export type SnackDefaults = {
  name: string;
  channel: string;
};

export type RouterData =
  | {
      type: 'success';
      snack?: SavedSnack;
      defaults: SnackDefaults;
    }
  | {
      type: 'error';
      error: { message: string };
      defaults: SnackDefaults;
    };

export type Viewer = UserData;

export type Platform = 'android' | 'ios' | 'web' | 'mydevice';

export type Device = {
  name: string;
  id: string;
  platform: Platform;
  status: 'connected' | 'disconnected';
  timestamp: number;
};

export type DeviceLog = {
  device: Device;
  method: 'log' | 'error' | 'warn';
  payload: unknown[];
};

export type QueryInitParams = {
  code?: string;
  sourceUrl?: string;
  name?: string;
  description?: string;
  dependencies?: string;
  files?: string;
  sdkVersion?: SDKVersion;
  iframeId?: string;
  waitForData?: 'boolean';
  saveToAccount?: 'true' | 'false';
  testTransport?: 'snackpub' | 'trafficMirroring';
  urlFormat?: 'universal';
};

export type QueryStateParams = {
  preview?: 'true' | 'false';
  platform?: Platform;
  theme?: ThemeName;
  supportedPlatforms?: string;
  appetizePayerCode?: string;
  verbose?: 'true' | 'false';
  hideQueryParams?: 'true' | 'false';
  deviceFrame?: 'true' | 'false';
  deviceAndroid?: AppetizeDeviceAndroid;
  deviceAndroidScale?: number;
  deviceIos?: AppetizeDeviceIos;
  deviceIosScale?: number;
};

export type QueryParams = QueryInitParams & QueryStateParams;

export type SaveStatus =
  | 'unsaved'
  | 'edited'
  | 'saving-draft'
  | 'saved-draft'
  | 'publishing'
  | 'published';

export type SaveHistory = {
  hashId: string;
  savedAt: string;
  isDraft?: boolean;
}[];

export type SaveOptions = {
  isDraft?: boolean;
  ignoreUser?: boolean;
  excludeFromHistory?: boolean;
};

export enum AnnotationSeverity {
  LOADING = -1,
  IGNORE = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  FATAL = 4,
}

export type AnnotationAction = {
  title: string;
  icon?: React.ComponentType<any>;
  run: () => void;
};

export type AnnotationLocation = {
  fileName: string;
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
};

export type Annotation = {
  message: string;
  severity: AnnotationSeverity;
  source: 'Device' | 'Web' | 'JSON' | 'ESLint' | 'Dependencies';
  location?: AnnotationLocation;
  action?: AnnotationAction;
};

export type $SetComplement<A, A1 extends A> = A extends A1 ? never : A;

export type $Subtract<T extends T1, T1 extends object> = Pick<T, $SetComplement<keyof T, keyof T1>>;
