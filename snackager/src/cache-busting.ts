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
    'react-native-reanimated': 1,
  },
};

export default function getCachePrefix(name: string): string {
  const packageVersion = cacheBusting.packages[name];
  return `${cacheBusting.version}${packageVersion ? `-${packageVersion}` : ''}`;
}
