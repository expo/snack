import { FileSystemEntry } from '../../types';
import createNewEntry from '../createNewEntry';

it('creates new file', () => {
  const entries: FileSystemEntry[] = [
    { item: { path: 'test', type: 'folder' }, state: {} },
    { item: { path: 'test/App.js', type: 'file', content: '' }, state: {} },
    { item: { path: 'components', type: 'folder' }, state: {} },
  ];

  expect(createNewEntry(entries, 'file')).toMatchSnapshot();

  expect(createNewEntry(entries, 'file', 'test')).toMatchSnapshot();
});

it('creates new folder', () => {
  const entries: FileSystemEntry[] = [
    { item: { path: 'test', type: 'folder' }, state: {} },
    { item: { path: 'test/App.js', type: 'file', content: '' }, state: {} },
    { item: { path: 'components', type: 'folder' }, state: {} },
  ];

  expect(createNewEntry(entries, 'folder')).toMatchSnapshot();

  expect(createNewEntry(entries, 'folder', 'test')).toMatchSnapshot();
});
