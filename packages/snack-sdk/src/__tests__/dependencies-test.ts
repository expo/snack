import '../__mocks__/fetch';
import { SDKVersion } from 'snack-content';

import Snack from './snack-sdk';

// A set of SDK versions to test against.
// When upgrading SDK version, make sure to update this list.
const sdkVersions: { [key: string]: SDKVersion } = {
  prev: '44.0.0',
  current: '45.0.0',
  next: '46.0.0',
};

describe('dependencies', () => {
  it('resolves dependency', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      dependencies: {
        'expo-firebase-analytics': { version: '~6.0.0' },
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies).toMatchSnapshot();
  });

  it('resolves multiple dependencies', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      dependencies: {
        'expo-font': { version: '~10.0.4' },
        '@react-navigation/native': { version: '5.1.1' },
        'react-native-paper': { version: '3.10.1' },
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(3);
    expect(state.dependencies).toMatchSnapshot();
  });

  it('ignores resolved dependencies', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      dependencies: {
        'expo-firebase-analytics': {
          version: '8.1.0',
          handle: 'snackager-1/expo-firebase-analytics@8.1.0',
        },
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies).toMatchSnapshot();
  });

  it('does not resolve preloaded modules', async () => {
    const snack = new Snack({
      dependencies: {
        'expo-font': {
          version: '8.1.0',
        },
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies['expo-font'].handle).toBeUndefined();
  });

  it('adds dependencies', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
    });
    snack.updateDependencies({
      'expo-font': { version: '8.1.0' },
      '@react-navigation/native': { version: '5.1.1' },
      'react-native-paper': { version: '3.10.1' },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(3);
    expect(state.dependencies).toMatchSnapshot();
  });

  it('removes dependencies', async () => {
    const snack = new Snack({});
    snack.updateDependencies({
      'expo-font': { version: '8.1.0' },
      '@react-navigation/native': { version: '5.1.1' },
      'react-native-paper': { version: '3.10.1' },
    });
    snack.updateDependencies({
      'expo-font': null,
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(2);
    expect(state.dependencies).toMatchSnapshot();
  });

  it('loads peer dependencies', async () => {
    const snack = new Snack({});
    snack.updateDependencies({
      firestorter: { version: '2.0.1' },
    });
    const state = await snack.getStateAsync();
    expect(state.dependencies.firestorter.peerDependencies).toMatchSnapshot();
    expect(Object.keys(state.missingDependencies).length).toBe(1);
    expect(state.missingDependencies.mobx).toBeDefined();
    expect(state.missingDependencies).toMatchSnapshot();
  });

  it('fails on invalid dependency name', async () => {
    const snack = new Snack({});
    const name = '+-/.';
    snack.updateDependencies({
      [name]: { version: '1.0.0' },
    });
    const state = snack.getState();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeDefined();
    expect(state.dependencies[name].error).toMatchSnapshot();
  });

  it('fails on incomplete scoped names', async () => {
    const snack = new Snack({});
    const name = '@scopeonly';
    snack.updateDependencies({
      [name]: { version: '1.0.0' },
    });
    const state = snack.getState();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeDefined();
    expect(state.dependencies[name].error).toMatchSnapshot();
  });

  it('succeeds on dependency name with subpath', async () => {
    const snack = new Snack({});
    const name = 'react-native-gesture-handler/DrawerLayout';
    snack.updateDependencies({
      [name]: { version: '1.6.0' },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeUndefined();
    expect(state.dependencies).toMatchSnapshot();
  });

  it('succeeds on scoped dependency name with subpath', async () => {
    const snack = new Snack({});
    const name = '@expo/vector-icons/FontAwesome.ttf';
    snack.updateDependencies({
      [name]: { version: '1.6.0' },
    });
    const state = snack.getState();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeUndefined();
  });

  it('fails on invalid dependency version', async () => {
    const snack = new Snack({});
    const name = 'expo';
    snack.updateDependencies({
      [name]: { version: '-- 2 4' },
    });
    const state = snack.getState();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeDefined();
    expect(state.dependencies[name].error).toMatchSnapshot();
  });

  it('fails on unknown dependency', async () => {
    const snack = new Snack({});
    const name = 'dsfljdslfjkldsjdsjfkldsklfjkldsfjkldsfldsjfkldsklfjdklsdjskl__nevernienooit';
    snack.updateDependencies({
      [name]: { version: '1.0.0' },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeDefined();
  });

  it('retries when clearing error', async () => {
    const name = 'dsfljdslfjkldsjdsjfkldsklfjkldsfjkldsfldsjfkldsklfjdklsdjskl__nevernienooit';
    const snack = new Snack({
      dependencies: {
        [name]: { version: '1.0.0' },
      },
    });
    await snack.getStateAsync();
    snack.updateDependencies({
      [name]: { version: '1.0.0' },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.dependencies).length).toBe(1);
    expect(state.dependencies[name].error).toBeDefined();
  });

  it('resolves * for unlisted package', async () => {
    const snack = new Snack({});
    snack.updateDependencies({
      firestorter: { version: '*' },
    });
    const state = await snack.getStateAsync();
    expect(state.dependencies.firestorter.version).toBe('*');
    expect(state.dependencies.firestorter.wantedVersion).toBeUndefined();
    expect(state.dependencies.firestorter.handle).toBeDefined();
  });

  it('resolves * to wanted version', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
    });
    snack.updateDependencies({
      'expo-constants': { version: '*' },
    });
    const state = await snack.getStateAsync();
    expect(state.dependencies).toMatchSnapshot();
  });

  it('does not resolve * when disabled', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      disabled: true,
    });
    snack.updateDependencies({
      'expo-constants': { version: '*' },
    });
    const state = await snack.getStateAsync();
    expect(state.dependencies).toMatchSnapshot();
  });

  it('resolves * after enabling', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      disabled: true,
    });
    snack.updateDependencies({
      'expo-constants': { version: '*' },
    });
    await snack.getStateAsync();
    snack.setDisabled(false);
    const state = await snack.getStateAsync();
    expect(state.dependencies).toMatchSnapshot();
  });

  it('updates preloaded module version when changing SDK version', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      dependencies: { 'expo-av': { version: '*' } },
    });
    const state1 = await snack.getStateAsync();
    expect(state1.dependencies).toMatchSnapshot();
    snack.setSDKVersion(sdkVersions.next);
    const state2 = await snack.getStateAsync();
    expect(state2.dependencies).toMatchSnapshot();
    expect(state1).not.toMatchObject(state2);
  });

  it('reports missing peer dependencies', async () => {
    const snack = new Snack({
      sdkVersion: sdkVersions.current,
      dependencies: {
        '@react-navigation/stack': {
          handle: 'snackager-1/@react-navigation~stack@5.10.0',
          version: '^5.9.0',
          peerDependencies: {
            'react-native': '*',
            '@react-navigation/native': '5.0.6',
            'react-native-screens': '^2.0.0',
            'react-native-gesture-handler': '^1.0.0',
            'react-native-safe-area-context': '^0.6.0',
            '@react-native-community/masked-view': '^0.1.0',
          },
        },
        '@react-navigation/drawer': {
          handle: 'snackager-1/@react-navigation~drawer@5.10.0',
          version: '^5.9.0',
          peerDependencies: {
            'react-native': '*',
            '@react-navigation/native': '5.0.5',
            'react-native-screens': '^2.0.0',
            'react-native-reanimated': '^1.0.0',
            'react-native-gesture-handler': '^1.0.0',
            'react-native-safe-area-context': '^0.7.0',
          },
        },
      },
    });
    const state = await snack.getStateAsync();
    expect(state.missingDependencies).toMatchSnapshot();
  });
});
