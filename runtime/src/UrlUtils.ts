/** @deprecated This function is using legacy URL format */
export function parseExperienceURL(
  experienceURL: string,
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

export function getSnackFromUrl(initialUrl: string): {
  /** The code transport channel to listen to, for communications with the Snack website */
  channel: string | null;
} {
  // Remove non-standard protocols and default to http, so we can parse the URL properly
  const url = new URL(initialUrl.replace(/^[a-z]+:/i, 'http:'));

  return {
    channel: url.searchParams.get('snack-channel'),
  };
}
