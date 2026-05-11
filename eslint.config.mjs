import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'archive/**',
    'docs/archive/**',
    'scripts/archive/**',
    'scripts/**',
    'llm-council-master/**',
    'testsprite_tests/**',
    'tests/**',
    '**/__tests__/**',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'prefer-const': 'off',
    },
  },
])

export default eslintConfig
