import escapeStringRegexp from 'escape-string-regexp';
import fs from 'fs';
import path from 'path';

type Request = {
  path: string;
  relativePath: string;
};

type Options = {
  test?: RegExp;
  platform: string;
};

type CollectedAssets = {
  [scale: string]: {
    platform: string;
    name: string;
  };
};

export default class AssetResolver {
  static test = /\.(bmp|gif|jpg|jpeg|png|psd|svg|webp|m4v|aac|aiff|caf|m4a|mp3|wav|html|pdf)$/;

  constructor(private options: Options) {}

  apply(resolver: any): void {
    const platform = this.options.platform;
    const testPath = this.options.test ?? AssetResolver.test;

    resolver.plugin('file', (request: Request, callback: Function) => {
      if (testPath.test(request.path)) {
        (resolver.fileSystem as typeof fs).readdir(path.dirname(request.path), (error, result) => {
          if (error) {
            callback();
            return;
          }

          const name = path.basename(request.path).replace(/\.[^.]+$/, '');
          const type = request.path.split('.').pop()!;

          let resolved = result.includes(path.basename(request.path)) ? request.path : null;

          if (!resolved) {
            const map = AssetResolver.collect(result, {
              name,
              type,
              platform,
            });
            const key = map['@1x']
              ? '@1x'
              : Object.keys(map).sort(
                  (a, b) => Number(a.replace(/[^\d.]/g, '')) - Number(b.replace(/[^\d.]/g, ''))
                )[0];
            resolved = map[key]?.name
              ? path.resolve(path.dirname(request.path), map[key].name)
              : null;
          }

          if (resolved) {
            callback(
              null,
              Object.assign({}, request, {
                path: resolved,
                relativePath: request.relativePath && resolver.join(request.relativePath, resolved),
                file: true,
              })
            );
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    });
  }

  static collect = (
    list: string[],
    { name, type, platform }: { name: string; type: string; platform: string }
  ): CollectedAssets => {
    const suffix = `(\\.(${platform === 'web' ? 'web' : `${platform}|native`}))?\\.${type}$`;
    const regex = /^(bmp|gif|jpg|jpeg|png|psd|tiff|webp|svg)$/.test(type)
      ? new RegExp(`^${escapeStringRegexp(name)}(@\\d+(\\.\\d+)?x)?${suffix}`)
      : new RegExp(`^${escapeStringRegexp(name)}${suffix}`);

    // Build a map of files according to the scale
    return list.reduce<CollectedAssets>((acc, curr) => {
      const match = regex.exec(curr);

      if (match) {
        const [, scale = '@1x', , , plat] = match;

        if (acc[scale]) {
          // platform takes highest prio, so if it exists, don't do anything
          if (acc[scale].platform === plat) {
            return acc;
          }

          // native takes second prio, so if it exists and platform doesn't, don't do anything
          if (platform !== 'web' && acc[scale].platform === 'native' && !plat) {
            return acc;
          }
        }

        return Object.assign({}, acc, {
          [scale]: { platform: plat, name: curr },
        });
      }

      return acc;
    }, {});
  };
}
