"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    createAddNamedImportOnce: null,
    getAsyncRoutes: null,
    getBabelRuntimeVersion: null,
    getBaseUrl: null,
    getBundler: null,
    getEngine: null,
    getExpoRouterAbsoluteAppRoot: null,
    getInlineEnvVarsEnabled: null,
    getIsDev: null,
    getIsDomComponent: null,
    getIsFastRefreshEnabled: null,
    getIsLoaderBundle: null,
    getIsNodeModule: null,
    getIsProd: null,
    getIsReactServer: null,
    getIsServer: null,
    getMetroSourceType: null,
    getPlatform: null,
    getPossibleProjectRoot: null,
    getReactCompiler: null,
    getStaticESM: null,
    toPosixPath: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get createAddNamedImportOnce () {
        return createAddNamedImportOnce;
    },
    get getAsyncRoutes () {
        return getAsyncRoutes;
    },
    get getBabelRuntimeVersion () {
        return getBabelRuntimeVersion;
    },
    get getBaseUrl () {
        return getBaseUrl;
    },
    get getBundler () {
        return getBundler;
    },
    get getEngine () {
        return getEngine;
    },
    get getExpoRouterAbsoluteAppRoot () {
        return getExpoRouterAbsoluteAppRoot;
    },
    get getInlineEnvVarsEnabled () {
        return getInlineEnvVarsEnabled;
    },
    get getIsDev () {
        return getIsDev;
    },
    get getIsDomComponent () {
        return getIsDomComponent;
    },
    get getIsFastRefreshEnabled () {
        return getIsFastRefreshEnabled;
    },
    get getIsLoaderBundle () {
        return getIsLoaderBundle;
    },
    get getIsNodeModule () {
        return getIsNodeModule;
    },
    get getIsProd () {
        return getIsProd;
    },
    get getIsReactServer () {
        return getIsReactServer;
    },
    get getIsServer () {
        return getIsServer;
    },
    get getMetroSourceType () {
        return getMetroSourceType;
    },
    get getPlatform () {
        return getPlatform;
    },
    get getPossibleProjectRoot () {
        return getPossibleProjectRoot;
    },
    get getReactCompiler () {
        return getReactCompiler;
    },
    get getStaticESM () {
        return getStaticESM;
    },
    get toPosixPath () {
        return toPosixPath;
    }
});
function _helpermoduleimports() {
    const data = require("@babel/helper-module-imports");
    _helpermoduleimports = function() {
        return data;
    };
    return data;
}
function _nodepath() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:path"));
    _nodepath = function() {
        return data;
    };
    return data;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getBundler(caller) {
    assertExpoBabelCaller(caller);
    if (!caller) return null;
    if (caller.bundler) return caller.bundler;
    if (// Known tools that use `webpack`-mode via `babel-loader`: `@expo/webpack-config`, Next.js <10
    caller.name === 'babel-loader' || // NextJS 11 uses this custom caller name.
    caller.name === 'next-babel-turbo-loader') {
        return 'webpack';
    }
    // Assume anything else is Metro.
    return 'metro';
}
function getPlatform(caller) {
    assertExpoBabelCaller(caller);
    if (!caller) return null;
    if (caller.platform) return caller.platform;
    const bundler = getBundler(caller);
    if (bundler === 'webpack') {
        return 'web';
    }
    // unknown
    return caller.platform ?? null;
}
function getEngine(caller) {
    assertExpoBabelCaller(caller);
    return caller?.engine ?? 'default';
}
function getPossibleProjectRoot(caller) {
    assertExpoBabelCaller(caller);
    if (!caller) return null;
    if (caller.projectRoot) return caller.projectRoot;
    // unknown
    return process.env.EXPO_PROJECT_ROOT;
}
function getIsReactServer(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isReactServer ?? false;
}
function assertExpoBabelCaller(caller) {}
function getIsDev(caller) {
    assertExpoBabelCaller(caller);
    if (caller?.isDev != null) return caller.isDev;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
}
function getIsFastRefreshEnabled(caller) {
    assertExpoBabelCaller(caller);
    if (!caller) return false;
    // NOTE(@kitten): `isHMREnabled` is always true in `@expo/metro-config`.
    // However, we still use this option to ensure fast refresh is only enabled in supported runtimes (Metro + Expo)
    return !!caller.isHMREnabled && !caller.isServer && !caller.isNodeModule && getIsDev(caller);
}
function getIsProd(caller) {
    assertExpoBabelCaller(caller);
    if (caller?.isDev != null) return caller.isDev === false;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}
function getIsNodeModule(caller) {
    return caller?.isNodeModule ?? false;
}
function getBaseUrl(caller) {
    assertExpoBabelCaller(caller);
    return caller?.baseUrl ?? '';
}
function getReactCompiler(caller) {
    assertExpoBabelCaller(caller);
    return caller?.supportsReactCompiler ?? false;
}
function getStaticESM(caller) {
    assertExpoBabelCaller(caller);
    return caller?.supportsStaticESM;
}
function getIsServer(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isServer ?? false;
}
function getIsDomComponent(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isDomComponent ?? false;
}
function getIsLoaderBundle(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isLoaderBundle ?? false;
}
function getMetroSourceType(caller) {
    assertExpoBabelCaller(caller);
    return caller?.metroSourceType;
}
function getBabelRuntimeVersion(caller) {
    assertExpoBabelCaller(caller);
    let babelRuntimeVersion;
    if (typeof caller?.babelRuntimeVersion === 'string') {
        babelRuntimeVersion = caller.babelRuntimeVersion;
    } else {
        try {
            babelRuntimeVersion = require('@babel/runtime/package.json').version;
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') throw error;
        }
    }
    // NOTE(@kitten): The default shouldn't be higher than `expo/package.json`'s `@babel/runtime` version
    // or `babel-preset-expo/package.json`'s peer dependency range for `@babel/runtime`
    return babelRuntimeVersion ?? '^7.20.0';
}
function getExpoRouterAbsoluteAppRoot(caller) {
    assertExpoBabelCaller(caller);
    const rootModuleId = caller?.routerRoot ?? './app';
    const projectRoot = getPossibleProjectRoot(caller);
    if (!projectRoot && !caller?.routerRoot) {
        return null;
    }
    const resolved = _nodepath().default.isAbsolute(rootModuleId) ? rootModuleId : _nodepath().default.join(projectRoot || '/', rootModuleId);
    // Silently fall back to the default if the configured router root escapes the project root, as a safety net
    if (projectRoot && !isPathInside(resolved, projectRoot)) {
        return _nodepath().default.join(projectRoot, 'app');
    }
    return resolved;
}
function isPathInside(child, parent) {
    const relative = _nodepath().default.relative(parent, child);
    return !!relative && !relative.startsWith('..') && !_nodepath().default.isAbsolute(relative);
}
function getInlineEnvVarsEnabled(caller) {
    assertExpoBabelCaller(caller);
    const isWebpack = getBundler(caller) === 'webpack';
    const isServer = getIsServer(caller);
    const isNodeModule = getIsNodeModule(caller);
    const preserveEnvVars = caller?.preserveEnvVars;
    // Development env vars are added using references to enable HMR in development.
    // Servers have env vars left as-is to read from the environment.
    return !isNodeModule && !isWebpack && !isServer && !preserveEnvVars;
}
function getAsyncRoutes(caller) {
    assertExpoBabelCaller(caller);
    const isServer = getIsServer(caller);
    if (isServer) {
        return false;
    }
    const isProd = getIsProd(caller);
    const platform = getPlatform(caller);
    if (platform !== 'web' && isProd) {
        return false;
    }
    return caller?.asyncRoutes ?? false;
}
const getOrCreateInMap = (map, key, create)=>{
    if (!map.has(key)) {
        const result = create();
        map.set(key, result);
        return [
            result,
            true
        ];
    }
    return [
        map.get(key),
        false
    ];
};
function createAddNamedImportOnce(t) {
    const addedImportsCache = new Map();
    return function addNamedImportOnce(path, name, source) {
        const [sourceCache] = getOrCreateInMap(addedImportsCache, source, ()=>new Map());
        const [identifier, didCreate] = getOrCreateInMap(sourceCache, name, ()=>(0, _helpermoduleimports().addNamed)(path, name, source));
        // for cached imports, we need to clone the resulting identifier, because otherwise
        // '@babel/plugin-transform-modules-commonjs' won't replace the references to the import for some reason.
        // this is a helper for that.
        return didCreate ? identifier : t.cloneNode(identifier);
    };
}
const REGEXP_REPLACE_SLASHES = /\\/g;
function toPosixPath(filePath) {
    return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}

//# sourceMappingURL=common.js.map
