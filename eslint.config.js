import globals from 'globals';
import tseslint from 'typescript-eslint';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
      'vitest.config.ts',
      'vitest.config.js'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      },
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': 'off',
      'no-unused-vars': 'off'
    }
  }
);
