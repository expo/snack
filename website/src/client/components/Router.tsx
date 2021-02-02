import * as React from 'react';
import { Switch, Route } from 'react-router-dom';

import type { RouterData, QueryParams } from '../types';
import App from './App';
import EmbeddedApp from './EmbeddedApp';
import NonExistent from './NonExistent';

type Props = {
  data: RouterData;
  queryParams: QueryParams;
  userAgent: string;
};

export default class Router extends React.Component<Props> {
  private _renderRoute = (props: any) => {
    const { data, ...rest } = this.props;
    const isEmbedded = props.location.pathname.split('/')[1] === 'embedded';

    if (data && data.type === 'success') {
      const appProps = {
        ...props,
        ...rest,
        query: this.props.queryParams,
        snack: data.snack,
        defaults: data.defaults,
      };
      return isEmbedded ? <EmbeddedApp {...appProps} /> : <App {...appProps} />;
    } else {
      return <NonExistent />;
    }
  };

  render() {
    return (
      <Switch>
        <Route exact path="/embedded/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/embedded/:id" render={this._renderRoute} />
        <Route exact path="/embedded" render={this._renderRoute} />
        <Route exact path="/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/:id" render={this._renderRoute} />
        <Route exact path="/" render={this._renderRoute} />
        <Route component={NonExistent} />
      </Switch>
    );
  }
}
