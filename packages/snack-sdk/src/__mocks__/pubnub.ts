import {
  PublishParameters,
  PubnubStatus,
  PublishResponse,
  ListenerParameters,
  SubscribeParameters,
  UnsubscribeParameters,
} from 'pubnub';

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

export default class PubNub {
  static instances: PubNub[] = [];
  static devices = TEST_DEVICES;

  config: any;
  listener: ListenerParameters = {};
  channel: string = '';
  publishes: PublishParameters[] = [];
  connectIdx = 0;

  constructor(config: any) {
    this.config = config;
    PubNub.instances.push(this);
  }

  addListener = jest.fn((params: ListenerParameters) => {
    this.listener = params;
  });

  removeListener = jest.fn((_params: ListenerParameters) => {
    this.listener = {};
  });

  subscribe = jest.fn((params: SubscribeParameters) => {
    // @ts-expect-error
    this.channel = params.channels[0];
  });

  unsubscribe = jest.fn((_params: UnsubscribeParameters) => {
    this.channel = '';
  });

  stop = jest.fn(() => {
    this.listener = {};
    this.channel = '';
  });

  publish = jest.fn(
    (
      params: PublishParameters,
      _callback: (status: PubnubStatus, response: PublishResponse) => void
    ) => {
      this.publishes.push(params);
      return Promise.resolve();
    }
  );

  connect(uuid?: string): string {
    const device = TEST_DEVICES[uuid ?? 'ios'];
    uuid = device ? JSON.stringify(device) : uuid;
    // @ts-expect-error
    this.listener.presence({
      action: 'join',
      uuid: uuid ?? '',
      channel: this.channel,
    });
    return uuid ?? '';
  }

  disconnect(uuid?: string, timeout?: boolean) {
    const device = TEST_DEVICES[uuid ?? 'ios'];
    uuid = device ? JSON.stringify(device) : uuid;
    // @ts-expect-error
    this.listener.presence({
      action: timeout ? 'timeout' : 'leave',
      uuid: uuid ?? '',
      channel: this.channel,
    });
    return uuid ?? '';
  }

  sendMessage(message: any, uuid?: string) {
    const device = TEST_DEVICES[uuid ?? 'ios'];
    uuid = device ? JSON.stringify(device) : uuid;
    // @ts-expect-error
    this.listener.message({
      channel: this.channel,
      message,
      publisher: uuid ?? '',
    });
  }
}

beforeEach(() => {
  PubNub.instances = [];
});
