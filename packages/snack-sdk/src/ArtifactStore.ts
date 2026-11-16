import {
  browserArtifactDigest,
  SnackArtifactReference,
  SnackArtifactStore,
  validateArtifactReference,
} from './Artifact';
import { validateCompiledArtifact } from './Compiler';
import { fetch } from './utils';

/** Reuses Snack's existing S3 code-upload API. Never places compiled code in source files. */
export function createSnackArtifactStore(apiURL: string): SnackArtifactStore {
  const cache = new Map<string, SnackArtifactReference['chunks'][number]>();
  return {
    async upload(artifact, signal) {
      validateCompiledArtifact(artifact, '58.0.0');
      const text = JSON.stringify(artifact),
        chunks: SnackArtifactReference['chunks'] = [];
      for (let offset = 0; offset < text.length; ) {
        if (signal.aborted) throw new Error('Artifact publication canceled');
        let end = Math.min(offset + 100000, text.length);
        if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
        const code = text.slice(offset, end);
        offset = end;
        const sha256 = await browserArtifactDigest(code),
          byteLength = new TextEncoder().encode(code).length;
        let chunk = cache.get(sha256);
        if (!chunk) {
          const response = await fetch(apiURL + '/v2/snack/uploadCode', {
            method: 'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });
          if (!response.ok) throw new Error('Compiled Snack upload failed: ' + response.status);
          const result = await response.json();
          chunk = { url: result.url, sha256, byteLength };
          validateArtifactReference({
            format: 'snack-worker-graph',
            version: 1,
            sdkVersion: '58.0.0',
            sha256,
            byteLength,
            chunks: [chunk],
          });
          cache.set(sha256, chunk);
          while (cache.size > 256) cache.delete(cache.keys().next().value!);
        }
        chunks.push(chunk);
      }
      const reference: SnackArtifactReference = {
        format: 'snack-worker-graph',
        version: 1,
        sdkVersion: '58.0.0',
        sha256: await browserArtifactDigest(text),
        byteLength: new TextEncoder().encode(text).length,
        chunks,
      };
      validateArtifactReference(reference);
      if (signal.aborted) throw new Error('Artifact publication canceled');
      return reference;
    },
  };
}
