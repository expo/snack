import { Compiler } from 'webpack';
import { parseResource } from 'webpack/lib/util/identifier';

import resolvePackageFile from './resolvePackageFile';

const PLUGIN_NAME = 'RestrictFilesPlugin';

export default class RestrictFilesPlugin {
  constructor(private readonly root: string) {}

  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (factory) => {
      factory.hooks.afterResolve.tap(PLUGIN_NAME, (data) => {
        const { resource } = data.createData as { resource: string };
        resolvePackageFile(this.root, parseResource(resource).path);
      });
    });
    compiler.hooks.contextModuleFactory.tap(PLUGIN_NAME, (factory) => {
      factory.hooks.afterResolve.tap(PLUGIN_NAME, (data) => {
        if (data) resolvePackageFile(this.root, parseResource(data.resource).path);
        return data;
      });
    });
  }
}
