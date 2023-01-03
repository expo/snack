import { ProtocolOutgoingMessage, ProtocolCodeMessage } from '../Protocol';
import TransportImplBase from '../TransportImplBase';
import { SnackTransportOptions } from '../index';

const TEST_DEVICES: any = {
  ios: {
    platform: 'ios',
    id: '7682-1234',
    name: 'iPhone 8',
  },
  android: {
    platform: 'android',
    id: 'xxxx-xxxx',
    name: 'Nexus 8',
  },
};

export default class TestTransport extends TransportImplBase {
  static instances: TestTransport[] = [];
  static devices = TEST_DEVICES;

  publishes: { channel: string; message: ProtocolOutgoingMessage }[] = [];
  started = false;
  static mockVerifyCodeMessageSize = jest.fn((codeMessage: ProtocolCodeMessage) => true);

  constructor(options: SnackTransportOptions) {
    super(options);
    TestTransport.instances.push(this);
  }

  start = jest.fn(() => {
    this.started = true;
  });

  stop = jest.fn(() => {
    this.started = false;
  });

  isStarted = jest.fn(() => {
    return this.started;
  });

  sendAsync = jest.fn((channel: string, message: ProtocolOutgoingMessage) => {
    this.publishes.push({
      channel,
      message,
    });
    return Promise.resolve();
  });

  onVerifyCodeMessageSize(codeMessage: ProtocolCodeMessage) {
    return TestTransport.mockVerifyCodeMessageSize(codeMessage);
  }

  connect(uuid?: string): string {
    const device = TEST_DEVICES[uuid ?? 'ios'];
    uuid = device ? JSON.stringify(device) : uuid;
    this.handleChannelEvent('join', uuid ?? '');
    return uuid ?? '';
  }

  disconnect(uuid?: string) {
    const device = TEST_DEVICES[uuid ?? 'ios'];
    uuid = device ? JSON.stringify(device) : uuid;
    this.handleChannelEvent('leave', uuid ?? '');
    return uuid ?? '';
  }

  sendMessage(message: any, uuid?: string) {
    const device = TEST_DEVICES[uuid ?? 'ios'];
    uuid = device ? JSON.stringify(device) : uuid;
    this.handleMessage(uuid ?? '', message);
  }
}

beforeEach(() => {
  TestTransport.instances = [];
  TestTransport.mockVerifyCodeMessageSize.mockReturnValue(true);
});
