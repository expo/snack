import TestTransport from './TestTransport';
import { SnackTransport, SnackTransportOptions } from '../index';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  const result = new TestTransport(options);
  return result;
}

export function createTrafficMirroringTransport(options: SnackTransportOptions): SnackTransport {
  return new TestTransport(options);
}
