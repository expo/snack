/* eslint @typescript-eslint/no-unused-vars: 0 */

import fetch from '../__mocks__/fetch';
import type { ProtocolCodeMessage } from '../transports/Protocol';
import Transport from '../transports/__mocks__/TestTransport';
import Snack from './snack-sdk';

jest.mock('../transports');

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

    Transport.mockVerifyCodeMessageSize.mockImplementation((codeMessage: ProtocolCodeMessage) => {
      let approxSize = 0;
      for (const path in codeMessage.diff) {
        approxSize += path.length + codeMessage.diff[path].length;
      }
      return approxSize < 4096;
    });

    const snack = new Snack({
      online: true,
      files: {
        'App.js': {
          type: 'CODE',
          contents: new Array(20000).fill('*').join(''),
        },
      },
    });
    const transport = Transport.instances[0];
    transport.connect();
    expect(transport.publishes).toHaveLength(0);
    for (let i = 0; i < 100; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (transport.publishes.length) {
        break;
      }
    }
    expect(fetch).toBeCalled();
    expect(transport.publishes).toHaveLength(1);
    const message = transport.publishes[0].message;
    expect(message.type).toBe('CODE');
    expect((message as ProtocolCodeMessage).s3url['App.js']).toBe(uploadURL);
  });
});
