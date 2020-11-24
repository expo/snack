import Snack from './snack-sdk';

describe('channel', () => {
  it('autogenerates a channel', async () => {
    const snack = new Snack({});
    expect(snack.getState().channel.length).toBeGreaterThanOrEqual(6);
  });

  it('generates new channel everytime', async () => {
    const state1 = new Snack({}).getState();
    const state2 = new Snack({}).getState();
    expect(state1.channel).not.toBe(state2.channel);
  });

  it('uses custom channel', async () => {
    const channel = '872948282';
    const snack = new Snack({ channel });
    expect(snack.getState().channel).toBe(channel);
  });

  it('fails on too short channels', async () => {
    expect(() => new Snack({ channel: '872' })).toThrowError();
  });

  it('fails on invalid characters ', async () => {
    expect(() => new Snack({ channel: '790822&?' })).toThrowError();
  });
});
