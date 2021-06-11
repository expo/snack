// Currently maintains one PubNub subscription for communication with a remote machine

import Constants from 'expo-constants';
import PubNub, { ListenerParameters } from 'pubnub';
import { Platform } from 'react-native';

import * as Logger from './Logger';

const PRESENCE_TIMEOUT = 600;
const HEARTBEAT_INTERVAL = 60;

let pubnub: PubNub;

// Device metadata that is sent with every message from us
const device = {
  id: '', // async, populated in init
  name: Constants.deviceName,
  platform: Platform.OS,
};

let currentChannel: string | null = null;

export const init = (deviceId: string) => {
  pubnub = new PubNub({
    publishKey: 'pub-c-2a7fd67b-333d-40db-ad2d-3255f8835f70',
    subscribeKey: 'sub-c-0b655000-d784-11e6-b950-02ee2ddab7fe',
    uuid: JSON.stringify({
      id: deviceId,
      name: Constants.deviceName,
      platform: Platform.OS,
    }),
    ssl: true,
    presenceTimeout: PRESENCE_TIMEOUT,
    heartbeatInterval: HEARTBEAT_INTERVAL,
  });
  device.id = deviceId;
};

// End existing PubNub subscription, if any
export const unsubscribe = () => {
  if (currentChannel) {
    Logger.comm('Unsubscribing from channel', currentChannel);
    pubnub.unsubscribe({ channels: [currentChannel] });
  }
};

// Initiate PubNub subscription to given `channel`, throw if couldn't connect / timed out. Ends
// existing subscription, if any.
export const subscribe = ({ channel }: { channel: string }) => {
  unsubscribe();

  currentChannel = channel;
  Logger.comm('Subscribing to channel', channel);
  pubnub.subscribe({ channels: [channel] });
};

// Add a message listener
export const listen = (listener: ListenerParameters['message']) => {
  pubnub.addListener({ message: listener });
};

// Publish a message to the currently subscribed channel, if any
export const publish = (message: object) => {
  if (currentChannel) {
    Logger.comm('Sending message', message);
    pubnub.publish({
      channel: currentChannel,
      message: { ...message, device },
    });
  }
};
