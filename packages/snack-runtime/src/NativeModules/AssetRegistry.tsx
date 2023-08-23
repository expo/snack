// @ts-ignore
import * as AssetRegistry from 'react-native-web/dist/modules/AssetRegistry';

export type PackagerAsset = {
  hash: string;
  name: string;
  scales: number[];
  fileHashes: string[];
  httpServerLocation: string;
  uri: string;
  width?: number;
  height?: number;
  type?: string;
};

export default AssetRegistry as {
  registerAsset(asset: PackagerAsset): number;
  getAssetByID(assetID: number): PackagerAsset | undefined;
};
