export function pathToFileURL(path) { return new URL('file://' + path.split('/').map(encodeURIComponent).join('/')); }
export default {pathToFileURL};
