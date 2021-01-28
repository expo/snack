import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { SDKVersion } from '../../types';
import { isEntryPoint, getParentPath } from '../../utils/fileUtilities';
import { ThemeName } from '../Preferences/withThemeName';
import { c } from '../ThemeProvider';
import { Action } from '../shared/ContextMenu';
import { KeyMap } from '../shared/KeybindingsManager';
import FileListChildren from './FileListChildren';
import FileListEntryBase from './FileListEntryBase';
import FileListEntryIcon from './FileListEntryIcon';
import { FileSystemEntry } from './types';

type Props = {
  entry: FileSystemEntry;
  rest: FileSystemEntry[];
  clipboard: FileSystemEntry[];
  onOpen: (path: string) => void;
  onFocus: (path: string) => void;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
  onCopy: (path: string) => void;
  onExpand: (path: string, expand?: boolean) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onCreateFile: (path: string | undefined) => void;
  onCreateFolder: (path: string | undefined) => void;
  onPaste: (path: string | undefined, entry: FileSystemEntry) => void;
  onClearClipboard: () => void;
  getAdjacentEntries: () => FileSystemEntry[];
  sdkVersion: SDKVersion;
  theme: ThemeName;
};

type State = {
  name: string;
  error: Error | null;
  isRenaming: boolean;
};

const toggleTSExt = (name: string) =>
  name.replace(/(\.[^.]+$)/, (_, $1) => ($1 === '.js' ? '.tsx' : '.js'));

export default class FileListEntry extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { entry } = props;

    this.state = {
      name: entry.state.isCreating ? entry.item.path.split('/').pop() ?? '' : '',
      error: null,

      isRenaming: !entry.item.asset && !!entry.state.isCreating,
    };
  }

  state: State;

  componentDidMount() {
    if (this.props.entry.state.isCreating) {
      this.props.onOpen(this.props.entry.item.path);
    }
  }

  _handleToggleExpand = () =>
    this.props.onExpand(
      this.props.entry.item.path,

      !this.props.entry.state.isExpanded
    );

  _handleToggleRename = () => {
    if (this.state.isRenaming && !this.state.error) {
      this._handleNameChange(this.state.name);
    }

    this.setState((state, props) =>
      state.isRenaming
        ? {
            isRenaming: false,
            name: '',
            error: null,
          }
        : {
            isRenaming: true,
            name: props.entry.item.path.split('/').pop() ?? '',
            error: null,
          }
    );
  };

  _handleDelete = () => this.props.onDelete(this.props.entry.item.path);

  _handleNameChange = (name: string) => {
    const { entry } = this.props;

    if (name && (name !== entry.item.path.split('/').pop() || entry.state.isCreating)) {
      const newPath = entry.item.path.replace(/[^/]+$/, name);

      this.props.onRename(entry.item.path, newPath);
    }
  };

  _handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    this.setState({
      name,
      error: this._validateName(name),
    });
  };

  _validateName = (name: string) => {
    if (name === this.props.entry.item.path.split('/').pop()) {
      return null;
    }

    const invalidCharacters = ['\0', '\\', ':', '*', '?', '"', '<', '>', '|'];
    const usedCharacters = invalidCharacters.filter((c) => name.includes(c));

    if (usedCharacters.length) {
      return new Error(
        `${
          usedCharacters.length === 1
            ? `${usedCharacters[0]} is`
            : `${usedCharacters.join(', ')} are`
        } not allowed`
      );
    }

    const adjacentEntries = this.props.getAdjacentEntries();

    if (
      adjacentEntries.some(
        (e) => (e.item.path.split('/').pop() ?? '').toLowerCase() === name.toLowerCase()
      )
    ) {
      return new Error(`Another entry already exists with same name`);
    }

    if (isEntryPoint(name)) {
      return new Error(`Cannot name a new file as ${name}`);
    }

    return null;
  };

  _handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    if (input instanceof HTMLInputElement) {
      input.select();
    }
  };

  _handleInputBlur = () => {
    if (!this.state.error) {
      this._handleNameChange(this.state.name);
    }
    this.setState({
      isRenaming: false,
      name: '',
      error: null,
    });
  };

  _handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.keyCode) {
      case KeyMap.Enter:
        this._handleToggleRename();
        break;
      case KeyMap.Escape:
        this._handleInputBlur();
        break;
    }
  };

  _handleCreateFile = () => this.props.onCreateFile(this.props.entry.item.path);

  _handleCreateFolder = () => this.props.onCreateFolder(this.props.entry.item.path);

  _handleCopy = () => this.props.onCopy(this.props.entry.item.path);

  _handlePaste = () => {
    const { entry, clipboard, onPaste, onClearClipboard } = this.props;
    clipboard.forEach((e) => onPaste(entry.item.path, e));
    onClearClipboard();
  };

  _handleDuplicate = () => {
    const { entry, onPaste } = this.props;
    const path = entry.item.path.includes('/')
      ? entry.item.type === 'folder'
        ? getParentPath(entry.item.path)
        : entry.item.path
      : undefined;
    onPaste(path, entry);
  };

  _handleToggleTSExt = () => {
    const filepath = this.props.entry.item.path;

    this.props.onRename(filepath, toggleTSExt(filepath));
  };

  _getActions = (): (Action | undefined)[] => [
    {
      label: 'New file',
      handler: this._handleCreateFile,
    },
    {
      label: 'New folder',
      handler: this._handleCreateFolder,
    },
    this.props.entry.item.type === 'folder'
      ? {
          label:
            this.props.entry.item.type === 'folder' && this.props.entry.state.isExpanded
              ? 'Collapse'
              : 'Expand',
          handler: this._handleToggleExpand,
          combo: [KeyMap.Enter],
        }
      : undefined,
    this.props.clipboard.length
      ? {
          label: 'Paste',
          handler: this._handlePaste,
          combo: [KeyMap.Meta, KeyMap.V],
        }
      : !this.props.entry.item.virtual
      ? {
          label: 'Copy',
          handler: this._handleCopy,
          combo: [KeyMap.Meta, KeyMap.C],
        }
      : undefined,
    !this.props.entry.item.virtual
      ? {
          label: 'Duplicate',
          handler: this._handleDuplicate,
          combo: [KeyMap.Meta, KeyMap.D],
        }
      : undefined,
    isEntryPoint(this.props.entry.item.path)
      ? {
          label: `Rename to ${toggleTSExt(this.props.entry.item.path)}`,
          handler: this._handleToggleTSExt,
        }
      : undefined,
    ...(!isEntryPoint(this.props.entry.item.path) && !this.props.entry.item.virtual
      ? [
          {
            label: 'Rename',
            handler: this._handleToggleRename,
            combo: [KeyMap.F2],
          },
          {
            label: 'Delete',
            handler: this._handleDelete,
            combo: [KeyMap.Delete],
          },
        ]
      : []),
  ];

  _renderItem = () => {
    const { entry } = this.props;
    const { isRenaming, name } = this.state;
    const displayName = isRenaming ? '\u00A0' : entry.item.path.split('/').pop();

    return (
      <div>
        {this.state.error ? (
          <div className={css(styles.error)}>{this.state.error.message}</div>
        ) : null}
        <FileListEntryIcon entry={entry} />
        <span className={css(styles.label, entry.state.isError ? styles.labelError : undefined)}>
          {displayName}
        </span>
        {isRenaming ? (
          <input
            autoFocus
            type="text"
            value={name}
            onChange={this._handleInputChange}
            onFocus={this._handleInputFocus}
            onBlur={this._handleInputBlur}
            onKeyUp={this._handleInputKeyUp}
            className={css(styles.input)}
          />
        ) : null}
      </div>
    );
  };

  _renderTree = () => {
    const {
      entry,
      rest,
      clipboard,
      onCreateFile,
      onCreateFolder,
      onOpen,
      onSelect,
      onFocus,
      onPaste,
      onRename,
      onExpand,
      onDelete,
      onCopy,
      onClearClipboard,
      theme,
    } = this.props;

    return entry.item.type === 'folder' && rest.length && entry.state.isExpanded ? (
      <div className={css(styles.child)}>
        <FileListChildren
          parent={entry.item.path}
          entries={rest}
          clipboard={clipboard}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onOpen={onOpen}
          onSelect={onSelect}
          onFocus={onFocus}
          onCopy={onCopy}
          onPaste={onPaste}
          onRename={onRename}
          onExpand={onExpand}
          onDelete={onDelete}
          onClearClipboard={onClearClipboard}
          sdkVersion={this.props.sdkVersion}
          theme={theme}
        />
      </div>
    ) : null;
  };

  _renderMenuIcon = () => (
    <svg className={css(styles.icon)} viewBox="0 0 16 16">
      <circle cy="3" cx="8" r="1.5" />
      <circle cy="8" cx="8" r="1.5" />
      <circle cy="13" cx="8" r="1.5" />
    </svg>
  );

  render() {
    const { entry, rest, onOpen, onFocus, onRename, onExpand, theme } = this.props;
    // Disable drag n drop for the entry file and virtual files
    // Also disable for files being created because they will have a nested input
    // Otherwise it'll be impossible to move the cursor in the input by dragging
    const draggable = !(
      (isEntryPoint(this.props.entry.item.path) || this.props.entry.item.virtual) ??
      this.props.entry.state.isCreating
    );

    return (
      <FileListEntryBase
        entry={entry}
        rest={rest}
        onOpen={onOpen}
        onFocus={onFocus}
        onRename={onRename}
        onExpand={onExpand}
        renderItem={this._renderItem}
        renderTree={this._renderTree}
        renderMenuIcon={this._renderMenuIcon}
        actions={this._getActions()}
        draggable={draggable}
        theme={theme}
      />
    );
  }
}

const styles = StyleSheet.create({
  child: {
    marginLeft: 16,
  },

  label: {
    verticalAlign: -1,
    margin: '0 6px',
    userSelect: 'none',
  },

  labelError: {
    color: c('error'),
  },

  input: {
    position: 'absolute',
    top: 0,
    left: 35,
    height: 28,
    margin: 1,
    border: `1px solid ${c('selected')}`,
    borderRadius: 3,
    backgroundColor: c('content'),
    outline: 0,
    paddingLeft: 2,
  },

  error: {
    backgroundColor: c('error'),
    color: c('error-text'),
    padding: '4px 8px',
    position: 'fixed',
    marginTop: -32,
    marginLeft: 20,
    borderRadius: 3,
  },

  icon: {
    height: 16,
    width: 16,
    opacity: 0.7,
    fill: 'currentColor',
  },
});
