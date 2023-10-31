// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettierConfig = require('./prettier.config');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    project: ['./tsconfig.json', './src/admin/tsconfig.json'],
  },
  env: {
    node: true,
    es6: true,
  },
  plugins: ['@typescript-eslint', 'prettier', 'node', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended', 'plugin:node/recommended', 'plugin:import/typescript'],
  rules: {
    'prefer-destructuring': ['error', { AssignmentExpression: { array: false } }],
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    'prettier/prettier': ['warn', prettierConfig],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/comma-dangle': 'off',
  },
};
