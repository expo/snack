// Currently maintains one PubNub subscription for communication with a remote machine

import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  Device,
  RuntimeMessagePayload,
  RuntimeTransport,
} from './transports/RuntimeTransport';

let transport: RuntimeTransport | null = null;

// Device metadata that is sent with every message from us
const device: Device = {
  id: '', // async, populated in init
  name: Constants.deviceName,
  platform: Platform.OS,
};

export const init = (deviceId: string, testTransport: string | null | undefined) => {
  device.id = deviceId;
  let transportClass;
  if (Platform.OS === 'web') {
    transportClass = require('./transports/RuntimeTransportImplWebPlayer').default;
  } else if (testTransport === 'snackpub') {
    transportClass = require('./transports/RuntimeTrafficMirroringTransport').default;
  } else if (testTransport === 'snackpubOnly') {
    transportClass = require('./transports/RuntimeTransportImplSocketIO').default;
  } else {
    transportClass = require('./transports/RuntimeTransportImplPubNub').default;
  }
  transport = new transportClass(device);
};

export const unsubscribe = () => {
  if (!transport) {
    throw new Error('Transport not initialized, call `Messaging.init()` first.');
  }
  transport.unsubscribe();
};

export const subscribe = ({ channel }: { channel: string }) => {
  if (!transport) {
    throw new Error('Transport not initialized, call `Messaging.init()` first.');
  }
  transport.subscribe(channel);
};

export const listen = (listener: (payload: RuntimeMessagePayload) => void) => {
  if (!transport) {
    throw new Error('Transport not initialized, call `Messaging.init()` first.');
  }
  transport.listen(listener);
};

export const publish = (message: object) => {
  if (!transport) {
    throw new Error('Transport not initialized, call `Messaging.init()` first.');
  }
  transport.publish(message);
};
