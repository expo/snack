import createEntryAtPath from './createEntryAtPath';
import updateEntry from './updateEntry';
import { isInsideFolder } from '../../../utils/fileUtilities';
import { FileSystemEntry } from '../types';

export default function createNewEntry(
  entries: FileSystemEntry[],
  type: 'file' | 'folder',
  at?: string | undefined,
) {
  const e: FileSystemEntry =
    type === 'file'
      ? {
          item: {
            path: 'Untitled file.js',
            type: 'file',
            content: '',
          },
          state: {
            isCreating: true,
          },
        }
      : {
          item: {
            path: 'Untitled folder',
            type: 'folder',
          },
          state: {
            isCreating: true,
          },
        };

  let path = at;

  if (typeof path !== 'string') {
    // Get the current folder if no path is specified
    const entry = entries.find((e) => e.state.isSelected === true);

    path = entry ? entry.item.path : undefined;
  }

  const entry = createEntryAtPath(entries, path, e);

  const next = entries.map((e) => {
    // Expand the parent folder
    if (
      e.item.type === 'folder' &&
      isInsideFolder(entry.item.path, e.item.path) &&
      !e.state.isExpanded
    ) {
      return updateEntry(e, {
        state: { isExpanded: true },
      });
    }

    return e;
  });

  return [...next, entry];
}
