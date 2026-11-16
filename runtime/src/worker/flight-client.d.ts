// Public surface of build-runtime.cjs's generated Flight bundle.
// Generated vendor implementation is validated by builds and relay integration tests.
export function createFromReadableStream(
  stream: ReadableStream<Uint8Array>,
  options: { callServer: (id: string, args: unknown[]) => Promise<unknown> },
): Promise<{ _value: import('react').ReactNode }>;
