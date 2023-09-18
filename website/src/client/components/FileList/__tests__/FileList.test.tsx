import { StyleSheetTestUtils } from 'aphrodite';
import { shallow } from 'enzyme';
import toJSON from 'enzyme-to-json';
import * as React from 'react';

import { TEST_SDK_VERSION } from '../../../configs/sdk';
import FileList from '../FileList';

// @ts-ignore
jest.mock('../../Preferences/withThemeName', () => (c) => c);

beforeEach(StyleSheetTestUtils.suppressStyleInjection);
afterEach(StyleSheetTestUtils.clearBufferAndResumeStyleInjection);

it('renders children', () => {
  const wrapper = shallow(
    <FileList
      files={{
        'App.js': {
          type: 'CODE',
          contents: '',
        },
        'components/Icon.js': {
          type: 'CODE',
          contents: '',
        },
      }}
      selectedFile="App.js"
      updateFiles={jest.fn()}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      onSelectFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      onShowModal={jest.fn()}
      hasSnackId={false}
      saveStatus="edited"
      sdkVersion={TEST_SDK_VERSION}
      visible
      annotations={[]}
    />,
  );

  expect(toJSON(wrapper)).toMatchSnapshot();
});

it('deletes entry', () => {
  const updateFiles = jest.fn();
  const wrapper = shallow(
    <FileList
      files={{
        'test/App.js': {
          type: 'CODE',
          contents: '',
        },
      }}
      selectedFile="test/App.js"
      updateFiles={updateFiles}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      onSelectFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      onShowModal={jest.fn()}
      hasSnackId={false}
      saveStatus="edited"
      sdkVersion={TEST_SDK_VERSION}
      visible
      annotations={[]}
    />,
  );

  // @ts-ignore
  wrapper.instance()._handleEntryDelete('test');

  expect(updateFiles).toBeCalledTimes(1);
});

it('copies item to clipboard', () => {
  const wrapper = shallow(
    <FileList
      files={{
        'test/App.js': {
          type: 'CODE',
          contents: '',
        },
      }}
      selectedFile="App.js"
      updateFiles={jest.fn()}
      onRemoveFile={jest.fn()}
      onRenameFile={jest.fn()}
      onSelectFile={jest.fn()}
      uploadFileAsync={jest.fn()}
      onDownloadCode={jest.fn()}
      onShowModal={jest.fn()}
      hasSnackId={false}
      saveStatus="edited"
      sdkVersion={TEST_SDK_VERSION}
      visible
      annotations={[]}
    />,
  );

  // @ts-ignore
  expect(wrapper.state().clipboard).toEqual([]);

  // @ts-ignore
  wrapper.instance()._handleCopy('test/App.js');

  // @ts-ignore
  expect(wrapper.state().clipboard).toEqual([
    {
      item: { path: 'test/App.js', type: 'file', content: '', virtual: false },
      state: {
        isError: false,
        isFocused: false,
        isLoading: false,
        isOpen: false,
        isSelected: false,
      },
    },
  ]);

  // @ts-ignore
  wrapper.instance()._handleClearClipboard();

  // @ts-ignore
  expect(wrapper.state().clipboard).toEqual([]);
});
