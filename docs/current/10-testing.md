---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - tests/
  - playwright.config.ts
---

# Testing Verone

Playwright pour tests E2E.

## Structure

```
tests/
  e2e/           # Tests end-to-end
  components/    # Tests composants
  fixtures/      # Donnees test
```

## Commandes

```bash
# Tous les tests
npm run test:e2e

# Tests critiques uniquement
npm run test:e2e:critical

# Tests avec UI
npm run test:e2e:headed

# Debug
npm run test:e2e:debug

# Tests composant button
npm run test:button
```

## Ecrire un test

```typescript
// tests/e2e/catalogue.spec.ts
import { test, expect } from '@playwright/test';

test('catalogue loads products', async ({ page }) => {
  await page.goto('/produits');
  await expect(page.getByRole('heading')).toContainText('Catalogue');
  await expect(page.locator('[data-testid="product-card"]')).toHaveCount.greaterThan(0);
});
```

## Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
});
```

## Liens

- [Deployment](./07-deployment.md) - CI tests

---

*Derniere verification: 2025-12-17*
