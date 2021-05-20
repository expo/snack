// Currently only one error is saved at a time for display

import Constants from 'expo-constants';
import * as React from 'react';
import { View, ScrollView, Text, StyleSheet, Platform } from 'react-native';

import * as Files from './Files';
import * as Logger from './Logger';
import * as Messaging from './Messaging';
import * as Modules from './Modules';
import ExceptionManager from './NativeModules/ExceptionManager';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  attemptRender: boolean;
  content: React.ReactNode;
};

// Save an error for display
let initialError: Error | null = null;
let setError = (e: Error | null) => {
  initialError = e;
};
let getError = () => initialError;

// Replace React Native's top-level exception handler with our own. Also its
// `console.error(...)`-to-exception forwarder skips this override so disable that too.
//
// See https://github.com/expo/react-native/blob/exp-latest/Libraries/Core/ExceptionsManager.js
ExceptionManager.handleException = (e: Error, _isFatal: boolean) => {
  report(e);
};

// @ts-ignore
console.reportErrorsAsExceptions = false;

// Report an error
export const report = (e: Error) => {
  Logger.error(e);
  setError(e);

  // Ensure the error is a real error
  if (typeof e !== 'object') {
    e = new Error(String(e));
  }

  // Try to resolve the location of the error
  const name = e.name;
  const stack = e.stack;
  const message = e.message;
  // @ts-ignore: fileName is not a default field of Error
  let fileName: string = e.fileName || '';
  // @ts-ignore: line fields are optional
  let lineNumber: number | undefined = e.lineNumber ?? e.startLine ?? e.line;
  // @ts-ignore: column fields are optional
  let columnNumber: number | undefined = e.columnNumber ?? e.startColumn ?? e.column;
  const lines = message.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let match = lines[i].match(/module:\/+(.*):(.*)\s\((\d+):(\d+)(\n|\))/);
    if (match) {
      fileName = Modules.sanitizeModule(match[1]);
      lineNumber = Number(match[3]);
      columnNumber = Number(match[4]);
      break;
    }
    match = lines[i].match(/module:\/+(.*)/);
    if (match) {
      fileName = Modules.sanitizeModule(match[1]);
      if (Files.get(fileName)) {
        break;
      }
    }
  }

  // Send error
  Messaging.publish({
    type: 'ERROR',
    error: JSON.stringify({
      name,
      message,
      fileName,
      lineNumber,
      columnNumber,
      stack,
    }),
  });
};

export const status = () => (getError() ? 'FAILURE' : 'SUCCESS');

// Prettified version of an `Error`'s stack trace. Performs the following transformations:
//   1. Replace references to the Snack client bundle code with `[snack internals]`.
//   2. Unmap references to user code to the original file and line and column.
//   3. Make column numbers one-indexed.
export const prettyStack = (e: Error) =>
  (e.stack ?? '')
    .replace(/https?:\/\/.+\n/g, '[snack internals]\n')
    .replace(/(module:\/\/[^:]+):(\d+):(\d+)(\n|\))/g, (match, sourceURL, line, column) => {
      const u = Modules.unmap({
        sourceURL,
        line: parseInt(line, 10),
        column: parseInt(column, 10),
      });
      return u
        ? u.path + (u.line !== null && u.column !== null ? `:${u.line}:${u.column}\n` : '\n')
        : match.replace(/module:\/+/, '').replace(/\.js\.js/, '.js');
    })
    .replace(/:(\d+):(\d+)\n/g, (_, line, column) => `:${line}:${parseInt(column, 10) + 1}\n`)
    .replace(/module:\/+/g, '');

// Acts as a boundary for upward error propagation in the React render tree. Displays errors with a
// friendly dialog.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      error: initialError,
      content: React.Children.only(props.children),
      attemptRender: true,
    };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    // ErrorBoundary expects only a single child so it can
    // efficiently determine whether the content has changed.
    const content = React.Children.only(props.children);
    if (state.content !== content) {
      return {
        content,
        attemptRender: true,
        // Reset error when new content has been received
        error: content ? null : state.error,
      };
    }
    return null;
  }

  componentDidMount() {
    setError = (error) => this.setState(() => ({ error }));
    getError = () => this.state.error;
  }

  componentWillUnmount() {
    setError = (_error: Error | null) => {};
    getError = () => null;
  }

  componentDidCatch(error: Error) {
    Logger.error(error);
    // This is called by React when an error occurs during rendering, so save the error and stop
    // rendering for now
    this.setState({ error, attemptRender: false });
  }

  render() {
    const { error, attemptRender } = this.state;
    const { children } = this.props;

    return (
      <View style={styles.container}>
        {attemptRender && this._renderChildren(children)}
        {error && this._renderOverlay(error)}
      </View>
    );
  }

  _renderChildren(children: React.ReactNode) {
    return <View style={styles.children}>{children}</View>;
  }

  _renderOverlay(error: Error) {
    return (
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.titleBold}>Did you know: </Text>
            <Text>You can turn off automatic updates under Devices in the footer?</Text>
          </Text>
        </View>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {this._renderErrorMessage(error)}
          {this._renderStackTrace(error)}
        </ScrollView>
      </View>
    );
  }

  _renderErrorMessage(error: Error) {
    const lines = error.message.split(/\r\n?|\n/);
    const children = [];
    let text = '';
    let isCode = false;
    lines.forEach((line) => {
      if (!line.trim()) return;
      line = line.replace(/module:\/+/g, '').replace(/\.js\.js/g, '.js');
      if (line.match(isCode ? /\|/ : /^\s*\d+\s*\|/)) {
        if (text && !isCode) {
          children.push(
            <Text key={children.length + ''} style={styles.plain}>
              {text}
            </Text>
          );
          text = '';
        }
        isCode = true;
      } else if (isCode) {
        children.push(
          <Text key={children.length + ''} style={styles.code}>
            {text}
          </Text>
        );
        isCode = false;
        text = '';
      }
      if (text) {
        text = `${text}\n${line}`;
      } else {
        text = line;
      }
    });
    if (text) {
      children.push(
        <Text key={children.length + ''} style={isCode ? styles.code : styles.plain}>
          {text}
        </Text>
      );
    }

    return <View style={styles.message}>{children}</View>;
  }

  _renderStackTrace(error: Error) {
    return <Text style={styles.stack}>{prettyStack(error)}</Text>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  children: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 28 + Constants.statusBarHeight,
    bottom: 28,
    left: 28,
    right: 28,
    backgroundColor: '#f44336',
    borderColor: '#922820',
    borderRadius: 16,
    borderTopWidth: 0,
    borderLeftWidth: 0.4,
    borderRightWidth: 0.4,
    borderBottomWidth: 1.2,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 42,
    padding: 8,
  },
  header: {
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'white',
    flexDirection: 'row',
  },
  title: {
    color: 'white',
  },
  titleBold: {
    fontWeight: 'bold',
  },
  content: { backgroundColor: 'transparent' },
  contentContainer: {
    padding: 8,
  },
  message: {
    marginBottom: 16,
  },
  plain: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stack: {
    color: 'white',
    fontSize: 14,
  },
});
