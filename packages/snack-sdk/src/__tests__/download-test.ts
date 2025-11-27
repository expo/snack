import Snack, { defaultConfig } from './snack-sdk';
import { mockFetch } from '../__mocks__/fetch';

const SAVE_ID = '7777771777';

mockFetch.mockReturnValue(
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ id: SAVE_ID }),
  }),
);

describe('download', () => {
  it('saves and returns download url', async () => {
    const snack = new Snack({
      files: {
        'App.js': {
          type: 'CODE',
          contents: `console.log('hello world');`,
        },
      },
    });
    const url = await snack.getDownloadURLAsync();
    expect(mockFetch).toBeCalled();
    expect(url).toBe(`${defaultConfig.apiURL}/--/api/v2/snack/download/${SAVE_ID}`);
  });

  it('does not save when initial id is provided', async () => {
    const snack = new Snack({
      id: '761293482',
    });
    const url = await snack.getDownloadURLAsync();
    expect(mockFetch).not.toBeCalled();
    expect(url).toBe(`${defaultConfig.apiURL}/--/api/v2/snack/download/761293482`);
  });
});
