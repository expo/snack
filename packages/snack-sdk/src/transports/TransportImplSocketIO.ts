import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

import ConnectionMetricsEmitter from './ConnectionMetricsEmitter';
import { ProtocolOutgoingMessage, ProtocolIncomingMessage, ProtocolCodeMessage } from './Protocol';
import TransportImplBase from './TransportImplBase';
import type { SnackTransportOptions } from './types';

interface ServerToClientEvents {
  message: (data: { channel: string; message: ProtocolIncomingMessage; sender: string }) => void;
  joinChannel: (data: { channel: string; sender: string }) => void;
  leaveChannel: (data: { channel: string; sender: string }) => void;
  terminate: (reason: string) => void;
}

interface ClientToServerEvents {
  message: (data: { channel: string; message: ProtocolOutgoingMessage; sender: string }) => void;
  subscribeChannel: (data: { channel: string; sender: string }) => void;
  unsubscribeChannel: (data: { channel: string; sender: string }) => void;
}

export default class TransportImplSocketIO extends TransportImplBase {
  private readonly snackpubURL: string;
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private startTime: number | undefined;
  private connectionAttempts: number;

  constructor(options: SnackTransportOptions) {
    super(options);
    const { snackpubURL } = options;
    if (!snackpubURL) {
      throw new Error('The `snackpubURL` option is unspecified.');
    }
    this.snackpubURL = snackpubURL;
    this.connectionAttempts = 0;
  }

  protected start(): void {
    this.stop();
    this.startTime = Date.now();

    this.socket = io(this.snackpubURL, { transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.socket?.emit('subscribeChannel', { channel: this.channel, sender: this.socket?.id! });
      if (this.startTime) {
        ConnectionMetricsEmitter.emitSuccessed({
          timeMs: Date.now() - this.startTime,
          attempts: this.connectionAttempts,
        });
      }
    });
    this.socket.io.on('reconnect_attempt', (attempts: number) => {
      this.connectionAttempts = attempts;
      if (this.startTime) {
        ConnectionMetricsEmitter.emitFailed({
          timeMs: Date.now() - this.startTime,
          attempts,
        });
      }
    });

    this.socket.on('message', this.onMessage);
    this.socket.on('joinChannel', this.onJoinChannel);
    this.socket.on('leaveChannel', this.onLeaveChannel);
    this.socket.on('terminate', (reason) => {
      this.logger?.comm(`Terminating connection: ${reason}`);
      this.socket?.disconnect();
    });
  }

  protected stop(): void {
    if (this.socket != null) {
      this.logger?.comm('Stopping...', this.logSuffix);

      this.socket.offAny();
      this.socket.close();
      this.socket = null;
    }
    this.startTime = undefined;
  }

  protected isStarted(): boolean {
    return this.socket != null;
  }

  protected sendAsync(channel: string, message: ProtocolOutgoingMessage): Promise<void> {
    this.socket?.emit('message', {
      channel,
      message,
      sender: this.socket.id!,
    });
    return Promise.resolve();
  }

  protected onVerifyCodeMessageSize(codeMessage: ProtocolCodeMessage): boolean {
    // Calculate unencoded size (quickly) and if that exceeds the limit
    // then don't bother calculating the exact size (which is more expensive)
    let approxSize = 0;
    for (const path in codeMessage.diff) {
      approxSize += path.length + codeMessage.diff[path].length;
    }
    return approxSize < TransportImplBase.CODE_SIZE_LIMIT_FOR_DIFF;
  }

  private onMessage = (data: {
    channel: string;
    message: ProtocolIncomingMessage;
    sender: string;
  }) => {
    const { sender, message } = data;
    this.handleMessage(sender, message);
  };

  private onJoinChannel = (data: { channel: string; sender: string }) => {
    const { sender } = data;
    if (sender !== '' && sender !== this.socket?.id) {
      this.handleChannelEvent('join', sender);
    }
  };

  private onLeaveChannel = (data: { channel: string; sender: string }) => {
    const { sender } = data;
    if (sender !== '' && sender !== this.socket?.id) {
      this.handleChannelEvent('leave', sender);
    }
  };
}
