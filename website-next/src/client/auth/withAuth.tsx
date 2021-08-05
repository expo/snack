import isEqual from 'lodash/isEqual';
import nullthrows from 'nullthrows';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { Viewer, $Subtract } from '../types';
import Analytics from '../utils/Analytics';
import AuthManager from './authManager';

export type AuthProps = {
  legacyLogout?: () => Promise<void>;
  getSessionSecret: () => string;
  setMetadata: (metadata: { appetizeCode: string }) => Promise<void>;
  viewer?: Viewer | undefined;
  dispatch: (action: { type: 'UPDATE_VIEWER'; viewer: Viewer | null | undefined }) => void;
};

const Auth = new AuthManager();

const enhanceWithAuthMethods = (Comp: React.ComponentType<AuthProps>) => {
  return class WithAuthWrapper extends React.Component<AuthProps> {
    componentDidMount() {
      this.updateViewer();
    }

    private async updateViewer() {
      const { accessToken, sessionSecret } = Auth;
      if (accessToken || sessionSecret) {
        const viewer = await Auth.getProfile();
        const prevViewer = this.props.viewer;
        this.props.dispatch({ type: 'UPDATE_VIEWER', viewer });
        if (viewer && !isEqual(prevViewer, viewer)) {
          Analytics.getInstance().identify({ username: viewer.username }, viewer.id);
        }
      } else {
        this.props.dispatch({ type: 'UPDATE_VIEWER', viewer: null });
      }
    }

    _handleGetSessionSecret = () => {
      return Auth.sessionSecret;
    };

    // TODO(tc): replace this once we talk to graphql elsewhere
    _handleSetMetadata = async (newMetadata: { appetizeCode: string }) => {
      const { accessToken, sessionSecret } = Auth;
      if (!accessToken && !sessionSecret) {
        return;
      }
      const endpoint = `${nullthrows(process.env.API_SERVER_URL)}/--/graphql`;
      try {
        const response = await fetch(`${endpoint}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(sessionSecret ? { 'Expo-Session': sessionSecret } : {}),
          },
          body: JSON.stringify({
            query: `mutation ($newMetadata: UserDataInput!) {
                      me {
                        updateProfile(userData: $newMetadata) {
                          id
                        }
                      }
                    }`,
            variables: { newMetadata },
          }),
        });
        const json = await response.json();

        if (!json.errors) {
          this.updateViewer();
        }
      } catch (e) {
        // nop
      }
    };

    _handleLegacyLogout = async () => {
      await Auth.legacyLogout();
      this.updateViewer();
    };

    render() {
      return (
        // @ts-ignore 'xxx' is specified more than once, so this usage will be overwritten.
        <Comp
          // @ts-ignore
          legacyLogout={Auth.isLegacyLogoutEnabled ? this._handleLegacyLogout : undefined}
          // @ts-ignore
          getSessionSecret={this._handleGetSessionSecret}
          // @ts-ignore
          setMetadata={this._handleSetMetadata}
          // @ts-ignore
          {...this.props}
        />
      );
    }
  };
};

export default function withAuth<P extends AuthProps>(
  Comp: React.ComponentType<P>
): React.ComponentType<$Subtract<P, AuthProps>> {
  return compose(
    connect((state: { viewer: Viewer | null }) => {
      return {
        viewer: state.viewer,
      };
    }),
    enhanceWithAuthMethods
  )(Comp) as any;
}
