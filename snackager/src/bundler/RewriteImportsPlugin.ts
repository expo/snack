function rewriteImports(specifier) {
  // Rewrite invalid "@babel/runtime/helpers/esm/..." imports.
  // Some packages such as `@material-ui/core` incorrectly import helpers from the @babel/runtime
  // plugin like this: `import _extends from "@babel/runtime/helpers/esm/extends";`
  // This caused the `@drafbit/ui` bundle to falsly externalize babel runtime helpers.
  if (
    specifier.value.startsWith('@babel/runtime/helpers/esm/') &&
    !specifier.value.endsWith('.mjs')
  ) {
    specifier.value = specifier.value.replace(
      '@babel/runtime/helpers/esm/',
      '@babel/runtime/helpers/'
    );
  }
}

export default function RewriteImportsPlugin() {
  return {
    visitor: {
      'ImportDeclaration|ExportNamedDeclaration'(path) {
        if (path.node.source) rewriteImports(path.node.source);
      },
      CallExpression(path) {
        if (path.node.callee.name === 'require') {
          const [specifier] = path.node.arguments;
          if (specifier && specifier.type === 'StringLiteral') rewriteImports(specifier);
        }
      },
    },
  };
}
