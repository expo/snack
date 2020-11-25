import '../__mocks__/fetch';
import { SnackTransportOptions } from '../transports';
import Snack from './snack-sdk';

const mock = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  postMessage: jest.fn(),
};

const Transport = jest.fn().mockImplementation(() => mock);
const createTransport = jest.fn((options: SnackTransportOptions) => new Transport(options));

beforeEach(() => {
  createTransport.mockClear();
  Transport.mockClear();
  Object.values(mock).forEach((obj) => obj.mockClear());
});

describe('transports', () => {
  it('is empty by default', async () => {
    const snack = new Snack({});
    expect(snack.getState().transports).toMatchObject({});
  });

  it('can be provided initially', async () => {
    const transport = new Transport();
    const snack = new Snack({ transports: { test: transport } });
    expect(Transport).toHaveBeenCalledTimes(1);
    expect(snack.getState().transports.test).toBe(transport);
  });

  it('calls start and provides a listener', async () => {
    const transport = new Transport();
    const snack = new Snack({ transports: { test: transport } });
    expect(snack).toBeDefined();
    expect(mock.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('does not call createTransport when offline', async () => {
    const snack = new Snack({ createTransport });
    await snack.getStateAsync();
    expect(createTransport).not.toBeCalled();
  });

  it('calls createTransport when initially online', async () => {
    const snack = new Snack({ createTransport, online: true });
    await snack.getStateAsync();
    expect(createTransport).toHaveBeenCalledTimes(1);
    snack.setOnline(false);
  });

  it('calls createTransport after setting online', async () => {
    const snack = new Snack({ createTransport });
    await snack.getStateAsync();
    expect(createTransport).not.toBeCalled();
    snack.setOnline(true);
    await snack.getStateAsync();
    expect(createTransport).toHaveBeenCalledTimes(1);
    snack.setOnline(false);
  });
});
