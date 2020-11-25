import formData from 'form-data';

import '../__mocks__/fetch';
import Snack from './snack-sdk';

function createAsset(name: string, contents: string, corrupt?: boolean): FormData {
  const FD = new formData();
  FD.append(corrupt ? 'something else' : 'asset', contents, name);
  return FD as any;
}

describe('files', () => {
  it('adds initial file', async () => {
    const snack = new Snack({
      files: {
        'App.js': {
          type: 'CODE',
          contents: `// whoop`,
        },
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.files).length).toBe(1);
    expect(state.files).toMatchSnapshot();
  });

  it('adds initial assets', async () => {
    const snack = new Snack({
      files: {
        'App.js': {
          type: 'CODE',
          contents: `// whoop`,
        },
        'assets/logo': {
          type: 'ASSET',
          contents: 'http://something.com',
        },
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.files).length).toBe(2);
    expect(state.files['assets/logo']).toMatchObject({
      type: 'ASSET',
      contents: 'http://something.com',
    });
  });

  it.skip('fails on invalid assets', async () => {
    const snack = new Snack({
      verbose: true,
      files: {
        'assets/logo': {
          type: 'ASSET',
          contents: createAsset('logo.png', 'hoi', true),
        },
      },
    });
    const state = await snack.getStateAsync();
    expect(state.files['assets/logo'].error).toBeDefined();
  });

  it('add code files', async () => {
    const snack = new Snack({});
    let state = await snack.getStateAsync();
    expect(Object.keys(state.files).length).toBe(0);
    snack.updateFiles({
      'App.js': {
        type: 'CODE',
        contents: `// whoop`,
      },
    });
    state = await snack.getStateAsync();
    expect(Object.keys(state.files).length).toBe(1);
    expect(state.files).toMatchSnapshot();
  });

  it('add asset files', async () => {
    const snack = new Snack({});
    snack.updateFiles({
      'assets/logo': {
        type: 'ASSET',
        contents: createAsset('logo.png', 'hoi'),
      },
    });
    const state = await snack.getStateAsync();
    expect(Object.keys(state.files).length).toBe(1);
    expect(typeof state.files['assets/logo'].contents).toBe('string');
    //expect(state.files['assets/logo']?.contents?.length).toBeGreaterThan(0);
  });
});
