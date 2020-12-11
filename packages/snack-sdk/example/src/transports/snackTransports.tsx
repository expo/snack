import {
  SnackTransport,
  SnackTransportOptions,
  SnackTransportMessage,
  SnackTransportListener,
  createTransport,
} from 'snack-sdk';

export default function createSnackTransport(
  options: SnackTransportOptions,
  config: {
    isWorker?: boolean;
    webPlayer?: {
      window: Window;
      ref: React.RefObject<Window>;
      origin: string;
    };
  }
) {
  let transport: SnackTransport | null = null;
  function getTransport(): SnackTransport {
    if (!transport) {
      if (config.isWorker) {
        const worker = new Worker('./SnackTransport.worker', { type: 'module' });
        worker.postMessage({ type: 'init', data: options });
        transport = worker;
      } else {
        transport = createTransport(options);
      }
    }
    return transport;
  }
  let webPlayerListener: ((event: any) => void) | undefined;
  let transportListener: ((event: any) => void) | undefined;
  return {
    addEventListener: (type: 'message', listener: SnackTransportListener) => {
      if (config.webPlayer && !webPlayerListener) {
        webPlayerListener = (event: any) => {
          if (event.origin === config.webPlayer.origin && typeof event.data === 'string') {
            if (transport) {
              transport.postMessage({
                type: 'synthetic_event',
                data: event.data,
              });
            }
          }
        };
        config.webPlayer.window.addEventListener(type, webPlayerListener);
      }
      if (!transportListener) {
        transportListener = (event: any) => {
          const message = config.isWorker ? event.data : event;
          if (config.webPlayer && message.type === 'synthetic_event') {
            config.webPlayer.ref.current?.postMessage(
              JSON.stringify(message.data),
              config.webPlayer.origin
            );
          } else {
            listener(message);
          }
        };
      }
      getTransport().addEventListener(type, transportListener);
    },
    removeEventListener: (type: 'message', _listener: SnackTransportListener) => {
      if (webPlayerListener) {
        config.webPlayer?.window.removeEventListener(type, webPlayerListener);
        webPlayerListener = undefined;
      }
      if (transportListener) {
        transport?.removeEventListener(type, transportListener);
        transportListener = undefined;
      }
    },
    postMessage: (message: SnackTransportMessage) => getTransport().postMessage(message),
  };
}
