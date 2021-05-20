export type Package = {
  name: string;
  version: string;
  description?: string;
  main?: string;
  peerDependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  dependencies?: { [key: string]: string };
  dist: {
    shasum: string;
    tarball: string;
  };
};

export type Metadata = {
  name: string;
  versions: { [key: string]: Package };
  'dist-tags': { [key: string]: string };
};

export type GitSnackFiles = {
  [name: string]:
    | {
        type: 'CODE';
        contents: string;
      }
    | { type: 'ASSET'; contents: string };
};

export type GitSnackDependencies = {
  [key: string]: string;
};

export type GitSnackObj = {
  files: GitSnackFiles;
  dependencies: GitSnackDependencies;
  sdkVersion: string;
  date: string;
};
