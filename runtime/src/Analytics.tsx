// Use Expo's Amplitude API to log analytics events

import Constants from 'expo-constants';

import Amplitude from './NativeModules/Amplitude';

const AMPLITUDE_KEY = '3b373bbc96d76a58d5efe2b73118a96e';

Amplitude.initializeAsync(AMPLITUDE_KEY);

let loggedReceivedFirstCode = false;

export const receivedCode = ({ message: { metadata } }: { message: { metadata: object } }) => {
  if (!loggedReceivedFirstCode) {
    Amplitude.logEventWithPropertiesAsync('RECEIVED_FIRST_CODE', {
      phoneId: Constants.installationId,
      phoneName: Constants.deviceName,
      ...metadata,
    });
    loggedReceivedFirstCode = true;
  }
};
