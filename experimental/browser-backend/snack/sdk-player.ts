import { isRecord, validateCompiledArtifact } from '../../../packages/snack-sdk/src/Compiler';
// Implements the existing Snack web-player envelope with a negotiated compiler protocol.
const configuredOrigin = new URL(location.href).searchParams.get('origin');
if (
  !configuredOrigin ||
  new URL(configuredOrigin).origin !== configuredOrigin ||
  !/^https?:/.test(configuredOrigin)
)
  throw Error('Missing editor origin');
const device = {
  id: 'worker-web-' + crypto.randomUUID(),
  name: 'Web preview',
  platform: 'web',
  compilerProtocols: ['snack-worker-graph@1'],
};
const send = (data: unknown) => parent.postMessage(JSON.stringify(data), configuredOrigin);
const frame = document.createElement('iframe');
frame.sandbox = 'allow-scripts';
frame.src = new URL('../preview.html', location.href).href;
frame.style.cssText = 'border:0;width:100%;height:100%;position:fixed;inset:0';
document.body.append(frame);
let port: MessagePort | undefined;
let latest: { flight: string; client: Record<string, unknown> } | undefined;
let revision = -1,
  sessionId = '',
  sequence = 0;
const render = () => {
  if (port && latest) port.postMessage({ type: 'render', request: ++sequence, ...latest });
};
frame.onload = () => {
  const channel = new MessageChannel();
  port = channel.port1;
  port.onmessage = ({ data }) => {
    if (data.type === 'ready') {
      send({ type: 'CONNECT', device });
      render();
    } else if (data.type === 'error' || data.type === 'runtime-error')
      send({
        type: 'MESSAGE',
        message: { type: 'ERROR', device, error: JSON.stringify({ message: data.error }) },
      });
  };
  port.start();
  frame.contentWindow?.postMessage({ type: 'connect' }, '*', [channel.port2]);
};
addEventListener('message', (event) => {
  if (
    event.source !== parent ||
    event.origin !== configuredOrigin ||
    typeof event.data !== 'string' ||
    event.data.length > 16 * 1024 * 1024
  )
    return;
  try {
    const message: unknown = JSON.parse(event.data);
    if (!isRecord(message)) throw Error('Invalid editor message');
    if (message.type === 'COMPILED_CODE') {
      const { artifact } = message;
      validateCompiledArtifact(artifact, '58.0.0');
      if (
        artifact.format !== 'snack-worker-graph' ||
        artifact.version !== 1 ||
        artifact.sdkVersion !== '58.0.0' ||
        typeof message.revision !== 'number' ||
        message.revision < 0 ||
        !Number.isSafeInteger(message.revision) ||
        typeof message.sessionId !== 'string' ||
        (message.sessionId === sessionId && message.revision < revision)
      )
        throw Error('Unsupported compiled artifact');
      if (typeof artifact.platforms.web !== 'string') throw Error('Missing web graph');
      const payload: unknown = JSON.parse(artifact.platforms.web);
      if (
        !isRecord(payload) ||
        typeof payload.flight !== 'string' ||
        !isRecord(payload.client) ||
        !isRecord(payload.client.modules)
      )
        throw Error('Invalid web graph');
      sessionId = message.sessionId;
      revision = message.revision;
      latest = { flight: payload.flight, client: payload.client };
      render();
    } else if (message.type === 'RELOAD_SNACK') {
      frame.src = new URL('../preview.html', location.href).href;
    } else if (message.type === 'REQUEST_STATUS') {
      send({
        type: 'MESSAGE',
        message: {
          type: 'STATUS_REPORT',
          device,
          status: latest ? 'SUCCESS' : 'FAILURE',
          previewLocation: '',
        },
      });
    }
  } catch (error) {
    send({
      type: 'MESSAGE',
      message: { type: 'ERROR', device, error: JSON.stringify({ message: String(error) }) },
    });
  }
});
addEventListener('pagehide', () => {
  port?.close();
  send({ type: 'DISCONNECT', device });
});
