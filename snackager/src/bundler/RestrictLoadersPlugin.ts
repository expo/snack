import { Compiler } from 'webpack';

const PLUGIN_NAME = 'RestrictLoadersPlugin';
const ERROR_MESSAGE = 'Package-supplied Webpack loaders are not supported';

/** Package contents are data; only Snackager's configured loaders may run on the server. */
export default class RestrictLoadersPlugin {
  private readonly allowedLoaders: Set<string>;

  constructor(loaders: string[]) {
    this.allowedLoaders = new Set(loaders);
  }

  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (factory) => {
      factory.hooks.beforeResolve.tap(PLUGIN_NAME, (data) => {
        rejectInlineRequest(data.request);
      });
      factory.hooks.afterResolve.tap(PLUGIN_NAME, (data) => {
        // Check resolved paths before Webpack loads a loader (including its pitch).
        // This also catches substitutions made by loader resolution mappings.
        const { loaders } = data.createData as { loaders: { loader: string }[] };
        for (const { loader } of loaders) {
          if (!this.allowedLoaders.has(loader)) {
            throw new Error(ERROR_MESSAGE);
          }
        }
      });
    });

    compiler.hooks.contextModuleFactory.tap(PLUGIN_NAME, (factory) => {
      // require.context has its own loader-request parser and resolver.
      factory.hooks.beforeResolve.tap(PLUGIN_NAME, (data) => {
        if (data) rejectInlineRequest(data.request);
      });
    });
  }
}

function rejectInlineRequest(request: string) {
  // Also reject loader-disabling prefixes and matchResource syntax. Even a trusted
  // loader must not be invoked with package-controlled options via an inline request.
  if (request.includes('!')) {
    throw new Error(ERROR_MESSAGE);
  }
}
