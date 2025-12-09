import Debug from 'debug';

const debug = Debug('snack-cli:parse-json');

export function parseJson<T = unknown>(contents: string): T | null {
  try {
    return JSON.parse(contents);
  } catch (error) {
    debug(`Failed to parse ${contents}`, error);
    return null;
  }
}
