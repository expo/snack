import '../__mocks__/fetch-mock-server';
import Snack from './snack-sdk';
import { ProtocolErrorMessage } from '../transports/Protocol';
import Transport from '../transports/__mocks__/TestTransport';

jest.mock('../transports');

describe('connectedClients', () => {
  it('has no connectedClients initially', async () => {
    const snack = new Snack({});
    expect(snack.getState().connectedClients).toMatchObject({});
  });

  it('removes connectedClients when no longer online', async () => {
    const snack = new Snack({
      online: true,
    });
    const transport = Transport.instances[0];
    transport.connect('ios');
    transport.connect('android');
    expect(transport.publishes).toHaveLength(2);
    snack.setOnline(false);
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });

  it('sends reload request when connectedClients exist', async () => {
    const snack = new Snack({
      online: true,
    });
    const transport = Transport.instances[0];
    transport.connect();
    expect(transport.publishes).toHaveLength(1);
    snack.reloadConnectedClients();
    expect(transport.publishes).toHaveLength(2);
    expect(transport.publishes[1].message.type).toBe('RELOAD_SNACK');
  });

  it('sends reload once for each transport', async () => {
    const snack = new Snack({
      online: true,
    });
    const transport = Transport.instances[0];
    transport.connect('ios');
    transport.connect('android');
    expect(transport.publishes).toHaveLength(2);
    snack.reloadConnectedClients();
    expect(transport.publishes).toHaveLength(3);
    expect(transport.publishes[2].message.type).toBe('RELOAD_SNACK');
  });

  it('send no reload when no connectedClients exist', async () => {
    const snack = new Snack({
      online: true,
    });
    const transport = Transport.instances[0];
    snack.reloadConnectedClients();
    expect(transport.publishes).toHaveLength(0);
  });

  it('keeps connectedClients until reloadTimeout has expired', async () => {
    const snack = new Snack({
      online: true,
      reloadTimeout: 40,
    });
    const transport = Transport.instances[0];
    const uuid = transport.connect();
    snack.reloadConnectedClients();
    transport.disconnect(uuid);
    const connectedClients = Object.keys(snack.getState().connectedClients);
    expect(connectedClients).toHaveLength(1);
    expect(snack.getState().connectedClients[connectedClients[0]].status).toBe('reloading');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(Object.keys(snack.getState().connectedClients)).toHaveLength(0);
  });

  it('ignores messages (errors/logs) for clients who have not advertised their presence', async () => {
    const snack = new Snack({
      online: true,
    });
    const transport = Transport.instances[0];

    const errorMessage: ProtocolErrorMessage = {
      type: 'ERROR',
      error: '{"message": "something went wrong"}',
      device: Transport.devices.ios,
    };
    transport.sendMessage(errorMessage);

    const connectedClients = Object.keys(snack.getState().connectedClients);
    expect(connectedClients).toHaveLength(0);
  });
});
