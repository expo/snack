export type ShutdownSignal = 'SIGHUP' | 'SIGINT' | 'SIGTERM' | 'SIGUSR2';

export interface ServerToClientEvents {
  message: (data: { channel: string; message: object; sender: string }) => void;
  joinChannel: (data: { channel: string; sender: string }) => void;
  leaveChannel: (data: { channel: string; sender: string }) => void;
}

export interface ClientToServerEvents {
  message: (data: { channel: string; message: object; sender: string }) => void;
  subscribeChannel: (data: { channel: string; sender: string }) => void;
  unsubscribeChannel: (data: { channel: string; sender: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  deviceId: string;
}
