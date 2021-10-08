module.exports = {
  root: true,
  extends: [
    'universe/native',
    'universe/node',
    'universe/web',
    'universe/shared/typescript-analysis',
    'plugin:import/typescript',
  ],
  plugins: ['import'],
  settings: {
    react: {
      version: '16.8',
    },
  },
  rules: {
    'spaced-comment': ['warn', 'always', { block: { balanced: true } }],
    'import/no-extraneous-dependencies': ['warn'],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.d.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        '@typescript-eslint/naming-convention': [
          'warn',
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: 'enumMember', format: ['UPPER_CASE'] },
        ],
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'warn',
      },
    },
  ],
};
