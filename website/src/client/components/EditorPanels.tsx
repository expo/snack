import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { DeviceLog, Annotation } from '../types';
import EditorPanelLogs from './EditorPanelLogs';
import type { PanelType } from './Preferences/PreferencesProvider';
import ProblemsPanel from './ProblemsPanel';
import { c } from './ThemeProvider';
import ResizablePane from './shared/ResizablePane';

type Props = {
  annotations: Annotation[];
  deviceLogs: DeviceLog[];
  onSelectFile: (path: string) => void;
  onShowErrorPanel: () => void;
  onShowDeviceLogs: () => void;
  onTogglePanels: (panelType?: PanelType) => void;
  onClearDeviceLogs: () => void;
  panelType: 'errors' | 'logs';
};

export default class EditorPanels extends React.Component<Props> {
  getSnapshotBeforeUpdate(prevProps: Props) {
    if (this.props.deviceLogs !== prevProps.deviceLogs && this._panel.current) {
      this._isScrolled =
        this._panel.current.scrollHeight - this._panel.current.clientHeight !==
        this._panel.current.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.deviceLogs !== prevProps.deviceLogs &&
      this._panel.current &&
      !this._isScrolled
    ) {
      this._panel.current.scrollTop =
        this._panel.current.scrollHeight - this._panel.current.clientHeight;
    }
  }

  _isScrolled: boolean = false;
  _panel = React.createRef<HTMLDivElement>();

  render() {
    const {
      annotations,
      deviceLogs,
      onSelectFile,
      onShowErrorPanel,
      onShowDeviceLogs,
      onTogglePanels,
      onClearDeviceLogs,
      panelType,
    } = this.props;
    return (
      <ResizablePane direction="vertical" className={css(styles.container)}>
        <div className={css(styles.panels)}>
          <div className={css(styles.header)}>
            <button
              onClick={onShowErrorPanel}
              className={css(styles.tab, panelType !== 'errors' && styles.inactive)}>
              Problems
            </button>
            <button
              onClick={onShowDeviceLogs}
              className={css(styles.tab, panelType !== 'logs' && styles.inactive)}>
              Logs
            </button>
            <div className={css(styles.buttons)}>
              {panelType === 'logs' ? (
                <button onClick={onClearDeviceLogs} className={css(styles.button, styles.clear)} />
              ) : null}
              <button
                onClick={() => onTogglePanels()}
                className={css(styles.button, styles.close)}
              />
            </div>
          </div>
          <div ref={this._panel} className={css(styles.panel)}>
            {panelType === 'errors' ? (
              <ProblemsPanel annotations={annotations} onSelectFile={onSelectFile} />
            ) : null}
            {panelType === 'logs' ? <EditorPanelLogs deviceLogs={deviceLogs} /> : null}
          </div>
        </div>
      </ResizablePane>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: '14em',
  },

  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: '.75em',
  },

  tab: {
    display: 'inline-block',
    appearance: 'none',
    background: 'none',
    border: 'none',
    margin: 0,
    padding: '.35em 1.5em',
    fontSize: '.9em',
    textTransform: 'uppercase',
    outline: 'none',
    opacity: 1,
  },

  inactive: {
    opacity: 0.5,
  },

  buttons: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    margin: '0 1em',
  },

  button: {
    height: 24,
    width: 24,
    border: 0,
    outline: 0,
    margin: '0 .5em',
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },

  close: {
    backgroundImage: `url(${require('../assets/cross.png')})`,
  },

  clear: {
    backgroundImage: `url(${require('../assets/clear.png')})`,
  },

  panels: {
    backgroundColor: c('content'),
    borderTop: `1px solid ${c('border-editor')}`,
    height: '100%',
    minHeight: 0,
  },

  panel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    padding: '.5em 0 .75em 0',
    overflow: 'auto',
    height: 'calc(100% - 2.5em)',
  },
});
