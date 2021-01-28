import { StyleSheet, css } from 'aphrodite';
import escapeRegexp from 'escape-string-regexp';
import * as React from 'react';

import { SDKVersion } from '../../types';
import { isInsideFolder } from '../../utils/fileUtilities';
import { ThemeName } from '../Preferences/withThemeName';
import FileListEntry from './FileListEntry';
import { FileSystemEntry } from './types';

type Props = {
  parent: string;
  entries: FileSystemEntry[];
  clipboard: FileSystemEntry[];
  onOpen: (path: string) => void;
  onFocus: (path: string) => void;
  onSelect: (path: string) => void;
  onCopy: (path: string) => void;
  onDelete: (path: string) => void;
  onExpand: (path: string, expand?: boolean) => void;
  onCreateFile: (path: string | undefined) => void;
  onCreateFolder: (path: string | undefined) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onPaste: (path: string | undefined, entry: FileSystemEntry) => void;
  onClearClipboard: () => void;
  sdkVersion: SDKVersion;
  theme: ThemeName;
  className?: string;
};

export default class FileListChildren extends React.PureComponent<Props> {
  _getImmediateChildren = () =>
    this.props.entries.filter(
      (e) =>
        // Filter-out non-immediate children
        !e.item.path.replace(new RegExp(`^${escapeRegexp(this.props.parent)}/`), '').includes('/')
    );

  render() {
    const {
      entries,
      clipboard,
      onCreateFile,
      onCreateFolder,
      onFocus,
      onOpen,
      onSelect,
      onPaste,
      onRename,
      onExpand,
      onDelete,
      onCopy,
      onClearClipboard,
      className,
      theme,
    } = this.props;

    return (
      <div className={`${css(styles.container)} ${className ?? ''}`}>
        {this._getImmediateChildren()
          .sort((a, b) => {
            if (a.item.type === b.item.type) {
              if (a.item.path.startsWith('.') && !b.item.path.startsWith('.')) {
                return 1;
              }

              if (b.item.path.startsWith('.') && !a.item.path.startsWith('.')) {
                return -1;
              }

              return a.item.path.localeCompare(b.item.path);
            } else if (a.item.type === 'folder') {
              return -1;
            } else {
              return 1;
            }
          })
          .map((e) => (
            <FileListEntry
              key={e.item.path}
              entry={e}
              rest={entries.filter((en) => isInsideFolder(en.item.path, e.item.path))}
              clipboard={clipboard}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onOpen={onOpen}
              onSelect={onSelect}
              onFocus={onFocus}
              onCopy={onCopy}
              onPaste={onPaste}
              onDelete={onDelete}
              onRename={onRename}
              onExpand={onExpand}
              onClearClipboard={onClearClipboard}
              getAdjacentEntries={this._getImmediateChildren}
              sdkVersion={this.props.sdkVersion}
              theme={theme}
            />
          ))}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'inline-block',
    width: '100%',
  },
});
