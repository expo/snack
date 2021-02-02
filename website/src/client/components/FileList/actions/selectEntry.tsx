import { FileSystemEntry } from '../types';
import updateEntry from './updateEntry';

export default function selectEntry(entries: FileSystemEntry[], path: string): FileSystemEntry[] {
  return entries.map((e) =>
    e.item.path === path
      ? updateEntry(e, {
          state: {
            isSelected: !e.state.isSelected,
          },
        })
      : e
  );
}
