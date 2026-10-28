import spawnAsync from '@expo/spawn-async';

import { Package } from '../../types';
import installDependencies from '../installDependencies';

jest.mock('@expo/spawn-async');

it.each([false, true])(
  'keeps dependency specs after installer options with fallback=%s',
  async (fallback) => {
    jest.mocked(spawnAsync).mockReset();
    (spawnAsync as jest.Mock).mockImplementation(async (command) => {
      if (command === 'which') return { stdout: '/trusted/yarnpkg' };
      if (command === '/trusted/yarnpkg' && fallback) throw new Error('Yarn failed');
      return { stdout: '' };
    });
    await installDependencies({ name: 'fixture', version: '1.0.0' } as Package, '/package', {
      '@scope/peer': '1.0.0',
    });
    const calls = jest.mocked(spawnAsync).mock.calls.slice(1);
    expect(calls.map(([command]) => command)).toEqual(
      fallback ? ['/trusted/yarnpkg', 'npm'] : ['/trusted/yarnpkg'],
    );
    for (const [command, args] of calls) {
      const boundary = args!.indexOf('--');
      expect(args!.slice(0, boundary)).toContain('--ignore-scripts');
      expect(args!.slice(boundary + 1)).toEqual(['@scope/peer@1.0.0']);
      if (command === '/trusted/yarnpkg') {
        expect(args!.slice(0, 2)).toEqual(['--no-default-rc', 'add']);
      } else {
        expect(args![0]).toBe('install');
        expect(args).not.toContain('--no-default-rc');
      }
    }
  },
);
