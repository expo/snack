import Constants from 'expo-constants';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import * as Logger from '../Logger';
import type { Device, RuntimeMessagePayload, RuntimeTransport } from './RuntimeTransport';

const SNACKPUB_URL_STAGING = 'https://staging-snackpub-3hn4fth2vq-uc.a.run.app';
const SNACKPUB_URL_PRODUCTION = 'https://snackpub-3hn4fth2vq-uc.a.run.app';

interface ServerToClientEvents {
  message: (data: { channel: string; sender: string } & RuntimeMessagePayload) => void;
  joinChannel: (data: { channel: string; sender: string }) => void;
  leaveChannel: (data: { channel: string; sender: string }) => void;
}

interface ClientToServerEvents {
  message: (data: { channel: string; message: object; sender: string }) => void;
  subscribeChannel: (data: { channel: string; sender: string }) => void;
  unsubscribeChannel: (data: { channel: string; sender: string }) => void;
}

export default class RuntimeTransportImplSocketIO implements RuntimeTransport {
  private currentChannel: string | null = null;
  private readonly device: Device;
  private readonly sender: string;
  private readonly socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor(device: Device) {
    this.device = device;
    this.sender = JSON.stringify(device);
    const snackpubURL =
      Constants.manifest?.extra?.cloudEnv !== 'production'
        ? SNACKPUB_URL_STAGING
        : SNACKPUB_URL_PRODUCTION;
    this.socket = io(snackpubURL, { transports: ['websocket'] });
  }

  subscribe(channel: string) {
    this.unsubscribe();

    this.currentChannel = channel;
    Logger.comm('Subscribing to channel', channel);
    this.socket.emit('subscribeChannel', { channel, sender: this.sender });
  }

  unsubscribe() {
    if (this.currentChannel) {
      Logger.comm('Unsubscribing from channel', this.currentChannel);
      this.socket.emit('unsubscribeChannel', {
        channel: this.currentChannel,
        sender: this.sender,
      });
      this.currentChannel = null;
    }
  }

  listen(listener: (payload: RuntimeMessagePayload) => void) {
    this.socket.on('message', listener);
  }

  publish(message: object) {
    if (this.currentChannel) {
      Logger.comm('Sending message', message);
      this.socket.emit('message', {
        channel: this.currentChannel,
        message: { ...message, device: this.device },
        sender: this.sender,
      });
    }
  }

  isConnected(): boolean {
    return this.socket.connected;
  }
}
