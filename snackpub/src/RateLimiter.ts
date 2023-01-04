import type { createClient } from 'redis';

interface RateLimiterOptions {
  maxOperations: number;
  intervalSeconds: number;
}

export default class RateLimiter {
  constructor(private readonly redisClient: ReturnType<typeof createClient>) {}

  public hasExceededSrcIpRateAsync(
    srcIp: string,
    _socketId: string,
    options: RateLimiterOptions = { maxOperations: 30, intervalSeconds: 60 } // 30 connections per IP per hour
  ): Promise<boolean> {
    return this.hasExceededKeyAsync(srcIp, `ip:${srcIp}`, options);
  }

  public hasExceededMessagesRateAsync(
    srcIp: string,
    socketId: string,
    options: RateLimiterOptions = { maxOperations: 600, intervalSeconds: 1 } // 600 messages per socket.id per second
  ): Promise<boolean> {
    return this.hasExceededKeyAsync(srcIp, `messages:${socketId}`, options);
  }

  public hasExceededChannelsRateAsync(
    srcIp: string,
    socketId: string,
    options: RateLimiterOptions = { maxOperations: 30, intervalSeconds: 60 } // 30 channels per socket.id per minute
  ): Promise<boolean> {
    return this.hasExceededKeyAsync(srcIp, `channels:${socketId}`, options);
  }

  private async hasExceededKeyAsync(
    srcIp: string,
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

    const operationsInt = parseInt((operations ?? '0').toString(), 10);
    // The `operationsInt` is the value after incr(), we should minus one back
    if (operationsInt - 1 >= options.maxOperations) {
      await this.redisClient.decr(redisKey);
      console.log(`[RateLimiter] exceeding limits - srcIp[${srcIp}] redisKey[${redisKey}]`);
      return true;
    }
    return false;
  }

  private createRedisKey(key: string, intervalSeconds: number): string {
    const intervalIndex = Math.floor(new Date().getTime() / 1000 / intervalSeconds);
    // Simplified rate limiter that cache hitting doesn't extend the time window.
    return `snackpub:rate:${key}:${intervalIndex}`;
  }
}
