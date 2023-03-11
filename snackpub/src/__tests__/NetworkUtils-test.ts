import type { IncomingMessage } from 'http';

import { getRemoteAddress } from '../NetworkUtils';

describe(getRemoteAddress, () => {
  it('should respect `x-forwarded-for` header', () => {
    const req = {
      headers: {
        'x-forwarded-for': '10.0.0.1',
      },
      socket: {
        address: '127.0.0.1',
      },
    } as unknown as IncomingMessage;
    expect(getRemoteAddress(req)).toBe('10.0.0.1');
  });

  it('should get first value from `x-forwarded-for` header', () => {
    const req = {
      headers: {
        'x-forwarded-for': '10.0.0.1, 10.0.0.2',
      },
      socket: {
        address: '127.0.0.1',
      },
    } as unknown as IncomingMessage;
    expect(getRemoteAddress(req)).toBe('10.0.0.1');
  });

  it('should use socket remoteAddress as fallback', () => {
    const req = {
      headers: {
        host: 'www.example.org',
      },
      socket: {
        remoteAddress: '127.0.0.1',
      },
    } as unknown as IncomingMessage;
    expect(getRemoteAddress(req)).toBe('127.0.0.1');
  });
});
