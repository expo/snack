import fs from 'fs';
import path from 'path';
import { RawLoaderDefinitionFunction } from 'webpack';

import AssetResolver from './AssetResolver';

// TODO upgrade dependencies to include typescript definitions
const hasha = require('hasha');
const size = require('image-size');

type Config = {
  platform: string;
  root: string;
  outputPath?: string | ((path: string) => string);
  publicPath?: string | ((path: string) => string);
};

type ImageSize = {
  width: number;
  height: number;
  type: string;
};

type AssetPair = {
  destination: string;
  content: Buffer;
};

const assetLoader: RawLoaderDefinitionFunction = async function (this) {
  this.cacheable();

  const callback = this.async();
  const config: Config = this.getOptions() as any;

  let info: ImageSize | null = null;

  try {
    info = size(this.resourcePath);
  } catch {
    // Asset is not an image
  }

  const filepath = this.resourcePath;
  const dirname = path.dirname(filepath);
  const url = path.relative(config.root, dirname);
  const type = path.extname(filepath).replace(/^\./, '');
  const suffix = `(@\\d+(\\.\\d+)?x)?(\\.(${config.platform}|native))?\\.${type}$`;
  const filename = path.basename(filepath).replace(new RegExp(suffix), '');
  const longname = `${`${url.replace(/\//g, '_')}_${filename}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')}`;

  const result = await new Promise<string[]>((resolve, reject) =>
    (this.fs as typeof fs).readdir(dirname, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    }),
  );

  const map = AssetResolver.collect(result, {
    name: filename,
    type,
    platform: config.platform,
  });

  const scales = Object.keys(map)
    .map((s) => Number(s.replace(/[^\d.]/g, '')))
    .sort();

  const pairs = await Promise.all(
    Object.keys(map).map<Promise<AssetPair>>((scale) => {
      this.addDependency(path.join(dirname, map[scale].name));

      return new Promise((resolve, reject) =>
        (this.fs as typeof fs).readFile(path.join(dirname, map[scale].name), (err, res) => {
          if (err) {
            reject(err);
          } else {
            const name = `${longname}${scale === '@1x' ? '' : scale}.${type}`;
            const dest = path.join('assets', name);

            resolve({
              destination: dest,
              content: res,
            });
          }
        }),
      );
    }),
  );

  pairs.forEach((item) => {
    let dest = item.destination;

    if (config.outputPath) {
      // support functions as outputPath to generate them dynamically
      dest =
        typeof config.outputPath === 'function'
          ? config.outputPath(dest)
          : path.join(config.outputPath, dest);
    }

    this.emitFile(dest, item.content, undefined);
  });

  const buffers = pairs.map((item) => item.content);
  const hashes = buffers.map((b) => hasha(b, { algorithm: 'md5' }));

  let publicPath = `__webpack_public_path__ + ${JSON.stringify(path.join('/', 'assets'))}`;

  if (config.publicPath) {
    // support functions as publicPath to generate them dynamically
    publicPath = JSON.stringify(
      typeof config.publicPath === 'function'
        ? config.publicPath(url)
        : path.join(config.publicPath, url),
    );
  }

  // Special case for fonts on web, which cannot be a registered
  // as an asset, but need to be a direct URL to the resource.
  const isFont = /(ttf|otf)$/i.test(type);
  if (isFont && config.platform === 'web') {
    callback(
      null,
      `
      module.exports = ${publicPath} + ${JSON.stringify(`/${longname}.${type}`)};
      `,
    );
    return '';
  }

  callback(
    null,
    `
    var AssetRegistry = require('AssetRegistry');
    module.exports = AssetRegistry.registerAsset({
      httpServerLocation: ${publicPath},
      name: ${JSON.stringify(longname)},
      width: ${info ? info.width : JSON.stringify(null)},
      height: ${info ? info.height : JSON.stringify(null)},
      type: ${JSON.stringify(type)},
      hash: ${JSON.stringify(hashes.join())},
      fileHashes: ${JSON.stringify(hashes)},
      scales: ${JSON.stringify(scales)},
    });
  `,
  );
  return '';
};

module.exports = assetLoader;
module.exports.raw = true;
