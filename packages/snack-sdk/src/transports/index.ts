import TrafficMirroringTransport from './TrafficMirroringTransport';
import TransportImplPubNub from './TransportImplPubNub';
import { SnackTransport, SnackTransportOptions } from './types';

export * from './types';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  return new TransportImplPubNub(options);
}

export function createSnackPubTransport(options: SnackTransportOptions): SnackTransport {
  return new TrafficMirroringTransport(options);
}
