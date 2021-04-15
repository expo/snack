import redis from 'redis';

// Need to require actual Redis, not the mock
const { createRedisClient } = jest.requireActual('../redis');

jest.mock('redis', () => ({ createClient: jest.fn() }));
jest.mock('../../config', () => ({
  redis: {
    url: 'rediss://127.0.0.1:6379',
    // Can't refer to path here, outer-scope variable.
    // It's the path from Jest root
    tls_ca: 'src/external/__fixtures__/redis.pem',
  },
}));

it('exports redis factory', () => {
  expect(createRedisClient).toBeInstanceOf(Function);
});

it('factory creates secure redis instance with tls ca and options', () => {
  createRedisClient({ custom: 'option' });
  expect(redis.createClient).toBeCalledWith(
    'rediss://127.0.0.1:6379',
    expect.objectContaining({
      custom: 'option',
      tls: { ca: expect.any(Buffer) },
    })
  );
});
