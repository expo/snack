import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import withThemeName, { ThemeName } from './Preferences/withThemeName';
import { c } from './ThemeProvider';
import Banner from './shared/Banner';
import Button from './shared/Button';
import ToggleButtons from './shared/ToggleButtons';
import ToggleSwitch from './shared/ToggleSwitch';
import constants from '../configs/constants';
import { Platform, SDKVersion } from '../types';
import { PlatformOption } from '../utils/PlatformOptions';

const handleClick = (e: any) => e.target.select();

type Props = {
  id?: string;
  sdkVersion: SDKVersion;
  theme: ThemeName;
  platformOptions: PlatformOption[];
};

type State = {
  platform: Platform;
  preview: boolean;
  theme: 'light' | 'dark';
  copied: boolean;
  url: string;
};

class EmbedCode extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      platform: 'web',
      preview: true,
      theme: this.props.theme || 'light',
      copied: false,
      url: `${window.location.origin}/embed.js`,
    };
  }

  state: State;

  componentDidMount() {
    this._maybeInsertScript();
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (
      prevState.preview !== this.state.preview ||
      prevState.platform !== this.state.platform ||
      prevState.theme !== this.state.theme
    ) {
      requestAnimationFrame(this._reinitialize);
    }
  }

  _reinitialize = () => {
    if ('ExpoSnack' in window) {
      const container = document.querySelector('[data-snack-id]');
      // @ts-ignore
      window.ExpoSnack.remove(container);
      // @ts-ignore
      window.ExpoSnack.append(container);
    }
  };

  _maybeInsertScript = () => {
    const scripts = document.querySelectorAll(`script[src="${this.state.url}"]`);

    if (scripts.length) {
      this._reinitialize();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = this.state.url;

    if (document.body) {
      document.body.appendChild(script);
    }
  };

  _handleCopy = () => {
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 1000);
  };

  _handleTogglePreview = () => this.setState((state) => ({ preview: !state.preview }));

  _handleToggleTheme = () =>
    this.setState((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    }));

  _handleChangePlatform = (platform: Platform) => this.setState({ platform });

  render() {
    const { platform, preview, theme, copied, url } = this.state;
    const html = `<div data-snack-id="${
      this.props.id ?? ''
    }" data-snack-platform="${platform}" data-snack-preview="${String(
      preview,
    )}" data-snack-theme="${theme}" style="overflow:hidden;background:${c(
      'background',
      theme,
    )};border:1px solid ${c('border')};border-radius:4px;height:505px;width:100%"></div>`;
    const code = `${html}\n<script async src="${url}"></script>`;

    return (
      <div className={css(styles.container)}>
        <Banner visible={copied}>Copied to clipboard!</Banner>
        <div className={css(styles.section)}>
          <div className={css(styles.header)}>
            <h3 className={css(styles.title)}>Embed Preview</h3>
            <a href={constants.links.authorDocs} target="blank">
              Learn more about what's possible
            </a>
          </div>
          <div className={css(styles.row, styles.options)}>
            <ToggleButtons
              options={this.props.platformOptions}
              value={platform}
              onValueChange={this._handleChangePlatform}
              className={css(styles.last)}
            />
            <ToggleSwitch checked={preview} label="Preview" onChange={this._handleTogglePreview} />
            <ToggleSwitch
              checked={theme !== 'light'}
              label="Dark theme"
              onChange={this._handleToggleTheme}
            />
          </div>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div className={css(styles.section)}>
          <h3 className={css(styles.header)}>Embed Code</h3>
          <div className={css(styles.inputContainer)}>
            <input readOnly className={css(styles.code)} onClick={handleClick} value={code} />
            <CopyToClipboard text={code} onCopy={this._handleCopy}>
              <Button variant="primary" className={css(styles.copyButton)}>
                Copy to clipboard
              </Button>
            </CopyToClipboard>
          </div>
        </div>
      </div>
    );
  }
}

export default withThemeName(EmbedCode);

const styles = StyleSheet.create({
  container: {
    width: 780,
    textAlign: 'left',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    margin: '.5em 0',
    display: 'inline',
    fontWeight: 500,
    flex: 1,
  },
  options: {
    color: c('text'),
    marginBottom: '.5em',
  },
  last: {
    marginRight: 0,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    ':not(:last-of-type)': {
      paddingBottom: '1.5em',
    },
  },
  code: {
    fontFamily: 'var(--font-monospace)',
    padding: '1em',
    width: '100%',
    outline: 0,
    border: `1px solid ${c('border')}`,
    borderRadius: 3,
    color: c('text'),
    backgroundColor: c('background'),
  },
  inputContainer: {
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    right: 0,
  },
});
