declare module 'react-native/Libraries/Image/AssetRegistry' {
  export type PackagerAsset = {
    __packager_asset: boolean;
    fileSystemLocation: string;
    httpServerLocation: string;
    width?: number;
    height?: number;
    scales: number[];
    fileHashes?: string[];
    uri?: string;
    hash: string;
    name: string;
    type: string;
  };

  export function registerAsset(asset: Partial<PackagerAsset>): number;

  export function getAssetByID(assetId: number): PackagerAsset;
}
