import http from 'http';

import {
  LivenessRequestHandler,
  ReadinessRequestHandler,
  ReadOnlyRequestsHandler,
} from '../HttpEndpoints';
import type { RedisClientType } from '../types';

describe(ReadOnlyRequestsHandler, () => {
  it('should return http 405 for any DELETE/POST/PUT requests', async () => {
    const methods = ['DELETE', 'POST', 'PUT'];
    for (const method of methods) {
      const req = createMockReq();
      const res = createMockRes();

      req.method = method;
      await new ReadOnlyRequestsHandler().processAsync(req, res);
      expect(res.writeHead.mock.calls[0][0]).toBe(405);
    }
  });

  it('should allow GET/OPTIONS requests', async () => {
    const methods = ['GET', 'OPTIONS'];
    for (const method of methods) {
      const req = createMockReq();
      const res = createMockRes();

      req.method = method;
      await new ReadOnlyRequestsHandler().processAsync(req, res);
      expect(res.writeHead.mock.calls.length).toBe(0);
      expect(res.end.mock.calls.length).toBe(0);
    }
  });
});

describe(LivenessRequestHandler, () => {
  it('should return http 200 for `/status/live` requests', async () => {
    const req = createMockReq();
    const res = createMockRes();

    req.url = '/status/live';
    await new LivenessRequestHandler().processAsync(req, res);
    expect(res.writeHead.mock.calls[0][0]).toBe(200);
  });
});

describe(ReadinessRequestHandler, () => {
  function createMockRedisClient(isReady: boolean): RedisClientType {
    return { isReady } as RedisClientType;
  }

  it('should return http 200 for `/status/ready` requests when not using redis adapters', async () => {
    const req = createMockReq();
    const res = createMockRes();

    req.url = '/status/ready';
    await new ReadinessRequestHandler([]).processAsync(req, res);
    expect(res.writeHead.mock.calls[0][0]).toBe(200);
  });

  it('should return http 200 for `/status/ready` requests when redis clients are all ready', async () => {
    const req = createMockReq();
    const res = createMockRes();

    req.url = '/status/ready';
    const redisClients = [
      createMockRedisClient(true),
      createMockRedisClient(true),
      createMockRedisClient(true),
    ];
    await new ReadinessRequestHandler(redisClients).processAsync(req, res);
    expect(res.writeHead.mock.calls[0][0]).toBe(200);
  });

  it('should return http 503 for `/status/ready` requests if any redis client unavailable', async () => {
    const req = createMockReq();
    const res = createMockRes();

    req.url = '/status/ready';
    const redisClients = [
      createMockRedisClient(true),
      createMockRedisClient(false),
      createMockRedisClient(true),
    ];
    await new ReadinessRequestHandler(redisClients).processAsync(req, res);
    expect(res.writeHead.mock.calls[0][0]).toBe(503);
  });
});

function createMockReq() {
  return {
    method: 'GET',
    url: '/',
  } as jest.Mocked<http.IncomingMessage>;
}

function createMockRes() {
  return {
    end: jest.fn(),
    write: jest.fn(),
    writeHead: jest.fn(),
  } as unknown as jest.Mocked<http.ServerResponse>;
}
