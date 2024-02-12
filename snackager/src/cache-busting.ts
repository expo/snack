const cacheBusting: { version: number; packages: { [name: string]: number } } = {
  /**
   * Main version. Incrementing this causes all cached bundles
   * to be invalidated and rebuild when requested.
   * */
  version: 1,
  /**
   * Package specific invalidations.
   * Adding or updating a version causes all cached bundled
   * of the given package to be invalidated and rebuild when
   * requested.
   * */
  packages: {
    'react-native-reanimated': 2,
    moti: 2,
    '@motify/interactions': 2,
    '@motify/skeleton': 2,
    '@draftbit/ui': 2,
    '@shopify/react-native-skia': 1,
    '@expo-google-fonts/.*': 2,
  },
};

export default function getCachePrefix(name: string): string {
  const match = Object.keys(cacheBusting.packages).find((spec) =>
    new RegExp(`^${spec}$`).test(name),
  );
  const packageVersion = match ? cacheBusting.packages[match] : undefined;
  return `${cacheBusting.version}${packageVersion ? `-${packageVersion}` : ''}`;
}
