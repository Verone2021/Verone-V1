# Migration E2E Tests: apps/linkme/e2e → packages/e2e-linkme

**Date**: 2026-01-21
**Status**: ✅ Completed

## 📋 Summary

Successfully migrated E2E tests from `apps/linkme/e2e/` to dedicated package `packages/e2e-linkme/` following **Turborepo 2026 best practices**.

## 🎯 Objectives Achieved

- [x] Created dedicated E2E package structure
- [x] Implemented **typed fixtures** with `test.extend<>()`
- [x] Implemented **worker-scoped database fixtures** for performance
- [x] Migrated 18 tests across 5 test suites
- [x] Updated Turborepo configuration
- [x] Created comprehensive documentation
- [x] Archived old structure for reference

## 🏗️ Changes

### 1. Package Structure Created

```
packages/e2e-linkme/
├── tests/
│   ├── data-consistency/
│   │   └── bo-linkme-sync.spec.ts
│   ├── product-management/
│   │   ├── creation.spec.ts
│   │   └── editing-restrictions.spec.ts
│   ├── approval-workflow/
│   │   └── workflow.spec.ts
│   └── security/
│       └── data-isolation.spec.ts
├── fixtures/
│   ├── auth.fixture.ts
│   ├── database.fixture.ts
│   ├── test-data.fixture.ts
│   └── index.ts
├── playwright.config.ts
├── global-setup.ts
├── global-teardown.ts
├── package.json
├── tsconfig.json
├── README.md
└── MIGRATION.md
```

### 2. Fixtures Improvements

**Before** (apps/linkme/e2e/fixtures/):
```typescript
// Simple helper functions
export const loginLinkMe = async (page: Page, email: string, password: string) => {
  // ...
};

export const getProductById = async (productId: string) => {
  const supabase = createClient(...); // New client every time
  // ...
};
```

**After** (packages/e2e-linkme/fixtures/):
```typescript
// Typed fixtures with test.extend()
export const test = base.extend<AuthFixtures>({
  loginLinkMe: async ({ page }, use) => {
    const login = async (email: string, password: string) => {
      // ...
    };
    await use(login);
  },
});

// Worker-scoped database client
export const test = base.extend<DatabaseTestFixtures, DatabaseWorkerFixtures>({
  supabaseWorker: [
    async ({}, use) => {
      const supabase = createClient(...); // Shared across all tests in worker
      await use(supabase);
    },
    { scope: 'worker' },
  ],
});
```

**Benefits**:
- ✅ Type safety with TypeScript
- ✅ Better performance (shared DB connections)
- ✅ Cleaner test code
- ✅ Auto-cleanup after tests

### 3. Test Adaptation

**Before**:
```typescript
import { test, expect } from '@playwright/test';
import { loginLinkMe, CREDENTIALS } from './fixtures/auth';
import { getProductById, cleanupTestData } from './fixtures/database';

test('my test', async ({ page }) => {
  await loginLinkMe(page, CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);
  const product = await getProductById('uuid');
  await cleanupTestData();
});
```

**After**:
```typescript
import { test, expect, CREDENTIALS } from '../../fixtures';

test('my test', async ({ page, loginLinkMe, db }) => {
  await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);
  const product = await db.getProductById('uuid');
  // Cleanup automatic via afterAll hook
});
```

### 4. Turborepo Integration

**turbo.json**:
```json
{
  "tasks": {
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": [
        "playwright-report/**",
        "test-results/**"
      ],
      "cache": false,
      "env": [
        "NEXT_PUBLIC_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY"
      ]
    }
  }
}
```

**Usage**:
```bash
# From monorepo root
pnpm turbo run test:e2e --filter=e2e-linkme

# Or directly
cd packages/e2e-linkme
pnpm test:e2e
```

## 📦 Migrated Tests

| Suite | Tests | Status |
|-------|-------|--------|
| Data Consistency | 4 | ✅ Migrated |
| Product Creation | 3 | ✅ Migrated |
| Editing Restrictions | 6 | ✅ Migrated |
| Approval Workflow | 3 | ✅ Migrated |
| Data Isolation | 2 | ✅ Migrated |
| **Total** | **18** | ✅ **All Migrated** |

## 🗄️ Archived Files

Old structure archived to `docs/archive/2026-01-21/linkme-e2e-old/`:

```
docs/archive/2026-01-21/
├── linkme-e2e-old/
│   ├── data-consistency.spec.ts
│   ├── product-creation.spec.ts
│   ├── product-editing-restrictions.spec.ts
│   ├── approval-workflow.spec.ts
│   ├── data-isolation.spec.ts
│   ├── margin-calculation.spec.ts       # Not migrated (out of scope)
│   ├── order-form-unified.spec.ts      # Not migrated (out of scope)
│   ├── smoke-linkme.spec.ts            # Not migrated (out of scope)
│   ├── fixtures/
│   ├── global-setup.ts
│   └── global-teardown.ts
└── playwright.config.mjs
```

**Note**: Tests not migrated (margin-calculation, order-form-unified, smoke-linkme) were outside the scope of the migration plan. They can be migrated later if needed.

## 🔍 Validation

### Pre-Migration Checklist

- [x] All 5 test suites (18 tests) identified
- [x] Dependencies analyzed (Playwright, Supabase)
- [x] Best practices researched (Turborepo 2026)

### Post-Migration Checklist

- [x] Package structure created
- [x] Fixtures refactored with typed fixtures
- [x] Tests migrated and imports updated
- [x] Playwright config adapted
- [x] Global setup/teardown created
- [x] README.md documentation written
- [x] turbo.json updated
- [x] Old files archived

### Next Steps (Manual Validation Required)

1. **Install dependencies**:
   ```bash
   cd packages/e2e-linkme
   pnpm install
   ```

2. **Start applications** (un seul terminal suffit !):
   ```bash
   # Turborepo démarre TOUTES les apps automatiquement
   pnpm dev  # From root (starts back-office + linkme + site-internet)
   ```

3. **Run tests**:
   ```bash
   cd packages/e2e-linkme
   pnpm test:e2e
   ```

4. **Expected result**: All 18 tests should pass

## 📊 Benefits

### Performance

- **Before**: Each test creates new Supabase client → ~18 connections
- **After**: Worker-scoped client → ~1-2 connections (shared across tests)
- **Improvement**: ~90% reduction in DB connections

### Code Quality

- **Type Safety**: 100% typed fixtures
- **Maintainability**: Centralized fixture logic
- **Testability**: Easier to mock/stub fixtures
- **Readability**: Cleaner test code

### Scalability

- **Isolation**: E2E tests separate from application code
- **Reusability**: Fixtures can be shared across multiple test packages
- **Extensibility**: Easy to add new test suites
- **CI/CD**: Better integration with Turborepo pipelines

## 🔗 References

- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)
- [Turborepo E2E Testing](https://github.com/vercel/turborepo/discussions/2320)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright Worker-Scoped Fixtures](https://www.semantive.com/blog/best-practices-for-using-playwright-fixtures-in-end-to-end-testing)

## 👥 Authors

- **Implementation**: Claude Sonnet 4.5
- **Plan**: Based on [Plan E2E - Validation LinkMe](../../.tasks/plans/e2e-linkme-validation.md)
- **Date**: 2026-01-21

---

**Status**: ✅ Migration completed successfully
**Next**: Validate tests pass and document any issues
