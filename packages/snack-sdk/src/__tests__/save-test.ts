import fetch from '../__mocks__/fetch';
import Snack from './snack-sdk';

describe('save', () => {
  it('is saved initially', async () => {
    const snack = new Snack({});
    expect(snack.getState().unsaved).toBe(false);
  });

  it('changes the saved status after changing files', async () => {
    const snack = new Snack({});
    snack.updateFiles({
      'App.js': {
        type: 'CODE',
        contents: `console.log('hello world');`,
      },
    });
    expect(snack.getState().unsaved).toBe(true);
  });

  it('changes the saved status after changing dependencies', async () => {
    const snack = new Snack({});
    snack.updateDependencies({
      'expo-font': {
        version: '8.1.0',
        handle: 'snackager-1/expo-font@8.1.0',
      },
    });
    expect(snack.getState().unsaved).toBe(true);
  });

  it('has no id initially', async () => {
    const snack = new Snack({});
    expect(snack.getState().id).toBeUndefined();
    expect(snack.getState().saveURL).toBeUndefined();
  });

  it('can be provided an id initially', async () => {
    const snack = new Snack({
      id: 'myawesomeid',
    });
    expect(snack.getState().id).toBe('myawesomeid');
    expect(snack.getState().saveURL).toBeDefined();
  });

  it('saveURL equals url when id is provided', async () => {
    const snack = new Snack({
      id: 'myawesomeid',
      online: true,
      channel: '3V353a70WJ',
    });
    expect(snack.getState().id).toBe('myawesomeid');
    expect(snack.getState().saveURL).toBeDefined();
    expect(snack.getState().url).toBe(`${snack.getState().saveURL}+3V353a70WJ`);
    snack.setOnline(false);
  });

  it('saves successfully', async () => {
    const snack = new Snack({
      online: true,
      files: {
        'App.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    const { url } = snack.getState();
    const result = await snack.saveAsync();
    expect(result.id.length).toBeGreaterThanOrEqual(3);
    expect(result.url.length).toBeGreaterThanOrEqual(3);
    expect(snack.getState().unsaved).toBe(false);
    expect(snack.getState().url).not.toBe(url);
    expect(snack.getState().saveURL).toBeDefined();
    snack.setOnline(false);
  });

  it('saves successfully (App.tsx)', async () => {
    const snack = new Snack({
      online: true,
      files: {
        'App.tsx': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    const { url } = snack.getState();
    const result = await snack.saveAsync();
    expect(result.id.length).toBeGreaterThanOrEqual(3);
    expect(result.url.length).toBeGreaterThanOrEqual(3);
    expect(snack.getState().unsaved).toBe(false);
    expect(snack.getState().url).not.toBe(url);
    expect(snack.getState().saveURL).toBeDefined();
    snack.setOnline(false);
  });

  it('does not use saveURL after changing sdkVersion', async () => {
    const snack = new Snack({
      online: true,
      files: {
        'App.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    await snack.saveAsync();
    const { url } = snack.getState();
    snack.setSDKVersion('39.0.0');
    expect(snack.getState().unsaved).toBe(true);
    expect(snack.getState().url).not.toBe(url);
    snack.setOnline(false);
  });

  it('fails when entry-point is invalid', async () => {
    const snack = new Snack({
      files: {
        'App2.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    await expect(snack.saveAsync()).rejects.toBeDefined();
  });

  it('saves snack with user session secret', async () => {
    const snack = new Snack({
      online: true,
      user: { sessionSecret: '{"some":"json"}' },
      files: {
        'App.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    await snack.saveAsync();
    expect(fetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Expo-Session': '{"some":"json"}',
        }),
      }),
    );
  });

  it('saves snack with user access token', async () => {
    const snack = new Snack({
      online: true,
      user: { accessToken: 'sometoken' },
      files: {
        'App.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    await snack.saveAsync();
    expect(fetch).toBeCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sometoken',
        }),
      }),
    );
  });
});
