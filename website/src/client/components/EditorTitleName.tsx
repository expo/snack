import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import withThemeName, { ThemeName } from './Preferences/withThemeName';
import { c } from './ThemeProvider';
import Popover from './shared/Popover';
import * as defaults from '../configs/defaults';

type Props = {
  name: string;
  description?: string;
  onShowEditModal: () => void;
  onSubmitMetadata: (details: { name: string; description: string }) => void;
  theme: ThemeName;
};

type State = {
  name: string;
  focused: boolean;
};

const RETURN_KEYCODE = 13;
const ESCAPE_KEYCODE = 27;

function validateName(name: string) {
  return name
    ? /^[a-z_\-\d\s]+$/i.test(name)
      ? null
      : new Error('Name can only contain letters, numbers, space, hyphen (-) and underscore (_).')
    : new Error('Name cannot be empty.');
}

class EditorTitleName extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.name !== props.name && !state.focused) {
      return {
        name: props.name || '',
      };
    }

    return null;
  }

  state: State = {
    name: this.props.name || '',
    focused: false,
  };

  _handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({ name: e.target.value });

  _handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    this.setState({ focused: true });
  };

  _handleBlur = async () => {
    if (!validateName(this.state.name)) {
      await this.props.onSubmitMetadata({
        name: this.state.name,
        description: this.props.description ?? '',
      });
    }
    this.setState({ focused: false });
  };

  _handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      (e.keyCode === RETURN_KEYCODE || e.keyCode === ESCAPE_KEYCODE) &&
      !validateName(this.state.name)
    ) {
      (e.target as HTMLInputElement).blur();
    }
  };

  render() {
    const { name } = this.state;
    const { description, onShowEditModal, theme } = this.props;
    const error = validateName(name);
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.titleContainer)}>
          <h1 className={css(styles.title)}>
            <div className={css(styles.content)}>
              <div className={css(styles.field, styles.phantom)}>
                {name.replace(/\n/g, '')}
                &nbsp;
              </div>
              <input
                onFocus={this._handleFocus}
                onBlur={this._handleBlur}
                onKeyDown={this._handleKeyDown}
                value={name}
                onChange={this._handleChangeText}
                className={css(styles.field, styles.editable)}
              />
            </div>
          </h1>
          <Popover
            content={
              <>
                <p className={css(styles.description)}>
                  {description ?? defaults.DEFAULT_DESCRIPTION}
                </p>
                <button onClick={onShowEditModal} className={css(styles.editButton)}>
                  Edit details
                </button>
              </>
            }
          >
            <button
              className={css(styles.icon, theme === 'light' ? styles.infoLight : styles.infoDark)}
            />
          </Popover>
        </div>
        {this.state.focused && error ? (
          <div className={css(styles.validation)}>{error.message}</div>
        ) : null}
      </div>
    );
  }
}

export default withThemeName(EditorTitleName);

const styles = StyleSheet.create({
  container: {},

  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  title: {
    fontSize: '1.3em',
    lineHeight: '1.3em',
    fontWeight: 600,
    margin: 0,
    position: 'relative',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },

  content: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '100%',
  },

  field: {
    display: 'inline-block',
    margin: 0,
    padding: '1px 6px',
  },

  editable: {
    position: 'absolute',
    appearance: 'none',
    background: 'none',
    outline: 0,
    border: 0,
    left: 0,
    width: '100%',
    borderRadius: 3,

    ':hover': {
      boxShadow: `inset 0 0 0 1px ${c('border')}`,
    },

    ':focus': {
      boxShadow: `inset 0 0 0 1px ${c('selected')}`,
    },

    ':hover:focus': {
      boxShadow: `inset 0 0 0 1px ${c('selected')}`,
    },
  },

  phantom: {
    display: 'inline-block',
    maxWidth: '100%',
    pointerEvents: 'none',
    whiteSpace: 'pre',
    overflow: 'hidden',
    opacity: 0,
  },

  validation: {
    position: 'absolute',
    backgroundColor: c('error'),
    color: c('error-text'),
    fontSize: 13,
    fontWeight: 'normal',
    padding: '6px 12px',
    borderRadius: 3,
    marginTop: 8,
    textAlign: 'left',
    zIndex: 1000,
    minWidth: 100,

    ':before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      bottom: '100%',
      width: 0,
      height: 0,
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderBottom: `6px solid ${c('error')}`,
    },
  },

  icon: {
    display: 'block',
    position: 'relative',
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 16,
    backgroundPosition: 'center',
    border: 0,
    outline: 0,
    margin: 0,
    padding: 0,
    height: 24,
    width: 24,
    opacity: 0.3,
    transition: '.2s',

    ':hover': {
      opacity: 0.8,
    },
  },

  description: {
    margin: 16,
  },

  infoLight: {
    backgroundImage: `url(${require('../assets/info-icon.png')})`,
  },

  infoDark: {
    backgroundImage: `url(${require('../assets/info-icon-light.png')})`,
  },

  editButton: {
    width: '100%',
    background: 'none',
    outline: 0,
    border: 'none',
    borderTop: `1px solid ${c('border')}`,
    color: c('primary'),
    padding: '8px 16px',
    fontWeight: 'bold',

    ':hover': {
      backgroundColor: c('hover'),
    },
  },
});
