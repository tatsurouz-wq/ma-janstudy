import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import functional from 'eslint-plugin-functional'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'playwright-report', 'test-results'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      functional,
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-console': 'error',
      'functional/immutable-data': [
        'error',
        {
          ignoreClasses: true,
          ignoreImmediateMutation: true,
          ignoreIdentifierPattern: ['^mutable[A-Z]'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'functional/immutable-data': 'off',
    },
  },
)
