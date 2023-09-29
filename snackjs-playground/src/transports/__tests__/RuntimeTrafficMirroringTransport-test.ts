import * as Logger from '../../Logger';
import RuntimeTrafficMirroringTransport, {
  AckMessageQueue,
} from '../RuntimeTrafficMirroringTransport';
import type { ListenerType } from '../RuntimeTrafficMirroringTransport';
import type { Device, RuntimeMessagePayload } from '../RuntimeTransport';
import RuntimeTransportImplPubNub from '../RuntimeTransportImplPubNub';
import RuntimeTransportImplSocketIO from '../RuntimeTransportImplSocketIO';

jest.mock('../../Logger');
jest.mock('../../NativeModules/LogBox');
jest.mock('../RuntimeTransportImplPubNub');
jest.mock('../RuntimeTransportImplSocketIO');

describe(RuntimeTrafficMirroringTransport, () => {
  const fallbackAckWaitMs = 100;

  const device: Device = {
    id: 'testId',
    name: 'testDeviceName',
    platform: 'ios',
  };

  const mockTransportPrimary = RuntimeTransportImplSocketIO as jest.MockedClass<
    typeof RuntimeTransportImplSocketIO
  >;
  const mockTransportFallback = RuntimeTransportImplPubNub as jest.MockedClass<
    typeof RuntimeTransportImplPubNub
  >;

  afterEach(() => {
    jest.clearAllMocks();
  });

  function setPrimaryTransportConnected(isConnected: boolean) {
    const mockIsConnected = mockTransportPrimary.mock.instances[0]
      .isConnected as jest.MockedFunction<InstanceType<typeof mockTransportPrimary>['isConnected']>;
    mockIsConnected.mockReturnValue(isConnected);
  }

  function emitCallbacks(
    transport: typeof RuntimeTransportImplSocketIO | typeof RuntimeTransportImplPubNub,
    message: RuntimeMessagePayload['message']
  ) {
    const mockTransportClass = transport as jest.MockedClass<typeof transport>;
    const mockTransport = mockTransportClass.mock.instances[0];
    const mockListener = mockTransport.listen as jest.MockedFunction<
      InstanceType<typeof mockTransportClass>['listen']
    >;
    const mockListenerCallback = mockListener.mock.calls[0][0];
    mockListenerCallback({ message });
  }

  function waitAsync(timeMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeMs);
    });
  }

  function expectAckListenerCalledFrom(primaryTransport: boolean) {
    if (primaryTransport) {
      const mockLogger = Logger.comm as jest.MockedFunction<typeof Logger.comm>;
      expect(mockLogger).toBeCalledWith(
        '[RuntimeTrafficMirroringTransport] ack upper from primary transport'
      );
    } else {
      const mockLogger = Logger.warn as jest.MockedFunction<typeof Logger.warn>;
      expect(mockLogger).toBeCalledWith(
        '[RuntimeTrafficMirroringTransport] ack upper from fallback transport'
      );
    }
  }

  it('should subscribe from all transports', () => {
    const transport = new RuntimeTrafficMirroringTransport(device, fallbackAckWaitMs);
    transport.subscribe('test');
    expect(mockTransportPrimary.mock.instances[0].subscribe).toBeCalled();
    expect(mockTransportFallback.mock.instances[0].subscribe).toBeCalled();
  });

  it('should unsubscribe from all transports', () => {
    const transport = new RuntimeTrafficMirroringTransport(device, fallbackAckWaitMs);
    transport.unsubscribe();
    expect(mockTransportPrimary.mock.instances[0].unsubscribe).toBeCalled();
    expect(mockTransportFallback.mock.instances[0].unsubscribe).toBeCalled();
  });

  it('should publish from primary transport when it is stable', () => {
    const transport = new RuntimeTrafficMirroringTransport(device, fallbackAckWaitMs);
    setPrimaryTransportConnected(true);
    transport.publish({ a: 'a' });
    expect(mockTransportPrimary.mock.instances[0].publish).toBeCalled();
    expect(mockTransportFallback.mock.instances[0].publish).not.toBeCalled();
  });

  it('should publish from fallback transport when the primary transport is not connected', () => {
    const transport = new RuntimeTrafficMirroringTransport(device, fallbackAckWaitMs);
    setPrimaryTransportConnected(false);
    transport.publish({ a: 'a' });
    expect(mockTransportPrimary.mock.instances[0].publish).not.toBeCalled();
    expect(mockTransportFallback.mock.instances[0].publish).toBeCalled();
  });

  it('should emit upper listener callback only once - primary is connected', async () => {
    const transport = new RuntimeTrafficMirroringTransport(device, fallbackAckWaitMs);
    setPrimaryTransportConnected(true);

    const mockUpperListener = jest.fn() as jest.MockedFunction<ListenerType>;
    transport.listen(mockUpperListener);
    emitCallbacks(mockTransportPrimary, { a: 'a', type: 'test' });
    emitCallbacks(mockTransportFallback, { a: 'a', type: 'test' });
    await waitAsync(500);

    expect(mockUpperListener).toBeCalledTimes(1);
    expect(mockUpperListener).toBeCalledWith({ message: { a: 'a', type: 'test' } });
    expectAckListenerCalledFrom(/* primaryTransport */ true);
  });

  it('should emit upper listener callback only once - primary is disconnected', async () => {
    const transport = new RuntimeTrafficMirroringTransport(device, fallbackAckWaitMs);
    setPrimaryTransportConnected(false);

    const mockUpperListener = jest.fn() as jest.MockedFunction<ListenerType>;
    transport.listen(mockUpperListener);
    emitCallbacks(mockTransportFallback, { a: 'a', type: 'test' });
    await waitAsync(500);

    expect(mockUpperListener).toBeCalledTimes(1);
    expect(mockUpperListener).toBeCalledWith({ message: { a: 'a', type: 'test' } });
    expectAckListenerCalledFrom(/* primaryTransport */ false);
  });

  it('should emit upper listener callback only once - primary is too slow', async () => {
    const transport = new RuntimeTrafficMirroringTransport(device, 100);
    setPrimaryTransportConnected(true);

    const mockUpperListener = jest.fn() as jest.MockedFunction<ListenerType>;
    transport.listen(mockUpperListener);
    setTimeout(() => {
      emitCallbacks(mockTransportPrimary, { a: 'a', type: 'test' });
    }, 200);
    emitCallbacks(mockTransportFallback, { a: 'a', type: 'test' });
    await waitAsync(500);

    expect(mockUpperListener).toBeCalledTimes(1);
    expect(mockUpperListener).toBeCalledWith({ message: { a: 'a', type: 'test' } });
    expectAckListenerCalledFrom(/* primaryTransport */ false);
  });

  it('should publish from primary transport when its missing rate lower than 3 times', async () => {
    const transport = new RuntimeTrafficMirroringTransport(device, 100);
    setPrimaryTransportConnected(true);

    const mockUpperListener = jest.fn() as jest.MockedFunction<ListenerType>;
    transport.listen(mockUpperListener);
    emitCallbacks(mockTransportFallback, { a: 'a', type: 'test' });
    emitCallbacks(mockTransportFallback, { b: 'b', type: 'test' });
    await waitAsync(500);

    expect(mockUpperListener).toBeCalledTimes(2);
    transport.publish({ a: 'a' });
    expect(mockTransportPrimary.mock.instances[0].publish).toBeCalled();
    expect(mockTransportFallback.mock.instances[0].publish).not.toBeCalled();
  });

  it('should publish from fallback transport when its missing rate is too high', async () => {
    const transport = new RuntimeTrafficMirroringTransport(device, 100);
    setPrimaryTransportConnected(true);

    const mockUpperListener = jest.fn() as jest.MockedFunction<ListenerType>;
    transport.listen(mockUpperListener);
    emitCallbacks(mockTransportFallback, { a: 'a', type: 'test' });
    emitCallbacks(mockTransportFallback, { b: 'b', type: 'test' });
    emitCallbacks(mockTransportFallback, { c: 'c', type: 'test' });
    emitCallbacks(mockTransportFallback, { d: 'd', type: 'test' });
    emitCallbacks(mockTransportFallback, { e: 'e', type: 'test' });
    await waitAsync(500);

    expect(mockUpperListener).toBeCalledTimes(5);
    transport.publish({ a: 'a' });
    expect(mockTransportPrimary.mock.instances[0].publish).not.toBeCalled();
    expect(mockTransportFallback.mock.instances[0].publish).toBeCalled();
  });
});

describe(AckMessageQueue, () => {
  it(`findMessageAsync should return false for empty queue`, async () => {
    const queue = new AckMessageQueue(3);
    const result = await queue.findMessageStringAsync(JSON.stringify({}));
    expect(result).toBe(false);
  });

  it(`findMessageAsync should return false when no matching item in queue`, async () => {
    const queue = new AckMessageQueue(3);
    await queue.enqueueMessageStringAsync(JSON.stringify({ '1': '1' }));
    const result = await queue.findMessageStringAsync(JSON.stringify({ '2': '2' }));
    expect(result).toBe(false);
  });

  it(`findMessageAsync should return true when matching item in queue`, async () => {
    const queue = new AckMessageQueue(3);
    await queue.enqueueMessageStringAsync(JSON.stringify({ '1': '1' }));
    const result = await queue.findMessageStringAsync(JSON.stringify({ '1': '1' }));
    expect(result).toBe(true);
  });

  it(`enqueueMessageAsync should remove oldest items and cut the queue size to fit limit`, async () => {
    const queue = new AckMessageQueue(3);
    await queue.enqueueMessageStringAsync(JSON.stringify({ '1': '1' }));
    await queue.enqueueMessageStringAsync(JSON.stringify({ '2': '2' }));
    await queue.enqueueMessageStringAsync(JSON.stringify({ '3': '3' }));
    await queue.enqueueMessageStringAsync(JSON.stringify({ '4': '4' }));
    await queue.enqueueMessageStringAsync(JSON.stringify({ '5': '5' }));

    expect(queue.size()).toBe(3);
    expect(queue.at(0)).toEqual(JSON.stringify({ '5': '5' }));
    expect(queue.at(1)).toEqual(JSON.stringify({ '4': '4' }));
    expect(queue.at(2)).toEqual(JSON.stringify({ '3': '3' }));
  });
});
