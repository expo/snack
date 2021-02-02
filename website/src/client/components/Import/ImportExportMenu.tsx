import * as React from 'react';

import { SaveStatus } from '../../types';
import FileListPaneButton from '../FileList/FileListPaneButton';
import ContextMenu from '../shared/ContextMenu';

type Props = {
  onImportFilesClick: () => void;
  onImportRepoClick: () => void;
  onImportProductionClick: () => void;
  onExportClick: () => void;
  hasSnackId: boolean;
  saveStatus: SaveStatus;
};

type State = {
  menu:
    | {
        pageX: number;
        pageY: number;
      }
    | undefined
    | null;
};

export default class ImportExportMenu extends React.PureComponent<Props, State> {
  state: State = {
    menu: null,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._hideContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._hideContextMenu);
  }

  _hideContextMenu = () => this.setState({ menu: null });

  _showContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { bottom, right } = e.currentTarget.getBoundingClientRect();
    this.setState({
      menu: {
        pageX: right - 8,
        pageY: bottom - 8,
      },
    });
  };

  _handleDocumentClick = (e: MouseEvent) => {
    if (this.state.menu) {
      if (
        this._button.current &&
        e.target !== this._button.current &&
        !this._button.current.contains(e.target as HTMLElement)
      ) {
        this._hideContextMenu();
      }
    }
  };

  _toggleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (this.state.menu) {
      this._hideContextMenu();
    } else {
      this._showContextMenu(e);
    }
  };

  _button = React.createRef<HTMLButtonElement>();

  render() {
    const isSaved =
      this.props.saveStatus === 'published' || this.props.saveStatus === 'saved-draft';

    return (
      <div>
        <FileListPaneButton ref={this._button} onClick={this._toggleContextMenu}>
          <g fillOpacity="0.7">
            <circle cy="3" cx="8" r="1.5" />
            <circle cy="8" cx="8" r="1.5" />
            <circle cy="13" cx="8" r="1.5" />
          </g>
        </FileListPaneButton>
        <ContextMenu
          visible={Boolean(this.state.menu)}
          position={this.state.menu}
          actions={[
            {
              label: 'Import files',
              handler: this.props.onImportFilesClick,
            },
            {
              label: 'Import git repository',
              handler: this.props.onImportRepoClick,
            },
            {
              label: 'Export project',
              handler: this.props.onExportClick,
              disabled: !(isSaved && this.props.hasSnackId),
            },
            ...(process.env.DEPLOY_ENVIRONMENT !== 'production'
              ? [
                  {
                    label: 'Import from production',
                    handler: this.props.onImportProductionClick,
                  },
                ]
              : []),
          ]}
          onHide={this._hideContextMenu}
        />
      </div>
    );
  }
}
