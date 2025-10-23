// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: ["dist/", "vite.config.ts", "tailwind.config.js"],
  },
  // JS and base TS rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // React rules
  {
    ...reactRecommended,
    files: ['**/*.{ts,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Type-aware rules for TS/TSX files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      ...tseslint.configs.recommendedTypeChecked.rules,
    },
  },
  // React Hooks rules
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  // React Refresh rules
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },
  // ESLint config file specific config
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
      }
    },
  }
];
