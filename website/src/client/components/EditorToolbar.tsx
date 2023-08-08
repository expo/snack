import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { Experiment } from '../auth/authManager';
import { SaveStatus, SaveHistory, Viewer, SaveOptions, SDKVersion } from '../types';
import EditorTitle from './EditorTitle';
import type { EditorModal } from './EditorViewProps';
import usePreferences from './Preferences/usePreferences';
import SearchBar from './Search/SearchBar';
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
  sdkVersion: SDKVersion;
  viewer: Viewer | undefined;
  isDownloading: boolean;
  isResolving: boolean;
  visibleModal: EditorModal | null;
  onSubmitMetadata: (details: { name: string; description: string }) => void;
  onShowModal: (modal: EditorModal) => void;
  onHideModal: () => void;
  onDownloadCode: () => Promise<void>;
  onOpenWithOrbit: () => void;
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
    sdkVersion,
    viewer,
    isDownloading,
    isResolving,
    visibleModal,
    onSubmitMetadata,
    onShowModal,
    onHideModal,
    onDownloadCode,
    onOpenWithOrbit,
    onPublishAsync,
  } = props;
  const { theme } = preferences;

  const isPublishing = saveStatus === 'publishing';
  const isPublished = saveStatus === 'published';

  const showOrbitButton =
    viewer?.experiments?.find(({ experiment }) => experiment === Experiment.Orbit)?.enabled ??
    false;

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
        <SearchBar sdkVersion={sdkVersion} />
        <Button
          variant="primary"
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
        {showOrbitButton ? (
          <IconButton responsive title="Open with Orbit" onClick={onOpenWithOrbit}>
            <svg width="20" height="20" viewBox="0 0 16 16">
              <path
                stroke="none"
                d="M6.53747 12.9531C6.25915 12.0253 11.176 9.35779 13.6693 8.14001C13.5533 9.02918 13.4373 10.5176 11.9298 12.0253C10.5962 13.3591 6.88536 14.1129 6.53747 12.9531Z"
              />
              <path
                stroke="none"
                d="M5.84172 3.037C1.99171 4.79989 2.45941 8.66153 3.17452 10.3432C2.88459 10.4596 1.78288 10.5176 1.60898 10.2857C1.43507 10.0537 1.95691 9.53181 2.30481 9.29939L2.18883 8.83547C0.565336 9.64778 -0.19688 10.652 0.0434576 11.2135C0.217402 11.6199 2.18883 12.6628 8.85678 9.58934C15.5247 6.51589 16.2785 4.83465 15.9306 4.25476C15.6523 3.79084 13.708 4.00301 12.7996 4.19631L13.2634 4.71867C13.8432 4.60269 14.3071 4.60269 14.3071 4.89264C14.3071 5.36574 13.6693 5.78138 13.3214 5.99402C12.4323 4.29299 9.84249 1.20508 5.84172 3.037Z"
              />
            </svg>
          </IconButton>
        ) : null}
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
