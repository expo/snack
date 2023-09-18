import { StyleSheet, css } from 'aphrodite';
import pickBy from 'lodash/pickBy';
import * as React from 'react';
import { isModulePreloaded } from 'snack-sdk';

import FileListChildren from './FileListChildren';
import FileListEntryDropTarget from './FileListEntryDropTarget';
import FileListOpenEntry from './FileListOpenEntry';
import FileListPane from './FileListPane';
import FileListPaneButton from './FileListPaneButton';
import closeEntry from './actions/closeEntry';
import createNewEntry from './actions/createNewEntry';
import expandEntry from './actions/expandEntry';
import openEntry from './actions/openEntry';
import pasteEntry from './actions/pasteEntry';
import recursivelyCreateParents from './actions/recursivelyCreateParents';
import renameEntry from './actions/renameEntry';
import selectEntry from './actions/selectEntry';
import updateEntry from './actions/updateEntry';
import { FileSystemEntry, TextFileEntry, AssetFileEntry } from './types';
import { filesToEntries, findFocusedEntry } from './utils/convertFileStructure';
import eslintrc from '../../configs/eslint.json';
import { SDKVersion, SaveStatus, SnackFiles, SnackFile, Annotation } from '../../types';
import {
  isPackageJson,
  getUniquePath,
  isInsideFolder,
  isESLintConfig,
} from '../../utils/fileUtilities';
import type { EditorModal } from '../EditorViewProps';
import ImportExportMenu from '../Import/ImportExportMenu';
import ImportFilesManager from '../Import/ImportFilesManager';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import SidebarShell from '../Shell/SidebarShell';
import { c } from '../ThemeProvider';
import ResizablePane from '../shared/ResizablePane';
import Toast from '../shared/Toast';

type Props = {
  visible: boolean;
  files: SnackFiles;
  selectedFile: string;
  updateFiles: (updateFn: (files: SnackFiles) => { [path: string]: SnackFile | null }) => void;
  onSelectFile: (path: string) => void;
  onRemoveFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  uploadFileAsync: (file: File) => Promise<string>;
  onDownloadCode: () => Promise<void>;
  onShowModal: (modal: EditorModal) => void;
  hasSnackId: boolean;
  saveStatus: SaveStatus;
  sdkVersion: SDKVersion;
  theme: ThemeName;
  annotations: Annotation[];
};

type State = {
  clipboard: FileSystemEntry[];
  deleted: {
    id: number;
    path: string;
    entries: FileSystemEntry[];
  }[];
  openFilesPane: boolean;
  projectPane: boolean;
  entries: FileSystemEntry[];
  selectedFile: string;
};

const AddIcon = () => (
  <g transform="translate(7.000000, 7.000000)">
    <circle fill={c('success')} cx="4.5" cy="4.5" r="4.5" />
    <rect fill={c('success-text')} x="4" y="2" width="1" height="5" />
    <rect fill={c('success-text')} x="2" y="4" width="5" height="1" />
  </g>
);

class FileList extends React.PureComponent<Props, State> {
  state: State = {
    clipboard: [],
    deleted: [],
    openFilesPane: true,
    projectPane: true,
    entries: [],
    selectedFile: '',
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    let entries = filesToEntries(props.files, props.annotations, state.entries);
    entries =
      state.selectedFile !== props.selectedFile ? openEntry(entries, props.selectedFile) : entries;
    return {
      entries,
      selectedFile: props.selectedFile,
    };
  }

  private updateEntries(entries: FileSystemEntry[]) {
    const prevEntries = this.state.entries;
    this.setState({ entries });

    // Sync changes
    this.props.updateFiles((files) => {
      const updates: { [path: string]: SnackFile | null } = {};

      // Handle file removal (and rename)
      for (const path in files) {
        const entry = entries.find((entry) => entry.item.path === path);
        if (!entry) {
          updates[path] = null;
        }
      }

      // Handle added/renamed files
      entries.forEach((entry) => {
        if (
          entry.item.type === 'file' &&
          !files[entry.item.path] &&
          !isPackageJson(entry.item.path)
        ) {
          updates[entry.item.path] = {
            type: entry.item.asset ? 'ASSET' : 'CODE',
            contents: entry.item.asset ? entry.item.uri : entry.item.content,
          };
        }
      });

      return updates;
    });

    // Update focus
    const prevFocusedEntry = findFocusedEntry(prevEntries);
    const focusedEntry = findFocusedEntry(entries);
    if (focusedEntry?.item.path !== prevFocusedEntry?.item.path) {
      this.props.onSelectFile(focusedEntry?.item.path ?? '');
    }
  }

  _handleEntrySelect = (path: string) => {
    this.updateEntries(selectEntry(this.state.entries, path));
  };

  _handleEntryOpen = (path: string) => {
    this.updateEntries(openEntry(this.state.entries, path));
  };

  _handleEntryFocus = (path: string) => {
    this.updateEntries(openEntry(this.state.entries, path, true));
  };

  _handleEntryExpand = (path: string, expand?: boolean) =>
    this.updateEntries(expandEntry(this.state.entries, path, expand));

  _handleEntryRename = (oldPath: string, newPath: string) => {
    if (oldPath === newPath) {
      return;
    }

    const entry = this.state.entries.find((e) => e.item.path === oldPath);
    if (entry) {
      if (entry.item.type === 'folder') {
        this.state.entries
          .filter((e) => e.item.type === 'file' && e.item.path.startsWith(oldPath))
          .forEach((renamedFile) => {
            this.props.onRenameFile(
              renamedFile.item.path,
              `${newPath}${renamedFile.item.path.substring(oldPath.length)}`
            );
          });
      } else {
        this.props.onRenameFile(oldPath, newPath);
      }
    }

    this.updateEntries(renameEntry(this.state.entries, oldPath, newPath));
  };

  _restoreEntries = (entries: FileSystemEntry[]) =>
    this.updateEntries([
      ...this.state.entries,
      ...entries.map((e) =>
        updateEntry(e, {
          item: {
            path: getUniquePath(
              this.state.entries.map((it) => it.item.path),
              e.item.path
            ),
          },
        })
      ),
    ]);

  _handleDismissDelete = (id: number) =>
    this.setState((state) => ({
      deleted: state.deleted.filter((g) => g.id !== id),
    }));

  _handleEntryClose = (path: string) =>
    this.updateEntries(this.state.entries.map((e) => (e.item.path === path ? closeEntry(e) : e)));

  _handleEntryCloseOthers = (path: string) =>
    this.updateEntries(this.state.entries.map((e) => (e.item.path !== path ? closeEntry(e) : e)));

  _handleEntryCloseAll = () => this.updateEntries(this.state.entries.map((e) => closeEntry(e)));

  _handleEntryDelete = (path: string) => {
    const entry = this.state.entries.find((e) => e.item.path === path);
    const deletedEntries: FileSystemEntry[] = [];

    this.updateEntries(
      this.state.entries.filter((e) => {
        const remove = e.item.path === path || isInsideFolder(e.item.path, path);
        if (remove) {
          deletedEntries.push(e);
          if (e.item.type === 'file') {
            this.props.onRemoveFile(e.item.path);
          }
        }
        return !remove;
      })
    );

    this.setState((state) => ({
      deleted: [
        ...state.deleted,
        {
          id: this._currentDeleteID++,
          path: entry ? entry.item.path : 'Item',
          entries: deletedEntries,
        },
      ],
    }));
  };

  _currentDeleteID: number = 0;

  _handleEntryImport = (entry: TextFileEntry | AssetFileEntry) => {
    let entries: FileSystemEntry[];

    if (isPackageJson(entry.item.path)) {
      // Merge dependencies from package.json file
      entries = this.state.entries.map((e) => {
        if (isPackageJson(e.item.path)) {
          try {
            // @ts-ignore
            const previous = JSON.parse(e.item.content);
            // @ts-ignore
            const next = JSON.parse(entry.item.content);

            return {
              ...e,
              item: {
                ...e.item,
                content: JSON.stringify(
                  {
                    ...previous,
                    dependencies: {
                      ...previous.dependencies,
                      ...Object.keys(next.dependencies).reduce(
                        (acc: { [key: string]: string }, name) => {
                          if (!isModulePreloaded(name, this.props.sdkVersion, true)) {
                            acc[name] = next.dependencies[name];
                          }

                          return acc;
                        },
                        {}
                      ),
                    },
                  },
                  null,
                  2
                ),
              },
            } as TextFileEntry;
          } catch {
            // Do nothing
          }
        }

        return e;
      });
    } else if (isESLintConfig(entry.item.path)) {
      try {
        const content = JSON.parse((entry as TextFileEntry).item.content);

        // Cleanup the config file to remove unsupported plugins and rules
        if (content.plugins) {
          content.plugins = content.plugins.filter((name: string) =>
            eslintrc.plugins.includes(name)
          );

          if (!content.plugins.length) {
            delete content.plugins;
          }
        }

        if (content.rules) {
          content.rules = pickBy(content.rules, (_, key) => {
            if (key.includes('/')) {
              return eslintrc.plugins.some((name) => key.startsWith(`${name}/`));
            }

            return key;
          });
        }

        if (content.extends) {
          if (typeof content.extends === 'string' && !content.extends.startsWith('eslint:')) {
            delete content.extends;
          } else {
            content.extends = content.extends.filter((name: string) => name.startsWith('eslint:'));

            if (!content.extends.length) {
              delete content.extends;
            }
          }
        }

        // Remove existing eslintrc if any
        entries = this.state.entries.filter((e) => !isESLintConfig(e.item.path));
        entries.push(
          updateEntry(entry, {
            item: {
              content: JSON.stringify(content, null, 2),
            },
          })
        );
      } catch {
        // Ignore errors
        entries = this.state.entries;
      }
    } else {
      const parents = recursivelyCreateParents(this.state.entries, entry.item.path);

      entries = [...this.state.entries, ...parents];
      entries.push(
        updateEntry(entry, {
          item: {
            path: getUniquePath(
              entries.map((e) => e.item.path),
              entry.item.path
            ),
          },
        })
      );
    }

    this.updateEntries(entries);
  };

  _handleEntryPaste = (path: string | undefined, e: FileSystemEntry) =>
    this.updateEntries(pasteEntry(this.state.entries, path, e));

  _handleCopy = (path: string) =>
    this.setState((state) => ({
      clipboard: state.entries.filter((e) => e.item.path === path),
    }));

  _handleClearClipboard = () =>
    this.setState({
      clipboard: [],
    });

  _toggleOpenFilesPane = () => this.setState((state) => ({ openFilesPane: !state.openFilesPane }));

  _toggleProjectPane = () => this.setState((state) => ({ projectPane: !state.projectPane }));

  _handleCreateFile = (path?: string | undefined) => {
    let entries = createNewEntry(this.state.entries, 'file', path);
    const newEntry = entries.find(
      (e) => !this.state.entries.find((e2) => e2.item.path === e.item.path)
    );
    entries = newEntry ? openEntry(entries, newEntry.item.path, true) : entries;
    this.updateEntries(entries);
  };

  _handleCreateFolder = (path?: string | undefined) => {
    this.updateEntries(createNewEntry(this.state.entries, 'folder', path));
  };

  render() {
    return (
      <ImportFilesManager
        className={css(styles.container)}
        entries={this.state.entries}
        onImportFile={this._handleEntryImport}
        uploadFileAsync={this.props.uploadFileAsync}
        render={({ onImportStart }) =>
          this.props.visible ? (
            <ResizablePane direction="horizontal" className={css(styles.pane)}>
              <SidebarShell>
                <FileListPane
                  className={css(
                    this.state.projectPane ? styles.openFilesSmall : styles.openFilesLarge
                  )}
                  title="Open files"
                  expanded={this.state.openFilesPane}
                  onClick={this._toggleOpenFilesPane}
                >
                  <ul className={css(styles.tabs)} data-test-id="file-list-open-files-content">
                    {this.state.entries
                      .filter((e) => e.item.type === 'file' && e.state.isOpen)
                      .map((e: any) => (
                        <FileListOpenEntry
                          key={e.item.path}
                          entry={e}
                          onOpen={() => this._handleEntryOpen(e.item.path)}
                          onClose={() => this._handleEntryClose(e.item.path)}
                          onCloseOthers={() => this._handleEntryCloseOthers(e.item.path)}
                          onCloseAll={this._handleEntryCloseAll}
                        />
                      ))}
                  </ul>
                </FileListPane>
                <FileListPane
                  className={css(styles.project)}
                  title="Project"
                  expanded={this.state.projectPane}
                  onClick={this._toggleProjectPane}
                  buttons={[
                    <FileListPaneButton key="create-file" onClick={() => this._handleCreateFile()}>
                      <path
                        fillOpacity="0.7"
                        d="M3,2 L13,2 L13,14 L3,14 L3,2 Z M9,2 L13,6 L13,2 L9,2 Z M9,6 L9,2 L8,2 L8,7 L13,7 L13,6 L9,6 Z"
                      />
                      <AddIcon />
                    </FileListPaneButton>,
                    <FileListPaneButton
                      key="create-folder"
                      onClick={() => this._handleCreateFolder()}
                    >
                      <path
                        fillOpacity="0.7"
                        d="M7.25,4 L7.5,4 L7.5,3 L7,3.5 L7,2 L15,2 L15,4 L7.25,4 Z M6.75,4 L5,4 L7,2 L7,3.5 L6.5,4 L6.75,4 Z M1,4 L15,4 L15,14 L1,14 L1,4 Z M7.5,3 L7.5,4 L14,4 L14,3 L7.5,3 Z"
                      />
                      <AddIcon />
                    </FileListPaneButton>,
                    <ImportExportMenu
                      key="menu"
                      onImportFilesClick={onImportStart}
                      onImportRepoClick={() => this.props.onShowModal('import-repo')}
                      onImportProductionClick={() => this.props.onShowModal('import-production')}
                      onExportClick={this.props.onDownloadCode}
                      saveStatus={this.props.saveStatus}
                      hasSnackId={this.props.hasSnackId}
                    />,
                  ]}
                >
                  <FileListEntryDropTarget
                    className={css(styles.files)}
                    rest={this.state.entries}
                    onRename={this._handleEntryRename}
                  >
                    <div className={css(styles.children)} data-test-id="file-list-project-content">
                      <FileListChildren
                        parent=""
                        entries={this.state.entries}
                        clipboard={this.state.clipboard}
                        onCreateFile={this._handleCreateFile}
                        onCreateFolder={this._handleCreateFolder}
                        onOpen={this._handleEntryOpen}
                        onSelect={this._handleEntrySelect}
                        onFocus={this._handleEntryFocus}
                        onPaste={this._handleEntryPaste}
                        onRename={this._handleEntryRename}
                        onExpand={this._handleEntryExpand}
                        onDelete={this._handleEntryDelete}
                        onCopy={this._handleCopy}
                        onClearClipboard={this._handleClearClipboard}
                        sdkVersion={this.props.sdkVersion}
                        theme={this.props.theme}
                        className={css(styles.list)}
                      />
                    </div>
                  </FileListEntryDropTarget>
                </FileListPane>
                {this.state.deleted
                  .map((group) => (
                    <Toast
                      key={group.id}
                      label={`Deleted ${group.path.split('/').pop()}`}
                      actions={[
                        {
                          label: 'Undo',
                          action: () => {
                            this._restoreEntries(group.entries);
                            this._handleDismissDelete(group.id);
                          },
                        },
                        { label: 'Dismiss' },
                      ]}
                      onDismiss={() => this._handleDismissDelete(group.id)}
                    />
                  ))
                  .reverse()}
              </SidebarShell>
            </ResizablePane>
          ) : null
        }
      />
    );
  }
}

export default withThemeName(FileList);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    padding: '0 12px',
    height: '100%',
  },
  pane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: 240,
    minWidth: 240,
    height: '100%',
    zIndex: 10,
  },
  project: {
    flex: 1,
  },
  openFilesSmall: {
    maxHeight: '50%',
  },
  openFilesLarge: {
    maxHeight: 'calc(100% - 30px)',
  },
  files: {
    flex: '1 0 0',
    overflow: 'auto',
    paddingBottom: 16,
  },
  children: {
    position: 'relative',
  },
  tabs: {
    margin: 0,
    listStyle: 'none',
    padding: '8px 0',
    overflow: 'auto',

    ':empty': {
      display: 'none',
    },
  },
  toolbar: {
    padding: 8,
  },
  toasts: {
    position: 'fixed',
    bottom: '3em',
    left: '1em',
    zIndex: 10,
  },
});
