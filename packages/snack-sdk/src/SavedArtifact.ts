import { validateArtifactReference, type SnackArtifactReference } from './Artifact';
import { isRecord } from './Compiler';

/** Saved launches read the existing Snack API, without requiring a live editor channel. */
export async function loadSavedArtifactReference(
  apiURL: string,
  id: string,
  signal: AbortSignal,
  read: (url: string, signal: AbortSignal) => Promise<string>,
): Promise<SnackArtifactReference> {
  const origin = new URL(apiURL);
  if (origin.origin !== apiURL || origin.protocol !== 'https:')
    throw new Error('Saved Snack API must be an HTTPS origin');
  if (!/^(?:[A-Za-z0-9_-]{1,100}|@[A-Za-z0-9_-]{1,100}\/[A-Za-z0-9_-]{1,100})$/.test(id))
    throw new Error('Invalid saved Snack identifier');
  signal.throwIfAborted();
  const text = await read(apiURL + '/v2/snack/' + id, signal);
  signal.throwIfAborted();
  if (new TextEncoder().encode(text).byteLength > 16 * 1024 * 1024)
    throw new Error('Saved Snack response exceeds limit');
  const saved: unknown = JSON.parse(text);
  if (!isRecord(saved) || !isRecord(saved.manifest) || saved.manifest.sdkVersion !== '58.0.0')
    throw new Error('Saved Snack requires SDK 58');
  const reference = saved.manifest.workerArtifact;
  if (!reference)
    throw new Error('This Snack has no published worker artifact; open and save it in the editor');
  validateArtifactReference(reference);
  return reference;
}
