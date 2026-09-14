# @verone/e2e-linkme

End-to-End tests for LinkMe application, validating data consistency between Back-Office and LinkMe (SSOT).

## 📋 Overview

This package contains comprehensive E2E tests using Playwright that validate:

1. **Data Consistency** between Back-Office and LinkMe (SSOT)
2. **Product Creation** by independent organizations (with/without storage)
3. **Editing Restrictions** based on approval status
4. **Approval Workflow** for affiliate products
5. **Data Isolation** (RLS policies)

**Total: 18 E2E tests** across 5 test suites.

## 🚀 Guide de Démarrage Rapide

**Nouveau dans les tests E2E ?** Commencez par le guide rapide : [`QUICKSTART.md`](./QUICKSTART.md) 📖

Ce guide vous permet de lancer les tests en ~10 minutes avec instructions pas-à-pas pour :

- ✅ Installation dépendances (pnpm + Chromium)
- ✅ Démarrage applications (Turborepo automatique)
- ✅ Lancement tests E2E (18 tests)
- ✅ Déboggage avec MCP Playwright Browser

## 🏗️ Architecture

### Best Practices 2026

This package follows **Turborepo best practices** for E2E testing in monorepos:

- **Dedicated package**: Isolated from application code
- **Typed fixtures**: Using `test.extend<>()` for type safety
- **Worker-scoped DB**: Shared Supabase connections across tests
- **Cross-app validation**: Tests validate both BO and LinkMe

### Structure

```
packages/e2e-linkme/
├── tests/
│   ├── data-consistency/
│   │   └── bo-linkme-sync.spec.ts        # 4 tests
│   ├── product-management/
│   │   ├── creation.spec.ts              # 3 tests
│   │   └── editing-restrictions.spec.ts  # 6 tests
│   ├── approval-workflow/
│   │   └── workflow.spec.ts              # 3 tests
│   └── security/
│       └── data-isolation.spec.ts        # 2 tests
├── fixtures/
│   ├── auth.fixture.ts                   # Typed auth fixtures
│   ├── database.fixture.ts               # Worker-scoped DB fixtures
│   ├── test-data.fixture.ts              # Test data helpers
│   └── index.ts                          # Combined exports
├── playwright.config.ts                  # Playwright configuration
├── global-setup.ts                       # Pre-test cleanup
├── global-teardown.ts                    # Post-test cleanup
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Usage

### Prerequisites

1. **Start applications** (Turborepo démarre TOUT automatiquement):

   ```bash
   # Un seul terminal suffit ! Turborepo démarre toutes les apps en parallèle
   pnpm dev
   # ✅ back-office (port 3000) + linkme (port 3002) + site-internet (port 3001)
   ```

2. **Environment variables**:
   ```bash
   # .env.local (root)
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

### Run Tests

```bash
# From monorepo root
pnpm turbo run test:e2e --filter=e2e-linkme

# Or directly
cd packages/e2e-linkme
pnpm test:e2e
```

### Available Commands

```bash
pnpm test:e2e           # Run all tests
pnpm test:e2e:ui        # Run with Playwright UI
pnpm test:e2e:headed    # Run in headed mode (browser visible)
pnpm test:e2e:debug     # Run in debug mode
pnpm test:smoke         # Run only @smoke tests
pnpm show-report        # Open HTML report
```

### Run Specific Tests

```bash
# Run single suite
pnpm exec playwright test tests/data-consistency

# Run single test file
pnpm exec playwright test tests/product-management/creation.spec.ts

# Run specific test by name
pnpm exec playwright test -g "Create product WITH Verone storage"
```

## 🧪 Test Suites

### 1. Data Consistency (4 tests)

**File**: `tests/data-consistency/bo-linkme-sync.spec.ts`

- ✅ 1.1: BO product visible in LinkMe catalog
- ✅ 1.2: Commission calculation matches BO and LinkMe
- ✅ 1.3: LinkMe order visible in BO with correct channel
- ✅ 1.4: Affiliate organization visible in BO and LinkMe

### 2. Product Creation (3 tests)

**File**: `tests/product-management/creation.spec.ts`

- ✅ 2.1: Create product WITH Verone storage
- ✅ 2.2: Create product WITHOUT Verone storage (managed by affiliate)
- ✅ 2.3: Dimensions required when store_at_verone is true

### 3. Editing Restrictions (6 tests)

**File**: `tests/product-management/editing-restrictions.spec.ts`

- ✅ 3.1: Edit product in draft status allows name/description/photos
- ✅ 3.2: Cannot change store_at_verone after product creation
- ✅ 3.3: Product in pending_approval is read-only
- ✅ 3.4: Product in approved status is read-only
- ✅ 3.5: Product in rejected status can be edited and resubmitted
- ✅ 3.6: Affiliate cannot modify commission_rate

### 4. Approval Workflow (3 tests)

**File**: `tests/approval-workflow/workflow.spec.ts`

- ✅ 4.1: Submit product for approval
- ✅ 4.2: Approve product from back-office
- ✅ 4.3: Reject product from back-office

### 5. Data Isolation (2 tests)

**File**: `tests/security/data-isolation.spec.ts`

- ✅ 5.1: Enseigne cannot see independent org products
- ✅ 5.2: Independent org cannot see enseigne orders

## 🔧 Fixtures

### Typed Authentication Fixtures

```typescript
import { test, expect, CREDENTIALS } from '../fixtures';

test('my test', async ({ loginLinkMe, loginBackOffice, page }) => {
  // Login to LinkMe
  await loginLinkMe(CREDENTIALS.pokawa.email, CREDENTIALS.pokawa.password);

  // Login to Back-Office
  await loginBackOffice();

  // Test code...
});
```

### Database Fixtures (Worker-Scoped)

```typescript
import { test, expect } from '../fixtures';

test('my test', async ({ db }) => {
  // Get product by ID
  const product = await db.getProductById('uuid');

  // Create test product
  const productId = await db.createTestProduct({
    name: 'Test Product',
    affiliate_payout_ht: 100,
    store_at_verone: false,
  });

  // Cleanup
  await db.cleanupTestData();
});
```

### Available DB Helpers

- `db.getProductById(id)` - Get product by ID
- `db.getOrderById(id)` - Get order with items
- `db.getCommissionByOrderId(id)` - Get commission data
- `db.getLinkmeeChannelId()` - Get LinkMe channel UUID
- `db.createTestProduct(data)` - Create test product
- `db.createTestOrder(data)` - Create test order
- `db.updateProductApprovalStatus(id, status, options)` - Update approval status
- `db.waitForCondition(fn, timeout, interval)` - Wait for async condition
- `db.cleanupTestData()` - Delete all test data

### Test Data Helpers

```typescript
import { generateTestProductName, generateTestCustomerName } from '../fixtures';

const productName = generateTestProductName('My Product'); // "My Product 1737489234567"
const customerName = generateTestCustomerName(); // "Test Customer 1737489234567"
```

## 📊 Test Credentials

> **[BO-AUDIT-002] 2026-07-30 — no passwords in this file.**
> This repository was public, and these are real accounts with active roles
> (`linkme:enseigne_admin`, `linkme:enseigne_collaborateur`). The passwords that used to be
> listed here were exposed and have been rotated.
> Values now live in `.claude/local/test-credentials.md` (gitignored) and are read from the
> environment by `fixtures/auth.fixture.ts`. Never write a password in a versioned file.

Required environment variables:

| Variable                               | Account                            |
| -------------------------------------- | ---------------------------------- |
| `LINKME_TEST_PASSWORD`                 | shared by the LinkMe test accounts |
| `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` | back-office account                |
| `LINKME_POKAWA_EMAIL` _(optional)_     | defaults to `admin@pokawa-test.fr` |
| `LINKME_TESTORG_EMAIL` _(optional)_    | defaults to `test-org@verone.fr`   |

```bash
LINKME_TEST_PASSWORD=... E2E_TEST_EMAIL=... E2E_TEST_PASSWORD=... pnpm test:e2e
```

## 🔍 Debugging

### Run in Debug Mode

```bash
pnpm test:e2e:debug
```

### View Test Report

```bash
pnpm show-report
```

### View Screenshots/Videos

After test failure:

```
playwright-report/
├── index.html         # HTML report
├── data/
│   ├── screenshots/   # Failure screenshots
│   └── videos/        # Failure videos
```

## ⚠️ Common Issues

### 1. Applications Not Running

**Error**: `Failed to connect to http://localhost:3002`

**Solution**:

```bash
# Start all applications (un seul terminal suffit !)
pnpm dev  # From root - Turborepo démarre toutes les apps automatiquement
```

### 2. Database Connection Error

**Error**: `Missing Supabase environment variables`

**Solution**:

```bash
# Check .env.local has:
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Test Data Not Cleaned Up

**Solution**:

```bash
# Run cleanup manually
cd packages/e2e-linkme
node -e "import('./global-teardown.js').then(m => m.default())"
```

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests LinkMe

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Start applications
        run: |
          pnpm dev &
          sleep 30  # Wait for apps to start

      - name: Run E2E tests
        run: pnpm turbo run test:e2e --filter=e2e-linkme
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: packages/e2e-linkme/playwright-report/
```

## 📚 Documentation

- **Playwright**: https://playwright.dev/
- **Turborepo**: https://turbo.build/repo/docs
- **Best Practices**: https://www.browserstack.com/guide/playwright-best-practices
- **Monorepo E2E**: https://github.com/vercel/turborepo/discussions/2320

## 🔗 Related Packages

- `apps/linkme` - LinkMe application (port 3002)
- `apps/back-office` - Back-Office application (port 3000)
- `@verone/types` - Shared TypeScript types
- `@verone/utils` - Shared utilities

## 📝 Contributing

When adding new E2E tests:

1. **Use typed fixtures**: Import from `../fixtures`
2. **Follow naming convention**: `X.Y: Test description`
3. **Add cleanup**: Use `test.afterAll(async ({ db }) => { await db.cleanupTestData(); })`
4. **Generate unique names**: Use `generateTestProductName()` and `generateTestCustomerName()`
5. **Document test**: Add clear comments for each step

### Example Template

```typescript
import {
  test,
  expect,
  CREDENTIALS,
  generateTestProductName,
} from '../../fixtures';

test.describe('My Feature Tests', () => {
  test.afterAll(async ({ db }) => {
    await db.cleanupTestData();
  });

  test('X.Y: Test description', async ({ page, loginLinkMe, db }) => {
    // Step 1: Setup
    const productName = generateTestProductName('Feature Test');

    // Step 2: Login
    await loginLinkMe(CREDENTIALS.testOrg.email, CREDENTIALS.testOrg.password);

    // Step 3: Perform action
    // ...

    // Step 4: Verify result
    expect(result).toBe(expected);
  });
});
```

## 📅 Version History

- **1.0.0** (2026-01-21): Initial migration from `apps/linkme/e2e/`
  - Migrated 18 tests across 5 suites
  - Implemented typed fixtures with `test.extend<>()`
  - Added worker-scoped database fixtures
  - Created comprehensive documentation

---

**Maintainer**: Verone Team
**Package**: `@verone/e2e-linkme`
**License**: Private
