import '../__mocks__/fetch';
import { getSupportedSDKVersions, oldestSdkVersion, newestSdkVersion } from 'snack-content';

import Snack, { defaultConfig } from './snack-sdk';

describe('sdkVersion', () => {
  it('uses default when omitted', async () => {
    const snack = new Snack({});
    expect(snack.getState()).toMatchObject({
      sdkVersion: defaultConfig.sdkVersion,
    });
  });

  it('can be provided initially', async () => {
    const snack = new Snack({ sdkVersion: newestSdkVersion });
    expect(snack.getState()).toMatchObject({
      unsaved: false,
      sdkVersion: newestSdkVersion,
    });
  });

  it('can be changed', async () => {
    const snack = new Snack({ sdkVersion: oldestSdkVersion });
    snack.setSDKVersion(newestSdkVersion);
    expect(snack.getState()).toMatchObject({
      unsaved: true,
      sdkVersion: newestSdkVersion,
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
