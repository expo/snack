import { SDKVersion, SDKFeature } from './sdks/types';

export type { SDKVersion, SDKFeature };

/**
 * The content of a Snack code or asset file.
 */
export type SnackFile = SnackCodeFile | SnackAssetFile;

/**
 * A non-asset file that is included with the project.
 * This can be either a code file (.js/.tsx) or a support
 * file such as a markdown or JSON file.
 */
export type SnackCodeFile = {
  type: 'CODE';
  contents: string;
  error?: Error;
};

/**
 * An asset file that refers to externally available
 * content such as an image or font.
 *
 * When resolved, the `contents` field is an URL to the
 * uploaded asset. A File, Blob or FormData object may
 * also be provided after which it is automatically uploaded
 * and converted into an URL.
 */
export type SnackAssetFile = {
  type: 'ASSET';
  contents: string | File | Blob | FormData; // string = url
  error?: Error;
};

/**
 * Dictionary of filenames and their content that make up
 * the files of the Snack.
 */
export type SnackFiles = {
  [path: string]: SnackFile;
};

/**
 * Dictionary of dependencies and their version.
 */
export type SnackDependencyVersions = { [name: string]: string };

/**
 * The version, resolved handle, peer-dependencies and optional
 * error of a dependency.
 */
export type SnackDependency = {
  version: string;
  handle?: string;
  peerDependencies?: SnackDependencyVersions;
  error?: Error;
  wantedVersion?: string;
};

/**
 * Dictionary of dependency names and their (resolved) versions.
 */
export type SnackDependencies = {
  [name: string]: SnackDependency;
};

/**
 * Wanted version of the dependency that is missing, including the
 * dependants which have this dependency as a peer-dependency.
 */
export type SnackMissingDependency = {
  dependents: string[];
  wantedVersion?: string;
};

/**
 * Dictionary of dependencies that are missing.
 */
export type SnackMissingDependencies = {
  [name: string]: SnackMissingDependency;
};
