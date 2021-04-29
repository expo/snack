export default {
  initializeAsync(_key: string) {
    return Promise.resolve(true);
  },

  logEventWithPropertiesAsync(_type: string, _payload: object) {
    return Promise.resolve(true);
  },
};
