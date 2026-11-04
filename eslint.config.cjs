const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'src/__tests__/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    plugins: { '@typescript-eslint': tsPlugin, prettier },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      // TypeScript checks global names, including type-only DOM declarations.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      // This rule is new in ESLint 10; retain the existing error-wrapping policy.
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'prettier/prettier': 'error',
    },
  },
];
