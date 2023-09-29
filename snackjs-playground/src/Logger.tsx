import { isVerbose } from './NativeModules/Linking';

const verbose = isVerbose();

const logger =
  (type: string, color: string, textColor?: string) =>
  (...messages: unknown[]) => {
    if (verbose) {
      console.log(
        `%c ${type.toUpperCase()} `,
        `background: ${color}; color: ${textColor ?? '#fff'}`,
        ...messages
      );
    }
  };

export const info = logger('info', '#2196f3');
export const warn = logger('warn', '#FF9800');
export const error = logger('error', '#f44336');
export const comm = logger('comm', '#DBD64E');
export const comm_recv = logger('comm', '#DBD64E', '#000');
export const comm_error = logger('comm', '#f44336');
export const module = logger('module', '#DB14C7');
