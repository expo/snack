// Assets from Snacks are hosted separately on a S3 bucket. These functions tell
// React Native how to load these separate Snack assets. Other assets are loaded
// with the default asset resolver.

import { PixelRatio } from 'react-native';
import AssetSourceResolver from 'react-native/Libraries/Image/AssetSourceResolver';
import { setCustomSourceTransformer } from 'react-native/Libraries/Image/resolveAssetSource';

export function registerSnackAssetSourceTransformer() {
  setCustomSourceTransformer(
    (resolver: any) => resolveSnackAssetSource(resolver.asset) || resolver.defaultAsset()
  );
}

export function resolveSnackAssetSource(assetMeta: any) {
  try {
    // The main issue is that `expo-asset` falls back to our main cloud CDN for assets.
    // But Snack has it's own CDN and needs to load from there instead.
    if (assetMeta.uri?.includes('snack-code-uploads.s3.us-west-1.amazonaws.com')) {
      const meta = assetMeta;

      const scale = AssetSourceResolver.pickScale(meta.scales, PixelRatio.get());
      const index = meta.scales.findIndex((s: number) => s === scale);
      const hash = meta.fileHashes ? meta.fileHashes[index] || meta.fileHashes[0] : meta.hash;

      return { uri: assetMeta.uri, hash };
    }
  } catch (e) {}

  return null;
}
