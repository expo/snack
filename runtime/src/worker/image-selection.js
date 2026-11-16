export function selectImageAsset(asset, density = 1) {
  if (!asset.variants) return asset;
  if (!Array.isArray(asset.variants) || !asset.variants.length || asset.variants.length > 8)
    throw Error('Invalid image variants');
  if (
    asset.variants.some(
      (item) =>
        !item ||
        !Number.isFinite(item.scale) ||
        item.scale <= 0 ||
        item.scale > 8 ||
        !Number.isFinite(item.width) ||
        !Number.isFinite(item.height) ||
        item.width <= 0 ||
        item.height <= 0 ||
        item.width > 32768 ||
        item.height > 32768,
    )
  )
    throw Error('Invalid image variant metadata');
  const variants = [...asset.variants].sort((a, b) => a.scale - b.scale);
  return variants.find((item) => item.scale >= density) || variants[variants.length - 1];
}
