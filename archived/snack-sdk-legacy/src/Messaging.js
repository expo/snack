/* @flow */

import PubNub from 'pubnub';

import type { ExpoMessaging, ExpoMessagingListeners, ExpoWebPlayer, Transport } from './types';
import type { Logger } from './utils/Logger';

type Options = {
  player?: ExpoWebPlayer,
  logger: Logger,
};

const PRESENCE_TIMEOUT = 600;
const HEARTBEAT_INTERVAL = 60;

class Messaging implements ExpoMessaging {
  _pubnub: PubNub;
  _pubnubListener: ExpoMessagingListeners | void;
  player: ?ExpoWebPlayer;
  logger: Logger;

  constructor(options: Options) {
    this.player = options.player;
    this.logger = options.logger;
  }

  get pubnub(): PubNub {
    // Don't initialize PubNub until necessary
    this._pubnub =
      this._pubnub ||
      new PubNub({
        publishKey: 'pub-c-2a7fd67b-333d-40db-ad2d-3255f8835f70',
        subscribeKey: 'sub-c-0b655000-d784-11e6-b950-02ee2ddab7fe',
        ssl: true,
        presenceTimeout: PRESENCE_TIMEOUT,
        heartbeatInterval: HEARTBEAT_INTERVAL,
      });

    // If we have pending listeners, we need to add them
    if (this._pubnubListener) {
      this._pubnub.addListener(this._pubnubListener);
      this._pubnubListener = undefined;
    }

    return this._pubnub;
  }

  addListener(listener: ExpoMessagingListeners) {
    this.player &&
      this.player.listen((data) => {
        if (typeof data !== 'string') {
          return;
        }

        try {
          const message = JSON.parse(data);

          switch (message.type) {
            case 'MESSAGE':
              listener.message(message);
              break;
            case 'CONNECT':
              listener.presence({ action: 'join', uuid: JSON.stringify(message.device) });
              break;
            case 'DISCONNECT':
              listener.presence({ action: 'leave', uuid: JSON.stringify(message.device) });
              break;
          }
        } catch (e) {
          this.logger.error('Failed to parse web-player message', e, data);
        }
      });

    // If pubnub is initialized already, add the listener
    // Otherwise save it for later to add when we initialize pubnub
    if (this._pubnub) {
      this._pubnub.addListener(listener);
    } else {
      this._pubnubListener = listener;
    }
  }

  publish(channel, message, transports: Transport[]) {
    const promises = [];

    if (transports.includes('postMessage')) {
      this.logger.comm('Sending message to web-player', message);
      this.player && this.player.publish(JSON.stringify(message));
    }

    if (transports.includes('PubNub')) {
      this.logger.comm('Sending message to channel', message);
      promises.push(
        new Promise((resolve, reject) =>
          this.pubnub.publish(
            {
              channel,
              message,
            },
            (status, response) => {
              if (status.error) {
                reject(status.errorData);
              } else {
                resolve(response);
              }
            }
          )
        )
      );
    }

    return Promise.all(promises);
  }

  subscribe(channel, transports: Transport[]) {
    if (transports.includes('postMessage')) {
      this.logger.comm('Subscribing to web-player');
      this.player && this.player.subscribe();
    }

    if (transports.includes('PubNub')) {
      this.logger.comm('Subscribing to channel', channel);
      this.pubnub.subscribe({
        channels: [channel],
        withPresence: true,
      });
    }
  }

  unsubscribe(channel, transports: Transport[]) {
    if (transports.includes('postMessage')) {
      this.logger.comm('Unsubscribing from web-player');
      this.player && this.player.unsubscribe();
    }

    if (transports.includes('PubNub')) {
      this.logger.comm('Unsubscribing from channel', channel);
      this.pubnub.unsubscribe({
        channels: [channel],
      });
    }
  }
}

export default function createMessaging(options: Options): ExpoMessaging {
  return new Messaging(options);
}
