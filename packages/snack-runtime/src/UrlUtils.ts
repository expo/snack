/**
 * Return the `testTransport` query parameter from a Snack URL, if provided.
 */
export function parseTestTransportFromUrl(snackUrl: string) {
  const url = new URL(snackUrl.replace(/^[a-z]+:/i, 'http://'));
  return url.searchParams.get('testTransport');
}
