import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import { standardizeDependencies } from 'snack-sdk';

import type {
  SavedSnack,
  SDKVersion,
  SnackFiles,
  SnackFile,
  SnackDependencies,
  SnackDependency,
} from '../../types';
import { c } from '../ThemeProvider';
import Button from '../shared/Button';
import ModalDialog from '../shared/ModalDialog';
import ProgressIndicator from '../shared/ProgressIndicator';
import TextInput from '../shared/TextInput';
import ToggleSwitch from '../shared/ToggleSwitch';

type Props = {
  visible: boolean;
  onHide: () => void;
  onSubmitMetadata: (details: { name: string; description: string }) => void;
  onChangeSDKVersion: (sdkVersion: SDKVersion) => void;
  updateFiles: (updateFn: (files: SnackFiles) => { [path: string]: SnackFile | null }) => void;
  updateDependencies: (
    updateFn: (dependencies: SnackDependencies) => { [name: string]: SnackDependency | null },
  ) => void;
};

type State = {
  isLoading: boolean;
  error: string;
  url: string;
  resetDependencies: boolean;
};

export default class ImportProductionModal extends React.PureComponent<Props, State> {
  state: State = {
    isLoading: false,
    error: '',
    url: '',
    resetDependencies: true,
  };

  _hideImportModal = () => {
    this.setState({
      isLoading: false,
      error: '',
      url: '',
      resetDependencies: true,
    });
    this.props.onHide();
  };

  _handleImportClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({
      isLoading: true,
      error: '',
    });

    try {
      const match = this.state.url.match(/^https:\/\/snack\.expo\.(io|dev)\/(.*)/);
      if (!match) {
        throw new Error('Invalid url');
      }
      const id = match[2];
      const response = await fetch(`https://exp.host/--/api/v2/snack/${id}`, {
        headers: { 'Snack-Api-Version': '3.0.0' },
      });

      const text = await response.text();
      const json = JSON.parse(text);

      if (json.errors?.length) {
        throw new Error(JSON.stringify(json.errors));
      }

      const snack: SavedSnack = {
        ...json,
        dependencies: standardizeDependencies(json.dependencies),
      };

      this.props.onSubmitMetadata({
        name: snack.manifest.name,
        description: snack.manifest.description,
      });

      if (snack.manifest.sdkVersion) {
        this.props.onChangeSDKVersion(snack.manifest.sdkVersion);
      }

      this.props.updateFiles((files) => {
        const newFiles: any = {};
        for (const key in files) {
          newFiles[key] = null;
        }
        const snackFiles =
          typeof snack.code === 'string'
            ? { 'App.js': { contents: snack.code, type: 'CODE' } }
            : (snack.code as any);
        for (const key in snackFiles) {
          newFiles[key] = snackFiles[key];
        }
        return newFiles;
      });

      this.props.updateDependencies((deps) => {
        const newDeps: any = {};
        for (const key in deps) {
          newDeps[key] = null;
        }
        for (const key in snack.dependencies) {
          if (this.state.resetDependencies) {
            newDeps[key] = { version: snack.dependencies[key].version };
          } else {
            newDeps[key] = snack.dependencies[key];
          }
        }
        return newDeps;
      });

      this.setState({
        isLoading: false,
      });

      this.props.onHide();
    } catch (e) {
      this.setState({
        isLoading: false,
        error: e.message,
      });
    }
  };

  _handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ url: e.target.value });
  };

  _toggleResetDependencies = () => {
    this.setState((state) => ({ resetDependencies: !state.resetDependencies }));
  };

  render() {
    const { visible } = this.props;
    const { isLoading, error, url, resetDependencies } = this.state;

    return (
      <ModalDialog
        visible={visible}
        onDismiss={this._hideImportModal}
        title="Import from production">
        {isLoading ? <ProgressIndicator duration={45000} className={css(styles.progress)} /> : null}
        <form onSubmit={this._handleImportClick}>
          <p className={!error ? css(styles.paragraph) : css(styles.errorParagraph)}>
            {!error
              ? 'Import a saved Snack from production. This will overwrite all your current files and dependencies with the contents of the saved Snack.'
              : `An error occurred during import. ${error}`}
          </p>
          <TextInput
            name="url"
            value={url}
            onChange={this._handleChange}
            placeholder="https://snack.expo.dev/82kWr6arT"
            autoFocus
          />
          <div className={css(styles.switch)}>
            <ToggleSwitch
              checked={resetDependencies}
              label="Reset resolved dependencies"
              onChange={this._toggleResetDependencies}
            />
          </div>
          <div className={css(styles.buttons)}>
            <Button large disabled={!url} loading={isLoading} type="submit" variant="primary">
              {isLoading ? 'Importing Snack...' : 'Import Snack'}
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

  progress: {
    marginTop: -16,
  },

  switch: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    textAlign: 'initial',
  },

  buttons: {
    margin: '16px 0 0 0',
  },
});
