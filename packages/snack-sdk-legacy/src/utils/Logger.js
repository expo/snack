/* @flow */

type LogFn = (...messages: any[]) => void;

export type Logger = {
  info: LogFn,
  warn: LogFn,
  error: LogFn,
  comm: LogFn,
  comm_recv: LogFn,
  module: LogFn,
};

function logFn(isEnabled: boolean, type: string, color: string, textColor?: string) {
  return (...messages: any[]) => {
    if (isEnabled) {
      console.log(
        `%c ${type.toUpperCase()} `,
        `background: ${color}; color: ${textColor || '#fff'}`,
        ...messages
      );
    }
  };
}

function createLogger(isEnabled: boolean): Logger {
  return {
    info: logFn(isEnabled, 'info', '#2196f3'),
    warn: logFn(isEnabled, 'warn', '#FF9800'),
    error: logFn(true, 'error', '#f44336'),
    comm: logFn(isEnabled, 'comm', '#DBD64E'),
    comm_recv: logFn(isEnabled, 'comm', '#DBD64E', '#000'),
    module: logFn(isEnabled, 'module', '#DB14C7'),
  };
}

export default createLogger;
