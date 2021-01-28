import type { SnackTransport, SnackTransportMessage, SnackTransportEvent } from 'snack-sdk';

declare const self: WorkerGlobalScope;

// @ts-ignore
self.window = self; // Needed for pubnub to work

const { createTransport } = require('snack-sdk');

let transport: SnackTransport | undefined = undefined;
const transportCallback = (event: SnackTransportEvent) => postMessage(event);

onmessage = (event) => {
  if (event.data.type === 'init') {
    transport = createTransport(event.data.data);
    // @ts-ignore
    transport.addEventListener('message', transportCallback);
  } else if (transport) {
    const message: SnackTransportMessage = event.data as any;
    transport.postMessage(message);
    if (message.type === 'stop') {
      transport.removeEventListener('message', transportCallback);
      transport = undefined;
      close();
    }
  }
};
