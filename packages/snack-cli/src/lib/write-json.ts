import * as fs from 'node:fs';
import * as path from 'node:path';
import Debug from 'debug';

const debug = Debug('snack-cli:write-json');

export async function writeJsonAsync<T = unknown>(file: string, data: T): Promise<void> {
  const dir = path.dirname(file);
  
  // Ensure directory exists
  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (error) {
    debug(`Failed to create directory ${dir}`, error);
    throw error;
  }

  // Write file
  try {
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2), { encoding: 'utf-8' });
  } catch (error) {
    debug(`Failed to write ${path}`, error);
    throw error;
  }
}
