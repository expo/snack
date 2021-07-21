type WindowConfig = {
  location: string;
};

type WindowEventListenerCallback = (event: any) => void;

class WindowLocation {
  public readonly href: string;
  public readonly origin: string;

  constructor(url: string) {
    this.href = url;
    const { origin } = new URL(url);
    this.origin = origin;
  }
}

export default class Window {
  public readonly location: WindowLocation;
  private callback?: (data: any) => void;

  constructor(config: WindowConfig) {
    this.location = new WindowLocation(config.location);
  }

  addEventListener = jest.fn((_type: string, callback: WindowEventListenerCallback) => {
    this.callback = callback;
  });

  removeEventListener = jest.fn((_type: string, _callback: WindowEventListenerCallback) => {
    this.callback = undefined;
  });

  postMessage = jest.fn((message: any, origin: string) => {
    this.callback?.({
      data: message,
      origin,
    });
  });
}

let globalWindowMock: any;

beforeEach(() => {
  globalWindowMock = new Window({
    location: 'https://snack.expo.dev',
  });
  Object.keys(globalWindowMock).forEach((key) => {
    // @ts-ignore
    global[key] = globalWindowMock[key];
  });
});

export function postMessage(message: any, origin?: string) {
  globalWindowMock.postMessage(message, origin ?? 'https://snack.expo.dev');
}
