import assert from 'assert';

import type { SnackWindowRef } from '../types';
import type { ProtocolOutgoingMessage, ProtocolCodeMessage } from './Protocol';
import TransportImplBase from './TransportImplBase';

export interface TransportWebPlayerConfig {
  name?: string;
  verbose?: boolean;
  webPlayerURL: string;
  window: Window;
  ref: SnackWindowRef;
}

export default class TransportImplWebPlayer extends TransportImplBase {
  private currentWindow: Window | undefined;
  private targetWindowRef: SnackWindowRef | undefined;
  private status: 'stopped' | 'started' = 'stopped';
  private readonly origin: string;

  constructor(config: TransportWebPlayerConfig) {
    super({ name: config.name, verbose: config.verbose });
    const { origin } = new URL(config.webPlayerURL);
    this.currentWindow = config.window;
    this.targetWindowRef = config.ref;
    this.status = 'stopped';
    this.origin = origin;
  }

  protected start(): void {
    assert(this.currentWindow);
    this.currentWindow?.addEventListener('message', this.handleDomWindowMessage, false);
    this.status = 'started';
  }

  protected stop(): void {
    assert(this.currentWindow);
    this.currentWindow.removeEventListener('message', this.handleDomWindowMessage, false);
    this.currentWindow = undefined;
    this.targetWindowRef = undefined;
    this.status = 'stopped';
  }

  protected isStarted(): boolean {
    return this.status === 'started' && this.currentWindow != null;
  }

  protected async sendAsync(channel: string, message: ProtocolOutgoingMessage): Promise<void> {
    assert(this.isStarted);
    const targetWindow = this.targetWindowRef?.current;
    assert(targetWindow);
    targetWindow.postMessage(JSON.stringify(message), this.origin);
  }

  protected onVerifyCodeMessageSize(codeMessage: ProtocolCodeMessage): boolean {
    return true;
  }

  handleDomWindowMessage = (event: MessageEvent) => {
    if (event.origin === this.origin) {
      try {
        const message = JSON.parse(event.data);
        const { type } = message;
        if (type === 'CONNECT') {
          const connectionId = JSON.stringify(message.device);
          this.handleChannelEvent('join', connectionId);
        } else if (type === 'DISCONNECT') {
          const connectionId = JSON.stringify(message.device);
          this.handleChannelEvent('leave', connectionId);
        } else if (type === 'MESSAGE') {
          const connectionId = JSON.stringify(message.message.device);
          this.handleMessage(connectionId, message.message);
        }
      } catch (e: unknown) {
        this.logger?.warn('Invalid message', event.data);
      }
    }
  };
}
