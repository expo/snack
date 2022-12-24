import PubNub from 'pubnub';

import { ProtocolOutgoingMessage, ProtocolIncomingMessage, ProtocolCodeMessage } from './Protocol';
import TransportImplBase from './TransportImplBase';

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

export default class TransportImplPubNub extends TransportImplBase {
  private pubNub?: PubNub;
  private pubNubClientId?: string;

  protected start() {
    this.stop();

    if (!this.pubNubClientId) {
      // Keep track of the client ID per transport instance.
      // See: https://support.pubnub.com/hc/en-us/articles/360051496532-How-do-I-set-the-UUID-
      this.pubNubClientId = PubNub.generateUUID();
    }

    if (this.channel) {
      this.logger?.comm('Starting channel...', this.channel, this.logSuffix);
      this.pubNub = new PubNub({
        publishKey: 'pub-c-2a7fd67b-333d-40db-ad2d-3255f8835f70',
        subscribeKey: 'sub-c-0b655000-d784-11e6-b950-02ee2ddab7fe',
        uuid: this.pubNubClientId,
        ssl: true,
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

  protected stop() {
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

  protected isStarted() {
    return this.pubNub != null;
  }

  protected async sendAsync(channel: string, message: ProtocolOutgoingMessage): Promise<void> {
    await this.pubNub?.publish({
      channel,
      message,
    });
  }

  protected onVerifyCodeMessageSize(codeMessage: ProtocolCodeMessage): boolean {
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
  }

  private onPubNubPresence = (event: PubNub.PresenceEvent) => {
    switch (event.action) {
      case 'join':
        this.handleChannelEvent('join', event.uuid);
        break;
      case 'timeout':
      case 'leave':
        this.handleChannelEvent('leave', event.uuid);
        break;
    }
  };

  private onPubNubMessage = (event: PubNub.MessageEvent) => {
    const message: ProtocolIncomingMessage = event.message;
    this.handleMessage(event.publisher, message);
  };

  private onPubNubStatus = (_event: PubNub.StatusEvent) => {
    // TODO: Do something here?
  };
}
