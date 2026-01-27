import TestTransport from './TestTransport';
import { SnackTransport, SnackTransportOptions } from '../index';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  return new TestTransport(options);
}
