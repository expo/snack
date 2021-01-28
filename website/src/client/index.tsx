import cookies from 'js-cookie';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import PreferencesProvider from './components/Preferences/PreferencesProvider';
import Router from './components/Router';
import ServiceWorkerManager from './components/ServiceWorkerManager';
import ThemeProvider from './components/ThemeProvider';
import createStore from './redux/createStore';
import type { RouterData, QueryParams } from './types';

declare const __INITIAL_DATA__: {
  data: RouterData;
  queryParams: QueryParams;
  splitTestSettings: any;
};

const store = createStore({ splitTestSettings: __INITIAL_DATA__.splitTestSettings });

function SnackApp() {
  return (
    <React.StrictMode>
      <ServiceWorkerManager />
      <HelmetProvider>
        <Provider store={store}>
          <PreferencesProvider cookies={cookies} queryParams={__INITIAL_DATA__.queryParams}>
            <ThemeProvider>
              <BrowserRouter>
                <Router
                  data={__INITIAL_DATA__.data}
                  queryParams={__INITIAL_DATA__.queryParams}
                  userAgent={navigator.userAgent}
                />
              </BrowserRouter>
            </ThemeProvider>
          </PreferencesProvider>
        </Provider>
      </HelmetProvider>
    </React.StrictMode>
  );
}

ReactDOM.hydrate(<SnackApp />, document.getElementById('root'));
