import { SnackDependencies } from 'snack-sdk';
import * as path from 'node:path';
import { readJsonAsync } from './read-json';
import Debug from 'debug';

const debug = Debug('snack-cli:load-dependencies');

export async function loadDependencies(cwd: string): Promise<SnackDependencies> {
  const packageJson: { dependencies?: { [name: string]: string } } = await readJsonAsync(path.join(cwd, 'package.json')) ?? {};
  const dependencies = Object.entries(packageJson?.dependencies ?? {}).reduce((acc, [name, version]) => {
    acc[name] = { version: "*" }; // TODO: Handle versions.
    return acc;
  }, {} as SnackDependencies);
  debug('Loaded dependencies:', dependencies);
  return dependencies;
}
