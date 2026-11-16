import { fetch } from 'expo/fetch';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

import {
  loadCompiledArtifact,
  type SnackArtifactReference,
} from '../../../packages/snack-sdk/src/Artifact';
import { loadSavedArtifactReference } from '../../../packages/snack-sdk/src/SavedArtifact';

export async function downloadSdkArtifact(reference: SnackArtifactReference, signal: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 30000);
  try {
    return await loadCompiledArtifact(reference, {
      digest: (text) => digestStringAsync(CryptoDigestAlgorithm.SHA256, text),
      read: async (url, maximumBytes) => {
        const response = await fetch(url, {
          signal: controller.signal,
          credentials: 'omit',
          redirect: 'error',
        });
        if (!response.ok || !response.body) throw Error('Compiled Snack download failed');
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > maximumBytes) throw Error('Compiled Snack download exceeds limit');
            chunks.push(value);
          }
        } finally {
          await reader.cancel();
        }
        const data = new Uint8Array(bytes);
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return new TextDecoder('utf-8', { fatal: true }).decode(data);
      },
    });
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

export async function downloadSavedSdkArtifact(apiURL: string, id: string, signal: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 30000);
  try {
    const reference = await loadSavedArtifactReference(
      apiURL,
      id,
      controller.signal,
      async (url, signal) => {
        const response = await fetch(url, { signal, credentials: 'omit', redirect: 'error' });
        if (!response.ok || !response.body)
          throw Error('Saved Snack could not be loaded (' + response.status + ')');
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: true });
        let text = '',
          bytes = 0;
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > 16 * 1024 * 1024) throw Error('Saved Snack response exceeds limit');
            text += decoder.decode(value, { stream: true });
          }
          text += decoder.decode();
        } finally {
          await reader.cancel();
        }
        return text;
      },
    );
    return await downloadSdkArtifact(reference, controller.signal);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}
