declare module '@react-native/assets-registry/registry' {
  export type AssetDestPathResolver = 'android' | 'generic';

  export type PackagerAsset = {
    __packager_asset: boolean;
    fileSystemLocation: string;
    httpServerLocation: string;
    width?: number;
    height?: number;
    scales: number[];
    hash: string;
    name: string;
    type: string;
    resolver: AssetDestPathResolver;
    fileHashes?: string[];
    uri?: string;
  };

  export function registerAsset(asset: Partial<PackagerAsset>): number;
}
