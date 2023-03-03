import { SnackTransport, SnackTransportOptions } from '../index';
import TestTransport from './TestTransport';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  const result = new TestTransport(options);
  return result;
}

export function createSnackPubTransport(options: SnackTransportOptions): SnackTransport {
  return new TestTransport(options);
}
