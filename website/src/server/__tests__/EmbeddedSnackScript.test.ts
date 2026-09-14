/**
 * @jest-environment jsdom
 */

export {};

type ExpoSnackApi = {
  append(container: HTMLElement): void;
  remove(container: HTMLElement): void;
};

const getExpoSnack = (): ExpoSnackApi =>
  (window as unknown as { ExpoSnack: ExpoSnackApi }).ExpoSnack;

const appendInlineSnack = () => {
  const container = document.createElement('div');
  container.dataset.snackCode = encodeURIComponent('export default function App() {}');
  document.body.appendChild(container);
  getExpoSnack().append(container);

  const iframe = container.querySelector<HTMLIFrameElement>('iframe[data-snack-iframe]');
  if (!iframe) {
    throw new Error('Expected an embedded Snack iframe');
  }

  const iframeId = new URL(iframe.src).searchParams.get('iframeId');
  if (!iframeId) {
    throw new Error('Expected the embedded Snack iframe to have an id');
  }

  return { container, iframe, iframeId };
};

beforeEach(() => {
  jest.resetModules();
  process.env.SNACK_SERVER_URL = 'https://snack.expo.dev';
  document.body.replaceChildren();
  delete (window as unknown as { ExpoSnack?: ExpoSnackApi }).ExpoSnack;
  delete (window as unknown as { ExpoSketch?: ExpoSnackApi }).ExpoSketch;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { script } = require('../EmbeddedSnackScript') as { script: string };
  // eslint-disable-next-line no-eval
  window.eval(script);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('removes the message listener after sending data to the iframe', () => {
  const removeEventListener = jest.spyOn(window, 'removeEventListener');
  const { iframe, iframeId } = appendInlineSnack();
  const postMessage = jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation();
  const loadedEvent = new MessageEvent('message', {
    data: ['expoFrameLoaded', { iframeId }],
  });

  window.dispatchEvent(loadedEvent);
  window.dispatchEvent(loadedEvent);

  expect(postMessage).toHaveBeenCalledTimes(1);
  expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
});

it('removes the message listener when removing an iframe before it loads', () => {
  const removeEventListener = jest.spyOn(window, 'removeEventListener');
  const { container, iframe } = appendInlineSnack();

  getExpoSnack().remove(container);

  expect(container.contains(iframe)).toBe(false);
  expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
});

it('removes the message listener when the host removes the container', async () => {
  const removeEventListener = jest.spyOn(window, 'removeEventListener');
  const { container } = appendInlineSnack();

  container.remove();
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
});

it('registers the message listener before inserting the iframe', () => {
  const removeEventListener = jest.spyOn(window, 'removeEventListener');
  const container = document.createElement('div');
  container.dataset.snackCode = encodeURIComponent('export default function App() {}');
  document.body.appendChild(container);
  const appendChild = container.appendChild.bind(container);

  jest.spyOn(container, 'appendChild').mockImplementation((node) => {
    const result = appendChild(node);
    const iframe = node as HTMLIFrameElement;
    const iframeId = new URL(iframe.src).searchParams.get('iframeId');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: ['expoFrameLoaded', { iframeId }],
      })
    );
    return result;
  });

  getExpoSnack().append(container);

  expect(removeEventListener).toHaveBeenCalledWith('message', expect.any(Function));
});
