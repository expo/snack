import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import convertDataTransferItemsToFiles, {
  WebkitFileEntry,
  WebkitDirectoryEntry,
} from '../../utils/convertDataTransferItemsToFiles';
import dragEventIncludes from '../../utils/dragEventIncludes';
import { getUniquePath, isESLintConfig } from '../../utils/fileUtilities';
import { FileSystemEntry, TextFileEntry, AssetFileEntry } from '../FileList/types';
import { c, s } from '../ThemeProvider';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ModalDialog from '../shared/ModalDialog';

type Props = {
  entries: FileSystemEntry[];
  onImportFile: (e: TextFileEntry | AssetFileEntry) => void;
  uploadFileAsync: (file: File) => Promise<string>;
  render: (options: { onImportStart: () => void }) => React.ReactNode;
  className?: string;
};

type FileItem = File | WebkitFileEntry | WebkitDirectoryEntry;

type State = {
  isImportModalShown: boolean;
  isDragging: boolean;
  isImporting: boolean;
  itemsToImport: FileItem[];
  itemsErrored: {
    item: FileItem;
    error: Error;
  }[];
  importTotal: number;
  importProgress: number;
};

export default class ImportFilesManager extends React.PureComponent<Props, State> {
  state: State = {
    isImportModalShown: false,
    isDragging: false,
    isImporting: false,
    itemsToImport: [],
    itemsErrored: [],
    importProgress: 0,
    importTotal: 0,
  };

  componentDidMount() {
    document.addEventListener('dragover', this._handleDragOver);
    document.addEventListener('drop', this._handleDrop);
  }

  // @ts-ignore
  _handleDragOver = (e: DragEvent) => {
    if (dragEventIncludes(e, 'Files')) {
      e.preventDefault();

      if (this.state.isImportModalShown) {
        return true;
      }

      if (!this.state.isDragging) {
        this.setState({ isDragging: true });
      }

      clearTimeout(this._dragTimer);
      this._dragTimer = setTimeout(this._handleDragEnd, 300);
    }
  };

  _handleDragEnd = () => {
    if (this.state.isDragging) {
      this.setState({ isDragging: false });
    }
  };

  _handleDrop = (e: DragEvent) => {
    if (
      dragEventIncludes(e, 'Files') &&
      e.dataTransfer &&
      (e.dataTransfer.items || e.dataTransfer.files)
    ) {
      const dataTransfer = e.dataTransfer;
      e.preventDefault();
      const entries: FileItem[] = dataTransfer.items
        ? Array.from(dataTransfer.items).map((it) => it.webkitGetAsEntry())
        : Array.from(dataTransfer.files);
      this._handleSelectFilesForImport(entries);
    }
  };

  _dragTimer: any;

  _showImportModal = () =>
    this.setState({
      isImportModalShown: true,
    });

  _hideImportModal = () =>
    this.setState({
      isImportModalShown: false,
      itemsToImport: [],
    });

  _handleSelectFilesForImport = (items: FileItem[]) =>
    this.setState((state) => ({
      isImportModalShown: true,
      itemsToImport: [...state.itemsToImport, ...items],
      itemsErrored: [],
    }));

  _handleImportClick = async () => {
    this.setState({
      isImporting: true,
      isImportModalShown: false,
      importProgress: 0,
    });

    const allPaths = this.props.entries.map((e) => e.item.path);
    const folderMappings: { [key: string]: string } = {};
    const { itemsToImport } = this.state;

    itemsToImport.forEach((item) => {
      // @ts-ignore
      if (item.isDirectory) {
        folderMappings[item.name] = getUniquePath(allPaths, item.name);
      }
    });

    const files = await convertDataTransferItemsToFiles(itemsToImport, folderMappings);

    this.setState({
      importTotal: files.length,
    });

    await Promise.all(
      files.map(async ({ file, path }) => {
        try {
          const entry =
            /\.(md|json|js|tsx?)$/.test(path) || isESLintConfig(path)
              ? await new Promise<TextFileEntry>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = (e: ProgressEvent) =>
                    resolve({
                      item: {
                        path,
                        type: 'file',
                        // @ts-ignore
                        content: e.target ? e.target.result : '',
                      },
                      state: {},
                    });
                  reader.onerror = (error) => reject(error);
                  reader.readAsText(file);
                })
              : await this.props.uploadFileAsync(file).then(
                  (uri) =>
                    ({
                      item: {
                        path,
                        type: 'file',
                        uri,
                        asset: true,
                      },
                      state: {},
                    } as AssetFileEntry)
                );

          if (!this.state.itemsToImport.length) {
            // Import was cancelled
            return;
          }

          this.props.onImportFile(entry);
        } catch (error) {
          console.error(error);
          this.setState((state) => ({
            itemsErrored: [...state.itemsErrored, { item: file, error }],
          }));
        } finally {
          this.setState((state) => ({
            importProgress: state.importProgress + 1,
          }));
        }
      })
    );

    this.setState({
      itemsToImport: [],
    });
  };

  _handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    // @ts-ignore
    this._handleSelectFilesForImport(e.target.files);

  _handleRemoveFileImport = (file: FileItem) =>
    this.setState((state) => ({
      itemsToImport: state.itemsToImport.filter((f) => f !== file),
    }));

  _handleProgressDismiss = () => {
    this.setState({
      itemsToImport: [],
      itemsErrored: [],
      importProgress: 0,
      isImporting: false,
    });
  };

  render() {
    const {
      isImporting,
      importProgress,
      itemsToImport,
      itemsErrored,
      isDragging,
      isImportModalShown,
      importTotal,
    } = this.state;
    const importedFiles = importProgress - itemsErrored.length;

    return (
      <div className={this.props.className}>
        {this.props.render({ onImportStart: this._showImportModal })}
        {isImporting ? (
          <div className={css(styles.importProgress)}>
            <div className={css(styles.importProgressHeader)}>
              <h4 className={css(styles.importProgressLabel)}>
                {importTotal === 0
                  ? 'Reading files…'
                  : importProgress === importTotal
                  ? `${importedFiles} file${importedFiles === 1 ? '' : 's'} imported${
                      itemsErrored.length
                        ? `, ${itemsErrored.length} failed to import`
                        : ` successfully`
                    }`
                  : `Importing files (${importProgress + 1}/${importTotal})`}
              </h4>
              <button
                onClick={this._handleProgressDismiss}
                className={css(styles.importProgressButton)}>
                {importProgress === importTotal ? 'Dismiss' : 'Cancel'}
              </button>
            </div>
            {importTotal ? (
              <progress
                className={css(styles.importProgressBar)}
                value={(importProgress / importTotal) * 100}
                max={100}
              />
            ) : null}
          </div>
        ) : null}
        <Modal visible={isDragging}>
          <div className={css(styles.dropzoneLarge)}>
            <h2>Drop anywhere to import</h2>
            <p>
              You&#39;ll be able to adjust your selection before importing them into your project
            </p>
          </div>
        </Modal>
        <ModalDialog
          visible={isImportModalShown}
          onDismiss={this._hideImportModal}
          title="Import files">
          <p className={css(styles.paragraph)}>
            Import JavaScript files from your computer or a GitHub repository to use in your expo
            project.
          </p>
          <div className={css(styles.dropzoneSmall)}>
            {itemsToImport.length ? (
              <ul className={css(styles.fileList)}>
                {itemsToImport.map((f, i) => (
                  <li className={css(styles.fileEntry)} key={i}>
                    <span className={css(styles.fileEntryName)}>
                      {(f as any).isDirectory ? `${f.name}/` : f.name}
                    </span>
                    <span className={css(styles.fileEntrySize)}>
                      {typeof (f as any).size === 'number'
                        ? `${((f as any).size / 1024).toFixed(2)}kb`
                        : ''}
                    </span>
                    <button
                      onClick={() => this._handleRemoveFileImport(f)}
                      className={css(styles.fileEntryClose)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={css(styles.dropzonePlaceholder)}>
                Drop your files or
                <label className={css(styles.fileInputLabel)}>
                  browse
                  <input
                    multiple
                    type="file"
                    onChange={this._handleFilesChange}
                    className={css(styles.fileInput)}
                  />
                </label>
              </div>
            )}
          </div>
          <Button
            large
            variant="primary"
            onClick={this._handleImportClick}
            disabled={!itemsToImport.length}>
            Import
          </Button>
        </ModalDialog>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  dropzoneLarge: {
    textAlign: 'center',
    padding: 48,
    border: `2px dashed ${c('border')}`,
    borderRadius: 4,
  },
  dropzoneSmall: {
    border: `1px dashed ${c('border')}`,
    backgroundColor: c('background'),
    borderRadius: 3,
    height: '12em',
    marginBottom: 8,
  },
  dropzonePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    margin: '8px 0 16px',
  },
  fileInputLabel: {
    margin: 0,
    paddingLeft: 4,
    color: c('selected'),
    fontWeight: 'normal',
    cursor: 'pointer',

    ':hover': {
      textDecoration: 'underline',
    },
  },
  fileInput: {
    display: 'none',
  },
  fileList: {
    listStyle: 'none',
    textAlign: 'left',
    padding: 0,
    height: '100%',
    width: '100%',
    overflow: 'auto',
  },
  fileEntry: {
    display: 'flex',
    borderBottom: `1px solid ${c('border')}`,
    alignItems: 'center',
  },
  fileEntrySize: {
    flex: 1,
    opacity: 0.5,
    margin: 8,
  },
  fileEntryName: {
    margin: 8,
    maxWidth: '15em',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  fileEntryClose: {
    padding: '4px 12px',
    margin: '0 4px',
    fontSize: 18,
    background: 'none',
    border: 'none',
    appearance: 'none',
  },
  importProgress: {
    position: 'fixed',
    zIndex: 10,
    left: '1em',
    bottom: '4em',
    width: '24em',
    padding: '8px 16px',
    borderRadius: 3,
    backgroundColor: c('content'),
    border: `1px solid ${c('border')}`,
    boxShadow: s('popover'),
  },
  importProgressHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: '4px 0',
  },
  importProgressLabel: {
    flex: 1,
    fontSize: '1em',
    fontWeight: 500,
    margin: 0,
  },
  importProgressButton: {
    appearance: 'none',
    background: 'none',
    border: 0,
    color: c('primary'),
  },
  importProgressBar: {
    appearance: 'none',
    width: '100%',
    margin: '8px 0',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',

    '::-webkit-progress-bar': {
      backgroundColor: c('content'),
    },

    '::-webkit-progress-value': {
      backgroundColor: c('primary'),
    },

    '::-moz-progress-bar': {
      backgroundColor: c('content'),
    },

    '::-moz-progress-value': {
      backgroundColor: c('primary'),
    },
  },
});
