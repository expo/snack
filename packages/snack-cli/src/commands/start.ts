import { Snack, SnackFile } from 'snack-sdk';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import Debug from 'debug';

const debug = Debug('snack-cli');

const IGNORE_DIRS = ['node_modules', '.git', '.snack', 'build', 'dist'];

export async function start() {
  const cwd = process.cwd();
  const snackJsonPath = path.join(cwd, '.snack', 'snack.json');
  let snackId: string | undefined;

  if (fs.existsSync(snackJsonPath)) {
    try {
      const snackJson = JSON.parse(fs.readFileSync(snackJsonPath, 'utf-8'));
      snackId = snackJson.snackId;
      debug(`Found existing snackId: ${snackId}`);
    } catch (e) {
      debug('Failed to parse .snack/snack.json');
    }
  }

  const sessionSecret = process.env.SNACK_SESSION_SECRET || process.env.sessionSecret;
  if (!sessionSecret) {
    console.warn('No sessionSecret found in env (SNACK_SESSION_SECRET). Snack will be anonymous/read-only if required.');
  }

  const snack = new Snack({
    snackId,
    user: sessionSecret ? { sessionSecret } : undefined,
    verbose: false, // We handle logging manually
  });
  snack.setOnline(true);
  const url = snack.getState().url;
  console.log(`Available at: ${url}`);

  const files: { [path: string]: SnackFile } = {};

  const loadFiles = async () => {
    const filePaths = await glob('**/*', {
      cwd,
      ignore: IGNORE_DIRS.map(d => `${d}/**`),
      nodir: true,
    });

    for (const filePath of filePaths) {
      const fullPath = path.join(cwd, filePath);
      const contents = fs.readFileSync(fullPath, 'utf-8');
      // Simple heuristic for now, treat everything as code. 
      // In a real app we'd distinguish assets.
      files[filePath] = {
        type: 'CODE',
        contents,
      };
    }
  };

  await loadFiles();
  snack.updateFiles(files);

  snack.addLogListener((log) => {
    const { type, message, connectedClient } = log;
    const clientName = connectedClient?.name ? `[${connectedClient.name}] ` : '';
    
    if (type === 'error') {
      console.error(`${clientName}Error: ${message}`);
    } else if (type === 'warn') {
      console.warn(`${clientName}Warn: ${message}`);
    } else {
      console.log(`${clientName}${message}`);
    }
  });

  const save = async () => {
    try {
      debug('Uploading files...');
      const result = await snack.saveAsync();
      debug(`Saved! Hash: ${result.id}`); // result.id is the hash/id
      
      // Save snackId if it's new
      if (!snackId && result.snackId) {
        snackId = result.snackId;
        const snackDir = path.join(cwd, '.snack');
        if (!fs.existsSync(snackDir)) {
          fs.mkdirSync(snackDir);
        }
        fs.writeFileSync(path.join(snackDir, 'snack.json'), JSON.stringify({ snackId }, null, 2));
        debug(`Saved snackId to ${path.join(snackDir, 'snack.json')}`);
      }
    } catch (e) {
      console.error('Failed to save snack:', e);
    }
  };

  await save();

  console.log('Watching for file changes...');
  let debounceTimer: NodeJS.Timeout | null = null;

  fs.watch(cwd, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    // Check ignores
    if (IGNORE_DIRS.some(dir => filename.startsWith(dir))) return;

    debug(`File changed: ${filename}`);
    
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const fullPath = path.join(cwd, filename);
      if (fs.existsSync(fullPath)) {
         if (fs.statSync(fullPath).isFile()) {
             const contents = fs.readFileSync(fullPath, 'utf-8');
             snack.updateFiles({
                 [filename]: { type: 'CODE', contents }
             });
         }
      } else {
          // Deleted
          snack.updateFiles({ [filename]: null });
      }
      await save();
    }, 1000);
  });
}
