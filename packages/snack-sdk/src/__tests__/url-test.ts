import '../__mocks__/fetch';
import Snack, { SnackOptions } from './snack-sdk';

const host = 'test.exp.host';
const apiURL = `https://${host}`;
const channel = '10spnBnPxi';
const sdkVersion = '39.0.0';
const id = '7816837218';
const config: SnackOptions = {
  apiURL,
  channel,
  sdkVersion,
};

describe('url', () => {
  it('has initial unnamed url', async () => {
    const snack = new Snack(config);
    expect(snack.getState().url).toBe(`exp://${host}/@snack/sdk.${sdkVersion}-${channel}`);
  });

  it('has initial named url when save-id provided', async () => {
    const snack = new Snack({
      ...config,
      id,
    });
    expect(snack.getState().url).toBe(`exp://${host}/@snack/${id}+${channel}`);
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
    expect(snack.getState().url).toBe(`exp://${host}/@snack/${id}+${channel}`);
  });

  it('updates url when changing sdk-version', async () => {
    const snack = new Snack(config);
    snack.setSDKVersion('38.0.0');
    expect(snack.getState().url).toBe(`exp://${host}/@snack/sdk.38.0.0-${channel}`);
  });

  it('reverts to unnamed url after changing sdk-version', async () => {
    const snack = new Snack({
      ...config,
      id,
    });
    snack.setSDKVersion('38.0.0');
    expect(snack.getState().url).toBe(`exp://${host}/@snack/sdk.38.0.0-${channel}`);
  });
});
