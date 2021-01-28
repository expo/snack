import { SnackFiles, SnackFile, Annotation } from '../../../types';
import { isEntryPoint } from '../../../utils/fileUtilities';
import { FileSystemEntry, TextFileEntry, AssetFileEntry } from '../types';

const getFolders = (path: string): string[] => {
  // TODO: change this to slice and join
  const pathSegments = path.split('/');
  if (pathSegments.length === 0) {
    return [];
  }
  const result = [];
  for (
    let pathIdx = 0;
    pathIdx < pathSegments.length - 1; // do not process the last element
    pathIdx++
  ) {
    result.push(pathSegments.slice(0, pathIdx + 1).join('/'));
  }
  return result;
};

function fileToEntry(
  path: string,
  file: SnackFile,
  annotations: Annotation[],
  prevEntry?: FileSystemEntry
): any {
  const isLoading = !!annotations.find(
    ({ location, severity }) => location?.fileName === path && severity < 0
  );
  const isError =
    !isLoading &&
    !!annotations.find(({ location, severity }) => location?.fileName === path && severity >= 3);

  if (file.type === 'ASSET') {
    if (prevEntry && prevEntry.item.type === 'file' && prevEntry.item.asset) {
      return prevEntry.item.uri === file.contents &&
        prevEntry.state.isError === isError &&
        prevEntry.state.isLoading === isLoading
        ? prevEntry
        : {
            item: {
              ...prevEntry.item,
              uri: file.contents as string,
            },
            state: {
              ...prevEntry.state,
              isError,
              isLoading,
            },
          };
    } else {
      return {
        item: {
          path,
          type: 'file',
          uri: file.contents as string,
          asset: true,
        },
        state: {
          isError,
          isLoading,
        },
      };
    }
  } else {
    const isEntry = isEntryPoint(path);
    if (prevEntry && prevEntry.item.type === 'file' && !prevEntry.item.asset) {
      return prevEntry.item.content === file.contents &&
        prevEntry.state.isError === isError &&
        prevEntry.state.isLoading === isLoading
        ? prevEntry
        : {
            item: {
              ...prevEntry.item,
              content: file.contents,
            },
            state: {
              ...prevEntry.state,
              isError,
              isLoading,
            },
          };
    } else {
      return {
        item: {
          path,
          type: 'file',
          content: file.contents,
          virtual: path === 'package.json',
        },
        state: {
          isOpen: isEntry,
          isSelected: isEntry,
          isFocused: isEntry,
          isError,
          isLoading,
        },
      };
    }
  }
}

export function filesToEntries(
  files: SnackFiles,
  annotations: Annotation[],
  prevEntries: FileSystemEntry[]
): FileSystemEntry[] {
  const fileSystem: FileSystemEntry[] = [];
  const foldersInFileSystem = new Set();

  // Add entries from files
  for (const filename of Object.keys(files).sort()) {
    for (const folder of getFolders(filename)) {
      if (!foldersInFileSystem.has(folder)) {
        fileSystem.push(
          prevEntries.find((entry) => entry.item.path === folder) ?? {
            item: {
              path: folder,
              type: 'folder',
            },
            state: {},
          }
        );
        foldersInFileSystem.add(folder);
      }
    }
    const file = files[filename];
    const prevEntry = prevEntries.find((entry) => entry.item.path === filename);
    fileSystem.push(fileToEntry(filename, file, annotations, prevEntry));
  }

  // Restore empty folders that cannot be derived from files
  prevEntries.forEach((entry) => {
    if (entry.item.type === 'folder' && !foldersInFileSystem.has(entry.item.path)) {
      fileSystem.push(entry);
    }
  });

  return fileSystem;
}

export function findFocusedEntry(
  entries: FileSystemEntry[]
): TextFileEntry | AssetFileEntry | undefined {
  return entries.find((entry) => entry.item.type === 'file' && entry.state.isFocused) as any;
}
