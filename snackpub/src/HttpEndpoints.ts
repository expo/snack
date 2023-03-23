import http from 'http';

import { type NullableRedisClientType } from './types';

export function createHttpEndpointsListener(
  requestHandlers: RequestHandler[]
): http.RequestListener {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    for (const requestHandler of requestHandlers) {
      const handled = await requestHandler.processAsync(req, res);
      if (handled) {
        return;
      }
    }

    res.writeHead(404);
    res.end();
  };
}

export interface RequestHandler {
  processAsync(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean>;
}

export class ReadOnlyRequestsHandler implements RequestHandler {
  async processAsync(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
    if (req.method != null && !['GET', 'OPTIONS'].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return true;
    }
    return false;
  }
}

export class LivenessRequestHandler implements RequestHandler {
  async processAsync(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
    if (req.url === '/status/live') {
      res.writeHead(200);
      res.end('Live');
      return true;
    }
    return false;
  }
}

export class ReadinessRequestHandler implements RequestHandler {
  private readonly redisClients: NullableRedisClientType[];

  constructor(redisClients: NullableRedisClientType[]) {
    this.redisClients = redisClients;
  }

  async processAsync(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
    if (req.url === '/status/ready') {
      let ready = true;
      for (const redisClient of this.redisClients) {
        if ((redisClient?.isReady ?? true) === false) {
          ready = false;
          break;
        }
      }

      if (ready) {
        res.writeHead(200);
        res.end('Ready');
      } else {
        res.writeHead(503);
        res.end('Unready');
      }
      return true;
    }
    return false;
  }
}
