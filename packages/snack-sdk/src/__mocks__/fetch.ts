const actualFetch = globalThis.fetch;

export const mockFetch = jest.fn()

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockClear();
});

afterEach(() => {
  globalThis.fetch = actualFetch;
});
