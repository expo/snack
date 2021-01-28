import * as React from 'react';

import { QueryParams } from '../types';
import App from './App';
import EmbeddedShell from './Shell/EmbeddedShell';

type Props = React.ComponentProps<typeof App> & {
  query: QueryParams;
};

type State = {
  query: QueryParams;
  receivedDataEvent: boolean;
};

export default class EmbeddedApp extends React.PureComponent<Props, State> {
  state = {
    query: this.props.query,
    receivedDataEvent: false,
  };

  componentDidMount() {
    this._listenForDataEvent();
  }

  _listenForDataEvent = () => {
    const { query } = this.state;

    if (query?.waitForData && query.iframeId) {
      const iframeId = query.iframeId;

      window.parent.postMessage(['expoFrameLoaded', { iframeId }], '*');
      window.addEventListener('message', (event) => {
        const eventName = event.data[0];
        const data = event.data[1];

        if (eventName === 'expoDataEvent' && data.iframeId === iframeId) {
          const { query: stateQuery } = this.state;
          this.setState({
            query: { ...stateQuery, ...data },
            receivedDataEvent: true,
          });
        }
      });
    }
  };

  render() {
    const { query, receivedDataEvent } = this.state;

    if (query?.waitForData && !receivedDataEvent) {
      return <EmbeddedShell />;
    }

    return <App {...this.props} query={query} isEmbedded />;
  }
}
