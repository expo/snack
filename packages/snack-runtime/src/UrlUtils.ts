export function parseExperienceURL(
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
