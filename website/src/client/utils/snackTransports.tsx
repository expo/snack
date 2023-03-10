import {
  SnackTransport,
  SnackTransportOptions,
  SnackTransportMessage,
  SnackTransportListener,
} from 'snack-sdk';

export function createSnackWorkerTransport(
  testTransport: 'pubnub' | 'snackpub',
  options: SnackTransportOptions
) {
  let transport: SnackTransport | null = null;
  function getTransport(): SnackTransport {
    if (!transport) {
      const worker = new Worker('../workers/SnackTransport.worker', { type: 'module' });
      worker.postMessage({ type: 'init', data: options, testTransport });
      transport = worker;
    }
    return transport;
  }
  let transportListener: ((event: any) => void) | undefined;
  return {
    addEventListener: (type: 'message', listener: SnackTransportListener) => {
      if (!transportListener) {
        transportListener = (event: any) => {
          const message = event.data;
          listener(message);
        };
      }
      getTransport().addEventListener(type, transportListener);
    },
    removeEventListener: (type: 'message', _listener: SnackTransportListener) => {
      if (transportListener) {
        transport?.removeEventListener(type, transportListener);
        transportListener = undefined;
      }
    },
    postMessage: (message: SnackTransportMessage) => getTransport().postMessage(message),
  };
}
