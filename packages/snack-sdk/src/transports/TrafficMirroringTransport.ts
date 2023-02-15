import TransportImplPubNub from './TransportImplPubNub';
import TransportImplSocketIO from './TransportImplSocketIO';
import {
  SnackTransport,
  SnackTransportListener,
  SnackTransportMessage,
  SnackTransportOptions,
} from './types';

export default class TrafficMirroringTransport implements SnackTransport {
  private readonly transports: SnackTransport[];

  constructor(options: SnackTransportOptions) {
    this.transports = [new TransportImplPubNub(options), new TransportImplSocketIO(options)];
  }

  addEventListener(type: 'message', listener: SnackTransportListener): void {
    for (const transport of this.transports) {
      transport.addEventListener(type, listener);
    }
  }

  removeEventListener(type: 'message', listener: SnackTransportListener): void {
    for (const transport of this.transports) {
      transport.removeEventListener(type, listener);
    }
  }

  postMessage(message: SnackTransportMessage): void {
    for (const transport of this.transports) {
      transport.postMessage(message);
    }
  }
}
