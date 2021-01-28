import { FileSystemEntry } from '../../types';
import selectEntry from '../selectEntry';

it('selects entry', () => {
  const entries: FileSystemEntry[] = [
    { item: { path: 'test', type: 'folder' }, state: {} },
    { item: { path: 'test/App.js', type: 'file', content: '' }, state: {} },
    { item: { path: 'components', type: 'folder' }, state: {} },
  ];

  expect(selectEntry(entries, 'test/App.js')).toEqual([
    { item: { path: 'test', type: 'folder' }, state: {} },
    {
      item: { path: 'test/App.js', type: 'file', content: '' },
      state: { isSelected: true },
    },
    { item: { path: 'components', type: 'folder' }, state: {} },
  ]);
});
