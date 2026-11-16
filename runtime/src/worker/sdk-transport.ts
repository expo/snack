import { io } from 'socket.io-client';

import {
  validateArtifactReference,
  type SnackArtifactReference,
} from '../../../packages/snack-sdk/src/Artifact';
import {
  isRecord,
  validateCompiledArtifact,
  type SnackCompiledArtifact,
} from '../../../packages/snack-sdk/src/Compiler';
import type {
  ProtocolCompiledCodeMessage,
  ProtocolCompiledReferenceMessage,
} from '../../../packages/snack-sdk/src/transports/Protocol';

export interface NativeRuntimePayload {
  flight: string;
  client: {
    hash: string;
    modules: Record<string, unknown>;
    roots: Record<string, { file: string }>;
  };
}
type CompiledMessage = ProtocolCompiledCodeMessage | ProtocolCompiledReferenceMessage;
interface SessionOptions {
  url: string;
  channel: string;
  platform: 'ios' | 'android';
  onArtifact: (payload: NativeRuntimePayload) => Promise<void>;
  onError: (error: unknown) => void;
  loadReference?: (
    reference: SnackArtifactReference,
    signal: AbortSignal,
  ) => Promise<SnackCompiledArtifact>;
}
export function parsePayload(text: string): NativeRuntimePayload {
  const payload: unknown = JSON.parse(text);
  if (
    !isRecord(payload) ||
    typeof payload.flight !== 'string' ||
    !isRecord(payload.client) ||
    typeof payload.client.hash !== 'string' ||
    !isRecord(payload.client.modules) ||
    !isRecord(payload.client.roots)
  )
    throw Error('Invalid native graph');
  const roots: Record<string, { file: string }> = Object.create(null);
  for (const [id, root] of Object.entries(payload.client.roots)) {
    if (!isRecord(root) || typeof root.file !== 'string') throw Error('Invalid native graph root');
    roots[id] = { file: root.file };
  }
  return {
    flight: payload.flight,
    client: { hash: payload.client.hash, modules: payload.client.modules, roots },
  };
}

/** Existing Snackpub channel protocol; independent of the prototype /preview relay. */
export function connectSdkSession({
  url,
  channel,
  platform,
  onArtifact,
  onError,
  loadReference = undefined,
}: SessionOptions) {
  if (
    !/^https?:\/\//.test(url) ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(channel) ||
    !['ios', 'android'].includes(platform)
  )
    throw Error('Invalid Snack connection');
  const device = {
    id: 'native-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
    name: 'Expo Go',
    platform,
    compilerProtocols: ['snack-worker-graph@1'],
  };
  const sender = JSON.stringify(device),
    socket = io(url, { transports: ['websocket'] });
  let session = '',
    revision = -1,
    closed = false,
    running = false;
  let latest: SnackCompiledArtifact | undefined;
  let pending: CompiledMessage | undefined;
  let inflight: CompiledMessage | undefined;
  let download: AbortController | undefined;
  const send = (message: Record<string, unknown>) => {
    if (!closed && socket.connected)
      socket.emit('message', { channel, sender, message: { ...message, device } });
  };
  const report = (error: unknown) => {
    if (!closed) {
      onError(error);
      send({ type: 'ERROR', error: JSON.stringify({ message: String(error) }) });
    }
  };
  const drain = async () => {
    if (running) return;
    running = true;
    try {
      while (pending && !closed) {
        const message = pending;
        pending = undefined;
        inflight = message;
        const controller = new AbortController();
        download = controller;
        try {
          const artifact =
            message.type === 'COMPILED_CODE_REFERENCE'
              ? await (loadReference
                  ? loadReference(message.reference, controller.signal)
                  : Promise.reject(Error('Artifact downloads are not configured')))
              : message.artifact;
          if (closed || controller.signal.aborted) continue;
          validateCompiledArtifact(artifact, '58.0.0');
          const text = artifact.platforms?.[platform];
          if (typeof text !== 'string')
            throw Error(artifact.errors?.[platform] || 'Missing native graph');
          if (new TextEncoder().encode(text).length > 15 * 1024 * 1024)
            throw Error('Native graph exceeds limit');
          const payload = parsePayload(text);
          await onArtifact(payload);
          session = message.sessionId;
          revision = message.revision;
          latest = artifact;
          send({ type: 'STATUS_REPORT', status: 'SUCCESS', previewLocation: '' });
        } catch (error) {
          if (!controller.signal.aborted) report(error);
        } finally {
          if (download === controller) download = undefined;
          inflight = undefined;
        }
      }
    } finally {
      running = false;
    }
  };
  socket.on('connect', () => {
    socket.emit('subscribeChannel', { channel, sender });
    send({ type: 'RESEND_CODE' });
  });
  socket.on('connect_error', report);
  socket.on('terminate', (reason: unknown) => {
    report(Error(String(reason)));
    socket.disconnect();
  });
  socket.on('message', (data: unknown) => {
    if (!isRecord(data) || data.channel !== channel || closed || !isRecord(data.message)) return;
    const message = data.message;
    try {
      if (message?.type === 'COMPILED_CODE' || message?.type === 'COMPILED_CODE_REFERENCE') {
        if (
          typeof message.sessionId !== 'string' ||
          !message.sessionId.length ||
          message.sessionId.length > 100 ||
          typeof message.revision !== 'number' ||
          !Number.isSafeInteger(message.revision) ||
          message.revision < 0
        )
          throw Error('Unsupported compiled Snack');
        if (message.sessionId === session && message.revision <= revision) return;
        if (pending?.sessionId === message.sessionId && pending.revision >= message.revision)
          return;
        if (inflight?.sessionId === message.sessionId && inflight.revision >= message.revision)
          return;
        if (message.type === 'COMPILED_CODE') {
          validateCompiledArtifact(message.artifact, '58.0.0');
          pending = {
            type: message.type,
            sessionId: message.sessionId,
            revision: message.revision,
            artifact: message.artifact,
          };
        } else {
          validateArtifactReference(message.reference);
          pending = {
            type: message.type,
            sessionId: message.sessionId,
            revision: message.revision,
            reference: message.reference,
          };
        }
        download?.abort();
        drain();
      } else if (message?.type === 'RELOAD_SNACK' && latest) {
        pending = { type: 'COMPILED_CODE', sessionId: session, revision, artifact: latest };
        drain();
      } else if (message?.type === 'REQUEST_STATUS')
        send({
          type: 'STATUS_REPORT',
          status: latest ? 'SUCCESS' : 'FAILURE',
          previewLocation: '',
        });
    } catch (error) {
      report(error);
    }
  });
  return {
    report,
    close() {
      closed = true;
      pending = undefined;
      download?.abort();
      socket.emit('unsubscribeChannel', { channel, sender });
      socket.close();
    },
  };
}
