import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { reload } from '../utils/reloadURL';
import ThemeProvider from './ThemeProvider';
import Banner from './shared/Banner';

type State = {
  banner: boolean;
};

export default class ServiceWorkerManager extends React.Component<object, State> {
  state = {
    banner: false,
  };

  componentDidMount() {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      const { serviceWorker } = navigator;

      // Register the service worker
      serviceWorker
        .register('/dist/sw.bundle.js', {
          scope: '/',
        })
        .then((registration) => {
          // Check if an updated worker is available
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;

            if (worker) {
              worker.addEventListener('statechange', () => {
                switch (worker.state) {
                  case 'installed': {
                    // A new service worker is available and installed
                    const isEmbedded = window.location.pathname.split('/')[1] === 'embedded';
                    if (!isEmbedded && serviceWorker.controller) {
                      this.setState({ banner: true });
                    }
                    break;
                  }
                }
              });
            }
          });
        });

      // Check if there is a service worker in already in waiting state
      // This might happen if the user refreshed the page without updating the worker
      serviceWorker.ready.then((registration) => {
        const worker = registration.waiting;
        const isEmbedded = window.location.pathname.split('/')[1] === 'embedded';

        if (!isEmbedded && worker && worker.state === 'installed') {
          this.setState({ banner: true });
        }
      });

      // Refresh page when the new service worker takes over
      serviceWorker.addEventListener('controllerchange', () => {
        if (document.hasFocus()) {
          // If the current page has focus, refresh it
          reload();
        }
      });
    }
  }

  _handleReload = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;
      const worker = registration.waiting;

      if (worker && worker.state === 'installed') {
        // If there is a worker waiting, let it know to take over
        worker.postMessage('skipWaiting');
      } else {
        // If there's no worker waiting, refresh the page anyway since the user clicked 'reload'
        // This might happen when there are multiple tabs open and the worker was activated by another tab
        // Reloading the page will make sure that this page is consistent with the new worker
        reload();
      }
    }
  };

  render() {
    if (!this.state.banner) {
      return null;
    }

    return (
      <ThemeProvider theme="light" style={styles.container}>
        <Banner visible>
          An update is available.{' '}
          <button className={css(styles.button, styles.reload)} onClick={this._handleReload}>
            Click here to reload
          </button>{' '}
          and start using the new version.
          <button
            className={css(styles.button, styles.close)}
            onClick={() => this.setState({ banner: false })}>
            ✕
          </button>
        </Banner>
      </ThemeProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
  },

  button: {
    appearance: 'none',
    display: 'inline',
    backgroundColor: 'transparent',
    border: 0,
  },

  reload: {
    padding: 0,
    margin: 0,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },

  close: {
    padding: '0 4px',
    marginLeft: 8,
  },
});
