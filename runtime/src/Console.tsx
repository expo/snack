import LogBox from './NativeModules/LogBox';

const ignoredWarnings = [
  'Setting a timer for a long period of time',

  // The following warnings don't seem to occur by default anymore.
  // TODO: These should probably be removed
  'Require cycle',
  'Following APIs have moved',

  // TODO(cedric): Move away from Constants.installationId
  'Constants.installationId has been deprecated',
];

LogBox.ignoreLogs(ignoredWarnings);

// @ts-ignore: Property __original__ does not exist on console
export const originalConsole = console.__original__ || {
  // TODO: Why is console.info
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
};
// @ts-ignore: Property __original__ does not exist on console
console.__original__ = originalConsole;

// Initialize Snack console. Hooks around `console.` methods to notify `Messaging` channel.
export const initialize = (callback: (method: string, payload: unknown[]) => void) => {
  ['log', 'error', 'warn'].map((methodName) => {
    // @ts-ignore
    console[methodName] = function (...args: unknown[]) {
      if (__DEV__) {
        switch (methodName) {
          case 'error':
            originalConsole.log(
              '%c APP %c ERROR ',
              'background: #01FFA2;',
              'background: #f44336; color: #fff;',
              ...args
            );
            break;
          case 'warn':
            originalConsole.log(
              '%c APP %c WARN ',
              'background: #01FFA2;',
              'background: #FF9800; color: #fff;',
              ...args
            );
            break;
        }
      }

      if (
        ignoredWarnings.some(
          (warning) => typeof args[0] === 'string' && (args[0] as string).startsWith(warning)
        )
      ) {
        return;
      }

      // TODO(tc): base console calls during initial load are putting the android app into a bad state
      // originalConsole[methodName](...args);
      callback(methodName, args);
    };
  });

  // React Native calls `console._errorOriginal(...)` underneath on a `console.error(...)` after
  // wrapping it internally. This ends up causing a stack overflow due to recursive calls somehow
  // after our hooks, so noop it out...
  //
  // See https://github.com/expo/react-native/blob/ed69235cb8d4a5cdb21bada7f53ba73bcb9cab13/Libraries/Core/ExceptionsManager.js#L105
  // @ts-ignore
  console._errorOriginal = () => {};
};
