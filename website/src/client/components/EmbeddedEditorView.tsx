import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import { connect } from 'react-redux';

import { withDependencyManager } from './DependencyManager';
import DeviceInstructionsModal, {
  EmbeddedConnectionMethod,
  ConnectionMethod,
} from './DeviceInstructions/DeviceInstructionsModal';
import SimpleEditor from './Editor/SimpleEditor';
import { EditorViewProps } from './EditorViewProps';
import EmbeddedEditorFooter from './EmbeddedEditorFooter';
import EmbeddedEditorTitle from './EmbeddedEditorTitle';
import PageMetadata from './PageMetadata';
import withPreferences, { PreferencesContextType } from './Preferences/withPreferences';
import withThemeName, { ThemeName } from './Preferences/withThemeName';
import EmbeddedToolbarShell from './Shell/EmbeddedToolbarShell';
import { c } from './ThemeProvider';
import LazyLoad from './shared/LazyLoad';
import OpenWithExpoButton from './shared/OpenWithExpoButton';
import constants from '../configs/constants';
import { isMobile, isAndroid } from '../utils/detectPlatform';
import { openEmbeddedSessionFullScreen } from '../utils/embeddedSession';
import { getWebsiteURL } from '../utils/getWebsiteURL';

type Props = PreferencesContextType &
  EditorViewProps & {
    testConnectionMethod?: ConnectionMethod;
    theme: ThemeName;
  };

type ModalName = 'device-instructions';

type State = {
  deviceConnectionMethod: EmbeddedConnectionMethod;
  currentModal: ModalName | null;
};

class EmbeddedEditorView extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    let deviceConnectionMethod = this.props.testConnectionMethod ?? 'qr-code';
    if (deviceConnectionMethod === 'account') {
      deviceConnectionMethod = 'qr-code';
    }

    this.state = {
      deviceConnectionMethod,
      currentModal: null,
    };
  }

  _handleShowModal = (modal: ModalName) => {
    switch (modal) {
      case 'device-instructions':
        this.props.onDeviceConnectionAttempt();
        break;
    }
    this.setState({ currentModal: modal });
  };

  _handleHideModal = () => {
    this.setState({ currentModal: null });
  };

  _handleChangeConnectionMethod = (method: ConnectionMethod) => {
    this.setState({
      deviceConnectionMethod: method as EmbeddedConnectionMethod,
    });
  };

  private handleOpenFullEditor = () => {
    openEmbeddedSessionFullScreen(this.props);
  };

  render() {
    const {
      annotations,
      name,
      description,
      connectedDevices,
      experienceURL,
      experienceName,
      selectedFile,
      files,
      dependencies,
      id,
      updateFiles,
      platform,
      platformOptions,
      previewRef,
      previewShown,
      previewURL,
      devices,
      onChangePlatform,
      onDeviceConnectionAttempt,
      onReloadSnack,
      onSendCode,
      onTogglePreview,
      onToggleSendCode,
      sdkVersion,
      sendCodeOnChangeEnabled,
      theme,
      userAgent,
    } = this.props;

    return (
      <main className={css(styles.container)}>
        <PageMetadata name={name} description={description} id={id} />
        <EmbeddedToolbarShell>
          <EmbeddedEditorTitle
            name={name}
            description={description}
            onOpenFullEditor={this.handleOpenFullEditor}
          />
          <a
            href={getWebsiteURL()}
            target="_blank"
            rel="noopener noreferrer"
            className={css(styles.logo)}
          >
            <img
              className={css(styles.wordmark)}
              src={
                theme === 'light'
                  ? require('../assets/expo-wordmark.png')
                  : require('../assets/expo-wordmark-light.png')
              }
            />
          </a>
        </EmbeddedToolbarShell>
        <div className={css(styles.editorArea)}>
          {/* @ts-ignore */}
          <SimpleEditor
            selectedFile={selectedFile}
            files={files}
            updateFiles={updateFiles}
            dependencies={dependencies}
            lineNumbers="off"
          />
          {previewShown ? (
            <LazyLoad
              load={() => import(/* webpackPreload: true */ './DevicePreview/DevicePreview')}
            >
              {({ loaded, data: Comp }) => {
                if (!(loaded && Comp)) {
                  return null;
                }

                return (
                  <Comp
                    className={css(styles.preview)}
                    width={285}
                    connectedDevices={connectedDevices}
                    experienceURL={experienceURL}
                    experienceName={experienceName}
                    name={name}
                    onAppLaunch={onDeviceConnectionAttempt}
                    onChangePlatform={onChangePlatform}
                    onShowModal={this._handleShowModal as any}
                    onReloadSnack={onReloadSnack}
                    onSendCode={onSendCode}
                    onToggleSendCode={onToggleSendCode}
                    payerCode={this.props.payerCode}
                    platform={platform}
                    platformOptions={platformOptions}
                    devices={devices}
                    previewRef={previewRef}
                    previewURL={previewURL}
                    sdkVersion={sdkVersion}
                    isEmbedded
                    sendCodeOnChangeEnabled={sendCodeOnChangeEnabled}
                  />
                );
              }}
            </LazyLoad>
          ) : null}
        </div>
        <DeviceInstructionsModal
          large
          isEmbedded
          visible={this.state.currentModal === 'device-instructions'}
          onDismiss={this._handleHideModal}
          experienceURL={experienceURL}
          onChangeMethod={this._handleChangeConnectionMethod}
          method={this.state.deviceConnectionMethod}
        />
        <div className={css(styles.footer)}>
          <EmbeddedEditorFooter
            annotations={annotations}
            previewShown={previewShown}
            platform={platform}
            sdkVersion={sdkVersion}
            platformOptions={platformOptions}
            onTogglePreview={onTogglePreview}
            onChangePlatform={onChangePlatform}
          />
        </div>
        {isMobile(userAgent) ? (
          <div className={css(styles.open)}>
            <OpenWithExpoButton
              experienceURL={experienceURL}
              onDeviceConnectionAttempt={onDeviceConnectionAttempt}
            />
            <a
              className={css(styles.download)}
              target="_blank"
              rel="noopener noreferrer"
              href={isAndroid(userAgent) ? constants.links.playstore : constants.links.itunes}
            >
              Download Expo Go
            </a>
          </div>
        ) : null}
      </main>
    );
  }
}

export default withThemeName(
  withPreferences(
    connect((state: any) => ({
      testConnectionMethod: state.splitTestSettings.defaultConnectionMethod,
    }))(withDependencyManager(EmbeddedEditorView, true))
  )
);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: c('background'),
    color: c('text'),
    minHeight: 0, // Without this firefox doesn't shrink content
  },

  editorArea: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    minHeight: 0, // Without this firefox doesn't shrink content
  },

  editorPlaceholder: {
    display: 'flex',
    flex: 1,
  },

  preview: {
    backgroundColor: c('background'),
  },

  logo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: c('text'),
    textDecoration: 'none',
    whiteSpace: 'nowrap',

    '@media (max-width: 480px)': {
      display: 'none',
    },
  },

  wordmark: {
    height: 18,
    margin: '0 .75em',
  },

  footer: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },

  open: {
    backgroundColor: c('background'),
    borderTop: `1px solid ${c('border')}`,
    padding: '.5em',

    '@media (min-width: 480px)': {
      display: 'none',
    },
  },

  download: {
    color: c('text'),
    display: 'block',
    paddingBottom: '.5em',
    textAlign: 'center',
  },
});
