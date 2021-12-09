import { StyleSheet, css } from 'aphrodite';
import debounce from 'lodash/debounce';
import * as React from 'react';
import { connect } from 'react-redux';

import { Viewer, SnackFiles, Annotation, SDKVersion } from '../types';
import Analytics from '../utils/Analytics';
import { isMobile } from '../utils/detectPlatform';
import { isScript, isJson, isTest } from '../utils/fileUtilities';
import lintFile from '../utils/lintFile';
import prettierCode from '../utils/prettierCode';
import AssetViewer from './AssetViewer';
import { withDependencyManager } from './DependencyManager';
import DeviceInstructionsModal, {
  ConnectionMethod,
} from './DeviceInstructions/DeviceInstructionsModal';
import DevicePreview from './DevicePreview/DevicePreview';
import { EditorProps } from './Editor/EditorProps';
import EditorFooter from './EditorFooter';
import EditorPanels from './EditorPanels';
import EditorToolbar from './EditorToolbar';
import { EditorViewProps, EditorModal } from './EditorViewProps';
import EmbedCode from './EmbedCode';
import FileList from './FileList/FileList';
import ImportProductionModal from './Import/ImportProductionModal';
import ImportRepoModal from './Import/ImportRepoModal';
import KeyboardShortcuts, { Shortcuts } from './KeyboardShortcuts';
import NoFileSelected from './NoFileSelected';
import PageMetadata from './PageMetadata';
import type { PanelType } from './Preferences/PreferencesProvider';
import withPreferences, { PreferencesContextType } from './Preferences/withPreferences';
import PreviousSaves from './PreviousSaves';
import PublishManager, { PublishModals } from './Publish/PublishManager';
import ContentShell from './Shell/ContentShell';
import EditorShell from './Shell/EditorShell';
import LayoutShell from './Shell/LayoutShell';
import { c, s } from './ThemeProvider';
import Banner from './shared/Banner';
import KeybindingsManager from './shared/KeybindingsManager';
import LazyLoad from './shared/LazyLoad';
import ModalDialog from './shared/ModalDialog';
import ProgressIndicator from './shared/ProgressIndicator';

const EDITOR_LOAD_FALLBACK_TIMEOUT = 3000;

export type Props = PreferencesContextType &
  EditorViewProps & {
    viewer?: Viewer;
  };

type ModalName = PublishModals | EditorModal;
type BannerName =
  | 'connected'
  | 'disconnected'
  | 'reconnect'
  | 'autosave-disabled'
  | 'sdk-upgraded'
  | 'sdk-downgraded'
  | 'embed-unavailable'
  | 'slow-connection';

type LintedFile = {
  code: string;
  annotations: Annotation[];
};

type LintedFiles = {
  [path: string]: LintedFile;
};

type State = {
  currentModal: ModalName | null;
  currentBanner: BannerName | null;
  loadedEditor: 'monaco' | 'simple' | null;
  isMarkdownPreview: boolean;
  deviceLogsShown: boolean;
  lintedFiles: LintedFiles;
  lintAnnotations: Annotation[];
  shouldPreventRedirectWarning: boolean;
};

const BANNER_TIMEOUT_SHORT = 1500;
const BANNER_TIMEOUT_LONG = 5000;

class EditorView extends React.Component<Props, State> {
  state: State = {
    currentModal: null,
    currentBanner: null,
    loadedEditor: null,
    isMarkdownPreview: true,
    deviceLogsShown: false,
    lintedFiles: {},
    lintAnnotations: [],
    shouldPreventRedirectWarning: false,
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    const { selectedFile, files } = props;
    let newState: any = null;

    // When an empty markdown file is opened, switch to edit mode
    if (state.isMarkdownPreview && selectedFile.endsWith('.md') && !files[selectedFile]?.contents) {
      newState = newState || {};
      newState.isMarkdownPreview = false;
    }

    return newState;
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this._handleUnload);

    // Load prettier early so that clicking on the prettier button doesn't take too long
    // Try to preload plugins required for the current entry first
    // If entry isn't present, load plugins for markdown, which will load several of them
    setTimeout(() => {
      this._lint(this.props.selectedFile, this.props.files, this.props.sdkVersion);
      prettierCode(isScript(this.props.selectedFile) ? this.props.selectedFile : 'index.md', '');
    }, 5000);

    if (this.props.upgradedFromSDKVersion) {
      if (this.props.upgradedFromSDKVersion > this.props.sdkVersion) {
        this._showBanner('sdk-downgraded');
      } else {
        this._showBanner('sdk-upgraded');
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.files !== prevProps.files) {
      this._lint(this.props.selectedFile, this.props.files, this.props.sdkVersion);
    }

    if (prevProps.connectedDevices !== this.props.connectedDevices) {
      if (prevProps.connectedDevices.length < this.props.connectedDevices.length) {
        Analytics.getInstance().logEvent('CONNECTED_DEVICE');

        if (prevProps.connectedDevices.length === 0) {
          Analytics.getInstance().startTimer('deviceConnected');
        }

        this._showBanner('connected', BANNER_TIMEOUT_SHORT);
      }

      if (prevProps.connectedDevices.length > this.props.connectedDevices.length) {
        if (this.props.connectedDevices.length === 0) {
          Analytics.getInstance().logEvent('DISCONNECTED_DEVICE', {}, 'deviceConnected');
        } else {
          Analytics.getInstance().logEvent('DISCONNECTED_DEVICE');
        }

        this._showBanner('disconnected', BANNER_TIMEOUT_SHORT);
      }
    }

    if (prevProps.sdkVersion !== this.props.sdkVersion && this.props.connectedDevices.length) {
      this._showBanner('reconnect');
    }

    if (prevProps.autosaveEnabled !== this.props.autosaveEnabled && !this.props.autosaveEnabled) {
      this._showBanner('autosave-disabled');
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this._handleUnload);
  }

  _handleUnload = (e: any) => {
    const isUnsaved =
      this.props.saveStatus === 'edited' ||
      this.props.saveStatus === 'publishing' ||
      this.props.saveStatus === 'saving-draft';

    if (!isUnsaved || this.state.shouldPreventRedirectWarning) {
      this._allowRedirectWarning();
      return;
    }

    const message = 'You have unsaved changes. Are you sure you want to leave this page?';
    e.returnValue = message;
    return message;
  };

  _lintNotDebounced = async (_selectedFile: string, files: SnackFiles, _sdkVersion: SDKVersion) => {
    const { lintedFiles } = this.state;
    let newLintedFiles: LintedFiles | null = null;

    // Lint other files if they have changed
    for (const path in files) {
      const file = files[path];
      if (!isTest(path) && file.type === 'CODE' && file.contents !== lintedFiles[path]?.code) {
        const annotations = await lintFile(path, files);
        newLintedFiles = newLintedFiles ?? { ...lintedFiles };
        newLintedFiles[path] = {
          code: file.contents,
          annotations,
        };
      }
    }

    // Remove linter-results for removed files
    for (const path in lintedFiles) {
      if (!files[path] || files[path].type !== 'CODE') {
        newLintedFiles = newLintedFiles ?? { ...lintedFiles };
        delete newLintedFiles[path];
      }
    }

    // Update state
    if (newLintedFiles) {
      this.setState(() => ({
        lintedFiles: newLintedFiles as LintedFiles,
        lintAnnotations: Object.values(newLintedFiles as LintedFiles).flatMap(
          ({ annotations }) => annotations
        ),
      }));
    }
  };

  _lint = debounce(this._lintNotDebounced, 500);

  _prettier = async () => {
    const { selectedFile, files } = this.props;
    const file = files[selectedFile];

    if (file?.type === 'CODE') {
      let code: string;
      if (isJson(selectedFile)) {
        code = JSON.stringify(JSON.parse(file.contents), null, 2);
      } else {
        code = await prettierCode(selectedFile, file.contents);
      }
      if (code !== file.contents) {
        this.props.updateFiles(() => ({
          [selectedFile]: {
            type: 'CODE',
            contents: code,
          },
        }));
      }
    }
  };

  _showBanner = (name: BannerName, duration: number = BANNER_TIMEOUT_LONG) => {
    this.setState({ currentBanner: name });

    setTimeout(() => {
      this.setState((state) => (state.currentBanner === name ? { currentBanner: null } : null));
    }, duration);
  };

  _handleHideModal = () => {
    switch (this.state.currentModal) {
      case 'edit-info':
        Analytics.getInstance().logEvent('DISMISSED_AUTH_MODAL', {
          currentModal: this.state.currentModal,
        });
        break;
    }
    this.setState({ currentModal: null });
  };

  _handleShowModal = (name: ModalName) => {
    switch (name) {
      case 'device-instructions':
        Analytics.getInstance().logEvent('REQUESTED_QR_CODE');
        break;
      case 'embed':
        if (!this.props.id) {
          this._showBanner('embed-unavailable', BANNER_TIMEOUT_LONG);
          return;
        }
        Analytics.getInstance().logEvent('REQUESTED_EMBED');
        break;
    }
    this.setState({ currentModal: name });
  };

  _handleShowShortcuts = () => {
    this._handleShowModal('shortcuts');
  };

  _handleRemoveFile = (path: string) => {
    this._EditorComponent?.removePath(path);
  };

  _handleRenameFile = (oldPath: string, newPath: string) => {
    this._EditorComponent?.renamePath(oldPath, newPath);
  };

  _EditorComponent: any;

  _showErrorPanel = () =>
    this.props.setPreferences({
      panelType: 'errors',
    });

  _showDeviceLogs = () =>
    this.props.setPreferences({
      panelType: 'logs',
    });

  _togglePanels = (panelType?: PanelType) =>
    this.props.setPreferences({
      panelsShown: !this.props.preferences.panelsShown,
      panelType:
        panelType && !this.props.preferences.panelsShown
          ? panelType
          : this.props.preferences.panelType,
    });

  _toggleFileTree = () =>
    this.props.setPreferences({
      fileTreeShown: !this.props.preferences.fileTreeShown,
    });

  _changeConnectionMethod = (deviceConnectionMethod: ConnectionMethod) =>
    this.props.setPreferences({ deviceConnectionMethod });

  _toggleEditorMode = () => {
    const editorMode = this.props.preferences.editorMode === 'vim' ? 'normal' : 'vim';
    this.props.setPreferences({ editorMode });
    localStorage.setItem('editorMode', editorMode);
  };

  _toggleTheme = () => {
    const theme = this.props.preferences.theme === 'light' ? 'dark' : 'light';
    this.props.setPreferences({ theme });
    localStorage.setItem('theme', theme);
  };

  _toggleMarkdownPreview = () =>
    this.setState((state) => ({ isMarkdownPreview: !state.isMarkdownPreview }));

  _preventRedirectWarning = () =>
    this.setState({
      shouldPreventRedirectWarning: true,
    });

  _allowRedirectWarning = () =>
    this.setState({
      shouldPreventRedirectWarning: false,
    });

  render() {
    const { currentModal, currentBanner, lintAnnotations } = this.state;

    const {
      id,
      createdAt,
      experienceURL,
      experienceName,
      saveHistory,
      saveStatus,
      viewer,
      snackagerURL,
      files,
      selectedFile,
      dependencies,
      deviceId,
      isResolving,
      sendCodeOnChangeEnabled,
      sdkVersion,
      isLocalWebPreview,
      userAgent,
      connectedDevices,
      deviceLogs,
      onSendCode,
      onReloadSnack,
      onClearDeviceLogs,
      onChangePlatform,
      onToggleSendCode,
      onTogglePreview,
      uploadFileAsync,
      preferences,
      name,
      description,
      previewRef,
      previewURL,
      platform,
      platformOptions,
      previewShown,
      isDownloading,
    } = this.props;

    const annotations = lintAnnotations.length
      ? [...this.props.annotations, ...lintAnnotations]
      : this.props.annotations;

    return (
      <ContentShell>
        {this.state.loadedEditor ? null : <ProgressIndicator />}
        <PageMetadata name={name} description={description} id={id} />
        <PublishManager
          id={id}
          sdkVersion={sdkVersion}
          name={name}
          description={description}
          onSubmitMetadata={this.props.onSubmitMetadata}
          onPublishAsync={this.props.onPublishAsync}
          onShowModal={this._handleShowModal}
          onHideModal={this._handleHideModal}
          currentModal={currentModal}>
          {({ onPublishAsync }) => {
            return (
              <>
                <KeybindingsManager
                  bindings={Shortcuts}
                  onTrigger={(type) => {
                    const commands: { [key: string]: (() => void) | null } = {
                      save:
                        saveStatus === 'published'
                          ? null
                          : this.props.isResolving
                          ? null
                          : onPublishAsync,
                      tree: this._toggleFileTree,
                      panels: this._togglePanels,
                      format: this._prettier,
                      shortcuts: this._handleShowShortcuts,
                      update: onSendCode,
                    };

                    const fn = commands[type];

                    if (fn) {
                      fn();
                    }
                  }}
                />
                <EditorToolbar
                  name={name}
                  description={description}
                  createdAt={createdAt}
                  saveHistory={saveHistory}
                  saveStatus={saveStatus}
                  sdkVersion={sdkVersion}
                  viewer={viewer}
                  isDownloading={isDownloading}
                  isResolving={isResolving}
                  visibleModal={currentModal as EditorModal}
                  onShowModal={this._handleShowModal}
                  onHideModal={this._handleHideModal}
                  onSubmitMetadata={this.props.onSubmitMetadata}
                  onDownloadCode={this.props.onDownloadAsync}
                  onPublishAsync={onPublishAsync}
                />
                <div className={css(styles.editorAreaOuterWrapper)}>
                  <div className={css(styles.editorAreaOuter)}>
                    <LayoutShell>
                      <FileList
                        annotations={annotations}
                        visible={preferences.fileTreeShown}
                        files={files}
                        selectedFile={selectedFile}
                        updateFiles={this.props.updateFiles}
                        onSelectFile={this.props.onSelectFile}
                        onRemoveFile={this._handleRemoveFile}
                        onRenameFile={this._handleRenameFile}
                        uploadFileAsync={uploadFileAsync}
                        onDownloadCode={this.props.onDownloadAsync}
                        onShowModal={this._handleShowModal}
                        hasSnackId={!!id}
                        saveStatus={saveStatus}
                        sdkVersion={sdkVersion}
                      />
                      {/* Don't load it conditionally since we need the _EditorComponent object to be available */}
                      <LazyLoad
                        load={async (): Promise<{ default: React.ComponentType<EditorProps> }> => {
                          if (isMobile(userAgent)) {
                            // Monaco doesn't work great on mobile`
                            // Use simple editor for better experience
                            const editor = await import('./Editor/SimpleEditor');
                            this.setState({ loadedEditor: 'simple' });
                            return editor;
                          }

                          let timeout: any;

                          const MonacoEditorPromise = import(
                            /* webpackPreload: true */ './Editor/MonacoEditor'
                          ).then((editor) => ({ editor, type: 'monaco' }));

                          // Fallback to simple editor if monaco editor takes too long to load
                          const SimpleEditorPromise = new Promise((resolve, reject) => {
                            timeout = setTimeout(() => {
                              this._showBanner('slow-connection');

                              import('./Editor/SimpleEditor').then(resolve, reject);
                            }, EDITOR_LOAD_FALLBACK_TIMEOUT);
                          }).then((editor) => ({ editor, type: 'simple' }));

                          return Promise.race([
                            MonacoEditorPromise.catch(() => SimpleEditorPromise),
                            SimpleEditorPromise,
                          ]).then(({ editor, type }: any) => {
                            this.setState({ loadedEditor: type });

                            clearTimeout(timeout);

                            return editor;
                          });
                        }}>
                        {({ loaded, data: Comp }) => {
                          this._EditorComponent = Comp;
                          const file = files[selectedFile];
                          if (file) {
                            if (file.type === 'ASSET') {
                              return <AssetViewer selectedFile={selectedFile} files={files} />;
                            }

                            const { contents } = file;
                            const isMarkdown = selectedFile.endsWith('.md');

                            if (isMarkdown && this.state.isMarkdownPreview) {
                              return (
                                <>
                                  <LazyLoad load={() => import('./Markdown/MarkdownPreview')}>
                                    {({ loaded: mdLoaded, data: MarkdownPreview }) => {
                                      if (mdLoaded && MarkdownPreview) {
                                        return <MarkdownPreview source={contents} />;
                                      }

                                      return <EditorShell />;
                                    }}
                                  </LazyLoad>
                                  <button
                                    className={css(styles.previewToggle)}
                                    onClick={this._toggleMarkdownPreview}>
                                    <svg
                                      width="12px"
                                      height="12px"
                                      viewBox="0 0 18 18"
                                      className={css(styles.previewToggleIcon)}>
                                      <g transform="translate(-147.000000, -99.000000)">
                                        <g transform="translate(144.000000, 96.000000)">
                                          <path d="M3,17.25 L3,21 L6.75,21 L17.81,9.94 L14.06,6.19 L3,17.25 L3,17.25 Z M20.71,7.04 C21.1,6.65 21.1,6.02 20.71,5.63 L18.37,3.29 C17.98,2.9 17.35,2.9 16.96,3.29 L15.13,5.12 L18.88,8.87 L20.71,7.04 L20.71,7.04 Z" />
                                        </g>
                                      </g>
                                    </svg>
                                  </button>
                                </>
                              );
                            }

                            if (loaded && Comp) {
                              return (
                                <>
                                  <Comp
                                    dependencies={dependencies}
                                    sdkVersion={sdkVersion}
                                    selectedFile={selectedFile}
                                    files={files}
                                    autoFocus={!/Untitled file.*\.(js|tsx?)$/.test(selectedFile)}
                                    annotations={annotations}
                                    updateFiles={this.props.updateFiles}
                                    onSelectFile={this.props.onSelectFile}
                                    mode={preferences.editorMode}
                                    lineNumbers={isMobile(userAgent) ? 'off' : undefined}
                                  />
                                  {isMarkdown ? (
                                    <button
                                      className={css(styles.previewToggle)}
                                      onClick={this._toggleMarkdownPreview}>
                                      <svg
                                        width="16px"
                                        height="12px"
                                        viewBox="0 0 22 16"
                                        className={css(styles.previewToggleIcon)}>
                                        <g transform="translate(-145.000000, -1156.000000)">
                                          <g transform="translate(144.000000, 1152.000000)">
                                            <path d="M12,4.5 C7,4.5 2.73,7.61 1,12 C2.73,16.39 7,19.5 12,19.5 C17,19.5 21.27,16.39 23,12 C21.27,7.61 17,4.5 12,4.5 L12,4.5 Z M12,17 C9.24,17 7,14.76 7,12 C7,9.24 9.24,7 12,7 C14.76,7 17,9.24 17,12 C17,14.76 14.76,17 12,17 L12,17 Z M12,9 C10.34,9 9,10.34 9,12 C9,13.66 10.34,15 12,15 C13.66,15 15,13.66 15,12 C15,10.34 13.66,9 12,9 L12,9 Z" />
                                          </g>
                                        </g>
                                      </svg>
                                    </button>
                                  ) : null}
                                </>
                              );
                            }
                          } else {
                            return <NoFileSelected />;
                          }

                          return <EditorShell />;
                        }}
                      </LazyLoad>
                    </LayoutShell>
                    {preferences.panelsShown ? (
                      <EditorPanels
                        annotations={annotations}
                        deviceLogs={deviceLogs}
                        onShowErrorPanel={this._showErrorPanel}
                        onShowDeviceLogs={this._showDeviceLogs}
                        onTogglePanels={this._togglePanels}
                        onClearDeviceLogs={onClearDeviceLogs}
                        onSelectFile={this.props.onSelectFile}
                        panelType={preferences.panelType}
                      />
                    ) : null}
                  </div>
                  {previewShown ? (
                    <DevicePreview
                      className={css(styles.preview)}
                      width={334}
                      connectedDevices={connectedDevices}
                      deviceId={deviceId}
                      experienceURL={experienceURL}
                      experienceName={experienceName}
                      name={name}
                      onChangePlatform={onChangePlatform}
                      onShowModal={this._handleShowModal}
                      onReloadSnack={onReloadSnack}
                      onSendCode={onSendCode}
                      onToggleSendCode={onToggleSendCode}
                      platform={platform}
                      platformOptions={platformOptions}
                      previewRef={previewRef}
                      previewURL={previewURL}
                      sdkVersion={sdkVersion}
                      setDeviceId={this.props.setDeviceId}
                      sendCodeOnChangeEnabled={sendCodeOnChangeEnabled}
                    />
                  ) : null}
                </div>
                <EditorFooter
                  annotations={annotations}
                  connectedDevices={connectedDevices}
                  fileTreeShown={preferences.fileTreeShown}
                  previewShown={previewShown}
                  panelsShown={preferences.panelsShown}
                  editorMode={preferences.editorMode}
                  sendCodeOnChangeEnabled={sendCodeOnChangeEnabled}
                  sdkVersion={sdkVersion}
                  isLocalWebPreview={isLocalWebPreview}
                  onSendCode={onSendCode}
                  onReloadSnack={onReloadSnack}
                  onToggleTheme={this._toggleTheme}
                  onTogglePanels={this._togglePanels}
                  onToggleFileTree={this._toggleFileTree}
                  onTogglePreview={onTogglePreview}
                  onToggleSendCode={onToggleSendCode}
                  onToggleVimMode={
                    this.state.loadedEditor === 'monaco' ? this._toggleEditorMode : undefined
                  }
                  onChangeSDKVersion={this.props.onChangeSDKVersion}
                  onShowModal={this._handleShowModal}
                  onPrettifyCode={this._prettier}
                  theme={this.props.preferences.theme}
                />
                <DeviceInstructionsModal
                  visible={currentModal === 'device-instructions'}
                  onDismiss={this._handleHideModal}
                  onChangeMethod={this._changeConnectionMethod}
                  method={preferences.deviceConnectionMethod}
                  experienceURL={experienceURL}
                  isEmbedded={false}
                  setDeviceId={this.props.setDeviceId}
                  deviceId={deviceId}
                />
                <ModalDialog
                  className={css(styles.embedModal)}
                  autoSize={false}
                  visible={currentModal === 'embed'}
                  onDismiss={this._handleHideModal}>
                  <EmbedCode id={id} sdkVersion={sdkVersion} platformOptions={platformOptions} />
                </ModalDialog>
                <ModalDialog
                  visible={currentModal === 'previous-saves'}
                  title="Previous saves"
                  onDismiss={this._handleHideModal}>
                  <PreviousSaves saveHistory={saveHistory} />
                </ModalDialog>
                <ModalDialog
                  visible={currentModal === 'shortcuts'}
                  onDismiss={this._handleHideModal}>
                  <KeyboardShortcuts />
                </ModalDialog>
                <ImportRepoModal
                  visible={currentModal === 'import-repo'}
                  onHide={this._handleHideModal}
                  preventRedirectWarning={this._preventRedirectWarning}
                  snackagerURL={snackagerURL}
                />
                <ImportProductionModal
                  visible={currentModal === 'import-production'}
                  onHide={this._handleHideModal}
                  onSubmitMetadata={this.props.onSubmitMetadata}
                  onChangeSDKVersion={this.props.onChangeSDKVersion}
                  updateFiles={this.props.updateFiles}
                  updateDependencies={this.props.updateDependencies}
                />
                <Banner type="success" visible={currentBanner === 'connected'}>
                  Device connected!
                </Banner>
                <Banner type="error" visible={currentBanner === 'disconnected'}>
                  Device disconnected!
                </Banner>
                <Banner type="info" visible={currentBanner === 'autosave-disabled'}>
                  Automatic saving has been disabled in this Snack because you have it open in
                  another tab.
                </Banner>
                <Banner type="info" visible={currentBanner === 'sdk-upgraded'}>
                  This Snack was written in an older Expo version that is not longer supported. We
                  have upgraded the Expo version to {sdkVersion}.<br />
                  You might need to do some manual changes to make the Snack work correctly.
                </Banner>
                <Banner type="info" visible={currentBanner === 'sdk-downgraded'}>
                  The requested Expo version is not yet supported. We have downgraded the Expo
                  version to {sdkVersion}.<br />
                  You might need to do some manual changes to make the Snack work correctly.
                </Banner>
                <Banner type="info" visible={currentBanner === 'reconnect'}>
                  Please close and reopen Expo Go on your phone to see the Expo version change.
                </Banner>
                <Banner type="info" visible={currentBanner === 'slow-connection'}>
                  Slow network detected. Trying to load a basic version of the editor. Some features
                  such as linting and autocomplete may not work.
                </Banner>
                <Banner type="info" visible={currentBanner === 'embed-unavailable'}>
                  You need to save the Snack first to get an Embed code!
                </Banner>
              </>
            );
          }}
        </PublishManager>
      </ContentShell>
    );
  }
}

export default withPreferences(
  connect((state: any) => ({
    viewer: state.viewer,
  }))(withDependencyManager(EditorView))
);

const styles = StyleSheet.create({
  editorAreaOuter: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },

  editorAreaOuterWrapper: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    minWidth: 0,
  },

  embedModal: {
    minWidth: 0,
    minHeight: 0,
    maxWidth: 'calc(100% - 48px)',
    maxHeight: 'calc(100% - 48px)',
  },

  preview: {
    backgroundColor: c('content'),
    borderLeft: `1px solid ${c('border')}`,
  },

  previewToggle: {
    appearance: 'none',
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 32,
    padding: 12,
    height: 48,
    width: 48,
    border: 0,
    borderRadius: '50%',
    backgroundColor: c('secondary'),
    color: c('secondary-text'),
    outline: 0,
    transitionDuration: '170ms',
    transitionProperty: 'box-shadow',
    transitionTimingFunction: 'linear',

    ':focus-visible': {
      outline: 'auto',
    },

    ':hover': {
      boxShadow: s('small'),
    },
  },

  previewToggleIcon: {
    fill: 'currentColor',
    verticalAlign: -1,
  },
});
