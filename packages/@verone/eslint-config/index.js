/**
 * @verone/eslint-config
 *
 * Configuration ESLint stricte pour le monorepo Vérone
 * Inclut : TypeScript strict, Next.js, Storybook, Prettier
 *
 * Best Practices 2025 :
 * - plugin:@typescript-eslint/recommended
 * - plugin:prettier/recommended (désactive conflits)
 * - Naming conventions strictes
 * - Import organization
 *
 * @see https://typescript-eslint.io/getting-started
 * @see https://github.com/prettier/eslint-plugin-prettier
 */

module.exports = {
  extends: [
    // Next.js + Core Web Vitals + TypeScript
    'next/core-web-vitals',

    // TypeScript ESLint Recommended (2025)
    'plugin:@typescript-eslint/recommended',

    // Storybook
    'plugin:storybook/recommended',

    // Prettier (DOIT ÊTRE EN DERNIER)
    // Active eslint-plugin-prettier + désactive règles conflictuelles
    'plugin:prettier/recommended',
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },

  rules: {
    // =========================================================================
    // TYPESCRIPT STRICT MODE (Best Practices 2025)
    // =========================================================================

    // Typage Strict
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',

    // Imports & Types
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      },
    ],
    '@typescript-eslint/consistent-type-exports': [
      'error',
      {
        fixMixedExportsWithInlineTypeSpecifier: true,
      },
    ],

    // Naming Conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
    ],

    // Code Quality
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',

    // =========================================================================
    // REACT & NEXT.JS BEST PRACTICES
    // =========================================================================

    // Hooks Rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Best Practices
    'react/jsx-no-target-blank': ['error', { allowReferrer: true }],
    'react/self-closing-comp': 'error',
    'react/jsx-boolean-value': ['error', 'never'],

    // =========================================================================
    // CODE CONSISTENCY
    // =========================================================================

    // Imports Organization
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
        ],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: 'next/**',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
          },
        ],
        pathGroupsExcludedImportTypes: ['react'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // No Unused Vars (avec exceptions)
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // Console Statements (warning only)
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'],
      },
    ],

    // Debugger Statements
    'no-debugger': 'error',

    // =========================================================================
    // PERFORMANCE & SECURITY
    // =========================================================================

    // No Dangerous Patterns
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Async Best Practices
    'no-async-promise-executor': 'error',
    'require-await': 'warn',

    // =========================================================================
    // VÉRONE-SPECIFIC RULES
    // =========================================================================

    // Next.js Image Optimization
    '@next/next/no-img-element': 'error',

    // Règles standards désactivées (héritées de next/core-web-vitals)
    'react/no-unescaped-entities': 'off',

    // Prefer const over let
    'prefer-const': 'error',
    'no-var': 'error',
  },

  overrides: [
    {
      // Disable type-aware linting for files outside tsconfig.json
      files: [
        '**/*.config.ts',
        '**/*.config.js',
        '**/*.config.mjs',
        'scripts/**/*.ts',
        'scripts/**/*.mjs',
        'docs/**/*.tsx',
        'docs/**/*.ts',
      ],
      parserOptions: {
        project: null,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-anonymous-default-export': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        // Disable type-aware rules
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/await-thenable': 'off',
      },
    },
    {
      // Relaxed rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        'no-console': 'off',
      },
    },
  ],
};
