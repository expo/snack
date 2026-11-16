import type { SnackWorkerRPC } from './WorkerCompiler';

/** Owns one compiler worker and its opaque-origin executor. Call dispose on editor unmount. */
export function createBrowserWorkerHost(options: {
  baseURL: string;
  project: string;
  backend?: 'custom' | 'metro';
}) {
  const base = new URL(options.baseURL, location.href);
  if (base.origin !== location.origin)
    throw new Error('Compiler assets must be served from the editor origin');
  let worker: Worker | undefined;
  let frame: HTMLIFrameElement | undefined;
  let disposed = false;
  let sequence = 0;
  let generation = 0;
  const pending = new Map<
    number,
    { resolve: (data: any) => void; reject: (error: Error) => void; cleanup: () => void }
  >();
  const source = fetch(new URL('executor.js', base).href, { credentials: 'omit' }).then(
    async (response) => {
      if (!response.ok) throw new Error('Executor unavailable');
      return response.text();
    },
  );
  // A request reports load failures; do not leave an unhandled prefetch rejection.
  source.catch(() => {});
  function reset(error: Error) {
    worker?.terminate();
    worker = undefined;
    frame?.remove();
    frame = undefined;
    pending.forEach((item) => {
      item.cleanup();
      item.reject(error);
    });
    pending.clear();
  }
  function start() {
    const url = new URL('worker.js', base);
    url.searchParams.set('project', options.project);
    url.searchParams.set('backend', options.backend ?? 'custom');
    const target = new Worker(url);
    worker = target;
    target.onmessage = ({ data }) => {
      const item = pending.get(data.id);
      if (!item) return;
      pending.delete(data.id);
      item.cleanup();
      if (data.error)
        item.reject(Object.assign(new Error(data.error), { diagnostic: data.diagnostic }));
      else item.resolve(data);
    };
    target.onerror = (event) => reset(new Error(event.message || 'Compiler worker failed'));
    const isolation = document.createElement('iframe');
    frame = isolation;
    isolation.hidden = true;
    isolation.sandbox.add('allow-scripts');
    isolation.onload = async () => {
      try {
        const script = await source;
        if (worker !== target) return;
        const channel = new MessageChannel();
        target.postMessage({ operation: 'connect-executor' }, [channel.port1]);
        isolation.contentWindow!.postMessage({ type: 'connect-executor', source: script }, '*', [
          channel.port2,
        ]);
      } catch (error) {
        if (worker === target) reset(error instanceof Error ? error : new Error(String(error)));
      }
    };
    isolation.src = new URL('isolation.html', base).href;
    document.body.appendChild(isolation);
  }
  const call: SnackWorkerRPC = (message, timeout, { signal }) => {
    if (disposed || signal.aborted) return Promise.reject(new Error('Compiler is stopped'));
    if (pending.size >= 16) return Promise.reject(new Error('Compiler queue is full'));
    if (!worker) start();
    const id = ++sequence;
    if (message.files || message.dependencies) generation++;
    return new Promise((resolve, reject) => {
      const cancel = () =>
        reset(new Error(signal.aborted ? 'Compilation canceled' : 'Compilation timed out'));
      const timer = setTimeout(cancel, Math.min(Math.max(timeout, 50), 90000));
      signal.addEventListener('abort', cancel, { once: true });
      pending.set(id, {
        resolve,
        reject,
        cleanup: () => {
          clearTimeout(timer);
          signal.removeEventListener('abort', cancel);
        },
      });
      try {
        worker!.postMessage({ ...message, id, generation });
      } catch (error) {
        reset(new Error(String(error)));
      }
    });
  };
  return {
    call,
    dispose() {
      disposed = true;
      reset(new Error('Compiler disposed'));
    },
  };
}
