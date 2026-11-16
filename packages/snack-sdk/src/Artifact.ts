import { SnackCompiledArtifact, isRecord, validateCompiledArtifact } from './Compiler';

export type SnackArtifactReference = {
  format: 'snack-worker-graph';
  version: 1;
  sdkVersion: '58.0.0';
  sha256: string;
  byteLength: number;
  chunks: { url: string; sha256: string; byteLength: number }[];
};
export type SnackArtifactDigest = (text: string) => Promise<string>;
export interface SnackArtifactStore {
  upload(artifact: SnackCompiledArtifact, signal: AbortSignal): Promise<SnackArtifactReference>;
}
export const artifactByteLimit = 15 * 1024 * 1024;
export function validateArtifactReference(
  reference: unknown,
): asserts reference is SnackArtifactReference {
  const validDigest = (value: unknown) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const validSize = (value: unknown, maximum: number): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= maximum;
  if (
    !isRecord(reference) ||
    reference.format !== 'snack-worker-graph' ||
    reference.version !== 1 ||
    reference.sdkVersion !== '58.0.0' ||
    !validDigest(reference.sha256) ||
    !validSize(reference.byteLength, artifactByteLimit) ||
    !Array.isArray(reference.chunks) ||
    !reference.chunks.length ||
    reference.chunks.length > 256
  )
    throw new Error('Invalid compiled Snack reference');
  let total = 0;
  for (const chunk of reference.chunks as unknown[]) {
    if (
      !isRecord(chunk) ||
      typeof chunk.url !== 'string' ||
      !/^https:\/\/snack-code-uploads\.s3\.us-west-1\.amazonaws\.com\/~code\/[a-f0-9]{32}$/.test(
        chunk.url,
      ) ||
      !validDigest(chunk.sha256) ||
      !validSize(chunk.byteLength, 400000)
    )
      throw new Error('Invalid compiled Snack reference');
    total += chunk.byteLength;
  }
  if (total !== reference.byteLength) throw new Error('Invalid compiled Snack reference');
}
export const browserArtifactDigest: SnackArtifactDigest = async (text) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
/** Verify size and digest before parsing or evaluating downloaded code. */
export async function loadCompiledArtifact(
  reference: SnackArtifactReference,
  options: {
    read: (url: string, maximumBytes: number) => Promise<string>;
    digest: SnackArtifactDigest;
  },
) {
  validateArtifactReference(reference);
  const chunks: string[] = [];
  for (const chunk of reference.chunks) {
    const text = await options.read(chunk.url, chunk.byteLength);
    if (
      new TextEncoder().encode(text).length !== chunk.byteLength ||
      (await options.digest(text)) !== chunk.sha256
    )
      throw new Error('Compiled Snack chunk failed integrity verification');
    chunks.push(text);
  }
  const text = chunks.join('');
  if ((await options.digest(text)) !== reference.sha256)
    throw new Error('Compiled Snack failed integrity verification');
  const artifact: unknown = JSON.parse(text);
  validateCompiledArtifact(artifact, reference.sdkVersion);
  return artifact;
}
