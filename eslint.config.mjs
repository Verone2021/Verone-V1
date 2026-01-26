/**
 * ESLint Flat Config - Verone Monorepo
 *
 * Configuration ESLint 9 optimisée (Best Practices 2026)
 * - TypeScript strict avec type-aware linting
 * - Next.js 15 + React 18
 * - Prettier intégré
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
      '**/.vercel/**',

      // Generated files (DO NOT LINT)
      '**/next-env.d.ts',
      '**/*.generated.ts',
      '**/src/types/supabase.ts',
      '**/types/supabase.ts',
      '**/*.d.ts',

      // Config files (handled separately)
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
      '**/.playwright/**',
      '**/playwright-report/**',
      '**/test-results/**',

      // Package manager files
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock',

      // Legacy/backups
      '**/backups/**',
      '**/MEMORY-BANK/**',
    ],
  },

  // ==========================================================================
  // BASE CONFIGS (Order matters: ESLint → TypeScript → Next.js → Prettier)
  // ==========================================================================

  // ESLint recommended
  eslint.configs.recommended,

  // TypeScript ESLint recommended
  ...tseslint.configs.recommended,

  // Next.js Core Web Vitals (via FlatCompat)
  ...compat.extends('next/core-web-vitals'),

  // Prettier (MUST be last to disable conflicting rules)
  ...compat.extends('plugin:prettier/recommended'),

  // ==========================================================================
  // TYPESCRIPT FILES - Apps & Packages (Main Rules)
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
      // TYPESCRIPT STRICT MODE - Type Safety (ERRORS)
      // =====================================================================

      // Type safety - STRICT
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // Type imports/exports (auto-fixable) - ERRORS
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

      // =====================================================================
      // ASYNC/AWAIT SAFETY - CRITICAL (Prevents silent bugs)
      // =====================================================================
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // =====================================================================
      // NULLISH COALESCING - Prevents bugs with 0, false, ""
      // =====================================================================
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // =====================================================================
      // CODE QUALITY
      // =====================================================================

      // Naming convention: OFF (Supabase types use snake_case)
      '@typescript-eslint/naming-convention': 'off',

      // Explicit return type: OFF (too verbose for React components)
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow empty object types (common in React props)
      '@typescript-eslint/no-empty-object-type': 'warn',

      // Unnecessary assertions
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      // Ban ts-comment: Relaxed (sometimes needed)
      '@typescript-eslint/ban-ts-comment': 'warn',

      // Require imports: Relaxed for scripts
      '@typescript-eslint/no-require-imports': 'warn',

      // No Unused Vars (with exceptions for _prefixed)
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

      // Hooks Rules (CRITICAL - prevents bugs)
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
      // GENERAL CODE QUALITY
      // =====================================================================

      // Console Statements (allow warn, error)
      'no-console': ['warn', { allow: ['warn', 'error'] }],

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

      // Case declarations
      'no-case-declarations': 'warn',

      // Prettier (formatting only)
      'prettier/prettier': 'warn',
    },
  },

  // ==========================================================================
  // SCRIPTS - Relaxed rules (no type-aware linting)
  // ==========================================================================
  {
    files: [
      'scripts/**/*.{ts,js,mjs}',
      '.claude/**/*.{ts,js}',
      '**/scripts/**/*.{ts,js,mjs}',
      'tools/**/*.{ts,js,mjs}',
    ],
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

      // Disable ALL type-aware rules for scripts
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
  // GRADUAL MIGRATION: back-office & linkme (7000+ errors to fix)
  // These overrides are TEMPORARY - target removal: Q2 2026
  //
  // Strategy: Fix files incrementally by domain, then remove overrides
  // Priority order:
  //   1. API routes (security-critical)
  //   2. Hooks (data fetching)
  //   3. Components (UI layer)
  //   4. Types (definitions)
  //
  // Track progress: Run `npx eslint <path> --format json | jq '[.[] | .errorCount] | add'`
  // ==========================================================================
  {
    files: [
      // Back-office - all source files (gradual migration)
      'apps/back-office/src/**/*.ts',
      'apps/back-office/src/**/*.tsx',
    ],
    rules: {
      // Type safety - WARN during migration (6000+ occurrences)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      // Async safety - WARN during migration (800+ occurrences)
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
    },
  },

  // LinkMe - Similar gradual migration
  {
    files: [
      'apps/linkme/src/lib/hooks/**/*.ts',
      'apps/linkme/src/hooks/**/*.ts',
      'apps/linkme/src/contexts/**/*.tsx',
      'apps/linkme/src/app/api/**/*.ts',
      'apps/linkme/src/types/**/*.ts',
      'apps/linkme/src/lib/**/*.ts',
      'apps/linkme/src/components/**/*.tsx',
      'apps/linkme/src/app/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
    },
  },

  // Packages - Similar gradual migration
  {
    files: [
      'packages/@verone/types/src/**/*.ts',
      'packages/@verone/utils/src/**/*.ts',
      'packages/@verone/notifications/src/**/*.ts',
      'packages/@verone/ui/src/**/*.tsx',
      'packages/@verone/ui-business/src/**/*.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
    },
  },
]);
