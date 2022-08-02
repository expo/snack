import type { Linter } from 'eslint';
import fs from 'fs';
import path from 'path';

import { getLinterConfig } from '../config';
import { linter } from '../eslint';

describe('linter', () => {
  it('parses default App.js', async () => {
    const result = lint('App.js', await fixture('snack-app.js'));
    expect(result).toHaveLength(0);
  });

  it('parses default App.tsx', async () => {
    const result = lint('App.tsx', await fixture('snack-app.js'));
    expect(result).toHaveLength(0);
  });

  it('parses undefined variables', () => {
    const result = lint('test.js', `
      const greet = 'Hello';
      console.log(groot);
    `);

    expect(result).toHaveLength(1);
    expect(result[0].ruleId).toBe('no-undef');
  });

  it('parses generics properly', () => {
    const result = lint('generics.ts', `
      async function process<A, B>(a: A, b: B): Promise<{ a: A, b: B }> {
        return { a, b };
      }

      process('should', 'work').then(console.log);
    `);

    expect(result).toHaveLength(0);
  });

  it('parses import type properly', () => {
    const result = lint('Component.tsx', `
      import type { ComponentProps } from 'react';
      import { View } from 'react-native'

      export type ViewProps = ComponentProps<View>;
    `);

    expect(result).toHaveLength(0);
  });

  it('parses enum types properly', () => {
    const result = lint('types.ts', `
      export enum State {
        IDLE = 'idle',
        PENDING = 'pending',
        RESOLVED = 'resolved',
        REJECTED = 'rejected',
      }
    `);

    expect(result).toHaveLength(0);
  });
});

function lint(file: string, code: string, config?: any): ReturnType<Linter['verify']> {
  return linter.verify(
    code, 
    getLinterConfig(file, config), // Get the config we should use for the linter
    { filename: file }, // Babel uses this to enable TypeScript features
  );
}

async function fixture(file: string): Promise<string> {
  return fs.promises.readFile(path.resolve(__dirname, './fixtures', file), 'utf-8');
}
