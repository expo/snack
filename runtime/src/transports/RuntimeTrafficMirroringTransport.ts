import AwaitLock from 'await-lock';

import type { Device, RuntimeMessagePayload, RuntimeTransport } from './RuntimeTransport';
import RuntimeTransportImplPubNub from './RuntimeTransportImplPubNub';
import RuntimeTransportImplSocketIO from './RuntimeTransportImplSocketIO';
import * as Logger from '../Logger';

const FALLBACK_ALWAYS_AFTER_MISSED_THRESHOLD = 5;
const FALLBACK_ACK_WAIT_MS = 3000;

export type ListenerType = (payload: RuntimeMessagePayload) => void;

export default class RuntimeTrafficMirroringTransport implements RuntimeTransport {
  private readonly transport: RuntimeTransport;
  private readonly fallbackTransport: RuntimeTransport;
  private missedMessageCount: number;
  private ackMessageQueue: AckMessageQueue;
  private readonly fallbackAckWaitMs: number;

  constructor(device: Device, fallbackAckWaitMs: number = FALLBACK_ACK_WAIT_MS) {
    this.transport = new RuntimeTransportImplSocketIO(device);
    this.fallbackTransport = new RuntimeTransportImplPubNub(device);
    this.missedMessageCount = 0;
    this.ackMessageQueue = new AckMessageQueue();
    this.fallbackAckWaitMs = fallbackAckWaitMs;
  }

  subscribe(channel: string) {
    this.transport.subscribe(channel);
    this.fallbackTransport.subscribe(channel);
  }

  unsubscribe() {
    this.transport.unsubscribe();
    this.fallbackTransport.unsubscribe();
  }

  listen(listener: ListenerType) {
    this.transport.listen(this.onMessage.bind(this, false, listener));
    this.fallbackTransport.listen(this.onMessage.bind(this, true, listener));
  }

  publish(message: object) {
    if (!this.shouldUseFallbackAlways()) {
      Logger.comm('[RuntimeTrafficMirroringTransport] publish message from primary transport');
      this.transport.publish(message);
    } else {
      Logger.warn(
        `[RuntimeTrafficMirroringTransport] publish message from fallback transport - primaryTransportConnected[${this.transport.isConnected()}] missedMessageCount[${
          this.missedMessageCount
        }]`,
      );
      this.fallbackTransport.publish(message);
    }
  }

  isConnected(): boolean {
    throw new Error('Should not reach this code path.');
  }

  private shouldUseFallbackAlways() {
    return (
      !this.transport.isConnected() ||
      this.missedMessageCount >= FALLBACK_ALWAYS_AFTER_MISSED_THRESHOLD
    );
  }

  private onMessage = async (
    fromFallback: boolean,
    upperLayerListener: ListenerType,
    payload: RuntimeMessagePayload,
  ) => {
    if (this.shouldUseFallbackAlways()) {
      Logger.warn('[RuntimeTrafficMirroringTransport] ack upper from fallback transport');
      upperLayerListener(payload);
      return;
    }

    const messageString = JSON.stringify(payload.message);

    // If the message is acked in the queue, it means the message already passed to upper listener.
    // Either primary or fallback transport receives the duplicated message, we can simply skip it.
    const acked = await this.ackMessageQueue.findMessageStringAsync(messageString);
    if (acked) {
      return;
    }

    if (!fromFallback) {
      Logger.comm('[RuntimeTrafficMirroringTransport] ack upper from primary transport');
      this.ackMessageQueue.enqueueMessageStringAsync(messageString);
      upperLayerListener(payload);
    } else {
      // In case the fallback transport receives message before primary transport,
      // we will still wait `this.fallbackAckWaitMs` to let primary transport go first.
      setTimeout(async () => {
        if (!(await this.ackMessageQueue.findMessageStringAsync(messageString))) {
          this.missedMessageCount += 1;
          this.ackMessageQueue.enqueueMessageStringAsync(messageString);
          upperLayerListener(payload);
          Logger.warn('[RuntimeTrafficMirroringTransport] ack upper from fallback transport');
        }
      }, this.fallbackAckWaitMs);
    }
  };
}

/**
 * A message queue for message deduplication from multiple transports
 *
 * As we have multiple transports, the application upper layer should not aware it and not send multiple code to remote.
 * We do the deduplication in RuntimeTrafficMirroringTransport.
 * The philosophy are:
 *   - Send message from primary transport if it's stable.
 *   - Receive messages and call callbacks for upper layer from primary transport if it's stable.
 *   - When fallback transport receives message, it will wait `FALLBACK_ACK_WAIT_MS` and check whether the message is receieved by primary transport.
 *     = So we need this `AckMessageQueue` to check message is received and acked by primary transport.
 *     = If the message receieved from fallback transport is acked by primary transport, then we can remove this message from the queue.
 *     = If the message is not acked, we let the fallback transport to call the upper layer callback and increase the `missedMessageCount`.
 *       Once `missedMessageCount` exceeds `FALLBACK_ALWAYS_AFTER_MISSED_THRESHOLD`, it means primary transport is not stable enough, so we should we fallback transport always.
 *
 * To compare the equalness of two messages, this implementation uses JSON.stringify() and compare by strings.
 */
export class AckMessageQueue {
  private readonly lock = new AwaitLock();
  private readonly queue: string[] = [];

  constructor(private readonly limit: number = 32) {}

  /**
   * Enqueues a new message to the queue
   */
  async enqueueMessageStringAsync(messageString: string): Promise<void> {
    await this.lock.acquireAsync();
    try {
      this.queue.unshift(messageString);
      Logger.comm('[AceMessageQueue] enqueue', this.queue.length);
      this.maybePurge();
    } finally {
      this.lock.release();
    }
  }

  /**
   * Finds a message from the queue.
   * @returns true if the item was in the queue.
   */
  async findMessageStringAsync(messageString: string): Promise<boolean> {
    let result = false;
    await this.lock.acquireAsync();
    try {
      const index = this.queue.findIndex((item) => item === messageString);
      if (index >= 0) {
        result = true;
      }
    } finally {
      this.lock.release();
    }
    return result;
  }

  /**
   * Purges the queue to fix the size limit.
   * This function will remove the oldest items first.
   */
  private async maybePurge() {
    const queueLength = this.queue.length;
    const trimCount = queueLength - this.limit;
    if (trimCount > 0) {
      this.queue.splice(queueLength - trimCount, trimCount);
      Logger.comm('[AceMessageQueue] purge', this.queue.length);
    }
  }

  /**
   * Gets the queue item for specific index
   */
  at(index: number): string | null {
    return this.queue[index] ?? null;
  }

  /**
   * Returns the queue size
   */
  size(): number {
    return this.queue.length;
  }
}
