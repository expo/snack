import '../__mocks__/fetch';
import Snack, {
  getSupportedSDKVersions,
  isValidSemver,
  defaultConfig,
  isModulePreloaded,
  getPreloadedModules,
  isFeatureSupported,
  getDeprecatedModule,
} from './snack-sdk';

describe('sdkVersion', () => {
  it('uses default when omitted', async () => {
    const snack = new Snack({});
    expect(snack.getState()).toMatchObject({
      sdkVersion: defaultConfig.sdkVersion,
    });
  });

  it('can be provided initially', async () => {
    const snack = new Snack({
      sdkVersion: '39.0.0',
    });
    expect(snack.getState()).toMatchObject({
      unsaved: false,
      sdkVersion: '39.0.0',
    });
  });

  it('can be changed', async () => {
    const snack = new Snack({});
    snack.setSDKVersion('39.0.0');
    expect(snack.getState()).toMatchObject({
      unsaved: true,
      sdkVersion: '39.0.0',
    });
  });

  it('throws when invalid version specified', async () => {
    expect(
      () =>
        new Snack({
          // @ts-ignore Type '"30.0.0"' is not assignable to type 'SDKVersion'
          sdkVersion: '30.0.0',
        })
    ).toThrowError();
  });

  it('throws when invalid version specified to setSDKVersion', async () => {
    const snack = new Snack({});
    expect(() =>
      // @ts-ignore Type '"30.0.0"' is not assignable to type 'SDKVersion'
      snack.setSDKVersion('thisaintright')
    ).toThrowError();
  });

  getSupportedSDKVersions().forEach((sdkVersion) => {
    it(`fetches wantedDependencyVersions for SDK ${sdkVersion}`, async () => {
      const snack = new Snack({
        sdkVersion,
        dependencies: {
          'expo-blur': { version: '*' },
        },
      });
      const { wantedDependencyVersions } = await snack.getStateAsync();
      expect(Object.keys(wantedDependencyVersions ?? {}).length).toBeGreaterThan(0);
    });
  });
});

describe('getSupportedSDKVersions', () => {
  it('contains at least 2 versions', () => {
    expect(getSupportedSDKVersions().length).toBeGreaterThan(1);
  });

  it('returns valid versions', () => {
    getSupportedSDKVersions().forEach((sdkVersion) => expect(isValidSemver(sdkVersion)).toBe(true));
  });
});

describe('isModulePreloaded', () => {
  it('returns true for internal modules', () => {
    expect(isModulePreloaded('react-native', '40.0.0')).toBe(true);
  });

  it('returns true for bundled modules', () => {
    expect(isModulePreloaded('expo-asset', '40.0.0')).toBe(true);
  });

  it('returns false when internalOnly is true', () => {
    expect(isModulePreloaded('expo-asset', '40.0.0', true)).toBe(false);
  });

  it('returns false for unknown modules', () => {
    expect(isModulePreloaded('firestorter', '40.0.0')).toBe(false);
  });
});

describe('getPreloadedModules', () => {
  it('returns valid modules', () => {
    const result = getPreloadedModules('40.0.0');
    expect(Object.keys(result).length).toBeGreaterThan(10);
    Object.values(result).map((version) => expect(isValidSemver(version)).toBe(true));
  });
  it('returns different results for other SDK', () => {
    const result = getPreloadedModules('40.0.0');
    const result2 = getPreloadedModules('41.0.0');
    expect(result).not.toMatchObject(result2);
  });
  it('returns subset for internal modules', () => {
    const result = getPreloadedModules('40.0.0');
    const internal = getPreloadedModules('40.0.0', true);
    expect(Object.keys(internal).length).toBeLessThan(Object.keys(result).length);
    expect(result).toMatchObject(internal);
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
      // @ts-ignore Type '"Bogus"' is not assignable to type 'SDKFeature'
      isFeatureSupported('Bogus', '38.0.0')
    ).toThrowError();
  });
  it('throws for invalid version', () => {
    expect(() => isFeatureSupported('TYPESCRIPT', 'foo')).toThrowError();
  });
});

describe('getDeprecatedModule', () => {
  it('returns undefined for non deprecated modules', () => {
    expect(getDeprecatedModule('expo-constants', '41.0.0')).toBe(undefined);
  });
  it('returns description for deprecated modules', () => {
    expect(getDeprecatedModule('@react-native-community/async-storage', '41.0.0')).toBe(
      'Async Storage has moved to new organization: https://github.com/react-native-async-storage/async-storage'
    );
  });
});
