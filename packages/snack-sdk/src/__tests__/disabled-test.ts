import fetch from '../__mocks__/fetch';
import Snack from './snack-sdk';

describe('disabled', () => {
  it('is enabled by default', async () => {
    const snack = new Snack({});
    const state = await snack.getStateAsync();
    expect(state.disabled).toBe(false);
  });

  it('can be disabled in constructor', async () => {
    const snack = new Snack({ disabled: true });
    const state = await snack.getStateAsync();
    expect(state.disabled).toBe(true);
  });

  it('can disable using setDisabled', async () => {
    const snack = new Snack({});
    snack.setDisabled(true);
    const state = await snack.getStateAsync();
    expect(state.disabled).toBe(true);
  });

  it('can enable using setDisabled', async () => {
    const snack = new Snack({ disabled: true });
    snack.setDisabled(false);
    const state = await snack.getStateAsync();
    expect(state.disabled).toBe(false);
  });

  it('does not fetch anything when disabled', async () => {
    const snack = new Snack({
      dependencies: {
        'expo-constants': { version: '*' },
      },
      disabled: true,
    });
    await snack.getStateAsync();
    expect(fetch).not.toBeCalled();
  });
});
