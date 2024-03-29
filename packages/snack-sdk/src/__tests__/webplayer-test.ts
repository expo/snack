/* eslint @typescript-eslint/no-unused-vars: 0 */
import '../__mocks__/node-fetch';
import Snack from './snack-sdk';
import Window, { postMessage } from '../__mocks__/window';

const device = {
  id: '1234567890',
  name: 'iPhoneX',
  platform: 'ios',
};

const origin = 'https://snack-web-player.s3.us-west-1.amazonaws.com';

describe('webpreview', () => {
  it('does not create a webplayer transport by default', async () => {
    const snack = new Snack({});
    expect(snack.getState().transports['webplayer']).toBeUndefined();
  });

  it('creates a webplayer transport', async () => {
    const snack = new Snack({
      webPreviewRef: {
        current: null,
      },
    });
    expect(snack.getState().transports['webplayer']).toBeDefined();
  });

  it('updates a webplayer url', async () => {
    const snack = new Snack({
      webPreviewRef: {
        current: null,
      },
    });
    const originalTransport = snack.getState().transports['webplayer'];
    snack.setWebPlayerURL('http://snack.expo.test');
    const newTransport = snack.getState().transports['webplayer'];
    expect(originalTransport).not.toBe(newTransport);

    // Simulate CONNECT by web-player with old origin, which will be a no-op
    postMessage(JSON.stringify({ type: 'CONNECT', device }), origin);
    expect(Object.keys(snack.getState().connectedClients).length).toBe(0);

    // Simulate CONNECT by web-player with new origin
    postMessage(JSON.stringify({ type: 'CONNECT', device }), 'http://snack.expo.test');
    expect(Object.keys(snack.getState().connectedClients).length).toBe(1);
  });

  it('registers for messages on the global window', async () => {
    // @ts-ignore 'snack' is declared but its value is never read.
    const snack = new Snack({
      webPreviewRef: {
        current: null,
      },
    });
    expect(global.addEventListener).toHaveBeenCalled();
  });

  it('registers for messages on the global window', async () => {
    // @ts-ignore 'snack' is declared but its value is never read.
    const snack = new Snack({
      webPreviewRef: {
        current: null,
      },
    });
    expect(global.addEventListener).toHaveBeenCalled();
  });

  it('allows connects from default web-player domain', async () => {
    const contentWindow = new Window({ location: origin });
    // @ts-ignore 'snack' is declared but its value is never read.
    const snack = new Snack({
      webPreviewRef: {
        current: contentWindow as any,
      },
    });
    // Simulate CONNECT by web-player
    postMessage(JSON.stringify({ type: 'CONNECT', device }), origin);
    expect(Object.keys(snack.getState().connectedClients).length).toBe(1);
  });

  it('ignores messages from other domains', async () => {
    const contentWindow = new Window({ location: origin });
    // @ts-ignore 'snack' is declared but its value is never read.
    const snack = new Snack({
      webPreviewRef: {
        current: contentWindow as any,
      },
    });
    // Simulate CONNECT by web-player
    postMessage(JSON.stringify({ type: 'CONNECT', device }), 'https://someotherdomain.org');
    expect(Object.keys(snack.getState().connectedClients).length).toBe(0);
  });

  it('sends code upon request', async () => {
    const contentWindow = new Window({ location: origin });
    // @ts-ignore 'snack' is declared but its value is never read.
    const snack = new Snack({
      webPreviewRef: {
        current: contentWindow as any,
      },
    });
    // Simulate RESEND_CODE by web-player
    postMessage(JSON.stringify({ type: 'CONNECT', device }), origin);
    postMessage(
      JSON.stringify({ type: 'MESSAGE', message: { type: 'RESEND_CODE', device } }),
      origin,
    );
    // Snack-sdk sends CODE in response
    expect(contentWindow.postMessage).toHaveBeenCalled();
  });

  it('succesfully disconnects clients', async () => {
    const contentWindow = new Window({ location: origin });
    // @ts-ignore 'snack' is declared but its value is never read.
    const snack = new Snack({
      webPreviewRef: {
        current: contentWindow as any,
      },
    });
    // Simulate CONNECT by web-player
    postMessage(JSON.stringify({ type: 'CONNECT', device }), origin);
    expect(Object.keys(snack.getState().connectedClients).length).toBe(1);
    // Simulate DISCONNECT by web-player
    postMessage(JSON.stringify({ type: 'DISCONNECT', device }), origin);
    expect(Object.keys(snack.getState().connectedClients).length).toBe(0);
  });
});
