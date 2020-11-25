import '../__mocks__/fetch';
import Snack, {
  getSupportedSDKVersions,
  isValidSemver,
  defaultConfig,
  isModulePreloaded,
  getPreloadedModules,
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
      sdkVersion: '36.0.0',
    });
    expect(snack.getState()).toMatchObject({
      unsaved: false,
      sdkVersion: '36.0.0',
    });
  });

  it('can be changed', async () => {
    const snack = new Snack({});
    snack.setSDKVersion('36.0.0');
    expect(snack.getState()).toMatchObject({
      unsaved: true,
      sdkVersion: '36.0.0',
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
    expect(isModulePreloaded('react-native', '37.0.0')).toBe(true);
  });

  it('returns true for bundled modules', () => {
    expect(isModulePreloaded('expo-asset', '37.0.0')).toBe(true);
  });

  it('returns false when internalOnly is true', () => {
    expect(isModulePreloaded('expo-asset', '37.0.0', true)).toBe(false);
  });

  it('returns false for unknown modules', () => {
    expect(isModulePreloaded('firestorter', '37.0.0')).toBe(false);
  });
});

describe('getPreloadedModules', () => {
  it('returns valid modules', () => {
    const result = getPreloadedModules('37.0.0');
    expect(Object.keys(result).length).toBeGreaterThan(10);
    Object.values(result).map((version) =>
      expect(isValidSemver(version) || version === 'image').toBe(true)
    );
  });
  it('returns different results for other SDK', () => {
    const result = getPreloadedModules('37.0.0');
    const result2 = getPreloadedModules('38.0.0');
    expect(result).not.toMatchObject(result2);
  });
  it('returns subset for internal modules', () => {
    const result = getPreloadedModules('37.0.0');
    const internal = getPreloadedModules('37.0.0', true);
    expect(Object.keys(internal).length).toBeLessThan(Object.keys(result).length);
    expect(result).toMatchObject(internal);
  });
});
