import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { SaveStatus, SaveHistory, Viewer, SaveOptions } from '../types';
import EditorTitle from './EditorTitle';
import type { EditorModal } from './EditorViewProps';
import usePreferences from './Preferences/usePreferences';
import SearchButton from './Search/SearchButton';
import ToolbarShell from './Shell/ToolbarShell';
import ToolbarTitleShell from './Shell/ToolbarTitleShell';
import UserMenu from './UserMenu';
import Button from './shared/Button';
import IconButton from './shared/IconButton';

type Props = {
  name: string;
  description: string;
  createdAt: string | undefined;
  saveStatus: SaveStatus;
  saveHistory: SaveHistory;
  viewer: Viewer | undefined;
  isDownloading: boolean;
  isResolving: boolean;
  visibleModal: EditorModal | null;
  onSubmitMetadata: (details: { name: string; description: string }) => void;
  onShowModal: (modal: EditorModal) => void;
  onHideModal: () => void;
  onDownloadCode: () => Promise<void>;
  onPublishAsync: (options?: SaveOptions) => Promise<void>;
};

export default function EditorToolbar(props: Props) {
  const [preferences] = usePreferences();

  const {
    name,
    description,
    createdAt,
    saveHistory,
    saveStatus,
    viewer,
    isDownloading,
    isResolving,
    visibleModal,
    onSubmitMetadata,
    onShowModal,
    onHideModal,
    onDownloadCode,
    onPublishAsync,
  } = props;
  const { theme } = preferences;

  const isPublishing = saveStatus === 'publishing';
  const isPublished = saveStatus === 'published';

  return (
    <ToolbarShell>
      <ToolbarTitleShell>
        <img
          src={
            theme === 'dark'
              ? require('../assets/snack-icon-dark.svg')
              : require('../assets/snack-icon.svg')
          }
          alt="Snack"
          className={css(styles.logo)}
        />
        <EditorTitle
          name={name}
          description={description}
          createdAt={createdAt}
          saveHistory={saveHistory}
          saveStatus={saveStatus}
          viewer={viewer}
          visibleModal={visibleModal}
          onSubmitMetadata={onSubmitMetadata}
          onShowModal={onShowModal}
          onHideModal={onHideModal}
        />
      </ToolbarTitleShell>
      <div className={css(styles.buttons)}>
        <Button
          variant="secondary"
          onClick={() => onPublishAsync()}
          disabled={isPublishing || isResolving || isPublished}
          loading={isPublishing}
          className={css(styles.saveButton)}>
          {isPublishing ? 'Saving…' : isPublished ? 'Saved' : 'Save'}
        </Button>
        <IconButton
          responsive
          title="Run on device"
          onClick={() => onShowModal('device-instructions')}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M8.333 7.083v5.667l4.534-2.833-4.534-2.834z" stroke="none" />
            <path d="M8.333 10H2.5" strokeWidth="1.25" strokeLinecap="round" />
            <path
              d="M5.444 11.889v3.778c0 1.043.846 1.889 1.89 1.889h6.61a1.889 1.889 0 001.89-1.89V4.334a1.889 1.889 0 00-1.89-1.889h-6.61a1.889 1.889 0 00-1.89 1.89V8.11"
              fill="none"
              strokeWidth="1.667"
            />
            <rect x="8.333" y="1.667" width="5" height="2.5" rx=".833" stroke="none" />
          </svg>
        </IconButton>
        <IconButton
          responsive
          title="Download as zip"
          onClick={onDownloadCode}
          disabled={isDownloading || isPublishing}>
          <svg width="20" height="20">
            <path d="M14.167 10H5.833L10 16.667 14.167 10z" />
            <path d="M2.5 18.333h15M10 10V1.667" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </IconButton>
        <IconButton responsive title="Show embed code" onClick={() => onShowModal('embed')}>
          <svg width="20px" height="18px" viewBox="0 0 20 18" fill="none">
            <path
              d="M13.333 15l5-5-5-5M6.667 5l-5 5 5 5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
        <IconButton responsive title="Help" onClick={() => onShowModal('help')}>
          <svg width="20px" height="18px" viewBox="0 0 20 18" fill="none">
            <path
              d="M13.333 15l5-5-5-5M6.667 5l-5 5 5 5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
        <SearchButton responsive />
        <UserMenu />
      </div>
    </ToolbarShell>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 24,
    height: 24,
    marginLeft: 16,
    marginRight: 16,
  },

  buttons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 5,
  },

  saveButton: {
    height: 40,
    fontWeight: 600,
    minWidth: 80,
    fontSize: '16px',
    marginRight: 16,
  },
});
