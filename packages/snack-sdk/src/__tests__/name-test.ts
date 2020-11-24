import Snack from './snack-sdk';

describe('name', () => {
  it('can be provided initially', async () => {
    const snack = new Snack({
      name: 'snackz',
    });
    expect(snack.getState()).toMatchObject({
      unsaved: false,
      name: 'snackz',
    });
  });

  it('can be changed', async () => {
    const snack = new Snack({});
    snack.setName('snacky');
    expect(snack.getState()).toMatchObject({
      unsaved: true,
      name: 'snacky',
    });
  });
});
