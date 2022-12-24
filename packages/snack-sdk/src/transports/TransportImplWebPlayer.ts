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
  private _currentWindow: Window | undefined;
  private _targetWindowRef: SnackWindowRef | undefined;
  private _isStarted: boolean;
  private readonly _origin: string;

  constructor(config: TransportWebPlayerConfig) {
    super({ name: config.name, verbose: config.verbose });
    const { origin } = new URL(config.webPlayerURL);
    this._currentWindow = config.window;
    this._targetWindowRef = config.ref;
    this._isStarted = false;
    this._origin = origin;
  }

  protected start(): void {
    assert(this._currentWindow);
    this._currentWindow?.addEventListener('message', this.handleDomWindowMessage, false);
    this._isStarted = true;
  }

  protected stop(): void {
    assert(this._currentWindow);
    this._currentWindow.removeEventListener('message', this.handleDomWindowMessage, false);
    this._currentWindow = undefined;
    this._targetWindowRef = undefined;
    this._isStarted = false;
  }

  protected isStarted(): boolean {
    return this._isStarted && this._currentWindow != null;
  }

  protected async sendAsync(channel: string, message: ProtocolOutgoingMessage): Promise<void> {
    assert(this.isStarted);
    const targetWindow = this._targetWindowRef?.current;
    assert(targetWindow);
    targetWindow.postMessage(JSON.stringify(message), this._origin);
  }

  protected onVerifyCodeMessageSize(codeMessage: ProtocolCodeMessage): boolean {
    return true;
  }

  handleDomWindowMessage = (event: MessageEvent) => {
    if (event.origin === this._origin) {
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
