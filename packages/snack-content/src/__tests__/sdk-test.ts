import { newestSdkVersion, oldestSdkVersion } from '../defaults';
import {
  getDeprecatedModule,
  getPreloadedModules,
  getSupportedSDKVersions,
  isFeatureSupported,
  isModulePreloaded,
  isValidSemver,
  standardizeDependencies,
  validateSDKVersion,
} from '../sdk';

describe('getSupportedSDKVersions', () => {
  it('contains at least 2 versions', () => {
    expect(getSupportedSDKVersions().length).toBeGreaterThan(1);
  });

  it('returns valid versions', () => {
    getSupportedSDKVersions().forEach((sdkVersion) => expect(isValidSemver(sdkVersion)).toBe(true));
  });
});

describe('validateSDKVersion', () => {
  it('allows supported SDK versions', () => {
    validateSDKVersion(newestSdkVersion);
  });

  it('throws an error for unsupported SDK versions', () => {
    expect(() => validateSDKVersion('1.0.0' as any)).toThrowError('Invalid SDKVersion');
  });
});

describe('isModulePreloaded', () => {
  it('returns true for internal modules', () => {
    expect(isModulePreloaded('react-native', oldestSdkVersion)).toBe(true);
  });

  it('returns true for bundled modules', () => {
    expect(isModulePreloaded('expo-asset', oldestSdkVersion)).toBe(true);
  });

  it('returns false when internalOnly is true', () => {
    expect(isModulePreloaded('expo-asset', oldestSdkVersion, true)).toBe(false);
  });

  it('returns false for unknown modules', () => {
    expect(isModulePreloaded('firestorter', oldestSdkVersion)).toBe(false);
  });

  it('returns false for unsupported SDK versions', () => {
    expect(isModulePreloaded('expo-asset', '1.0.0' as any)).toBe(false);
  });
});

describe('getPreloadedModules', () => {
  it('returns valid modules', () => {
    const result = getPreloadedModules(oldestSdkVersion);
    expect(Object.keys(result).length).toBeGreaterThan(10);
    Object.values(result).map((version) => expect(isValidSemver(version)).toBe(true));
  });

  it('returns different results for other SDK', () => {
    const result = getPreloadedModules(oldestSdkVersion);
    const result2 = getPreloadedModules(newestSdkVersion);
    expect(result).not.toMatchObject(result2);
  });

  it('returns subset for internal modules', () => {
    const result = getPreloadedModules(oldestSdkVersion);
    const internal = getPreloadedModules(oldestSdkVersion, true);
    expect(Object.keys(internal).length).toBeLessThan(Object.keys(result).length);
    expect(result).toMatchObject(internal);
  });

  it('returns an empty set for unsupported SDK versions', () => {
    const result = getPreloadedModules('1.0.0' as any);
    expect(result).toEqual({});
  });
});

describe('isValidSemver', () => {
  it('is valid for *', () => {
    expect(isValidSemver('*')).toBe(true);
  });

  it('is valid for latest', () => {
    expect(isValidSemver('latest')).toBe(true);
  });

  it('is valid for version', () => {
    expect(isValidSemver('1.2.3')).toBe(true);
  });

  it('is invalid for random string', () => {
    expect(isValidSemver('random-string')).toBe(false);
  });
});

describe('isFeatureSupported', () => {
  it('returns true for supported feature', () => {
    expect(isFeatureSupported('TYPESCRIPT', '38.0.0')).toBe(true);
  });

  it('returns false for supported feature', () => {
    expect(isFeatureSupported('TYPESCRIPT', '21.0.0')).toBe(false);
  });

  it('throws for invalid feature', () => {
    expect(() =>
      // @ts-expect-error Type '"Bogus"' is not assignable to type 'SDKFeature'
      isFeatureSupported('Bogus', '38.0.0')
    ).toThrowError();
  });

  it('throws for invalid version', () => {
    expect(() => isFeatureSupported('TYPESCRIPT', 'foo')).toThrowError();
  });
});

describe('getDeprecatedModule', () => {
  it('returns undefined for non deprecated modules', () => {
    expect(getDeprecatedModule('expo-constants', oldestSdkVersion)).toBe(undefined);
  });

  it('returns description for deprecated modules', () => {
    expect(getDeprecatedModule('@react-native-community/async-storage', oldestSdkVersion)).toBe(
      'Async Storage has moved to new organization: https://github.com/react-native-async-storage/async-storage'
    );
  });
});

describe('standardizeDependencies', () => {
  it('converts v1 dependencies', () => {
    expect(
      standardizeDependencies({
        dep1: '1.2.3',
      })
    ).toMatchObject({
      dep1: {
        version: '1.2.3',
      },
    });
  });

  it('converts v2 dependencies', () => {
    expect(
      standardizeDependencies({
        dep1: {
          version: '1.2.3',
          peerDependencies: {
            peerDep2: {
              version: '4.5.6',
            },
          },
        },
      })
    ).toMatchObject({
      dep1: {
        version: '1.2.3',
        peerDependencies: {
          peerDep2: '4.5.6',
        },
      },
    });
  });

  it('returns v3 dependencies untouched', () => {
    const deps = {
      dep1: {
        version: '1.2.3',
        peerDependencies: {
          peerDep2: '4.5.6',
        },
      },
    };
    expect(standardizeDependencies(deps)).toBe(deps);
  });

  it('deletes invalid v3 dependencies', () => {
    const deps = {
      dep1: 1,
      dep2: {
        version: '1.2.3',
        peerDependencies: {
          peerDep3: 1,
        },
      },
    };
    expect(standardizeDependencies(deps)).toEqual({
      dep2: {
        version: '1.2.3',
        peerDependencies: {},
      },
    });
  });
});
