const js = require('@eslint/js');
const nextPlugin = require('@next/eslint-plugin-next');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: '.',
        sourceType: 'module',
        ecmaVersion: 2020,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        setInterval: 'readonly',
      },
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off', // TypeScriptが型チェックを行うため
      
      // import順序のルール
      'import/order': [
        'error',
        {
          groups: [
            'builtin',    // Node.js標準モジュール
            'external',   // npmパッケージ
            'internal',   // @/で始まる内部モジュール
            'parent',     // ../で始まる親ディレクトリ
            'sibling',    // ./で始まる同じディレクトリ
            'index'       // ./index
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
    },
  },
  {
    ignores: [
      'scripts/',
      '*.js',
      'node_modules/',
      '.next/',
      'dist/',
      'build/',
      '.env example',
      '.prettierignore',
      '.gitignore',
      '*.md',
      '.github/',
      '.git/',
    ],
  },
];
