import * as babel from '@babel/parser';
import { parse, types } from 'recast';
import validate from 'validate-npm-package-name';

import getFileLanguage from './getFileLanguage';

export type FileDependency = {
  isPackage: boolean;
  version?: string;
  location?: {
    fileName: string;
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  };
};

export type FileDependencies = { [name: string]: FileDependency };

const parserPlugins: babel.ParserPlugin[] = [
  'asyncGenerators',
  'bigInt',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  ['decorators', { decoratorsBeforeExport: true }],
  'doExpressions',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  ['pipelineOperator', { proposal: 'minimal' }],
  'throwExpressions',
];

const getVersionFromComments = (comments: { value: string }[]) => {
  return comments?.[0] && /^\s*((\d+\.)?(\d+\.)?(\*|\d+))|(LATEST)\s*$/.test(comments[0].value)
    ? comments[0].value.trim()
    : null;
};

const isValidBundle = (name: any) => {
  if (typeof name !== 'string') {
    return false;
  }

  const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(name);
  const fullName = match ? (match[1] ? `@${match[1]}/` : '') + match[2] : null;

  return fullName ? validate(fullName).validForOldPackages : false;
};

const removeCommentFromPath = (path: any) => {
  let node;

  if (path.node.type === 'CallExpression') {
    const { parentPath } = path;

    if (parentPath.node.type === 'VariableDeclarator') {
      node = parentPath.parentPath.node;
    } else {
      node = parentPath.node;
    }
  } else {
    node = path.node;
  }

  node.comments = node.comments || [];
  node.comments = node.comments.filter(
    (comment: any) => !(comment.type === 'CommentLine' && comment.trailing)
  );
};

const findDependencies = (
  code: string,
  filename: string,
  removeVersionComments: boolean = false
): FileDependencies => {
  const babelPlugins = [...parserPlugins];
  const language = getFileLanguage(filename);

  if (language === 'typescript') {
    babelPlugins.push('typescript');

    if (filename.endsWith('.tsx')) {
      babelPlugins.push('jsx');
    }
  } else {
    babelPlugins.push('flow', 'jsx');
  }

  const parser = {
    parse: (code: string) =>
      babel.parse(code, {
        sourceType: 'module',
        sourceFilename: filename,
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        tokens: true,
        plugins: babelPlugins,
      }),
  };

  const dependencies: FileDependencies = {};
  const ast = parse(code, { parser });

  const findModuleFromRequire = (path: any) => {
    const { callee, arguments: args } = path.node;

    let name;

    if (callee.name === 'require' && args.length === 1) {
      if (args[0].type === 'Literal' || args[0].type === 'StringLiteral') {
        name = args[0].value;
      } else if (args[0].type === 'TemplateLiteral' && args[0].quasis.length === 1) {
        name = args[0].quasis[0].value.cooked;
      }
    }

    if (name) {
      const version = getVersionFromComments(
        args[0]?.trailingComments || path.parentPath.parentPath.node.trailingComments
      );

      if (removeVersionComments) {
        removeCommentFromPath(path);
      }

      const loc = path.node.source?.loc || path.node.loc;
      dependencies[name] = {
        isPackage: isValidBundle(name),
        version: version ?? undefined,
        location: loc
          ? {
              fileName: filename,
              startLineNumber: loc.start.line,
              startColumn: loc.start.column + 1,
              endLineNumber: loc.end.line,
              endColumn: loc.end.column + 1,
            }
          : undefined,
      };
    }
  };

  const findModuleFromImport = (path: any) => {
    const name = path.node.source?.value;

    if (name) {
      const version = getVersionFromComments(path.node.trailingComments);

      if (removeVersionComments) {
        removeCommentFromPath(path);
      }

      dependencies[name] = {
        isPackage: isValidBundle(name),
        version: version ?? undefined,
        location: path.node.source.loc
          ? {
              fileName: filename,
              startLineNumber: path.node.source.loc.start.line,
              startColumn: path.node.source.loc.start.column + 1,
              endLineNumber: path.node.source.loc.end.line,
              endColumn: path.node.source.loc.end.column + 1,
            }
          : undefined,
      };
    }
  };

  try {
    types.visit(ast, {
      visitImportDeclaration(path) {
        findModuleFromImport(path);
        this.traverse(path);
      },

      visitExportNamedDeclaration(path) {
        findModuleFromImport(path);
        this.traverse(path);
      },

      visitExportAllDeclaration(path) {
        findModuleFromImport(path);
        this.traverse(path);
      },

      visitCallExpression(path) {
        findModuleFromRequire(path);
        this.traverse(path);
      },
    });
  } catch {
    // Ignore error: did not recognize object of type "..."
  }

  return dependencies;
};

export default findDependencies;
