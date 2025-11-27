import { wait } from './wait';

export default async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout, ...fetchOptions } = options;

  if (!timeout) {
    return globalThis.fetch(url, fetchOptions);
  }

  return Promise.race([globalThis.fetch(url, fetchOptions), wait(timeout).then(() => {
    throw new Error(`Request timeout after ${timeout}ms`);
  })]);
}
