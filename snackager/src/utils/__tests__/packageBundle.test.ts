import fetch from 'node-fetch';

import { getBundledVersionAsync } from '../packageBundle';

const { Response } = jest.requireActual('node-fetch');

jest.mock('node-fetch');

describe(getBundledVersionAsync, () => {
  it('should resolve the version from bundledNativeModules', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              createdAt: '2023-05-08T23:17:04.269Z',
              id: '7bdedbb0-b80c-4915-a0b5-449178a2f3b9',
              npmPackage: 'expo-modules-core',
              sdkVersion: '49.0.0',
              updatedAt: '2023-05-08T23:17:04.269Z',
              versionRange: '~1.5.10',
            },
          ],
        }),
      ),
    );
    const version = await getBundledVersionAsync('expo-modules-core', '49.0.0');
    expect(version).toBe('~1.5.10');
  });

  it('should return null when no sdkVersion matched', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [],
        }),
      ),
    );
    const version = await getBundledVersionAsync('expo-modules-core', '999.999.999');
    expect(version).toBe(null);
  });

  it('should return null when no bundledNativeModules matched', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              createdAt: '2023-05-08T23:17:04.269Z',
              id: '7bdedbb0-b80c-4915-a0b5-449178a2f3b9',
              npmPackage: 'expo-modules-core',
              sdkVersion: '49.0.0',
              updatedAt: '2023-05-08T23:17:04.269Z',
              versionRange: '~1.5.10',
            },
          ],
        }),
      ),
    );
    const version = await getBundledVersionAsync('expo-modules-extra', '999.999.999');
    expect(version).toBe(null);
  });
});
