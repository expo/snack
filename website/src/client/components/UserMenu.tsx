import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { getLoginHref } from '../auth/login';
import withAuth, { AuthProps } from '../auth/withAuth';
import { getWebsiteURL } from '../utils/getWebsiteURL';
import { c } from './ThemeProvider';
import Avatar from './shared/Avatar';
import ContextMenu from './shared/ContextMenu';

type State = {
  visible: boolean;
};

type Props = AuthProps;

class UserMenu extends React.Component<Props, State> {
  state: State = {
    visible: false,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  _handleDocumentClick = (e: MouseEvent) => {
    if (this.state.visible) {
      if (
        this._menu.current &&
        e.target !== this._menu.current &&
        !this._menu.current.contains(e.target as HTMLElement)
      ) {
        this._hideMenu();
      }
    } else if (
      this._avatar.current &&
      (e.target === this._avatar.current || this._avatar.current.contains(e.target as Node))
    ) {
      this.setState((state) => ({ visible: !state.visible }));
    }
  };

  _handleDocumentContextMenu = () => {
    if (this.state.visible) {
      this._hideMenu();
    }
  };

  _hideMenu = () => this.setState({ visible: false });

  _menu = React.createRef<HTMLUListElement>();
  _avatar = React.createRef<HTMLButtonElement>();

  render() {
    const { viewer, legacyLogout } = this.props;

    const websiteURL = getWebsiteURL();

    return (
      <div className={css(styles.container)}>
        <button ref={this._avatar} className={css(styles.button)}>
          <Avatar source={viewer?.profilePhoto ? viewer.profilePhoto : null} size={26} />
        </button>
        <ContextMenu
          ref={this._menu}
          visible={this.state.visible}
          actions={
            viewer
              ? [
                  {
                    label: 'My Snacks',
                    handler: () => window.open(`${websiteURL}/snacks`),
                  },
                  {
                    label: 'User Settings',
                    handler: () => window.open(`${websiteURL}/settings`),
                  },
                  ...(legacyLogout ? [{ label: 'Log out', handler: legacyLogout }] : []),
                ]
              : [
                  {
                    label: 'Log in to Expo',
                    handler: () => (window.location.href = getLoginHref()),
                  },
                ]
          }
          onHide={this._hideMenu}
          className={css(styles.menu)}
        />
      </div>
    );
  }
}

export default withAuth(UserMenu);

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  menu: {
    position: 'absolute',
    margin: '4px 0',
    right: 16,
    top: '100%',
  },
  button: {
    appearance: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    border: 0,
    outline: 0,
    height: 40,
    width: 40,
    borderRadius: 2,
    textDecoration: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ':hover': {
      backgroundColor: c('hover'),
    },
  },
});
