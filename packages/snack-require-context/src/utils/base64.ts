import { Buffer } from 'buffer';

/** Convert any string to a URL-safe base64 string. */
export function encodeBase64(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Convert a URL-safe base64 string to its original value. */
export function decodeBase64(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}
