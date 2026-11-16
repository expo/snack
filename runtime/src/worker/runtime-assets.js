import { Directory, File, Paths } from 'expo-file-system';
import { PixelRatio } from 'react-native';

import { selectImageAsset } from './image-selection';

const extensions = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'font/ttf': 'ttf',
  'font/otf': 'otf',
};
const graphLimit = 20 * 1024 * 1024;
let directory;
const launchId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
let sequence = 0;
let bytes = 0;
let committed = new Set();
const cache = new Map();

// Retain the displayed graph while staging its replacement. Evict older entries,
// never derive filenames from user paths, and recreate files purged by the OS.
export async function prepareAssets(records) {
  const wanted = new Map();
  let graphBytes = 0;
  for (const record of Object.values(records)) {
    if (!record.asset) continue;
    const { mime, base64 } = selectImageAsset(record.asset, PixelRatio.get());
    const extension = Object.hasOwn(extensions, mime) ? extensions[mime] : undefined;
    if (!extension) throw Error('Unsupported native asset type: ' + mime);
    if (
      typeof base64 !== 'string' ||
      base64.length > 12 * 1024 * 1024 ||
      base64.length % 4 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)
    )
      throw Error('Invalid or oversized native asset');
    const key = mime + ':' + base64;
    if (wanted.has(key)) continue;
    const size =
      (base64.length * 3) / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    graphBytes += size;
    if (graphBytes > graphLimit || wanted.size >= 256)
      throw Error('Native asset graph budget exceeded');
    wanted.set(key, { base64, extension, size });
  }
  if (!directory) {
    directory = new Directory(Paths.cache, 'snack-runtime-assets');
    if (directory.exists) directory.delete();
  }
  if (!directory.exists) directory.create({ intermediates: true });
  for (const [key, entry] of cache) {
    if (committed.has(key) || wanted.has(key)) continue;
    if (entry.file.exists) entry.file.delete();
    bytes -= entry.size;
    cache.delete(key);
  }
  for (const [key, asset] of wanted) {
    let entry = cache.get(key);
    if (!entry) {
      if (bytes + asset.size > graphLimit * 2 || cache.size >= 512)
        throw Error('Native asset cache budget exceeded');
      entry = {
        file: new File(directory, launchId + '-' + sequence++ + '.' + asset.extension),
        size: asset.size,
      };
      await entry.file.write(asset.base64, { encoding: 'base64' });
      cache.set(key, entry);
      bytes += entry.size;
    } else if (!entry.file.exists) {
      await entry.file.write(asset.base64, { encoding: 'base64' });
    }
  }
  const sources = Object.create(null);
  for (const [id, record] of Object.entries(records)) {
    if (record.asset) {
      const asset = selectImageAsset(record.asset, PixelRatio.get());
      sources[id] = {
        uri:
          asset.mime === 'image/svg+xml'
            ? 'data:image/svg+xml;base64,' + asset.base64
            : cache.get(asset.mime + ':' + asset.base64).file.uri,
        ...(asset.width ? { width: asset.width, height: asset.height, scale: asset.scale } : {}),
      };
    }
  }
  return {
    sources,
    commit() {
      committed = new Set(wanted.keys());
    },
  };
}
