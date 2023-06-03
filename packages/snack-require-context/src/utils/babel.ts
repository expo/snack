import type * as BabelCore from '@babel/core';
import type { BooleanLiteral, RegExpLiteral, StringLiteral } from '@babel/types';

import type { SnackRequireContextRequest } from './context';
import { convertRequestToVirtualModulePath, resolveContextDirectory } from './context';
import { sanitizeFilePath } from './path';

/**
 * Convert `require.context` statements to virtual modules `require(<vmodule>)`.
 * These virtual modules are resolved inside the Snack Runtime itself.
 * This Babel plugin is used in both Snackager (for libraries) and Snack Runtime (for user-provided code).
 */
export function snackRequireContextVirtualModuleBabelPlugin({
  types,
}: typeof BabelCore): BabelCore.PluginObj {
  return {
    name: 'snack-require-context-virtual-module',
    visitor: {
      MemberExpression(path) {
        const node = path.node;

        if (
          types.isCallExpression(path.parent) &&
          types.isIdentifier(node.object, { name: 'require' }) &&
          types.isIdentifier(node.property, { name: 'context' }) &&
          !path.scope.hasOwnBinding('require') &&
          path.parent.arguments.length >= 1
        ) {
          // Gather the `require.context` arguments
          const directory = path.parent.arguments[0] as StringLiteral;
          const isRecursive = path.parent.arguments[1] as undefined | BooleanLiteral;
          const matching = path.parent.arguments[2] as undefined | RegExpLiteral;
          const mode = path.parent.arguments[3] as undefined | StringLiteral;

          // Convert the arguments into a virtual module path
          const contextModule = convertRequestToVirtualModulePath({
            directory: resolveContextDirectory(sanitizeFilePath(this.filename), directory.value),
            isRecursive: isRecursive?.value,
            matching: matching?.pattern ? new RegExp(matching.pattern) : undefined,
            mode: mode?.value as undefined | SnackRequireContextRequest['mode'],
          });

          // If everything succeeded, replace the `require.context` with `require(<vmodule>)`
          if (contextModule) {
            path.parentPath.replaceWith(
              // @ts-expect-error Somehow typescript doesnt like this
              createRequireStatement(contextModule)
            );
          }
        }
      },
    },
  };
}

/**
 * Generate the AST required for a `require("...")` statement.
 * We avoid importing the `@babel/core` `template` function to avoid adding it to the runtime.
 * A new AST can be created through `require('@babel/core').template.smart('require("...")')()`.
 */
function createRequireStatement(modulePath: string) {
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'require',
      },
      arguments: [
        {
          type: 'StringLiteral',
          value: modulePath,
          extra: {
            rawValue: modulePath,
            raw: `"${modulePath}"`,
          },
        },
      ],
    },
  };
}
