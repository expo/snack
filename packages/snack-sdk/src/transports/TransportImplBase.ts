import CodeMessageBuilder, { CodeMessageBuilderCallback } from './CodeMessageBuilder';
import { ProtocolOutgoingMessage, ProtocolIncomingMessage, ProtocolCodeMessage } from './Protocol';
import {
  SnackTransport,
  SnackTransportListener,
  SnackTransportMessage,
  SnackTransportOptions,
} from './types';
import { createLogger, Logger } from '../Logger';

export default abstract class TransportImplBase implements SnackTransport {
  protected readonly channel: string;
  protected readonly logger?: Logger;
  private callback?: SnackTransportListener;
  private codeMessageBuilder: CodeMessageBuilder;
  private codeMessage?: ProtocolCodeMessage;
  private connectionsCount: number = 0;
  protected readonly logSuffix: string;

  // Limit for code size in diff message
  protected static readonly CODE_SIZE_LIMIT_FOR_DIFF = 32768;

  constructor(options: SnackTransportOptions) {
    const { apiURL, channel, verbose } = options;
    this.channel = channel ?? '';
    this.logger = verbose ? createLogger(true) : undefined;
    this.logSuffix = options.name ? ` (${options.name})` : '';

    if (channel) {
      this.codeMessageBuilder = new CodeMessageBuilder({
        verifyCodeMessageSize: this.onVerifyCodeMessageSize,
        callback: this.onCodeMessageReady,
        apiURL,
        logger: this.logger,
        maxDiffPlaceholder: 'X'.repeat(TransportImplBase.CODE_SIZE_LIMIT_FOR_DIFF),
      });
    } else {
      this.codeMessageBuilder = new CodeMessageBuilder({
        verifyCodeMessageSize: () => true,
        callback: this.onCodeMessageReady,
        logger: this.logger,
      });
    }
  }

  addEventListener(_type: 'message', callback: SnackTransportListener) {
    this.callback = callback;
  }

  removeEventListener(_type: 'message', _callback: SnackTransportListener) {
    this.callback = undefined;
  }

  postMessage(message: SnackTransportMessage) {
    switch (message.type) {
      case 'start':
        this.start();
        break;
      case 'stop':
        this.stop();
        break;
      case 'update_code':
        this.codeMessageBuilder.setCode(message.data);
        break;
      case 'protocol_message':
        this.publish(message.data);
        break;
      case 'synthetic_event':
        this.onSyntheticEvent(message.data);
        break;
    }
  }

  /**
   * Start transport
   */
  protected abstract start(): void;

  /**
   * Stop transport
   */
  protected abstract stop(): void;

  /**
   * Is transport started
   */

  protected abstract isStarted(): boolean;

  /**
   * Send message to target channel
   */

  protected abstract sendAsync(channel: string, message: ProtocolOutgoingMessage): Promise<void>;

  /**
   * Verify whether the transport is able to send the code message with given size
   * @returns true if the code message size is valid
   */
  protected abstract onVerifyCodeMessageSize(codeMessage: ProtocolCodeMessage): boolean;

  /**
   * Helper function for derived transports.
   * When the derived transport receives message, it should call this function to process message data.
   */
  protected handleMessage(senderConnectionId: string, message: ProtocolIncomingMessage) {
    this.onProtocolMessage(senderConnectionId, message);
  }

  /**
   * Helper function for derived transports.
   * When the derived transport receives channel join/leave events, it should call this function to process channel presence data.
   */
  protected handleChannelEvent(event: 'join' | 'leave', connectionId: string) {
    if (event === 'join') {
      try {
        const device = JSON.parse(connectionId);
        this.connectionsCount++;
        this.callback?.({
          type: 'connect',
          connectionId,
          data: device,
        });
        if (this.codeMessage) {
          this.logger?.comm('Sending code...', this.logSuffix);
          this.publish(this.codeMessage);
        }
      } catch {
        // Wasn't from the device
      }
    } else {
      this.connectionsCount = Math.max(this.connectionsCount - 1, 0);
      this.callback?.({
        type: 'disconnect',
        connectionId,
        data: {},
      });
    }
  }

  private onProtocolMessage(connectionId: string, message: ProtocolIncomingMessage) {
    if (message.type === 'RESEND_CODE') {
      if (this.codeMessage) {
        this.logger?.comm('Resending code...', this.logSuffix);
        this.publish(this.codeMessage);
      }
    } else {
      this.callback?.({
        type: 'protocol_message',
        connectionId,
        data: message,
      });
    }
  }

  private async publish(message: ProtocolOutgoingMessage) {
    if (!this.connectionsCount) {
      return;
    }
    if (this.isStarted()) {
      try {
        await this.sendAsync(this.channel, message);
      } catch (e) {
        this.logger?.error('Failed to publish message', message.type, e, this.logSuffix);
      }
    } else {
      this.callback?.({
        type: 'synthetic_event',
        data: message,
      });
    }
    this.callback?.({
      type: 'send_message',
      data: message,
    });
  }

  private onSyntheticEvent(data: any) {
    if (typeof data !== 'string') {
      return;
    }

    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'CONNECT':
          this.connectionsCount++;
          this.callback?.({
            type: 'connect',
            connectionId: JSON.stringify(message.device),
            data: message.device,
          });
          break;
        case 'DISCONNECT':
          this.connectionsCount = Math.max(this.connectionsCount - 1, 0);
          this.callback?.({
            type: 'disconnect',
            connectionId: JSON.stringify(message.device),
            data: {},
          });
          break;
        case 'MESSAGE':
          this.onProtocolMessage(JSON.stringify(message.message.device), message.message);
          break;
      }
    } catch (e) {
      this.logger?.error('Failed to parse postMessage', e, data, this.logSuffix);
    }
  }

  private onCodeMessageReady: CodeMessageBuilderCallback = (codeMessage) => {
    this.codeMessage = codeMessage;
    this.logger?.comm('Sending code...', this.logSuffix);
    this.publish(codeMessage);
  };
}
