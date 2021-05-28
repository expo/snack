import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import constants from '../configs/constants';
import { Device, Annotation, SDKVersion } from '../types';
import type { EditorModal } from './EditorViewProps';
import { Shortcuts } from './KeyboardShortcuts';
import type { PanelType } from './Preferences/PreferencesProvider';
import SDKVersionSwitcher from './SDKVersionSwitcher';
import FooterShell from './Shell/FooterShell';
import { c } from './ThemeProvider';
import FooterButton from './shared/FooterButton';
import IconButton from './shared/IconButton';
import LoadingText from './shared/LoadingText';
import MenuButton from './shared/MenuButton';
import ShortcutLabel from './shared/ShortcutLabel';
import ToggleSwitch from './shared/ToggleSwitch';

type Props = {
  annotations: Annotation[];
  connectedDevices: Device[];
  fileTreeShown: boolean;
  editorMode: 'vim' | 'normal';
  previewShown: boolean;
  panelsShown: boolean;
  sendCodeOnChangeEnabled: boolean;
  sdkVersion: SDKVersion;
  isLocalWebPreview: boolean;
  onToggleTheme: () => void;
  onTogglePanels: (panelType?: PanelType) => void;
  onToggleFileTree: () => void;
  onTogglePreview: () => void;
  onToggleSendCode: () => void;
  onToggleVimMode?: () => void;
  onChangeSDKVersion: (sdkVersion: SDKVersion, isLocalWebPreview?: boolean) => void;
  onShowModal: (modal: EditorModal) => void;
  onPrettifyCode: () => void;
  onSendCode: () => void;
  onReloadSnack: () => void;
  theme: string;
};

export default function EditorFooter(props: Props) {
  const {
    annotations,
    connectedDevices,
    fileTreeShown,
    previewShown,
    panelsShown,
    sendCodeOnChangeEnabled,
    editorMode,
    sdkVersion,
    isLocalWebPreview,
    onSendCode,
    onReloadSnack,
    onToggleTheme,
    onTogglePanels,
    onToggleFileTree,
    onTogglePreview,
    onToggleSendCode,
    onToggleVimMode,
    onChangeSDKVersion,
    onShowModal,
    onPrettifyCode,
    theme,
  } = props;

  const appText = connectedDevices.length > 1 ? 'apps' : 'app';
  const deviceText = connectedDevices.length > 1 ? 'devices' : 'device';

  const loadingItems = annotations.filter((a) => a.severity < 0);
  const isLoading = loadingItems.length >= 1;
  const isErrorFatal = !isLoading && annotations.some((a) => a.severity > 3);
  const warningCount = annotations.filter((a) => a.severity === 2).length;
  let text: any;
  if (isLoading) {
    text = isLoading
      ? `${loadingItems[0].message}${
          loadingItems.length > 1 ? ` (+${loadingItems.length - 1} more)` : ''
        }`
      : '';
  } else {
    const errors = annotations.filter((a) => a.severity >= 3);
    if (errors.length) {
      const { message, location, action } = errors[0];
      const prefix = location
        ? `${location.fileName} (${location.startLineNumber}:${location.startColumn}) `
        : '';
      const suffix = action ? (
        <span
          className={css(styles.action)}
          onClick={(event) => {
            event.stopPropagation();
            action.run();
          }}>
          {action.title}
        </span>
      ) : errors.length > 1 ? (
        `(+${errors.length - 1} more)`
      ) : (
        ''
      );
      text = (
        <span>
          {prefix}
          {message.split('\n')[0] + ' '}
          {suffix}
        </span>
      );
    }
  }

  return (
    <FooterShell type={isLoading ? 'loading' : isErrorFatal ? 'error' : null}>
      <div className={css(styles.left)}>
        {isLoading ? (
          <LoadingText className={css(styles.loadingText)} onClick={() => onTogglePanels('errors')}>
            {text}
          </LoadingText>
        ) : (
          <button
            onClick={() => onTogglePanels(text ? 'errors' : undefined)}
            className={css(
              styles.statusText,
              text ? (isErrorFatal ? styles.errorTextFatal : styles.errorText) : styles.successText
            )}>
            {text ??
              `No errors${
                warningCount ? `, ${warningCount} warning${warningCount > 1 ? 's' : ''}` : ''
              }`}
          </button>
        )}
      </div>
      <FooterButton icon={require('../assets/prettify-icon.png')} onClick={onPrettifyCode}>
        <span className={css(styles.buttonLabel)}>Prettier</span>
      </FooterButton>
      <MenuButton
        icon={require('../assets/settings-icon.png')}
        label={<span className={css(styles.buttonLabel)}>Editor</span>}
        content={
          <>
            <div
              className={css(styles.buttonItem, styles.buttonItemEditorPane)}
              onClick={() => onShowModal('shortcuts')}>
              <IconButton small title="Show keyboard shortcuts" label="Shortcuts" />
              <ShortcutLabel
                combo={Shortcuts.shortcuts.combo}
                className={css(styles.buttonItemShortcut)}
              />
            </div>
            <div className={css(styles.menuSeparator)} />
            <ToggleSwitch checked={fileTreeShown} onChange={onToggleFileTree} label="Files" />
            <ToggleSwitch checked={panelsShown} onChange={() => onTogglePanels()} label="Panel" />
            <ToggleSwitch checked={theme !== 'light'} onChange={onToggleTheme} label="Dark theme" />
            {onToggleVimMode ? (
              <ToggleSwitch
                checked={editorMode === 'vim'}
                onChange={onToggleVimMode}
                label="Vim mode"
              />
            ) : null}
          </>
        }
      />
      <SDKVersionSwitcher
        sdkVersion={sdkVersion}
        isLocalWebPreview={isLocalWebPreview}
        onChange={onChangeSDKVersion}
        selectClassName={(isErrorFatal && css(styles.errorBorder)) || undefined}
      />
      <MenuButton
        label={
          <>
            <span className={css(styles.buttonLabel)}>Devices</span>
            <span className={css(styles.devicesCount)}>{connectedDevices.length}</span>
          </>
        }
        content={
          <div className={css(styles.devicePane)}>
            {connectedDevices.length ? (
              <>
                <div className={css(styles.devicePaneItem)}>
                  <ToggleSwitch
                    checked={sendCodeOnChangeEnabled}
                    onChange={onToggleSendCode}
                    label="Update as you type"
                  />
                </div>
                <div className={css(styles.buttonItem)}>
                  <IconButton
                    small
                    title={`Update changes on connected ${deviceText}`}
                    label="Update now"
                    onClick={onSendCode}>
                    <svg width="14px" height="17px" viewBox="0 0 14 17">
                      <path
                        transform="translate(-5.000000, -3.000000)"
                        d="M9,16 L15,16 L15,10 L19,10 L12,3 L5,10 L9,10 L9,16 Z M5,18 L19,18 L19,20 L5,20 L5,18 Z"
                      />
                    </svg>
                  </IconButton>
                  <ShortcutLabel combo={Shortcuts.update.combo} />
                </div>
                <div className={css(styles.buttonItem)}>
                  <IconButton
                    small
                    title={`Reload ${appText} on connected ${deviceText}`}
                    label={`Reload ${appText}`}
                    onClick={onReloadSnack}>
                    <svg width="16px" height="20px" viewBox="0 0 16 20">
                      <path d="M8,3.5 L8,0 L3,5 L8,10 L8,5.5 C11.314,5.5 14,8.186 14,11.5 C14,14.814 11.314,17.5 8,17.5 C4.686,17.5 2,14.814 2,11.5 L0,11.5 C0,15.918 3.582,19.5 8,19.5 C12.418,19.5 16,15.918 16,11.5 C16,7.082 12.418,3.5 8,3.5" />
                    </svg>
                  </IconButton>
                </div>
                <h4 className={css(styles.title)}>Connected devices</h4>
                {connectedDevices.map((device) => (
                  <div key={device.id} className={css(styles.deviceLabel)}>
                    {device.platform === 'android' ? (
                      <svg
                        className={css(styles.deviceIcon)}
                        width="16px"
                        height="20px"
                        viewBox="0 0 16 20">
                        <path
                          transform="translate(-16.000000, -146.000000)"
                          d="M19.2,160.325197 C19.2,160.762881 19.56,161.120986 20,161.120986 L20.8,161.120986 L20.8,163.906247 C20.8,164.566752 21.336,165.099931 22,165.099931 C22.664,165.099931 23.2,164.566752 23.2,163.906247 L23.2,161.120986 L24.8,161.120986 L24.8,163.906247 C24.8,164.566752 25.336,165.099931 26,165.099931 C26.664,165.099931 27.2,164.566752 27.2,163.906247 L27.2,161.120986 L28,161.120986 C28.44,161.120986 28.8,160.762881 28.8,160.325197 L28.8,152.367307 L19.2,152.367307 L19.2,160.325197 L19.2,160.325197 Z M17.2,152.367307 C16.536,152.367307 16,152.900485 16,153.56099 L16,159.131513 C16,159.792018 16.536,160.325197 17.2,160.325197 C17.864,160.325197 18.4,159.792018 18.4,159.131513 L18.4,153.56099 C18.4,152.900485 17.864,152.367307 17.2,152.367307 L17.2,152.367307 Z M30.8,152.367307 C30.136,152.367307 29.6,152.900485 29.6,153.56099 L29.6,159.131513 C29.6,159.792018 30.136,160.325197 30.8,160.325197 C31.464,160.325197 32,159.792018 32,159.131513 L32,153.56099 C32,152.900485 31.464,152.367307 30.8,152.367307 L30.8,152.367307 Z M26.824,147.719899 L27.868,146.681394 C28.024,146.526215 28.024,146.275542 27.868,146.120363 C27.712,145.965184 27.46,145.965184 27.304,146.120363 L26.12,147.294152 C25.48,146.979815 24.764,146.796784 24,146.796784 C23.232,146.796784 22.512,146.979815 21.868,147.298131 L20.68,146.116384 C20.524,145.961205 20.272,145.961205 20.116,146.116384 C19.96,146.271563 19.96,146.522237 20.116,146.677415 L21.164,147.719899 C19.976,148.591288 19.2,149.991877 19.2,151.571518 L28.8,151.571518 C28.8,149.987898 28.02,148.587309 26.824,147.719899 L26.824,147.719899 Z M26,149.978945 C26.2209139,149.978945 26.4,149.800802 26.4,149.581051 C26.4,149.361299 26.2209139,149.183156 26,149.183156 C25.7790861,149.183156 25.6,149.361299 25.6,149.581051 C25.6,149.800802 25.7790861,149.978945 26,149.978945 Z M22,149.978945 C22.2209139,149.978945 22.4,149.800802 22.4,149.581051 C22.4,149.361299 22.2209139,149.183156 22,149.183156 C21.7790861,149.183156 21.6,149.361299 21.6,149.581051 C21.6,149.800802 21.7790861,149.978945 22,149.978945 Z"
                        />
                      </svg>
                    ) : device.platform === 'ios' ? (
                      <svg
                        className={css(styles.deviceIcon)}
                        width="16px"
                        height="16px"
                        viewBox="0 0 16 16">
                        <path d="M5,0 L11,0 C13.7614237,-5.07265313e-16 16,2.23857625 16,5 L16,11 C16,13.7614237 13.7614237,16 11,16 L5,16 C2.23857625,16 3.38176876e-16,13.7614237 0,11 L0,5 C-3.38176876e-16,2.23857625 2.23857625,5.07265313e-16 5,0 Z M2.79296875,11 L3.5,11 L3.5,6.890625 L2.79296875,6.890625 L2.79296875,11 Z M2.64453125,5.625 C2.64453125,5.90625 2.859375,6.11328125 3.140625,6.11328125 C3.4375,6.11328125 3.65234375,5.90625 3.65234375,5.625 C3.65234375,5.33984375 3.4375,5.1328125 3.140625,5.1328125 C2.859375,5.1328125 2.64453125,5.33984375 2.64453125,5.625 Z M9.20385423,8.71875 L9.20385423,7.94921875 C9.20385423,6.4375 8.36401048,5.55859375 7.05541673,5.55859375 C5.74682298,5.55859375 4.90697923,6.43359375 4.90697923,7.94921875 L4.90697923,8.71875 C4.90697923,10.2304688 5.74682298,11.109375 7.05541673,11.109375 C8.36401048,11.109375 9.20385423,10.2304688 9.20385423,8.71875 Z M10.1616147,9.64453125 C10.2358335,10.5039062 10.962396,11.109375 12.0913022,11.109375 C13.321771,11.109375 14.0913022,10.4726562 14.0913022,9.50390625 C14.0913022,8.7265625 13.634271,8.2890625 12.7006772,8.046875 L11.790521,7.80859375 C11.3022397,7.6875 11.040521,7.4296875 11.040521,7.0546875 C11.040521,6.53515625 11.4897397,6.1796875 12.1616147,6.1796875 C12.7827085,6.1796875 13.2045835,6.4765625 13.3022397,6.9453125 L14.024896,6.9453125 C13.9428647,6.1328125 13.228021,5.54296875 12.1733335,5.54296875 C11.087396,5.54296875 10.3100522,6.18359375 10.3100522,7.08984375 C10.3100522,7.8046875 10.7709897,8.29296875 11.571771,8.5 L12.4975522,8.73828125 C13.0952085,8.890625 13.3647397,9.13671875 13.3647397,9.5625 C13.3647397,10.1171875 12.9077085,10.4726562 12.165521,10.4726562 C11.4702085,10.4726562 10.9897397,10.1484375 10.8881772,9.64453125 L10.1616147,9.64453125 Z M8.48119798,7.94921875 L8.48119798,8.72265625 C8.48119798,9.89453125 7.86401048,10.4648438 7.05541673,10.4648438 C6.24291673,10.4648438 5.62963548,9.89453125 5.62963548,8.72265625 L5.62963548,7.94921875 C5.62963548,6.7734375 6.24291673,6.203125 7.05541673,6.203125 C7.86401048,6.203125 8.48119798,6.7734375 8.48119798,7.94921875 Z" />
                      </svg>
                    ) : (
                      <svg
                        width="18px"
                        height="18px"
                        viewBox="0 0 18 18"
                        className={css(styles.deviceIcon)}
                        style={{ stroke: 'currentColor' }}>
                        <g strokeWidth="1" fill="none">
                          <circle cx="9" cy="9" r="8" />
                          <rect x="2" y="11" width="14" height="0.5" />
                          <rect x="2" y="6" width="14" height="0.5" />
                          <ellipse cx="9" cy="9" rx="3" ry="8" />
                        </g>
                      </svg>
                    )}
                    {device.name}
                  </div>
                ))}
              </>
            ) : (
              <div className={css(styles.noDevicesMessage)}>No devices connected</div>
            )}
          </div>
        }
      />
      <div className={css(styles.devicePreviewSwitch)}>
        <ToggleSwitch checked={previewShown} onChange={onTogglePreview} label="Preview" />
      </div>
    </FooterShell>
  );
}

const styles = StyleSheet.create({
  left: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },

  loadingText: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '.5em',
    width: '100%',
    cursor: 'pointer',
  },

  statusText: {
    border: 0,
    outline: 0,
    margin: 0,
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '1em center',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '.25em .5em .25em 3em',
    minWidth: 200,
    width: '100%',
    textAlign: 'left',
  },

  successText: {
    backgroundImage: `url(${require('../assets/checkmark.png')})`,
  },

  errorText: {
    backgroundImage: `url(${require('../assets/cross-red.png')})`,
    color: c('error'),
  },

  errorTextFatal: {
    backgroundImage: `url(${require('../assets/cross-light.png')})`,
  },

  errorBorder: {
    borderColor: c('error-text'),
  },

  devicesCount: {
    position: 'absolute',
    top: 4,
    right: 6,
    height: 20,
    minWidth: 20,
    borderRadius: '50%',
    backgroundColor: c('text'),
    color: c('background'),
    opacity: 0.5,
  },

  devicePane: {
    padding: '0 16px',
  },

  devicePaneItem: {
    margin: '0 -16px',
  },

  deviceLabel: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    padding: '8px 0',
  },

  deviceIcon: {
    height: 16,
    width: 16,
    marginRight: 8,
    fill: 'currentColor',
  },

  noDevicesMessage: {
    whiteSpace: 'nowrap',
    margin: 8,
  },

  buttonLabel: {
    display: 'none',

    [`@media (min-width: ${constants.preview.minWidth + 20}px)`]: {
      display: 'inline',
    },
  },

  buttonItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  buttonItemShortcut: {
    userSelect: 'none',
    cursor: 'pointer',
    marginLeft: 12,
  },

  buttonItemEditorPane: {
    margin: '0 12px',
  },

  title: {
    margin: '16px 0 8px',
  },

  action: {
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: 'bold',
  },

  devicePreviewSwitch: {
    display: 'none',

    [`@media (min-width: ${constants.preview.minWidth}px)`]: {
      display: 'block',
    },
  },

  menuSeparator: {
    margin: '6px 0',
    borderBottom: `1px solid ${c('border')}`,
  },
});
