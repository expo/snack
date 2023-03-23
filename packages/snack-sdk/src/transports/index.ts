import TrafficMirroringTransport from './TrafficMirroringTransport';
import TransportImplPubNub from './TransportImplPubNub';
import TransportImplSocketIO from './TransportImplSocketIO';
import { SnackTransport, SnackTransportOptions } from './types';

export * from './types';
export * from './ConnectionMetricsEmitter';
export { default as ConnectionMetricsEmitter } from './ConnectionMetricsEmitter';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  return new TransportImplPubNub(options);
}

export function createSnackPubTransport(options: SnackTransportOptions): SnackTransport {
  return new TrafficMirroringTransport(options);
}

export function createSnackPubOnlyTransport(options: SnackTransportOptions): SnackTransport {
  return new TransportImplSocketIO(options);
}
