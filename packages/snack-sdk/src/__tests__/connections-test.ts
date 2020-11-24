import PubNub from '../__mocks__/pubnub';
import Snack from './snack-sdk';

beforeEach(() => {
  PubNub.instances = [];
});

describe('connectedClients', () => {
  it('has no connectedClients initially', async () => {
    const snack = new Snack({});
    expect(snack.getState().connectedClients).toMatchObject({});
  });

  it('removes connectedClients when no longer online', async () => {
    const snack = new Snack({
      online: true,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect('ios');
    pubnub.connect('android');
    expect(pubnub.publishes).toHaveLength(2);
    snack.setOnline(false);
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });

  it('sends reload request when connectedClients exist', async () => {
    const snack = new Snack({
      online: true,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    snack.reloadConnectedClients();
    expect(pubnub.publishes).toHaveLength(2);
    expect(pubnub.publishes[1].message.type).toBe('RELOAD_SNACK');
  });

  it('sends reload once for each transport', async () => {
    const snack = new Snack({
      online: true,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect('ios');
    pubnub.connect('android');
    expect(pubnub.publishes).toHaveLength(2);
    snack.reloadConnectedClients();
    expect(pubnub.publishes).toHaveLength(3);
    expect(pubnub.publishes[2].message.type).toBe('RELOAD_SNACK');
  });

  it('send no reload when no connectedClients exist', async () => {
    const snack = new Snack({
      online: true,
    });
    const pubnub = PubNub.instances[0];
    snack.reloadConnectedClients();
    expect(pubnub.publishes).toHaveLength(0);
  });

  it('keeps connectedClients until reloadTimeout has expired', async () => {
    const snack = new Snack({
      online: true,
      reloadTimeout: 40,
    });
    const pubnub = PubNub.instances[0];
    const uuid = pubnub.connect();
    snack.reloadConnectedClients();
    pubnub.disconnect(uuid);
    const connectedClients = Object.keys(snack.getState().connectedClients);
    expect(connectedClients).toHaveLength(1);
    expect(snack.getState().connectedClients[connectedClients[0]].status).toBe('reloading');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });
});
