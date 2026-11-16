/**
 * Copyright © 2026 650 Industries.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "reactUseCachePlugin", {
    enumerable: true,
    get: function() {
        return reactUseCachePlugin;
    }
});
function _nodepath() {
    const data = require("node:path");
    _nodepath = function() {
        return data;
    };
    return data;
}
function _nodeurl() {
    const data = /*#__PURE__*/ _interop_require_default(require("node:url"));
    _nodeurl = function() {
        return data;
    };
    return data;
}
const _common = require("../common");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const MODES = {
    embed: 'embed',
    private: 'private',
    'no-store': 'no-store'
};
function parseDirective(value) {
    if (value === 'use cache') {
        return {
            value,
            mode: 'cache'
        };
    }
    const options = /^use cache:(.*)$/.exec(value)?.[1];
    if (options === undefined) {
        return undefined;
    }
    const words = options.trim().split(/\s+/);
    const directive = {
        value,
        mode: 'cache'
    };
    let hasMode = false;
    for (const word of words){
        const [key = '', option] = word.split(/:(.*)/s);
        if (key === 'max-age') {
            if (directive.maxAge !== undefined || !option || !/^\d+$/.test(option)) {
                directive.error ??= `'${value}' has an invalid max-age. Use max-age:<seconds>, for example max-age:300.`;
            } else {
                directive.maxAge = Number(option);
            }
        } else if (MODES[key] && !hasMode) {
            hasMode = true;
            directive.mode = MODES[key];
            directive.argsRef = option;
        } else {
            directive.error ??= MODES[key] ? `'${value}' has more than one mode. Use one of embed, private, or no-store.` : `'${value}' has the unknown word "${word}". Use embed, embed:<list>, private, no-store, or max-age:<seconds>.`;
        }
    }
    if (directive.mode === 'no-store' && directive.maxAge !== undefined) {
        directive.error ??= `'${value}' has a max-age, but no-store results are never stored. Remove the max-age.`;
    }
    return directive;
}
function reactUseCachePlugin(api) {
    const { template, types } = api;
    const isReactServer = api.caller(_common.getIsReactServer);
    // Loaders and API routes run in the node environment, and the development server has no RSC index.
    // Both read the mode from the reference.
    const keepsMode = api.caller(_common.getIsServer) || api.caller(_common.getIsDev);
    const possibleProjectRoot = api.caller(_common.getPossibleProjectRoot);
    function getDirective(directives) {
        for (const directive of directives){
            const parsed = parseDirective(directive.value.value);
            if (parsed) return parsed;
        }
        return undefined;
    }
    function removeCacheDirectives(directives) {
        return directives.filter((directive)=>!parseDirective(directive.value.value));
    }
    function assertArgsRef(program, statement, directive) {
        if (directive.error) {
            throw statement.buildCodeFrameError(directive.error);
        }
        const { argsRef } = directive;
        if (argsRef === undefined) {
            return;
        }
        if (directive.mode !== 'embed') {
            throw statement.buildCodeFrameError(`Only 'use cache: embed' takes an argument list. Remove ":${argsRef}" from '${directive.value}'.`);
        }
        if (!types.isValidIdentifier(argsRef) || !program.scope.hasOwnBinding(argsRef)) {
            throw statement.buildCodeFrameError(`'${directive.value}' refers to "${argsRef}", which is not defined in this module.`);
        }
    }
    /** Returns the function of `export async function f() {}` or `export const f = async () => {}`. */ function getExportedFunction(declaration) {
        if (types.isFunctionDeclaration(declaration) && declaration.id) {
            return {
                name: declaration.id.name,
                fn: declaration
            };
        }
        if (types.isVariableDeclaration(declaration) && declaration.declarations.length === 1) {
            const declarator = declaration.declarations[0];
            if (types.isIdentifier(declarator.id) && (types.isArrowFunctionExpression(declarator.init) || types.isFunctionExpression(declarator.init))) {
                return {
                    name: declarator.id.name,
                    fn: declarator.init
                };
            }
        }
        return undefined;
    }
    function getExportNames(declaration) {
        if (types.isVariableDeclaration(declaration)) {
            return declaration.declarations.flatMap((d)=>types.isIdentifier(d.id) ? [
                    d.id.name
                ] : []);
        }
        if ('id' in declaration && types.isIdentifier(declaration.id)) {
            return [
                declaration.id.name
            ];
        }
        return [];
    }
    function isTypeOnly(declaration) {
        return types.isTSTypeAliasDeclaration(declaration) || types.isTSInterfaceDeclaration(declaration) || types.isTSDeclareFunction(declaration) || types.isTypeAlias(declaration) || types.isInterfaceDeclaration(declaration);
    }
    /** Collects cached exports and removes their directives. Returns undefined for other modules. */ function collectCachedExports(program) {
        const fileDirective = getDirective(program.node.directives);
        const isUseServerFile = program.node.directives.some((d)=>d.value.value === 'use server');
        const cached = [];
        const others = [];
        for (const statement of program.get('body')){
            if (statement.isExportDefaultDeclaration() || statement.isExportAllDeclaration()) {
                others.push({
                    name: 'default',
                    path: statement
                });
                continue;
            }
            if (!statement.isExportNamedDeclaration()) continue;
            const declaration = statement.node.declaration;
            if (statement.node.exportKind === 'type' || declaration && isTypeOnly(declaration)) {
                continue;
            }
            if (!declaration) {
                for (const specifier of statement.node.specifiers){
                    const exported = specifier.exported;
                    others.push({
                        name: types.isIdentifier(exported) ? exported.name : exported.value,
                        path: statement
                    });
                }
                continue;
            }
            const exported = getExportedFunction(declaration);
            const body = exported && types.isBlockStatement(exported.fn.body) ? exported.fn.body : null;
            const directive = (body && getDirective(body.directives)) ?? (exported && fileDirective);
            if (exported && directive) {
                if (body?.directives.some((directive)=>directive.value.value === 'use server')) {
                    throw statement.buildCodeFrameError(`A 'use cache' function is already a server function. Remove 'use server' from "${exported.name}".`);
                }
                if (isUseServerFile) {
                    throw statement.buildCodeFrameError(`A 'use server' file cannot contain 'use cache' functions. Move "${exported.name}" to another module.`);
                }
                if (!exported.fn.async) {
                    throw statement.buildCodeFrameError(`'use cache' functions must be async.`);
                }
                assertArgsRef(program, statement, directive);
                if (body) {
                    body.directives = removeCacheDirectives(body.directives);
                }
                cached.push({
                    name: exported.name,
                    mode: directive.mode,
                    argsRef: directive.argsRef,
                    maxAge: directive.maxAge
                });
            } else {
                for (const name of getExportNames(declaration)){
                    others.push({
                        name,
                        path: statement
                    });
                }
            }
        }
        if (!cached.length) {
            return undefined;
        }
        for (const other of others){
            if (other.name === 'prerender') {
                throw other.path.buildCodeFrameError("The `prerender` export was replaced. Name the argument list in the directive instead: 'use cache: embed:prerender'. The list does not need to be exported.");
            }
            throw other.path.buildCodeFrameError(`A module with 'use cache' functions can only export 'use cache' functions. Move "${other.name}" to another module.`);
        }
        program.node.directives = removeCacheDirectives(program.node.directives);
        return cached;
    }
    return {
        name: 'expo-use-cache',
        visitor: {
            Program (path, state) {
                if (!state.file.code.includes('use cache')) {
                    return;
                }
                if (path.node.directives.some((d)=>d.value.value === 'use client')) {
                    if (getDirective(path.node.directives)) {
                        throw path.buildCodeFrameError(`It's not possible to have both "use client" and "use cache" directives in the same file.`);
                    }
                    return;
                }
                const cached = collectCachedExports(path);
                if (!cached) {
                    return;
                }
                const filePath = state.file.opts.filename;
                if (!filePath) {
                    // This can happen in tests or systems that use Babel standalone.
                    throw new Error('[Babel] Expected a filename to be set in the state');
                }
                const projectRoot = possibleProjectRoot || state.file.opts.root || '';
                // Must match the module id of the server actions plugin.
                const moduleId = './' + (0, _common.toPosixPath)((0, _nodepath().relative)(projectRoot, filePath));
                // Babel metadata is untyped.
                const metadata = state.file.metadata;
                metadata.reactServerReference = _nodeurl().default.pathToFileURL(filePath).href;
                if (isReactServer) {
                    path.unshiftContainer('body', template.statement.ast(`import { registerServerReference as _registerServerReference } from "react-server-dom-webpack/server";`));
                    for (const { name, mode, argsRef, maxAge } of cached){
                        path.pushContainer('body', template.statements.ast(`_registerServerReference(${name}, ${JSON.stringify(moduleId)}, ${JSON.stringify(name)});\n` + `${name}.$$expoCache = ${JSON.stringify(mode)};` + (argsRef ? `\n${name}.$$expoEmbedArgs = ${argsRef};` : '') + (maxAge !== undefined ? `\n${name}.$$expoCacheMaxAge = ${maxAge};` : '')));
                    }
                    metadata.reactServerActions = {
                        id: moduleId,
                        names: cached.map((c)=>c.name)
                    };
                    return;
                }
                path.node.body = [];
                path.node.directives = [];
                path.pushContainer('body', template.statements.ast([
                    `import { createCachedServerReference } from 'expo-router/rsc/internal';`,
                    // The client reads the mode from the RSC index, so that a mode change keeps the client bundle.
                    ...cached.map(({ name, mode })=>`export const ${name} = createCachedServerReference(${JSON.stringify(`${moduleId}#${name}`)}${keepsMode ? `, ${JSON.stringify(mode)}` : ''});`)
                ].join('\n')));
                metadata.proxyExports = cached.map((c)=>c.name);
            }
        }
    };
}

//# sourceMappingURL=use-cache-plugin.js.map
