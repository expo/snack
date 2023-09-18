import Snack from './snack-sdk';
import Transport from '../transports/__mocks__/TestTransport';

jest.mock('../transports');

describe('pubsub', () => {
  it('is disabled by default', async () => {
    const snack = new Snack({});
    expect(snack.getState().transports.pubsub).toBeUndefined();
    expect(snack.getState().online).toBe(false);
    expect(Transport.instances.length).toBe(0);
  });

  it('can be enabled initially', async () => {
    const snack = new Snack({ online: true });
    expect(snack.getState().transports.pubsub).toBeDefined();
    expect(snack.getState().online).toBe(true);
    expect(Transport.instances.length).toBe(1);
    const transport = Transport.instances[0];
    expect(transport.start).toHaveBeenCalledTimes(1);
    expect(transport.stop).toHaveBeenCalledTimes(0);
  });

  it('can be enabled afterwards', async () => {
    const snack = new Snack({});
    snack.setOnline(true);
    expect(snack.getState().transports.pubsub).toBeDefined();
    expect(snack.getState().online).toBe(true);
    expect(Transport.instances.length).toBe(1);
  });

  it('can be turned off afterwards', async () => {
    const snack = new Snack({ online: true });
    snack.setOnline(false);
    expect(snack.getState().transports.pubsub).toBeUndefined();
    expect(snack.getState().online).toBe(false);
    expect(Transport.instances.length).toBe(1);
    const transport = Transport.instances[0];
    expect(transport.stop).toHaveBeenCalledTimes(1);
  });

  it('accepts connections', async () => {
    const snack = new Snack({ online: true });
    const transport = Transport.instances[0];
    transport.connect();
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(1);
    expect(snack.getState().connectedClients).toMatchSnapshot();
  });

  it('ignores invalid uuids', async () => {
    const snack = new Snack({ online: true });
    const transport = Transport.instances[0];
    transport.connect('hola');
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });

  it('removes connections', async () => {
    const snack = new Snack({ online: true });
    const transport = Transport.instances[0];
    const uuid = transport.connect();
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(1);
    transport.disconnect(uuid);
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });
});
