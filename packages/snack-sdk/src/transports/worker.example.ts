// import { SnackTransport } from './types';

/*
export function createTransport(transport: string, options: any) {
  const worker = new Worker('./SnackTransportWorker');
  worker.postMessage({
    type: 'init',
    transport,
    options,
  });
  return worker;
}

//
// SnackTransportWorker.js
//
import { createTransport } from 'snack-sdk';

let transport?: SnackTransport;

onmessage = (event) => {
  if (event.type === 'init') {
    transport = createTransport(event.transport, event.options);
    transport.addEventListener('message', postMessage);
  } else {
    transport?.postMessage(event);
  }
};
*/

/* export default class SnackTransportWorker implements SnackTransport {
  private readonly eventListeners: any[] = [];
  private readonly worker: any;

  constructor(transport: string, options: any, debounceTimeout: number) {
    this.worker = new Worker('./SnackTransportWorker');
    this.worker.addEventListener('message', this.onMessageEvent);
    this.worker.postMessage({
      type: 'init',
      transport,
      options,
    });
  }

  terminate() {
    this.worker?.terminate();
  }

  addEventListener(type: 'message', listener: any) {
    this.eventListeners.push(listener);
  }

  removeEventListener(type: 'message', listener: any) {
    const idx = this.eventListeners.indexOf(listener);
    if (idx >= 0) {
      this.eventListeners.splice(idx, 1);
    }
  }

  private onMessageEvent(event: any) {
    this.eventListeners.forEach((listener) => listener(event));
  }

  postMessage(message: any) {
    this.worker.postMessage(message);
  }
} */
