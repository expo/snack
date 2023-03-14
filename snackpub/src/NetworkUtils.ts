import type { IncomingHttpHeaders, IncomingMessage } from 'http';

type ValueOf<T> = T[keyof T];

export function getRemoteAddress(req: IncomingMessage): string | undefined {
  return (
    getFirstHeaderValue(req.headers['cf-connecting-ip']) ??
    getFirstHeaderValue(req.headers['x-real-ip']) ??
    getFirstHeaderValue(req.headers['x-forwarded-for']) ??
    req.socket.remoteAddress
  );
}

function getFirstHeaderValue(headerValue: ValueOf<IncomingHttpHeaders>): string | undefined {
  const firstValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return firstValue?.split(/\s*,\s*/, 1)[0];
}
