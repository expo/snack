export const defaultConfig = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    errorRecovery: true,
    requireConfigFile: false,
    babelOptions: {
      babelrc: false,
      configFile: false,
      ast: false,
      presets: [
        'module:metro-react-native-babel-preset',
        '@babel/preset-typescript',
      ],
    },
  },
  env: {
    es6: true,
  },
  plugins: ['react', 'react-hooks', 'react-native'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  globals: {
    __DEV__: false,
    __dirname: false,
    alert: false,
    Blob: false,
    cancelAnimationFrame: false,
    cancelIdleCallback: false,
    clearImmediate: true,
    clearInterval: false,
    clearTimeout: false,
    console: false,
    escape: false,
    Event: false,
    EventTarget: false,
    exports: false,
    fetch: false,
    File: false,
    FileReader: false,
    FormData: false,
    global: false,
    Map: true,
    module: false,
    navigator: false,
    process: false,
    Promise: true,
    requestAnimationFrame: true,
    requestIdleCallback: true,
    require: false,
    Set: true,
    setImmediate: true,
    setInterval: false,
    setTimeout: false,
    WebSocket: false,
    window: false,
    XMLHttpRequest: false,
  },
  rules: {
    'constructor-super': 'error',
    'no-case-declarations': 'error',
    'no-class-assign': 'error',
    'no-cond-assign': 'error',
    'no-const-assign': 'error',
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-delete-var': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'error',
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-semi': 'error',
    'no-fallthrough': 'error',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-new-symbol': 'error',
    'no-obj-calls': 'error',
    'no-octal': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-self-assign': 'error',
    'no-sparse-arrays': 'error',
    'no-this-before-super': 'error',
    'no-undef': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unused-labels': 'error',
    'require-yield': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',

    // TODO(cedric): check if we still need to support Flow
    // 'flowtype/array-style-complex-type': 'off',
    // 'flowtype/array-style-simple-type': 'off',
    // 'flowtype/boolean-style': 'off',
    // 'flowtype/define-flow-type': 'error',
    // 'flowtype/delimiter-dangle': 'off',
    // 'flowtype/generic-spacing': 'off',
    // 'flowtype/newline-after-flow-annotation': 'off',
    // 'flowtype/no-dupe-keys': 'error',
    // 'flowtype/no-existential-type': 'off',
    // 'flowtype/no-flow-fix-me-comments': 'off',
    // 'flowtype/no-mutable-array': 'off',
    // 'flowtype/no-primitive-constructor-types': 'off',
    // 'flowtype/no-types-missing-file-annotation': 'off',
    // 'flowtype/no-unused-expressions': 'off',
    // 'flowtype/no-weak-types': 'off',
    // 'flowtype/object-type-delimiter': 'off',
    // 'flowtype/require-exact-type': 'off',
    // 'flowtype/require-parameter-type': 'off',
    // 'flowtype/require-return-type': 'off',
    // 'flowtype/require-types-at-top': 'off',
    // 'flowtype/require-valid-file-annotation': 'off',
    // 'flowtype/require-variable-type': 'off',
    // 'flowtype/semi': 'off',
    // 'flowtype/sort-keys': 'off',
    // 'flowtype/space-after-type-colon': 'off',
    // 'flowtype/space-before-generic-bracket': 'off',
    // 'flowtype/space-before-type-colon': 'off',
    // 'flowtype/type-id-match': 'off',
    // 'flowtype/type-import-style': 'off',
    // 'flowtype/union-intersection-spacing': 'off',
    // 'flowtype/use-flow-type': 'off',
    // 'flowtype/valid-syntax': 'off',

    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/no-deprecated': 'error',
    'react/no-did-mount-set-state': 'error',
    'react/no-did-update-set-state': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-is-mounted': 'error',
    'react/no-string-refs': 'error',
    'react/react-in-jsx-scope': 'off', // Disabled for React 17+, where its optional
    'react/require-render-return': 'error',

    'react-native/no-single-element-style-arrays': 'error',
    'react-native/no-unused-styles': 'error',

    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
};

export const tsConfig = {
  ...defaultConfig,
  parserOptions: {
    ...defaultConfig.parserOptions,
    babelOptions: {
      ...defaultConfig.parserOptions.babelOptions,
      plugins: ['@babel/plugin-transform-typescript'],
    },
  },
};

/**
 * Get the ESLint config that should be used for the to-lint file.
 * This will return either `defaultConfig`, or `tsConfig`.
 * When a custom config is provided, it will merge the parser options.
 */
export function getLinterConfig(fileName: string, customConfig?: any): any {
  const isTs = /\.tsx?$/.test(fileName);
  let baseConfig = isTs ? tsConfig : defaultConfig;

  if (customConfig) {
    baseConfig = {
      // Reuse the same bundled parser, we can't really change that
      parser: baseConfig.parser,
      parserOptions: baseConfig.parserOptions,
      // Use the configuration provided by the user
      ...customConfig,
    };
  }

  return baseConfig;
}
