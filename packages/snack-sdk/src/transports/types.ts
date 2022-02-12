import { SnackFiles, SnackDependencies, SDKVersion } from 'snack-content';

import { ProtocolOutgoingMessage, ProtocolIncomingMessage } from './Protocol';

export type SnackTransportStartMessage = {
  type: 'start';
};

export type SnackTransportStopMessage = {
  type: 'stop';
};

export type SnackTransportUpdateCodeMessage = {
  type: 'update_code';
  data: {
    files: SnackFiles;
    dependencies: SnackDependencies;
    sdkVersion: SDKVersion;
  };
};

export type SnackTransportProtocolMessage = {
  type: 'protocol_message';
  data: ProtocolOutgoingMessage;
};

export type SnackTransportSyntheticMessage = {
  type: 'synthetic_event';
  data: any;
};

export type SnackTransportMessage =
  | SnackTransportStartMessage
  | SnackTransportStopMessage
  | SnackTransportUpdateCodeMessage
  | SnackTransportProtocolMessage
  | SnackTransportSyntheticMessage;

export type SnackTransportEventConnect = {
  type: 'connect';
  connectionId: string;
  data: any; // DeviceInfo
};

export type SnackTransportEventDisconnect = {
  type: 'disconnect';
  connectionId: string;
  data: {
    timedout: boolean;
  };
};

export type SnackTransportEventProtocolMessage = {
  type: 'protocol_message';
  connectionId: string;
  data: ProtocolIncomingMessage;
};

export type SnackTransportEventSendMessage = {
  type: 'send_message';
  data: ProtocolOutgoingMessage;
};

export type SnackTransportEventSyntheticMessage = {
  type: 'synthetic_event';
  data: any;
};

export type SnackTransportEvent =
  | SnackTransportEventConnect
  | SnackTransportEventDisconnect
  | SnackTransportEventProtocolMessage
  | SnackTransportEventSendMessage
  | SnackTransportEventSyntheticMessage;

export type SnackTransportListener = (event: SnackTransportEvent) => void;

export interface SnackTransport {
  addEventListener(type: 'message', listener: SnackTransportListener): void;
  removeEventListener(type: 'message', listener: SnackTransportListener): void;
  postMessage(message: SnackTransportMessage): void;
}

export type SnackTransportOptions = {
  channel?: string;
  apiURL?: string;
  verbose?: boolean;
  name?: string;
};
