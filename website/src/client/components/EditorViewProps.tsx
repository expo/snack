import {
  SaveStatus,
  SaveHistory,
  SaveOptions,
  Platform,
  Device,
  DeviceLog,
  SnackFiles,
  SnackFile,
  SnackDependencies,
  SnackDependency,
  SnackMissingDependencies,
  Annotation,
  SDKVersion,
} from '../types';
import { PlatformOption } from '../utils/PlatformOptions';

export type EditorViewProps = {
  createdAt: string | undefined;
  saveHistory: SaveHistory;
  saveStatus: SaveStatus;
  selectedFile: string;
  files: SnackFiles;
  name: string;
  description: string;
  dependencies: SnackDependencies;
  missingDependencies: SnackMissingDependencies;
  id?: string;
  isResolving: boolean;
  isDownloading: boolean;
  connectedDevices: Device[];
  annotations: Annotation[];
  deviceLogs: DeviceLog[];
  experienceURL: string;
  experienceName: string;
  sdkVersion: SDKVersion;
  sendCodeOnChangeEnabled: boolean;
  onSendCode: () => void;
  onReloadSnack: () => void;
  onToggleSendCode: () => void;
  onTogglePreview: () => void;
  onChangePlatform: (platform: Platform) => void;
  onDeviceConnectionAttempt: () => void;
  onClearDeviceLogs: () => void;
  onSubmitMetadata: (details: { name: string; description: string }) => void;
  onChangeSDKVersion: (sdkVersion: SDKVersion) => void;
  onPublishAsync: (options?: SaveOptions) => Promise<void>;
  onDownloadAsync: () => Promise<void>;
  onSelectFile: (path: string) => void;
  updateFiles: (updateFn: (files: SnackFiles) => { [path: string]: SnackFile | null }) => void;
  updateDependencies: (
    updateFn: (dependencies: SnackDependencies) => { [name: string]: SnackDependency | null }
  ) => void;
  uploadFileAsync: (file: File) => Promise<string>;
  setDeviceId: (deviceId: string) => void;
  deviceId: string | undefined;
  wasUpgraded: boolean;
  autosaveEnabled: boolean;
  payerCode: string | undefined;
  userAgent: string;
  previewRef: React.MutableRefObject<Window | null>;
  previewShown: boolean;
  previewURL: string;
  platform: Platform;
  platformOptions: PlatformOption[];
  verbose: boolean;
  snackagerURL: string;
};
