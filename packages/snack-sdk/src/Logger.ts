type LogFn = (...messages: unknown[]) => void;

export interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  comm: LogFn;
  comm_recv: LogFn;
  module: LogFn;
}

function logFn(isEnabled: boolean, type: string, color: string, textColor?: string) {
  return (...messages: any[]) => {
    if (isEnabled) {
      console.log(
        `%c ${type.toUpperCase()} `,
        `background: ${color}; color: ${textColor ?? '#fff'}`,
        ...messages
      );
    }
  };
}

export function createLogger(isEnabled: boolean): Logger {
  return {
    info: logFn(isEnabled, 'info', '#2196f3'),
    warn: logFn(isEnabled, 'warn', '#FF9800'),
    error: logFn(isEnabled, 'error', '#f44336'),
    comm: logFn(isEnabled, 'comm', '#DBD64E'),
    comm_recv: logFn(isEnabled, 'comm', '#DBD64E', '#000'),
    module: logFn(isEnabled, 'module', '#DB14C7'),
  };
}
