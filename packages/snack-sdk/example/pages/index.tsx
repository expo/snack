import { diff } from 'deep-object-diff';
import QRCode from 'qrcode.react';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, css } from 'aphrodite';
import { Snack, getSupportedSDKVersions, SDKVersion } from 'snack-sdk';
import Head from 'next/head';

import createWorkerTransport from '../components/transports/createWorkerTransport';
import { Button } from '../components/Button';
import { Toolbar } from '../components/Toolbar';
import defaults from '../components/Defaults';

const INITIAL_CODE_CHANGES_DELAY = 500;
const VERBOSE = !!process.browser;
const USE_WORKERS = true;

export default function Home() {
  const webPreviewRef = useRef(null);
  const [snack] = useState(
    () =>
      new Snack({
        ...defaults,
        disabled: !process.browser,
        codeChangesDelay: INITIAL_CODE_CHANGES_DELAY,
        verbose: VERBOSE,
        webPreviewRef: process.browser ? webPreviewRef : undefined,
        // Optionally you can run the transports inside a web-worker.
        // Encoding data messages for large apps might take several milliseconds
        // and can cause stutter when executed often.
        ...(USE_WORKERS ? { createTransport: createWorkerTransport } : {}),
      })
  );
  const [snackState, setSnackState] = useState(snack.getState());
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [codeChangesDelay, setCodeChangesDelay] = useState(INITIAL_CODE_CHANGES_DELAY);
  const [isClientReady, setClientReady] = useState(false);

  // Listen for state changes and log messages
  useEffect(() => {
    const listeners = [
      snack.addStateListener((state, prevState) => {
        console.log('State changed: ', diff(prevState, state));
        setSnackState(state);
      }),
      snack.addLogListener(({ message }) => console.log(message)),
    ];
    if (process.browser) {
      setClientReady(true);
    }
    return () => listeners.forEach((listener) => listener());
  }, [snack]);

  const {
    files,
    url,
    deviceId,
    online,
    onlineName,
    connectedClients,
    name,
    description,
    sdkVersion,
    webPreviewURL,
  } = snackState;

  return (
    <div className={css(styles.container)}>
      <Head>
        <title>Snack SDK Example</title>
        <meta name="description" content="Snack SDK Example App" />
      </Head>
      <div className={css(styles.left)}>
        <Toolbar title="Code" />
        <textarea
          className={css(styles.code)}
          value={files['App.js'].contents as string}
          onChange={(event) =>
            snack.updateFiles({
              'App.js': {
                type: 'CODE',
                contents: event.target.value,
              },
            })
          }
        />
        <p>Open the Developer Console of your Browser to view logs.</p>
      </div>
      <div className={css(styles.preview)}>
        <Toolbar title="Preview" />
        <div className={css(styles.previewContainer)}>
          <iframe
            className={css(styles.previewFrame)}
            ref={(c) => (webPreviewRef.current = c?.contentWindow ?? null)}
            src={isClientReady ? webPreviewURL : undefined}
            allow="geolocation; camera; microphone"
          />
          {isClientReady && !webPreviewURL && (
            <div className={css(styles.previewNotSupported)}>
              <label>Set the SDK Version to 40.0.0 or higher to use Web preview</label>
            </div>
          )}
        </div>
      </div>
      <div className={css(styles.right)}>
        <div className={css(styles.settingsContainer)}>
          <Toolbar>
            <Button
              style={styles.button}
              label="Save"
              loading={isSaving}
              onClick={async () => {
                console.log('Saving...');
                setIsSaving(true);
                try {
                  const { id } = await snack.saveAsync();
                  console.log(`Saved with id ${id}`);
                } catch (err) {
                  console.error('Save failed', err);
                }
                setIsSaving(false);
              }}
            />
            <Button
              label="Download"
              loading={isDownloading}
              onClick={async () => {
                console.log('Getting download URL...');
                setIsDownloading(true);
                try {
                  const url = await snack.getDownloadURLAsync();
                  console.log(`Download URL: ${url}, starting download...`);
                } catch (err) {
                  console.error('Get download URL failed', err);
                }
                setIsDownloading(false);
              }}
            />
          </Toolbar>
          <div className={css(styles.settingsContent)}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => snack.setName(event.target.value)}
            />
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(event) => snack.setDescription(event.target.value)}
            />
            <label>SDK Version</label>
            <select
              value={sdkVersion}
              onChange={(event) => snack.setSDKVersion(event.target.value as SDKVersion)}>
              {getSupportedSDKVersions().map((ver) => (
                <option key={ver} value={ver}>
                  {ver}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={css(styles.onlineContainer)}>
          <Toolbar title="Connections">
            <Button
              label={online ? 'Go Offline' : 'Go Online'}
              onClick={() => snack.setOnline(!online)}
            />
          </Toolbar>
          <div className={css(styles.onlineContent)}>
            <label>Device Id</label>
            <input
              type="text"
              placeholder="xxxx-xxxx"
              value={deviceId}
              onChange={(event) => snack.setDeviceId(event.target.value)}
            />
            <label>Send Code changes automatically</label>
            <select
              value={codeChangesDelay}
              onChange={(event) => {
                snack.setCodeChangesDelay(Number(event.target.value));
                setCodeChangesDelay(Number(event.target.value));
              }}>
              <option value={-1}>Disabled (-1)</option>
              <option value={0}>Immediately (0)</option>
              <option value={500}>Debounced (after 500ms)</option>
            </select>
            {codeChangesDelay === -1 ? (
              <Button label="Send Code changes" onClick={() => snack.sendCodeChanges()} />
            ) : undefined}
            <label>{`Status: ${online ? 'Online' : 'Offline'}`}</label>
            {online ? <QRCode className={css(styles.qrcode)} value={url} /> : undefined}
            {online ? <a href={url}>{url}</a> : undefined}
            {online ? <label>{`Online name: ${onlineName}`}</label> : undefined}
            {online ? (
              <label>{`${Object.keys(connectedClients).length} connected client(s)`}</label>
            ) : undefined}
          </div>
        </div>
      </div>
    </div>
  );
}

const sharedStyles = {
  pane: {
    border: '1px solid #DDDDE1',
    borderRadius: 4,
  },
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    paddingTop: 14,
  },
  left: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    width: 300,
    marginLeft: 20,
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 20,
    width: 240,
  },
  previewContainer: {
    flex: 1,
    ...sharedStyles.pane,
    position: 'relative',
    overflow: 'hidden',
  },
  previewFrame: {
    position: 'relative',
    width: '100%',
    height: '100%',
    border: 0,
    backgroundColor: 'white',
  },
  previewNotSupported: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 20,
    bottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  code: {
    display: 'flex',
    flex: 1,
    ...sharedStyles.pane,
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  settingsContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: 20,
    ...sharedStyles.pane,
  },
  onlineContainer: {
    display: 'flex',
    flex: 1,
    marginTop: 20,
    flexDirection: 'column',
  },
  onlineContent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    padding: 20,
    ...sharedStyles.pane,
  },
  qrcode: {
    width: 260,
    height: 260,
    marginBottom: 20,
  },
  offline: {
    flex: 1,
    alignSelf: 'center',
    opacity: 0.5,
  },
  button: {
    marginRight: 10,
  },
});
