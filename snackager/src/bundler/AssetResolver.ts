import escapeStringRegexp from 'escape-string-regexp';
import fs from 'fs';
import path from 'path';

type ResolveRequest = {
  path: string | false;
  relativePath?: string;
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
  /**
   * TODO: It is unclear whether AssetResolver as a plugin is still needed. No tests are
   * affected by disabling the AssetResolver plugin. It looks like `assetLoader.ts`
   * resolves all file suffixes for all current tests. AssetResolver as a plugin does seem
   * to cover more file-extensions, which may explain why it's needed. It is not clear though
   * which packages have assets that need to be resolved this way.
   */
  static test = /\.(bmp|gif|jpg|jpeg|png|psd|svg|webp|m4v|aac|aiff|caf|m4a|mp3|wav|html|pdf)$/;

  constructor(private options: Options) {}

  apply(resolver: any): void {
    const platform = this.options.platform;
    const testPath = this.options.test ?? AssetResolver.test;

    resolver
      .getHook('file')
      .tapAsync(
        'SnackagerAssetResolverPlugin',
        (request: ResolveRequest, _context: any, callback: Function) => {
          if (typeof request.path === 'string' && testPath.test(request.path)) {
            const requestPath = request.path;
            (resolver.fileSystem as typeof fs).readdir(
              path.dirname(request.path),
              (error, result) => {
                if (error) {
                  callback();
                  return;
                }

                const name = path.basename(requestPath).replace(/\.[^.]+$/, '');
                const type = requestPath.split('.').pop()!;

                let resolved = result.includes(path.basename(requestPath)) ? request.path : null;

                if (!resolved) {
                  const map = AssetResolver.collect(result, {
                    name,
                    type,
                    platform,
                  });
                  const key = map['@1x']
                    ? '@1x'
                    : Object.keys(map).sort(
                        (a, b) =>
                          Number(a.replace(/[^\d.]/g, '')) - Number(b.replace(/[^\d.]/g, ''))
                      )[0];
                  resolved = map[key]?.name
                    ? path.resolve(path.dirname(requestPath), map[key].name)
                    : null;
                }

                if (resolved) {
                  callback(null, {
                    ...request,
                    path: resolved,
                    relativePath:
                      request.relativePath && resolver.join(request.relativePath, resolved),
                    file: true,
                  });
                } else {
                  callback();
                }
              }
            );
          } else {
            callback();
          }
        }
      );
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
