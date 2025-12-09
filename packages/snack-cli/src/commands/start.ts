import { Snack, SnackDependency, SnackFile } from 'snack-sdk';
import fs from 'fs';
import path from 'path';
import Debug from 'debug';
import { IGNORE_DIRS, loadFiles } from '../lib/load-files';
import { parseJson } from '../lib/parse-json';
import { loadDependencies } from '../lib/load-dependencies';
import { readJsonAsync } from '../lib/read-json';
import { getRuntimeEndpoint } from '../lib/snack-runtime';

const debug = Debug('snack-cli');

export async function start(options: { experimentalRuntime?: boolean }) {
  const cwd = process.cwd();
  const snackJsonPath = path.join(cwd, '.snack', 'snack.json');

  const snackJson: { name?: string } = await readJsonAsync(snackJsonPath) ?? {};
  const existingSnackName = snackJson.name;

  const sessionSecret = process.env.SNACK_SESSION_SECRET || process.env.sessionSecret;
  if (!sessionSecret) {
    console.warn('No sessionSecret found in env (SNACK_SESSION_SECRET). Snack will be anonymous/read-only if required.');
  }

  const dependencies = await loadDependencies(cwd);

  const snack = new Snack({
    name: existingSnackName,
    dependencies,
    user: sessionSecret ? { sessionSecret } : undefined,
    verbose: false, // We handle logging manually
    runtimeEndpoint: getRuntimeEndpoint(options)
  });
  snack.setOnline(true);
  const url = snack.getState().url;
  console.log(`Available at: ${url}`);

  snack.updateFiles(await loadFiles(cwd));

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

  console.log('Watching for file changes...');
  let debounceTimer: NodeJS.Timeout | null = null;

  let packageJsonPath = path.join(cwd, 'package.json');
  
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
          if (fullPath === packageJsonPath) {
            const packageJson: { dependencies?: { [name: string]: string } } = parseJson(contents) ?? {};
            const packageDependencies = packageJson?.dependencies ?? {};
            const currentDependencies = snack.getState().dependencies;
            const newDependencies = Object.entries(packageDependencies).reduce((acc, [name, version]) => {
              acc[name] = { version: "*" }; // TODO: Handle versions.
              return acc;
            }, {} as { [name: string]: SnackDependency })
            const dependenciesToRemove = Object
              .keys(currentDependencies)
              .filter(name => !packageDependencies[name])
              .reduce((acc, name) => {
                acc[name] = null;
                return acc;
              }, {} as { [name: string]: null });
            snack.updateDependencies({
              ...dependenciesToRemove,
              ...newDependencies,
            });
          }
        }
      } else {
        // Deleted
        snack.updateFiles({ [filename]: null });
      }
    }, 1000);
  });
}
