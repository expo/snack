/* eslint @typescript-eslint/no-unused-vars: 0 */

import fetch from '../__mocks__/fetch';
import PubNub from '../__mocks__/pubnub';
import Snack from './snack-sdk';

describe('upload', () => {
  it('uploads code for too large messages', async () => {
    const uploadURL = 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~code/whoop';
    fetch.mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ url: uploadURL }),
      })
    );
    // @ts-ignore
    const snack = new Snack({
      online: true,
      files: {
        'App.js': {
          type: 'CODE',
          contents: new Array(20000).fill('*').join(''),
        },
      },
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(0);
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (pubnub.publishes.length) {
        break;
      }
    }
    expect(fetch).toBeCalled();
    expect(pubnub.publishes).toHaveLength(1);
    expect(pubnub.publishes[0].message.type).toBe('CODE');
    expect(pubnub.publishes[0].message.s3url['App.js']).toBe(uploadURL);
  });
});
