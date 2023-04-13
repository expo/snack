import TrafficMirroringTransport from './TrafficMirroringTransport';
import TransportImplSocketIO from './TransportImplSocketIO';
import { SnackTransport, SnackTransportOptions } from './types';

export * from './types';
export * from './ConnectionMetricsEmitter';
export { default as ConnectionMetricsEmitter } from './ConnectionMetricsEmitter';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  return new TransportImplSocketIO(options);
}

export function createTrafficMirroringTransport(options: SnackTransportOptions): SnackTransport {
  return new TrafficMirroringTransport(options);
}
