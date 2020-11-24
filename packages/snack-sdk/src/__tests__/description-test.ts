import Snack from './snack-sdk';

describe('description', () => {
  it('description can be provided initially', async () => {
    const snack = new Snack({
      description: 'snacky was here',
    });
    expect(snack.getState().unsaved).toBe(false);
    expect(snack.getState().description).toBe('snacky was here');
  });

  it('description can be changed', async () => {
    const snack = new Snack({});
    snack.setDescription('no it was snakz');
    expect(snack.getState().unsaved).toBe(true);
    expect(snack.getState().description).toBe('no it was snakz');
  });
});
