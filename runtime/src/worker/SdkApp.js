/* global AbortController */
import React from 'react';
import { View, Text, Platform } from 'react-native';

import { createNativeRuntime } from './runtime';
import { downloadSdkArtifact, downloadSavedSdkArtifact } from './sdk-artifact';
import { connectSdkSession, parsePayload } from './sdk-transport';
class Boundary extends React.Component {
  state = { error: null, revision: 0 };
  static getDerivedStateFromProps(props, state) {
    return props.revision !== state.revision ? { error: null, revision: props.revision } : null;
  }
  static getDerivedStateFromError(error) {
    return { error: String(error) };
  }
  componentDidCatch(error) {
    this.props.report(error);
  }
  render() {
    return this.state.error ? <Text>{this.state.error}</Text> : this.props.children;
  }
}
export default function SdkApp({ channel, url, snackId, apiURL }) {
  const refreshEnabled = React.useRef(false);
  const [screen, setScreen] = React.useState({ tree: null, revision: 0, error: 'Connecting…' });
  const transport = React.useRef(null);
  React.useEffect(() => {
    const platform = Platform.OS;
    if (platform !== 'ios' && platform !== 'android') {
      setScreen((previous) => ({ ...previous, error: 'This client requires iOS or Android' }));
      return;
    }
    let active = true;
    const runtime = createNativeRuntime(() =>
      Promise.reject(Error('Server actions are not supported in ordinary Snacks')),
    );
    refreshEnabled.current = runtime.supportsRefresh;
    const controller = new AbortController();
    let liveReceived = false;
    const display = async (payload) => {
      await runtime.install(payload.client);
      const tree = await runtime.decode(payload.flight);
      if (active) runtime.refresh();
      if (active) setScreen((previous) => ({ tree, revision: previous.revision + 1, error: null }));
    };
    const report = (error) => {
      if (active) setScreen((previous) => ({ ...previous, error: String(error) }));
    };
    // Serialize installs so a slow saved download cannot overwrite a newer live edit.
    let installation = Promise.resolve();
    const enqueue = (payload, saved = false) => {
      installation = installation
        .catch(() => {})
        .then(async () => {
          if (!active || (saved && liveReceived)) return;
          await display(payload);
        });
      return installation;
    };
    if (channel && url)
      transport.current = connectSdkSession({
        url,
        channel,
        platform,
        loadReference: downloadSdkArtifact,
        onArtifact: (payload) => {
          liveReceived = true;
          controller.abort();
          return enqueue(payload);
        },
        onError: report,
      });
    if (snackId && apiURL) {
      downloadSavedSdkArtifact(apiURL, snackId, controller.signal)
        .then((artifact) => {
          if (!active || liveReceived) return;
          const text = artifact.platforms[platform];
          if (typeof text !== 'string')
            throw Error(artifact.errors?.[platform] || 'Missing native graph');
          return enqueue(parsePayload(text), true);
        })
        .catch((error) => {
          if (!controller.signal.aborted) report(error);
        });
    }
    return () => {
      active = false;
      controller.abort();
      transport.current?.close();
    };
  }, [channel, url, snackId, apiURL]);
  return (
    <View style={{ flex: 1 }}>
      {screen.error ? <Text>{screen.error}</Text> : null}
      {screen.tree ? (
        <Boundary
          key={refreshEnabled.current ? 0 : screen.revision}
          revision={screen.revision}
          report={(error) => transport.current?.report(error)}>
          {screen.tree}
        </Boundary>
      ) : null}
    </View>
  );
}
