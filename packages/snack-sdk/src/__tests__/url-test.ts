import '../__mocks__/fetch-mock-server';
import { newestSdkVersion, oldestSdkVersion } from 'snack-content';

import Snack, { SnackOptions } from './snack-sdk';

const host = 'test.exp.host';
const apiURL = `https://${host}`;
const channel = '10spnBnPxi';
const sdkVersion = newestSdkVersion;
const id = '7816837218';
const config: SnackOptions = {
  apiURL,
  channel,
  sdkVersion,
};

describe('url', () => {
  it('has initial unnamed url', async () => {
    const snack = new Snack(config);
    expect(snack.getState().url).toBe(
      `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A${sdkVersion}&channel-name=production&snack-channel=${channel}`,
    );
  });

  it('has initial named url when save-id provided', async () => {
    const snack = new Snack({
      ...config,
      id,
    });
    expect(snack.getState().url).toBe(
      `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A${sdkVersion}&channel-name=production&snack=${id}&snack-channel=${channel}`,
    );
  });

  it('keeps named url after changing code', async () => {
    const snack = new Snack({
      ...config,
      id,
    });
    snack.updateFiles({
      'App.js': {
        type: 'CODE',
        contents: `console.log('hello world');`,
      },
    });
    expect(snack.getState().url).toBe(
      `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A${sdkVersion}&channel-name=production&snack=${id}&snack-channel=${channel}`,
    );
  });

  it('updates url when changing sdk-version', async () => {
    const snack = new Snack(config);
    snack.setSDKVersion(oldestSdkVersion);
    expect(snack.getState().url).toBe(
      `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A${oldestSdkVersion}&channel-name=production&snack-channel=${channel}`,
    );
  });

  it('reverts to unnamed url after changing sdk-version', async () => {
    const snack = new Snack({
      ...config,
      id,
    });
    snack.setSDKVersion(oldestSdkVersion);
    expect(snack.getState().url).toBe(
      `exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?runtime-version=exposdk%3A${oldestSdkVersion}&channel-name=production&snack-channel=${channel}`,
    );
  });
});
