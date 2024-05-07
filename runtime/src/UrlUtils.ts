import { parse as parseQueryString } from 'query-string';

/**
 * Parse the query parameters of the URL to extract the channel, and optional test transport.
 * Note, this is backported and should not be used in new code.
 */
export function parseExperienceURL(url: string) {
  try {
    const qs = parseQueryString(url.split('?')[1] || '');
    if (qs['snack-channel']) {
      return {
        channel: qs['snack-channel'] as string,
        testTransport: qs['testTransport'] as string | null,
      };
    }
  } catch {
    // Pass through
  }

  return null;
}

/**
 * @deprecated This format of URLs is being phased out
 */
export function parseClassicExperienceURL(
  experienceURL: string
): { channel: string; testTransport: string | null } | null {
  const matches = experienceURL.match(/(\+|\/sdk\..*-)([^?]*)\??(.*$)/);
  if (!matches) {
    return null;
  }
  const channel = matches[2];

  let testTransport = null;
  const queryItems = (matches[3] ?? '').split(/&/g);
  for (const item of queryItems) {
    if (item.startsWith('testTransport=')) {
      testTransport = item.substring(14);
      break;
    }
  }
  return {
    channel,
    testTransport,
  };
}
