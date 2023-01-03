import AwaitLock from 'await-lock';

import * as Logger from '../Logger';
import type { Device, RuntimeMessagePayload, RuntimeTransport } from './RuntimeTransport';
import RuntimeTransportImplPubNub from './RuntimeTransportImplPubNub';
import RuntimeTransportImplSocketIO from './RuntimeTransportImplSocketIO';

const FALLBACK_ALWAYS_AFTER_MISSED_THRESHOLD = 5;
const FALLBACK_ACK_WAIT_MS = 3000;

export type ListenerType = (payload: RuntimeMessagePayload) => void;

export default class RuntimeCompositedTransport implements RuntimeTransport {
  private readonly _transport: RuntimeTransport;
  private readonly _fallbackTransport: RuntimeTransport;
  private _missedMessageCount: number;
  private _ackMessageQueue: AckMessageQueue;
  private readonly _fallbackAckWaitMs: number;

  constructor(device: Device, fallbackAckWaitMs: number = FALLBACK_ACK_WAIT_MS) {
    this._transport = new RuntimeTransportImplSocketIO(device);
    this._fallbackTransport = new RuntimeTransportImplPubNub(device);
    this._missedMessageCount = 0;
    this._ackMessageQueue = new AckMessageQueue();
    this._fallbackAckWaitMs = fallbackAckWaitMs;
  }

  subscribe(channel: string) {
    this._transport.subscribe(channel);
    this._fallbackTransport.subscribe(channel);
  }

  unsubscribe() {
    this._transport.unsubscribe();
    this._fallbackTransport.unsubscribe();
  }

  listen(listener: ListenerType) {
    this._transport.listen(this.onMessage.bind(this, false, listener));
    this._fallbackTransport.listen(this.onMessage.bind(this, true, listener));
  }

  publish(message: object) {
    if (!this.shouldUseFallbackAlways()) {
      Logger.comm('[RuntimeCompositedTransport] publish message from primary transport');
      this._transport.publish(message);
    } else {
      Logger.warn(
        `[RuntimeCompositedTransport] publish message from fallback transport - primaryTransportConnected[${this._transport.isConnected()}] missedMessageCount[${
          this._missedMessageCount
        }]`
      );
      this._fallbackTransport.publish(message);
    }
  }

  isConnected(): boolean {
    throw new Error('Should not reach this code path.');
  }

  private shouldUseFallbackAlways() {
    return (
      !this._transport.isConnected() ||
      this._missedMessageCount >= FALLBACK_ALWAYS_AFTER_MISSED_THRESHOLD
    );
  }

  private onMessage = async (
    fromFallback: boolean,
    upperLayerListener: ListenerType,
    payload: RuntimeMessagePayload
  ) => {
    if (this.shouldUseFallbackAlways()) {
      Logger.warn('[RuntimeCompositedTransport] ack upper from fallback transport');
      upperLayerListener(payload);
      return;
    }

    const messageString = JSON.stringify(payload.message);

    // If the message is acked in the queue, it means the message already passed to upper listener.
    // Either primary or fallback transport receives the duplicated message, we can simply skip it.
    const acked = await this._ackMessageQueue.findMessageStringAsync(messageString);
    if (acked) {
      return;
    }

    if (!fromFallback) {
      Logger.comm('[RuntimeCompositedTransport] ack upper from primary transport');
      this._ackMessageQueue.enqueueMessageStringAsync(messageString);
      upperLayerListener(payload);
    } else {
      // In case the fallback transport receives message before primary transport,
      // we will still wait `this._fallbackAckWaitMs` to let primary transport go first.
      setTimeout(async () => {
        if (!(await this._ackMessageQueue.findMessageStringAsync(messageString))) {
          this._missedMessageCount += 1;
          this._ackMessageQueue.enqueueMessageStringAsync(messageString);
          upperLayerListener(payload);
          Logger.warn('[RuntimeCompositedTransport] ack upper from fallback transport');
        }
      }, this._fallbackAckWaitMs);
    }
  };
}

/**
 * A message queue for message deduplication from multiple transports
 *
 * As we have multiple transports, the application upper layer should not aware it and not send multiple code to remote.
 * We do the deduplication in RuntimeCompositedTransport.
 * The philosophy are:
 *   - Send message from primary transport if it's stable.
 *   - Receive messages and call callbacks for upper layer from primary transport if it's stable.
 *   - When fallback transport receives message, it will wait `FALLBACK_ACK_WAIT_MS` and check whether the message is receieved by primary transport.
 *     = So we need this `AckMessageQueue` to check message is received and acked by primary transport.
 *     = If the message receieved from fallback transport is acked by primary transport, then we can remove this message from the queue.
 *     = If the message is not acked, we let the fallback transport to call the upper layer callback and increase the `_missedMessageCount`.
 *       Once `_missedMessageCount` exceeds `FALLBACK_ALWAYS_AFTER_MISSED_THRESHOLD`, it means primary transport is not stable enough, so we should we fallback transport always.
 *
 * To compare the equalness of two messages, this implementation uses JSON.stringify() and compare by strings.
 */
export class AckMessageQueue {
  private readonly _lock = new AwaitLock();
  private readonly _queue: string[] = [];
  private readonly limit;

  constructor(queueLimit: number = 32) {
    this.limit = queueLimit;
  }

  /**
   * Enqueues a new message to the queue
   */
  async enqueueMessageStringAsync(messageString: string): Promise<void> {
    await this._lock.acquireAsync();
    try {
      this._queue.unshift(messageString);
      Logger.comm('[AceMessageQueue] enqueue', this._queue.length);
      this.maybePurge();
    } finally {
      this._lock.release();
    }
  }

  /**
   * Finds a message from the queue.
   * @returns true if the item was in the queue.
   */
  async findMessageStringAsync(messageString: string): Promise<boolean> {
    let result = false;
    await this._lock.acquireAsync();
    try {
      const index = this._queue.findIndex((item) => item === messageString);
      if (index >= 0) {
        result = true;
      }
    } finally {
      this._lock.release();
    }
    return result;
  }

  /**
   * Purges the queue to fix the size limit.
   * This function will remove the oldest items first.
   */
  private async maybePurge() {
    const queueLength = this._queue.length;
    const trimCount = queueLength - this.limit;
    if (trimCount > 0) {
      this._queue.splice(queueLength - trimCount, trimCount);
      Logger.comm('[AceMessageQueue] purge', this._queue.length);
    }
  }

  /**
   * Gets the queue item for specific index
   */
  at(index: number): string | null {
    return this._queue[index] ?? null;
  }

  /**
   * Returns the queue size
   */
  size(): number {
    return this._queue.length;
  }
}
