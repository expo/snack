import { promises as fs } from 'node:fs';
import Debug from 'debug';

const debug = Debug('snack-cli:read-json');

export async function readJsonAsync<T = unknown>(path: string): Promise<T | null> {
  try {
    const contents = await fs.readFile(path, 'utf-8');
    return JSON.parse(contents);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      debug(`${path} does not exist`);
    } else {
      debug(`Failed to parse ${path}`, error);
    }
    return null;
  }
}
