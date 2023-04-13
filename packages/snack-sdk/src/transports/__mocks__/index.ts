import { SnackTransport, SnackTransportOptions } from '../index';
import TestTransport from './TestTransport';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  const result = new TestTransport(options);
  return result;
}

export function createTrafficMirroringTransport(options: SnackTransportOptions): SnackTransport {
  return new TestTransport(options);
}
