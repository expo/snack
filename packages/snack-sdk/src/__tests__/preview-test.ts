import '../__mocks__/fetch';
import Snack from './snack-sdk';
import { ProtocolStatusMessage } from '../transports/Protocol';
import Transport from '../transports/__mocks__/TestTransport';

jest.mock('../transports');

describe('preview', () => {
  it('sends preview request once per transport', async () => {
    const snack = new Snack({
      online: true,
    });
    const transport = Transport.instances[0];
    transport.connect('ios');
    transport.connect('android');
    expect(transport.publishes).toHaveLength(2);
    snack.getPreviewAsync();
    expect(transport.publishes).toHaveLength(3);
    expect(transport.publishes[2].message.type).toBe('REQUEST_STATUS');
    snack.setOnline(false);
  });

  it('times out preview request when no response received', async () => {
    const snack = new Snack({
      online: true,
      previewTimeout: 50,
    });
    const transport = Transport.instances[0];
    transport.connect('ios');
    await expect(snack.getPreviewAsync()).rejects.toBeDefined();
    snack.setOnline(false);
  });

  it('waits for preview request to complete', async () => {
    const snack = new Snack({
      online: true,
      previewTimeout: 100,
    });
    const transport = Transport.instances[0];
    transport.connect('ios');
    const promise = snack.getPreviewAsync();
    const statusMessage: ProtocolStatusMessage = {
      type: 'STATUS_REPORT',
      status: 'SUCCESS',
      previewLocation: 'https://test.com/preview.jpg',
    };
    transport.sendMessage(statusMessage);
    const connections = await promise;
    const connectionIds = Object.keys(connections);
    expect(connectionIds).toHaveLength(1);
    expect(connections[connectionIds[0]].previewURL).toBe(statusMessage.previewLocation);
    snack.setOnline(false);
  });

  it('preview request completes immediately when there are no connections', async () => {
    const snack = new Snack({
      online: true,
      previewTimeout: 100,
    });
    const connections = await snack.getPreviewAsync();
    const connectionIds = Object.keys(connections);
    expect(connectionIds).toHaveLength(0);
    snack.setOnline(false);
  });

  it('requests preview on save', async () => {
    const snack = new Snack({
      online: true,
      previewTimeout: 100,
      files: {
        'App.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    const transport = Transport.instances[0];
    transport.connect('ios');
    expect(transport.publishes).toHaveLength(1);
    const savePromise = snack.saveAsync();
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(transport.publishes).toHaveLength(2);
    const statusMessage: ProtocolStatusMessage = {
      type: 'STATUS_REPORT',
      status: 'SUCCESS',
      previewLocation: 'https://test.com/preview.jpg',
    };
    transport.sendMessage(statusMessage);
    await savePromise;
    snack.setOnline(false);
  });
});
