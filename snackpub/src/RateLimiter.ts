import type { createClient } from 'redis';

interface RateLimiterOptions {
  maxOperations: number;
  intervalSeconds: number;
}

export default class RateLimiter {
  constructor(private readonly redisClient: ReturnType<typeof createClient>) {}

  public hasExceededRemoteAddressRateAsync(
    remoteAddress: string,
    _socketId: string,
    options: RateLimiterOptions = { maxOperations: 30, intervalSeconds: 60 } // 30 connections per IP per minute
  ): Promise<boolean> {
    return this.hasExceededKeyAsync(remoteAddress, `remoteAddr:${remoteAddress}`, options);
  }

  public async hasExceededMessagesRateAsync(
    remoteAddress: string,
    socketId: string,
    options?: {
      dosPrevention?: RateLimiterOptions;
      fairUsage?: RateLimiterOptions;
    }
  ): Promise<boolean> {
    // A short internal to prevent DOS: 600 messages per socket.id per second
    const optsDosPrevention = options?.dosPrevention ?? { maxOperations: 600, intervalSeconds: 1 };

    // Longer internal for fair usage: 6000 messages per socket.id per minute
    const optsFairUsage = options?.fairUsage ?? { maxOperations: 6000, intervalSeconds: 60 };

    const results = await Promise.all([
      this.hasExceededKeyAsync(
        remoteAddress,
        `messagesDosPrevention:${socketId}`,
        optsDosPrevention
      ),
      this.hasExceededKeyAsync(remoteAddress, `messagesFairUsage:${socketId}`, optsFairUsage),
    ]);

    return results.some((result) => !!result);
  }

  public hasExceededChannelsRateAsync(
    remoteAddress: string,
    socketId: string,
    options: RateLimiterOptions = { maxOperations: 30, intervalSeconds: 60 } // 30 channels per socket.id per minute
  ): Promise<boolean> {
    return this.hasExceededKeyAsync(remoteAddress, `channels:${socketId}`, options);
  }

  private async hasExceededKeyAsync(
    remoteAddress: string,
    key: string,
    options: RateLimiterOptions
  ): Promise<boolean> {
    const { intervalSeconds } = options;
    const redisKey = this.createRedisKey(key, intervalSeconds);
    const [operations] = await this.redisClient
      .multi()
      .incr(redisKey)
      .expire(redisKey, intervalSeconds)
      .exec();

    const operationsString = operations?.toString() ?? '0';
    const operationsInt = parseInt(operationsString, 10);
    if (operationsInt === options.maxOperations + 1) {
      // Log only once when exceeding limits
      console.log(
        `[RateLimiter] exceeding limits - remoteAddress[${remoteAddress}] redisKey[${redisKey}]`
      );
    }
    if (operationsInt > options.maxOperations) {
      return true;
    }
    return false;
  }

  private createRedisKey(key: string, intervalSeconds: number): string {
    const intervalIndex = Math.floor(Date.now() / 1000 / intervalSeconds);
    // Simplified rate limiter that cache hitting doesn't extend the time window.
    return `snackpub:rate:${key}:${intervalIndex}`;
  }
}
