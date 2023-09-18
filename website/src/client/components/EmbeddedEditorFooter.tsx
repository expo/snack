import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import EmbeddedFooterShell from './Shell/EmbeddedFooterShell';
import LoadingText from './shared/LoadingText';
import ToggleButtons from './shared/ToggleButtons';
import ToggleSwitch from './shared/ToggleSwitch';
import { Platform, Annotation, SDKVersion } from '../types';
import { PlatformOption } from '../utils/PlatformOptions';

type Props = {
  annotations: Annotation[];
  previewShown: boolean;
  platform: Platform;
  sdkVersion: SDKVersion;
  onTogglePreview: () => void;
  onChangePlatform: (platform: Platform) => void;
  platformOptions: PlatformOption[];
};

export default class EmbeddedEditorFooter extends React.PureComponent<Props> {
  render() {
    const {
      platform,
      previewShown,
      annotations,
      onChangePlatform,
      onTogglePreview,
      platformOptions,
    } = this.props;

    const loadingItems = annotations.filter((a) => a.severity < 0);
    const isLoading = loadingItems.length >= 1;
    const loadingMessage = isLoading
      ? `${loadingItems[0].message}${
          loadingItems.length > 1 ? ` (+${loadingItems.length - 1} more)` : ''
        }`
      : '';

    return (
      <EmbeddedFooterShell type={isLoading ? 'loading' : undefined}>
        <div>{isLoading ? <LoadingText>{loadingMessage}</LoadingText> : null}</div>
        <div className={css(styles.right)}>
          <ToggleSwitch
            className={css(styles.preview)}
            checked={previewShown}
            onChange={onTogglePreview}
            label="Preview"
          />
          {platformOptions.length > 1 && (
            <ToggleButtons
              disabled={!previewShown}
              options={platformOptions}
              value={platform}
              onValueChange={onChangePlatform}
            />
          )}
        </div>
      </EmbeddedFooterShell>
    );
  }
}

const styles = StyleSheet.create({
  loadingText: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '.5em',
  },

  right: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
  },

  preview: {
    margin: '0 8px',
  },
});
