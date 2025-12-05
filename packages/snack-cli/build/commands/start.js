"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const snack_sdk_1 = require("snack-sdk");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('snack-cli');
const IGNORE_DIRS = ['node_modules', '.git', '.snack', 'build', 'dist'];
async function start() {
    const cwd = process.cwd();
    const snackJsonPath = path_1.default.join(cwd, '.snack', 'snack.json');
    let snackId;
    if (fs_1.default.existsSync(snackJsonPath)) {
        try {
            const snackJson = JSON.parse(fs_1.default.readFileSync(snackJsonPath, 'utf-8'));
            snackId = snackJson.snackId;
            debug(`Found existing snackId: ${snackId}`);
        }
        catch (e) {
            debug('Failed to parse .snack/snack.json');
        }
    }
    const sessionSecret = process.env.SNACK_SESSION_SECRET || process.env.sessionSecret;
    if (!sessionSecret) {
        console.warn('No sessionSecret found in env (SNACK_SESSION_SECRET). Snack will be anonymous/read-only if required.');
    }
    const snack = new snack_sdk_1.Snack({
        snackId,
        user: sessionSecret ? { sessionSecret } : undefined,
        verbose: false, // We handle logging manually
    });
    snack.setOnline(true);
    const url = snack.getState().url;
    console.log(`Available at: ${url}`);
    const files = {};
    const loadFiles = async () => {
        const filePaths = await (0, glob_1.glob)('**/*', {
            cwd,
            ignore: IGNORE_DIRS.map(d => `${d}/**`),
            nodir: true,
        });
        for (const filePath of filePaths) {
            const fullPath = path_1.default.join(cwd, filePath);
            const contents = fs_1.default.readFileSync(fullPath, 'utf-8');
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
        }
        else if (type === 'warn') {
            console.warn(`${clientName}Warn: ${message}`);
        }
        else {
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
                const snackDir = path_1.default.join(cwd, '.snack');
                if (!fs_1.default.existsSync(snackDir)) {
                    fs_1.default.mkdirSync(snackDir);
                }
                fs_1.default.writeFileSync(path_1.default.join(snackDir, 'snack.json'), JSON.stringify({ snackId }, null, 2));
                debug(`Saved snackId to ${path_1.default.join(snackDir, 'snack.json')}`);
            }
        }
        catch (e) {
            console.error('Failed to save snack:', e);
        }
    };
    await save();
    console.log('Watching for file changes...');
    let debounceTimer = null;
    fs_1.default.watch(cwd, { recursive: true }, (eventType, filename) => {
        if (!filename)
            return;
        // Check ignores
        if (IGNORE_DIRS.some(dir => filename.startsWith(dir)))
            return;
        debug(`File changed: ${filename}`);
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const fullPath = path_1.default.join(cwd, filename);
            if (fs_1.default.existsSync(fullPath)) {
                if (fs_1.default.statSync(fullPath).isFile()) {
                    const contents = fs_1.default.readFileSync(fullPath, 'utf-8');
                    snack.updateFiles({
                        [filename]: { type: 'CODE', contents }
                    });
                }
            }
            else {
                // Deleted
                snack.updateFiles({ [filename]: null });
            }
            await save();
        }, 1000);
    });
}
exports.start = start;
