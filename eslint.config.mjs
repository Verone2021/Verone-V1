/**
 * ESLint Flat Config - Verone Monorepo
 *
 * Configuration ESLint 9 moderne pour le monorepo Verone
 * Inclut : TypeScript strict, Next.js, Prettier
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @see https://typescript-eslint.io/getting-started
 */

import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import path from 'path';
import { fileURLToPath } from 'url';
import tseslint from 'typescript-eslint';

// Mimic CommonJS variables for FlatCompat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FlatCompat for legacy configs (eslint-config-next, prettier)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslint.configs.recommended,
});

export default defineConfig([
  // ==========================================================================
  // GLOBAL IGNORES
  // ==========================================================================
  {
    ignores: [
      // Dependencies
      '**/node_modules/**',
      '**/.pnpm-store/**',

      // Build outputs
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.cache/**',

      // Generated files
      '**/next-env.d.ts',
      '**/*.generated.ts',
      '**/src/types/supabase.ts',
      '**/*.d.ts',

      // Config files
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.ts',
      '**/postcss.config.js',
      '**/tailwind.config.ts',

      // Storybook
      '**/.storybook/**',
      '**/storybook-static/**',
      '**/*.stories.tsx',
      '**/*.stories.ts',

      // Playwright
      '**/.playwright-mcp/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/.playwright/**',

      // Package manager files
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',
    ],
  },

  // ==========================================================================
  // BASE CONFIGS
  // ==========================================================================

  // ESLint recommended
  eslint.configs.recommended,

  // TypeScript ESLint recommended
  ...tseslint.configs.recommended,

  // Next.js Core Web Vitals (via FlatCompat)
  ...compat.extends('next/core-web-vitals'),

  // Prettier (must be last to disable conflicting rules)
  ...compat.extends('plugin:prettier/recommended'),

  // ==========================================================================
  // TYPESCRIPT FILES - Apps & Packages
  // ==========================================================================
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // =====================================================================
      // TYPESCRIPT STRICT MODE
      // =====================================================================

      // Typage Strict (warnings pour migration progressive)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Type imports/exports
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'warn',
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],

      // Naming Convention: DISABLED
      // Les types Supabase utilisent snake_case (convention PostgreSQL)
      '@typescript-eslint/naming-convention': 'off',

      // Explicit return type: Relaxed
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Code Quality - Type-aware rules
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Allow empty object types (common in React props)
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Ban ts-comment: Relaxed
      '@typescript-eslint/ban-ts-comment': 'warn',

      // Require imports: Relaxed for scripts
      '@typescript-eslint/no-require-imports': 'warn',

      // No Unused Vars (with exceptions)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // =====================================================================
      // REACT & NEXT.JS
      // =====================================================================

      // Hooks Rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Best Practices
      'react/jsx-no-target-blank': ['error', { allowReferrer: true }],
      'react/self-closing-comp': 'warn',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/no-unescaped-entities': 'off',

      // Next.js Image Optimization
      '@next/next/no-img-element': 'warn',

      // =====================================================================
      // CODE QUALITY
      // =====================================================================

      // Console Statements (warning only)
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],

      // Debugger Statements
      'no-debugger': 'error',

      // No Dangerous Patterns
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Async Best Practices
      'no-async-promise-executor': 'error',
      'require-await': 'off', // Disabled - too noisy

      // Prefer const over let
      'prefer-const': 'warn',
      'no-var': 'error',

      // Disable ESLint core no-unused-vars (use TypeScript version)
      'no-unused-vars': 'off',

      // Case declarations (warning for migration)
      'no-case-declarations': 'warn',

      // Prettier (formatting only)
      'prettier/prettier': 'warn',
    },
  },

  // ==========================================================================
  // SCRIPTS - Relaxed rules (no type-aware linting)
  // ==========================================================================
  {
    files: ['scripts/**/*.{ts,js,mjs}', '.claude/**/*.{ts,js}', '**/scripts/**/*.{ts,js,mjs}'],
    languageOptions: {
      parserOptions: {
        project: null, // Disable type-aware linting
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'no-unused-vars': 'off',

      // Disable ALL type-aware rules
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
    },
  },

  // ==========================================================================
  // TEST FILES - Relaxed rules
  // ==========================================================================
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/tests/**/*.ts',
      '**/tests/**/*.tsx',
      'packages/e2e-*/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off',
      // Playwright fixtures use `use()` which is NOT a React hook
      'react-hooks/rules-of-hooks': 'off',
      // Allow empty patterns in test destructuring
      'no-empty-pattern': 'off',
    },
  },

  // ==========================================================================
  // DOCUMENTATION FILES
  // ==========================================================================
  {
    files: ['docs/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: LinkMe hooks with heavy Supabase any casts
  // These files heavily use `(supabase as any)` due to complex query patterns
  // TODO: Remove after Phase 2 typed wrappers (target: Feb 2026)
  // Ticket: Track typed Supabase wrapper implementation
  // ==========================================================================
  {
    files: [
      'apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/**/*.ts',
      'apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: Base hooks with Supabase generics issues
  // TODO: Remove after Phase 2 typed wrappers (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'apps/back-office/src/hooks/base/**/*.ts',
      'apps/back-office/src/hooks/base/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: Type definition files with complex inference
  // TODO: Remove after Phase 2 typed wrappers (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'apps/back-office/src/types/**/*.ts',
      'apps/linkme/src/types/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: LinkMe app hooks with Supabase queries
  // TODO: Remove after Phase 2 typed wrappers (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'apps/linkme/src/lib/hooks/**/*.ts',
      'apps/linkme/src/lib/hooks/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: API Routes with FormData transforms
  // TODO: Remove after adding proper Zod schemas (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'apps/back-office/src/app/api/**/*.ts',
      'apps/linkme/src/app/api/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: Back-office hooks directory
  // TODO: Remove after Phase 2 typed wrappers (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'apps/back-office/src/hooks/**/*.ts',
      'apps/back-office/src/hooks/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: Server actions with weak typing
  // TODO: Remove after adding proper Zod schemas (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'apps/back-office/src/app/(protected)/**/actions/**/*.ts',
      'apps/linkme/src/app/(main)/**/actions/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // ==========================================================================
  // TEMPORARY: Packages with utils and shared code
  // TODO: Remove after Phase 2 typed wrappers (target: Feb 2026)
  // ==========================================================================
  {
    files: [
      'packages/@verone/utils/src/**/*.ts',
      'packages/@verone/types/src/**/*.ts',
      'packages/@verone/notifications/src/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
]);
