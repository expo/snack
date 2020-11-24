import Transport from './Transport';
import { SnackTransport, SnackTransportOptions } from './types';

export * from './types';

export function createTransport(options: SnackTransportOptions): SnackTransport {
  return new Transport(options);
}
