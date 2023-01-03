import TransportImplPubNub from './TransportImplPubNub';
import TransportImplSocketIO from './TransportImplSocketIO';
import {
  SnackTransport,
  SnackTransportListener,
  SnackTransportMessage,
  SnackTransportOptions,
} from './types';

export default class CompositedTransport implements SnackTransport {
  private readonly _transports: SnackTransport[];

  constructor(options: SnackTransportOptions) {
    this._transports = [new TransportImplPubNub(options), new TransportImplSocketIO(options)];
  }

  addEventListener(type: 'message', listener: SnackTransportListener): void {
    for (const transport of this._transports) {
      transport.addEventListener(type, listener);
    }
  }

  removeEventListener(type: 'message', listener: SnackTransportListener): void {
    for (const transport of this._transports) {
      transport.removeEventListener(type, listener);
    }
  }

  postMessage(message: SnackTransportMessage): void {
    for (const transport of this._transports) {
      transport.postMessage(message);
    }
  }
}
