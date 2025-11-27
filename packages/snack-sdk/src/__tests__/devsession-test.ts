import '../__mocks__/blob';
import { mockFetch } from '../__mocks__/fetch';

import Snack from './snack-sdk';

mockFetch.mockReturnValue(
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        url: 'whoop',
      },
    }),
  }),
);

describe('devsession', () => {
  it('sends notify when online and user or device-id specified', async () => {
    const snack = new Snack({});
    expect(mockFetch).not.toBeCalled(); // !online
    snack.setOnline(true);
    expect(mockFetch).not.toBeCalled(); // !device-id
    snack.setOnline(false);
    expect(mockFetch).not.toBeCalled(); // !online
    snack.setOnline(true);
    snack.setDeviceId('1234');
    expect(mockFetch).toBeCalledTimes(1); // online && device-id
    snack.setOnline(false);
    expect(mockFetch).toBeCalledTimes(2); // close
    snack.setDeviceId();
    expect(mockFetch).toBeCalledTimes(2); // still closed
    snack.setOnline(true);
    expect(mockFetch).toBeCalledTimes(2); // !device-id
    snack.setDeviceId('1234');
    expect(mockFetch).toBeCalledTimes(3); // notify
    snack.setOnline(false);
    expect(mockFetch).toBeCalledTimes(4); // !online
  });

  it('receives sendBeaconCloseRequest', async () => {
    const snack = new Snack({
      apiURL: 'https://exp.host',
      channel: '10spnBnPxi',
    });
    expect(snack.getState().sendBeaconCloseRequest).toBeUndefined();
    expect(mockFetch).not.toBeCalled();
    snack.setOnline(true);
    expect(mockFetch).not.toBeCalled();
    snack.setDeviceId('1234');
    expect(mockFetch).toBeCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(snack.getState().sendBeaconCloseRequest).toBeDefined();
    expect(snack.getState().sendBeaconCloseRequest).toMatchSnapshot();
    snack.setOnline(false);
    expect(mockFetch).toBeCalledTimes(2);
  });

  it('sends notify when calling setFocus', async () => {
    const snack = new Snack({
      apiURL: 'https://exp.host',
      online: true,
      deviceId: '1234',
    });
    expect(mockFetch).toBeCalledTimes(1);
    snack.setFocus();
    expect(mockFetch).toBeCalledTimes(2);
    snack.setOnline(false);
    expect(mockFetch).toBeCalledTimes(3);
  });

  it('sends notify with user session secret', async () => {
    const snack = new Snack({
      apiURL: 'https://exp.host',
      online: true,
      deviceId: '1234',
      user: { sessionSecret: '{"some":"json"}' },
    });
    expect(mockFetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Expo-Session': '{"some":"json"}',
        }),
      }),
    );
    snack.setOnline(false);
  });

  it('sends notify with user access token', async () => {
    const snack = new Snack({
      apiURL: 'https://exp.host',
      online: true,
      deviceId: '1234',
      user: { accessToken: 'sometoken' },
    });
    expect(mockFetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sometoken',
        }),
      }),
    );
    snack.setOnline(false);
  });
});
