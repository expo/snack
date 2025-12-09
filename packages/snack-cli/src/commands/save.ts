import { Snack } from 'snack-sdk';
import path from 'path';
import Debug from 'debug';
import { readJsonAsync } from '../lib/read-json';
import { writeJsonAsync } from '../lib/write-json';
import { randomName } from '../lib/random-name';
import { loadFiles } from '../lib/load-files';
import { loadDependencies } from '../lib/load-dependencies';

const debug = Debug('snack-cli');

export async function save() {
  const cwd = process.cwd();
  const snackJsonPath = path.join(cwd, '.snack', 'snack.json');

  const snackJson: { name?: string } = await readJsonAsync(snackJsonPath) ?? {};
  const existingSnackName = snackJson.name;
  
  const sessionSecret = process.env.SNACK_SESSION_SECRET;
  if (!sessionSecret) {
    console.warn('No sessionSecret found in env (SNACK_SESSION_SECRET). Snack will be saved anonymously (as read-only).');
  }

  const dependencies = await loadDependencies(cwd);
  
  const snack = new Snack({
    name: existingSnackName,
    dependencies,
    user: sessionSecret ? { sessionSecret } : undefined,
    verbose: false,
  });
  
  let newName: string | null = null;
  if (!existingSnackName && sessionSecret) {
    newName = randomName();
    snack.setName(newName);
  }

  snack.updateFiles(await loadFiles(cwd));

  let result: Awaited<ReturnType<typeof snack.saveAsync>> | null = null;
  try {
    debug('Uploading files...');
    console.log('Uploading files...');
    result = await snack.saveAsync({
      ignoreUser: !sessionSecret,
    });
    debug(`Saved!`, result);
  } catch (e) {
    console.error('Failed to save snack:', e);
  }
  if (!result) {
    debug('Missing result from saveAsync');
    process.exit(1);
  }

  // Save snackId if it's new
  if (result.id && sessionSecret && newName) {
    // TODO: Add lock to avoid race condition with multiple concurrent saves
    snackJson.name = newName;
    await writeJsonAsync(snackJsonPath, snackJson);
    debug(`Saved snackId to ${snackJsonPath}`);
  }
  
  console.log(`Snack saved successfully!`);
  console.log(`Available at: ${result.url}`);
}
