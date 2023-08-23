// Disable Amplitude for SDK 46
// TODO(cedric): find an alternative to send events
export default {
  initializeAsync(_key: string) {
    return Promise.resolve(true);
  },

  logEventWithPropertiesAsync(_type: string, _payload: object) {
    return Promise.resolve(true);
  },
};
