import { Context as ServerContext } from 'koa';
import * as React from 'react';
import { Switch, Route } from 'react-router-dom';

import type { RouterData, QueryParams } from '../types';
import App from './App';
import EmbeddedApp from './EmbeddedApp';
import NonExistent from './NonExistent';

type RouterProps = {
  /** The server context if Snack is being server-side rendered */
  ctx?: ServerContext;
  data: RouterData;
  queryParams: QueryParams;
  userAgent: string;
};

export default function Router(props: RouterProps) {
  const render404 = React.useCallback(() => {
    if (props.ctx) {
      // If the router is server-side rendered, we need to set the right response code and headers.
      // Without this, it's possible CDNs might cache the invalid path.
      props.ctx.response.status = 404;
      props.ctx.response.set(
        'Cache-Control',
        'private, no-cache, no-store, max-age=0, must-revalidate'
      );
    }

    return <NonExistent />;
  }, [props.ctx]);

  function renderRoute(routeProps: any) {
    const { data } = props;
    const isEmbedded = routeProps.location.pathname.split('/')[1] === 'embedded';

    if (!data || data.type !== 'success') {
      return render404();
    }

    const appProps: React.ComponentProps<typeof App | typeof EmbeddedApp> = {
      ...routeProps,
      userAgent: props.userAgent,
      query: props.queryParams,
      snack: data.snack,
      defaults: data.defaults,
    };

    return isEmbedded ? <EmbeddedApp {...appProps} /> : <App {...appProps} />;
  }

  return (
    <Switch>
      <Route exact path="/embedded/@:username/:projectName+" render={renderRoute} />
      <Route exact path="/embedded/:id" render={renderRoute} />
      <Route exact path="/embedded" render={renderRoute} />
      <Route exact path="/@:username/:projectName+" render={renderRoute} />
      <Route exact path="/:id" render={renderRoute} />
      <Route exact path="/" render={renderRoute} />
      <Route render={render404} />
    </Switch>
  );
}
