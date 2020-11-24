import PubNub from '../__mocks__/pubnub';
import Snack from './snack-sdk';

beforeEach(() => {
  PubNub.instances = [];
});

describe('pubnub', () => {
  it('is disabled by default', async () => {
    const snack = new Snack({});
    expect(snack.getState().transports.pubnub).toBeUndefined();
    expect(snack.getState().online).toBe(false);
    expect(PubNub.instances.length).toBe(0);
  });

  it('can be enabled initially', async () => {
    const snack = new Snack({ online: true });
    expect(snack.getState().transports.pubnub).toBeDefined();
    expect(snack.getState().online).toBe(true);
    expect(PubNub.instances.length).toBe(1);
    const pubnub = PubNub.instances[0];
    expect(pubnub.addListener).toHaveBeenCalledTimes(1);
    expect(pubnub.subscribe).toHaveBeenCalledTimes(1);
    expect(pubnub.removeListener).toHaveBeenCalledTimes(0);
    expect(pubnub.unsubscribe).toHaveBeenCalledTimes(0);
  });

  it('can be enabled afterwards', async () => {
    const snack = new Snack({});
    snack.setOnline(true);
    expect(snack.getState().transports.pubnub).toBeDefined();
    expect(snack.getState().online).toBe(true);
    expect(PubNub.instances.length).toBe(1);
  });

  it('can be turned off afterwards', async () => {
    const snack = new Snack({ online: true });
    snack.setOnline(false);
    expect(snack.getState().transports.pubnub).toBeUndefined();
    expect(snack.getState().online).toBe(false);
    expect(PubNub.instances.length).toBe(1);
    const pubnub = PubNub.instances[0];
    expect(pubnub.removeListener).toHaveBeenCalledTimes(1);
    expect(pubnub.unsubscribe).toHaveBeenCalledTimes(1);
    expect(pubnub.stop).toHaveBeenCalledTimes(1);
  });

  it('accepts connections', async () => {
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(1);
    expect(snack.getState().connectedClients).toMatchSnapshot();
  });

  it('ignores invalid uuids', async () => {
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    pubnub.connect('hola');
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });

  it('removes connections', async () => {
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    const uuid = pubnub.connect();
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(1);
    pubnub.disconnect(uuid);
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });

  it('removes timed out connections', async () => {
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    const uuid = pubnub.connect();
    pubnub.disconnect(uuid, true);
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });
});
