import PubNub from 'pubnub';

import { createLogger, Logger } from '../Logger';
import CodeMessageBuilder, { CodeMessageBuilderCallback } from './CodeMessageBuilder';
import { ProtocolOutgoingMessage, ProtocolIncomingMessage, ProtocolCodeMessage } from './Protocol';
import {
  SnackTransport,
  SnackTransportListener,
  SnackTransportMessage,
  SnackTransportOptions,
} from './types';

export function calcPubNubCodeMessageSize(channel: string, codeMessage: ProtocolCodeMessage) {
  // https://support.pubnub.com/hc/en-us/articles/360051495932-Calculating-message-payload-size-before-publishing
  return (
    encodeURIComponent(
      channel +
        JSON.stringify(codeMessage).replace(
          /[!~*'()]/g,
          (x) => `%${x.charCodeAt(0).toString(16).toUpperCase()}`
        )
    ).length + 200
  );
}

export default class Transport implements SnackTransport {
  private readonly channel: string;
  private readonly logger?: Logger;
  private callback?: SnackTransportListener;
  private pubNub?: PubNub;
  private codeMessageBuilder: CodeMessageBuilder;
  private codeMessage?: ProtocolCodeMessage;
  private connectionsCount: number = 0;
  private readonly logSuffix: string;

  constructor(options: SnackTransportOptions) {
    const { apiURL, channel, verbose } = options;
    this.channel = channel ?? '';
    this.logger = verbose ? createLogger(true) : undefined;
    this.logSuffix = options.name ? ` (${options.name})` : '';

    if (channel) {
      this.codeMessageBuilder = new CodeMessageBuilder({
        verifyCodeMessageSize: this.onPubNubVerifyCodeMessageSize,
        callback: this.onCodeMessageReady,
        apiURL,
        logger: this.logger,
        maxDiffPlaceholder: 'X'.repeat(32768),
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

  private start() {
    this.stop();

    if (this.channel) {
      this.logger?.comm('Starting channel...', this.channel, this.logSuffix);
      this.pubNub = new PubNub({
        publishKey: 'pub-c-2a7fd67b-333d-40db-ad2d-3255f8835f70',
        subscribeKey: 'sub-c-0b655000-d784-11e6-b950-02ee2ddab7fe',
        ssl: true,
        // uuid: TODO
        presenceTimeout: 600,
        heartbeatInterval: 60,
      });

      this.pubNub.addListener({
        presence: this.onPubNubPresence,
        message: this.onPubNubMessage,
        status: this.onPubNubStatus,
      });

      this.pubNub.subscribe({
        channels: [this.channel],
        withPresence: true,
      });
    }
  }

  private stop() {
    if (this.pubNub) {
      this.logger?.comm('Stopping...', this.logSuffix);
      this.pubNub.removeListener({
        presence: this.onPubNubPresence,
        message: this.onPubNubMessage,
        status: this.onPubNubStatus,
      });

      this.pubNub.unsubscribe({
        channels: [this.channel],
      });

      this.pubNub.stop();
      this.pubNub = undefined;
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
    if (this.pubNub) {
      try {
        await this.pubNub.publish({
          channel: this.channel,
          message,
        });
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

  private onPubNubPresence = (event: PubNub.PresenceEvent) => {
    switch (event.action) {
      case 'join':
        try {
          const device = JSON.parse(event.uuid);
          this.connectionsCount++;
          this.callback?.({
            type: 'connect',
            connectionId: event.uuid,
            data: device,
          });
          if (this.codeMessage) {
            this.logger?.comm('Sending code...', this.logSuffix);
            this.publish(this.codeMessage);
          }
        } catch (e) {
          // Wasn't from the device
        }
        break;
      case 'timeout':
      case 'leave':
        this.connectionsCount = Math.max(this.connectionsCount - 1, 0);
        this.callback?.({
          type: 'disconnect',
          connectionId: event.uuid,
          data: {
            timedout: event.action === 'timeout',
          },
        });
        break;
    }
  };

  private onPubNubMessage = (event: PubNub.MessageEvent) => {
    const message: ProtocolIncomingMessage = event.message;
    this.onProtocolMessage(event.publisher, message);
  };

  private onPubNubStatus = (_event: PubNub.StatusEvent) => {
    // TODO: Do something here?
  };

  private onPubNubVerifyCodeMessageSize = (codeMessage: ProtocolCodeMessage) => {
    // Calculate unencoded size (quickly) and if that exceeds the limit
    // then don't bother calculating the exact size (which is more expensive)
    let approxSize = 0;
    for (const path in codeMessage.diff) {
      approxSize += path.length + codeMessage.diff[path].length;
    }
    if (approxSize >= 32768) {
      return false;
    }

    // Calculate exact size and check whether it exceeds the limit
    const size = calcPubNubCodeMessageSize(this.channel, codeMessage);
    return size < 32768;
  };

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
            data: {
              timedout: false,
            },
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
