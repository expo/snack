import { FileSystemEntry } from '../types';
import updateEntry from './updateEntry';

export default function expandEntry(
  entries: FileSystemEntry[],
  path: string,
  expand: boolean = true
): FileSystemEntry[] {
  return entries.map((entry) => {
    if (entry.item.path === path && entry.item.type === 'folder') {
      return updateEntry(entry, {
        state: {
          isExpanded: expand,
        },
      });
    }

    return entry;
  });
}
