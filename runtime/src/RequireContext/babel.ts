import { template } from 'snack-babel-standalone';
import path from 'path';

import * as Logger from '../Logger';
import { getMatchingFiles } from './files';

export default function snackInlineRequireContext({ types: t }: any) {
  return {
    name: 'snack-inline-require-context',
    visitor: {
      MemberExpression(path: any) {
        const node = path.node;

        if (
          t.isCallExpression(path.parent) &&
          t.isIdentifier(node.object, { name: 'require' }) &&
          t.isIdentifier(node.property, { name: 'context' }) &&
          !path.scope.hasOwnBinding('require')
        ) {
          // Get the require.context arguments, such as `<directory>` and `<regex>`.
          const contextDirectory = path.parent.arguments[0]?.value;
          const contextRegex = path.parent.arguments[2]?.value ?? /^\.\/.*$/;

          if (!contextDirectory) return; // abort

          // @ts-expect-error
          const contextTarget = getFilePathFromBabelFilePath(this.filename, contextDirectory);
          const contextFiles = getMatchingFiles(contextTarget, contextRegex);

          path.parentPath.replaceWith(createInlineTemplate(contextFiles)());
        }
      },
    },
  };

  // const contextTemplate = template.smart(
  //   `(function () {
  //     function req() {}
  //     req.keys = function () { return []; }
  //     req.resolve = function () {};
  //     return req;
  //   }())`);

  // return {
  //   name: 'snack-inline-require-context',
  //   visitor: {
  //     MemberExpression(path: any) {
  //       const node = path.node;
  //       if () {
  //         path.parentPath.replaceWith(contextTemplate());
  //       }
  //     }
  //   }
  // }
}

function getFilePathFromBabelFilePath(babelPath: string, directory: string) {
  const moduleFile = babelPath
    .replace(/^\//, '') // remove starting `/`
    .replace(/module:[/]+/, ''); // remove `module://` prefix

  const moduleDir = path.dirname(moduleFile);

  return './' + path.normalize(path.join(moduleDir, directory));
}

function createInlineTemplate(filePaths: string[]) {
  const mapProperties = filePaths.map(
    (filePath) => `'${filePath}': { enumerable: true, get() { return require('${filePath}'); } }`
  );

  return template.smart(`
    (function() {
      // Snack inline require(tm)

      const map = Object.defineProperties({}, {
        ${mapProperties.join(',\n')}
      });

      function snackRequireContext(key) {
        return map[key];
      }

      snackRequireContext.keys = function snackRequireContextKeys() {
        return Object.keys(map);
      }

      snackRequireContext.resolve = function snackRequireContextResolve(key) {
        throw new Error('Unimplemented Snack module context functionality');
      }

      return snackRequireContext;
    })();
  `);
}
