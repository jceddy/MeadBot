const js = require('@eslint/js');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    // conversion factors are written with more significant digits than a double can hold,
    // for documentation purposes; they round to the same value either way
    files: ['src/calculator/CalculatorAPI.Constants.js'],
    rules: {
      'no-loss-of-precision': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'media/**'],
  },
];
