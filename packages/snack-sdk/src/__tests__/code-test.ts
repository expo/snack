/* eslint @typescript-eslint/no-unused-vars: 0 */
import formData from 'form-data';

import '../__mocks__/fetch';
import PubNub from '../__mocks__/pubnub';
import { ProtocolErrorMessage, ProtocolResendCodeMessage } from '../transports/Protocol';
import Snack, { SnackFile } from './snack-sdk';

const TEST_FILES: { [path: string]: SnackFile } = {
  'app.js': {
    type: 'CODE',
    contents: 'hoi',
  },
};

function createAsset(name: string, contents: string, corrupt?: boolean): FormData {
  const FD = new formData();
  FD.append(corrupt ? 'something else' : 'asset', contents, name);
  return FD as any;
}

beforeEach(() => {
  PubNub.instances = [];
});

describe('code', () => {
  it('receives code update on connect', async () => {
    // @ts-ignore
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    expect(pubnub.publishes[0].message.type).toBe('CODE');
  });

  it('receives new code update', async () => {
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    snack.updateFiles(TEST_FILES);
    expect(pubnub.publishes).toHaveLength(2);
  });

  it('debounces code updates', async () => {
    const snack = new Snack({
      online: true,
      codeChangesDelay: 40,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    snack.updateFiles(TEST_FILES);
    expect(pubnub.publishes).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(pubnub.publishes).toHaveLength(2);
    expect(pubnub.publishes[1].message.type).toBe('CODE');
  });

  it('does not debounce first code update', async () => {
    // @ts-ignore
    const snack = new Snack({
      online: true,
      codeChangesDelay: 100,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    expect(pubnub.publishes[0].message.type).toBe('CODE');
  });

  it('turns of code updates (except for first)', async () => {
    const snack = new Snack({ online: true, codeChangesDelay: -1 });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    snack.updateFiles(TEST_FILES);
    expect(pubnub.publishes).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(pubnub.publishes).toHaveLength(1);
  });

  it('triggers code update when calling sendCodeChanges', async () => {
    const snack = new Snack({ online: true, codeChangesDelay: 1000 });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    snack.updateFiles(TEST_FILES);
    expect(pubnub.publishes).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(pubnub.publishes).toHaveLength(1);
    snack.sendCodeChanges();
    expect(pubnub.publishes).toHaveLength(2);
  });

  it('doesnt receive code when no clients are connected', async () => {
    // @ts-ignore
    const snack = new Snack({ online: true });
    const pubnub = PubNub.instances[0];
    expect(pubnub.publishes).toHaveLength(0);
  });

  it('doesnt receive code update when code is unchanged', async () => {
    const snack = new Snack({
      online: true,
      files: TEST_FILES,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    snack.updateFiles(TEST_FILES);
    expect(pubnub.publishes).toHaveLength(1);
  });

  it('receives empty code diff', async () => {
    // @ts-ignore
    const snack = new Snack({
      online: true,
      files: {},
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    const { message } = pubnub.publishes[0];
    expect(message.diff).toMatchObject({});
  });

  it('receives valid code diff', async () => {
    // @ts-ignore
    const snack = new Snack({
      online: true,
      files: TEST_FILES,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    const { message } = pubnub.publishes[0];
    expect(message.diff['app.js'].length).toBeGreaterThanOrEqual(20);
    expect(message.diff).toMatchSnapshot();
  });

  it('receives valid dependencies', async () => {
    // @ts-ignore
    const snack = new Snack({
      online: true,
      dependencies: {
        'expo-firebase-analytics': {
          version: '~8.1.0',
          handle: 'snackager-1/expo-font@8.1.1',
          peerDependencies: {
            expo: '*',
          },
        },
      },
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    const { message } = pubnub.publishes[0];
    expect(Object.keys(message.dependencies)).toHaveLength(1);
    expect(message.dependencies['expo-firebase-analytics']).toBeDefined();
    expect(message.dependencies['expo-firebase-analytics'].peerDependencies).toBeUndefined();
    expect(message.dependencies).toMatchSnapshot();
  });

  it('does not receive preloaded dependencies', async () => {
    // @ts-ignore
    const snack = new Snack({
      online: true,
      dependencies: {
        'expo-font': {
          version: '~8.1.0',
          handle: 'snackager-1/expo-font@8.1.1',
          peerDependencies: {
            expo: '*',
          },
        },
      },
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    const { message } = pubnub.publishes[0];
    expect(Object.keys(message.dependencies)).toHaveLength(0);
  });

  it('doesnt receive code update when dependencies are unchanged', async () => {
    const dependencies = {
      'expo-firebase-analytics': {
        version: '~2.4.0',
        handle: 'snackager-1/expo-firebase-analytics@2.4.1',
      },
    };
    const snack = new Snack({ online: true, dependencies });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    snack.updateDependencies(dependencies);
    expect(pubnub.publishes).toHaveLength(1);
  });

  it('only sends code update after all dependencies are resolved ', async () => {
    const snack = new Snack({
      online: true,
      dependencies: {
        'expo-font': { version: '8.1.0' },
        '@react-navigation/native': { version: '5.1.1' },
        'react-native-paper': { version: '3.10.1' },
      },
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(0);
    await snack.getStateAsync();
    expect(pubnub.publishes).toHaveLength(1);
    expect(pubnub.publishes[0].message.type).toBe('CODE');
  });

  it('only sends code update after all assets have been uploaded', async () => {
    const snack = new Snack({
      online: true,
      files: {
        'assets/logo': {
          type: 'ASSET',
          contents: createAsset('logo.png', 'hoi'),
        },
      },
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(0);
    await snack.getStateAsync();
    expect(pubnub.publishes).toHaveLength(1);
    expect(pubnub.publishes[0].message.type).toBe('CODE');
  });

  it('handles received error after code update', async () => {
    const snack = new Snack({
      online: true,
      files: TEST_FILES,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);
    const connectedClientIds = Object.keys(snack.getState().connectedClients);
    expect(connectedClientIds).toHaveLength(1);
    expect(snack.getState().connectedClients[connectedClientIds[0]].error).toBeUndefined();

    const errorMessage: ProtocolErrorMessage = {
      type: 'ERROR',
      error: '{"message": "something went wrong"}',
      device: PubNub.devices.ios,
    };
    pubnub.sendMessage(errorMessage);
    expect(snack.getState().connectedClients[connectedClientIds[0]].error).toBeDefined();
  });

  it('handles re-send code request', async () => {
    // @ts-ignore
    const snack = new Snack({
      online: true,
      files: TEST_FILES,
    });
    const pubnub = PubNub.instances[0];
    pubnub.connect();
    expect(pubnub.publishes).toHaveLength(1);

    const resendCodeMessage: ProtocolResendCodeMessage = {
      type: 'RESEND_CODE',
      device: PubNub.devices.ios,
    };
    pubnub.sendMessage(resendCodeMessage);
    expect(pubnub.publishes).toHaveLength(2);
    expect(pubnub.publishes[1].message.type).toBe('CODE');
  });
});
