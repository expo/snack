import fetch from 'node-fetch';

import '../__mocks__/blob';
import Snack from './snack-sdk';

jest.mock('node-fetch');

// @ts-ignore
fetch.mockReturnValue(
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        url: 'whoop',
      },
    }),
  })
);

beforeEach(() => {
  // @ts-ignore
  fetch.mockClear();
});

describe('devsession', () => {
  it('sends notify when online and user or device-id specified', async () => {
    const snack = new Snack({});
    expect(fetch).not.toBeCalled(); // !online
    snack.setOnline(true);
    expect(fetch).not.toBeCalled(); // !device-id
    snack.setOnline(false);
    expect(fetch).not.toBeCalled(); // !online
    snack.setOnline(true);
    snack.setDeviceId('1234');
    expect(fetch).toBeCalledTimes(1); // online && device-id
    snack.setOnline(false);
    expect(fetch).toBeCalledTimes(2); // close
    snack.setDeviceId();
    expect(fetch).toBeCalledTimes(2); // still closed
    snack.setOnline(true);
    expect(fetch).toBeCalledTimes(2); // !device-id
    snack.setDeviceId('1234');
    expect(fetch).toBeCalledTimes(3); // notify
    snack.setOnline(false);
    expect(fetch).toBeCalledTimes(4); // !online
  });

  it('receives sendBeaconCloseRequest', async () => {
    const snack = new Snack({
      apiURL: 'https://exp.host',
      host: 'expo.io',
      channel: '10spnBnPxi',
      sdkVersion: '37.0.0',
    });
    expect(snack.getState().sendBeaconCloseRequest).toBeUndefined();
    expect(fetch).not.toBeCalled();
    snack.setOnline(true);
    expect(fetch).not.toBeCalled();
    snack.setDeviceId('1234');
    expect(fetch).toBeCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(snack.getState().sendBeaconCloseRequest).toBeDefined();
    expect(snack.getState().sendBeaconCloseRequest).toMatchSnapshot();
    snack.setOnline(false);
    expect(fetch).toBeCalledTimes(2);
  });

  it('sends notify when calling setFocus', async () => {
    const snack = new Snack({
      apiURL: 'https://exp.host',
      online: true,
      deviceId: '1234',
    });
    expect(fetch).toBeCalledTimes(1);
    snack.setFocus();
    expect(fetch).toBeCalledTimes(2);
    snack.setOnline(false);
    expect(fetch).toBeCalledTimes(3);
  });

  it('sends notify with user session secret', async () => {
    new Snack({
      apiURL: 'https://exp.host',
      online: true,
      deviceId: '1234',
      user: { sessionSecret: '{"some":"json"}' },
    });
    expect(fetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Expo-Session': '{"some":"json"}',
        }),
      }),
    );
  });

  it('sends notify with user access token', async () => {
    new Snack({
      apiURL: 'https://exp.host',
      online: true,
      deviceId: '1234',
      user: { accessToken: 'sometoken' },
    });
    expect(fetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sometoken',
        }),
      }),
    );
  })
});
