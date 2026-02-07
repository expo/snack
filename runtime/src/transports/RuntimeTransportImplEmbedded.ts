import { EventEmitter, requireOptionalNativeModule } from 'expo-modules-core';

import type { Device, RuntimeMessagePayload, RuntimeTransport } from './RuntimeTransport';
import * as Logger from '../Logger';

type Listener = (payload: RuntimeMessagePayload) => void;

// Load the native module — returns null if not available (e.g., web, standalone builds)
const nativeModule = requireOptionalNativeModule('SnackDirectTransport');
const emitter = nativeModule ? new EventEmitter(nativeModule) : null;

console.log('[SnackDirectTransport] Module load: nativeModule=' + (nativeModule ? 'found' : 'null') + ', isAvailable constant=' + (nativeModule?.isAvailable));

/**
 * Returns true when the SnackDirectTransport native module is present
 * and an embedded session (lesson, playground, demo) is active.
 */
export function isAvailable(): boolean {
  const result = nativeModule?.isAvailable === true;
  console.log('[SnackDirectTransport] isAvailable() called: nativeModule=' + (nativeModule ? 'exists' : 'null') + ', nativeModule.isAvailable=' + nativeModule?.isAvailable + ', result=' + result);
  return result;
}

/**
 * Transport for embedded snacks in Expo Go.
 *
 * Communicates directly with the Expo Go kernel via the SnackDirectTransport
 * native module — no Snackpub WebSocket involved. CODE is delivered
 * synchronously on subscribe(), giving ~0ms latency.
 */
export default class RuntimeTransportImplEmbedded implements RuntimeTransport {
  private readonly device: Device;
  private readonly listeners: Listener[] = [];
  private subscription: { remove(): void } | null = null;

  constructor(device: Device) {
    this.device = device;
  }

  subscribe(channel: string) {
    this.unsubscribe();

    if (!emitter || !nativeModule) {
      Logger.comm_error('SnackDirectTransport native module not available');
      return;
    }

    Logger.comm('Subscribing via embedded transport');

    // Register event listener BEFORE calling native subscribe,
    // so the immediately-delivered CODE message is received.
    this.subscription = emitter.addListener('onMessage', (event: { message: any }) => {
      this.listeners.forEach((listener) => listener({ message: event.message }));
    });

    // Native module immediately delivers CODE message via onMessage event
    nativeModule.subscribe(channel);
  }

  unsubscribe() {
    if (this.subscription) {
      Logger.comm('Unsubscribing from embedded transport');
      this.subscription.remove();
      this.subscription = null;
    }

    nativeModule?.unsubscribe();
  }

  listen(listener: (payload: RuntimeMessagePayload) => void) {
    this.listeners.push(listener);
  }

  publish(message: object) {
    // For embedded snacks, most published messages are no-ops.
    // Console logs go through LogBox, RESEND_CODE is unnecessary since
    // CODE was already delivered via subscribe().
    nativeModule?.publish({ ...message, device: this.device });
  }

  isConnected(): boolean {
    // Embedded transport is always "connected" — it's in-process communication
    return true;
  }
}
