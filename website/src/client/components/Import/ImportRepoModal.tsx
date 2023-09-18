import { StyleSheet, css } from 'aphrodite';
import parseGitUrl from 'git-url-parse';
import querystring from 'query-string';
import * as React from 'react';

import Analytics from '../../utils/Analytics';
import { c } from '../ThemeProvider';
import Button from '../shared/Button';
import ModalDialog from '../shared/ModalDialog';
import ProgressIndicator from '../shared/ProgressIndicator';
import TextArea from '../shared/TextArea';
import TextInput from '../shared/TextInput';

type Props = {
  visible: boolean;
  onHide: () => void;
  preventRedirectWarning: () => void;
  snackagerURL: string;
};

type State = {
  status: 'idle' | 'importing' | 'error';
  error?: string;
  advanced: boolean;
  url: string;
  repo: string;
  path: string;
  branch: string;
};

const TIMEOUT_MS = 45000;

export default class ImportRepoModal extends React.PureComponent<Props, State> {
  state: State = {
    status: 'idle',
    advanced: false,
    url: '',
    repo: '',
    path: '',
    branch: '',
  };

  _hideImportModal = () => {
    Analytics.getInstance().logEvent('IMPORT_COMPLETED', { reason: 'dismiss' }, 'importStart');
    this.setState({
      status: 'idle',
      url: '',
      repo: '',
      path: '',
      branch: '',
    });
    this.props.onHide();
  };

  _handleImportRepoClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({
      status: 'importing',
    });

    // If the import hangs we want to make sure to throw an error
    setTimeout(() => {
      if (this.props.visible && this.state.status === 'importing') {
        this.setState({
          status: 'error',
        });
      }
    }, TIMEOUT_MS);

    let res;
    let snackId;
    let didFail = false;
    try {
      const IMPORT_API_URL = `${this.props.snackagerURL}/git`;

      const params: { repo: string; subpath?: string; branch?: string } = {
        repo: this.state.repo,
      };
      if (this.state.path) {
        params.subpath = this.state.path;
      }
      if (this.state.branch) {
        params.branch = this.state.branch;
      }

      res = await fetch(`${IMPORT_API_URL}?${querystring.stringify(params)}`);
      snackId = await res.text();
      if (this.props.visible) {
        if (res.ok) {
          Analytics.getInstance().logEvent(
            'IMPORT_COMPLETED',
            { reason: 'success' },
            'importStart'
          );
          this.props.preventRedirectWarning();
          window.location.href = `/${snackId}`;
        } else {
          didFail = true;
        }
      }
    } catch {
      didFail = true;
    }

    if (didFail) {
      this.setState({
        error: snackId,
        status: 'error',
      });
      Analytics.getInstance().logEvent('IMPORT_COMPLETED', { reason: 'error' }, 'importStart');
    } else {
      this.setState({
        status: 'idle',
      });
    }
  };

  _handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // @ts-ignore
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  _handleChangeUrl = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const url = e.target.value;
    const parsed = parseGitUrl(url);

    this.setState({
      url,
      repo: `${parsed.protocol}://${parsed.source}/${parsed.owner}/${parsed.name}`,
      path: parsed.filepath,
      branch: parsed.ref,
    });
  };

  render() {
    const { status, error, url, repo, path, branch, advanced } = this.state;
    const isImporting = status === 'importing';
    const isError = status === 'error';

    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this._hideImportModal}
        title="Import git repository"
      >
        {isImporting ? (
          <ProgressIndicator duration={45000} className={css(styles.progress)} />
        ) : null}
        <form onSubmit={this._handleImportRepoClick}>
          <p className={!isError ? css(styles.paragraph) : css(styles.errorParagraph)}>
            {!isError
              ? 'Import an Expo project from a Public Git repository.'
              : 'An error occurred during import. This could be because the data provided was invalid, or because the repository referenced is not a properly formatted Expo project.'}
          </p>
          {isError && <p className={css(styles.errorParagraph)}>{error}</p>}
          {advanced ? (
            <>
              <h4 className={css(styles.subtitle)}>Repository URL</h4>
              <TextInput
                name="repo"
                value={repo}
                onChange={this._handleChange}
                placeholder="https://github.com/ide/love-languages.git"
                autoFocus
              />
              <h4 className={css(styles.subtitle)}>Folder path</h4>
              <TextInput
                name="path"
                value={path}
                onChange={this._handleChange}
                placeholder="/example/app"
              />
              <h4 className={css(styles.subtitle)}>Branch name</h4>
              <TextInput
                name="branch"
                value={branch}
                onChange={this._handleChange}
                placeholder="main"
              />
            </>
          ) : (
            <>
              <h4 className={css(styles.subtitle)}>Git URL</h4>
              <TextArea
                minRows={2}
                value={url}
                onChange={this._handleChangeUrl}
                placeholder="https://github.com/ide/love-languages/tree/main/app"
                autoFocus
              />
            </>
          )}
          <button
            type="button"
            onClick={() => this.setState((state) => ({ advanced: !state.advanced }))}
            className={css(styles.advanced)}
          >
            {advanced ? 'Hide' : 'Show'} advanced options
          </button>
          <div className={css(styles.buttons)}>
            <Button large disabled={!repo} loading={isImporting} type="submit" variant="primary">
              {isImporting ? 'Importing repository…' : 'Import repository'}
            </Button>
          </div>
        </form>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  paragraph: {
    margin: '8px 0 16px',
  },

  errorParagraph: {
    margin: '8px 0 16px',
    color: c('error'),
  },

  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px 0',
  },

  progress: {
    marginTop: -16,
  },

  advanced: {
    appearance: 'none',
    background: 'none',
    border: 0,
    padding: '8px 0',
    marginTop: 8,
    textAlign: 'left',
    width: '100%',
    color: c('primary'),
  },

  buttons: {
    margin: '16px 0 0 0',
  },
});
