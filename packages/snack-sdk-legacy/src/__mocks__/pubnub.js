'use strict';

export default class PubNub {
  subscribe = jest.fn();
  unsubscribe = jest.fn();

  addListener = jest.fn((listener) => {
    this._listener = listener;
  });

  publish = jest.fn((object, listener) => {
    this._publishListener = listener;
  });

  __sendMessage = (object) => {
    this._listener.message(object);
  };

  __sendPresence = (object) => {
    this._listener.presence(object);
  };

  __sendStatus = (object) => {
    this._listener.status(object);
  };
}
