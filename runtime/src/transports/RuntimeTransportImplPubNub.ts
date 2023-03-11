// Currently maintains one PubNub subscription for communication with a remote machine

import PubNub from 'pubnub';

import * as Logger from '../Logger';
import type { Device, RuntimeMessagePayload, RuntimeTransport } from './RuntimeTransport';

const PRESENCE_TIMEOUT = 600;
const HEARTBEAT_INTERVAL = 60;

export default class RuntimeTransportImplPubNub implements RuntimeTransport {
  private currentChannel: string | null = null;
  private readonly device: Device;
  private readonly pubnub: PubNub;

  constructor(device: Device) {
    this.device = device;
    this.pubnub = new PubNub({
      publishKey: 'pub-c-2a7fd67b-333d-40db-ad2d-3255f8835f70',
      subscribeKey: 'sub-c-0b655000-d784-11e6-b950-02ee2ddab7fe',
      uuid: JSON.stringify(device),
      ssl: true,
      presenceTimeout: PRESENCE_TIMEOUT,
      heartbeatInterval: HEARTBEAT_INTERVAL,
    });
  }

  /**
   * Initiate PubNub subscription to given `channel`, throw if couldn't connect / timed out.
   * Ends existing subscription, if any.
   */
  subscribe(channel: string) {
    // End existing PubNub subscription, if any
    this.unsubscribe();

    this.currentChannel = channel;
    Logger.comm('Subscribing to channel', channel);
    this.pubnub.subscribe({ channels: [channel] });
  }

  unsubscribe() {
    if (this.currentChannel) {
      Logger.comm('Unsubscribing from channel', this.currentChannel);
      this.pubnub.unsubscribe({ channels: [this.currentChannel] });
      this.currentChannel = null;
    }
  }

  /**
   * Add a message listener
   */
  listen(listener: (payload: RuntimeMessagePayload) => void) {
    this.pubnub.addListener({ message: listener });
  }

  /**
   * Publish a message to the currently subscribed channel, if any
   */
  publish(message: object) {
    if (this.currentChannel) {
      Logger.comm('Sending message', message);
      this.pubnub.publish({
        channel: this.currentChannel,
        message: { ...message, device: this.device },
      });
    }
  }

  isConnected(): boolean {
    // We don't have a way to get current connection status from PubNub SDK, assuming it's connected.
    return true;
  }
}
