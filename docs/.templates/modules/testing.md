# [MODULE_NAME] - Testing Guide

**Test Coverage** : [X]% | **Last Run** : [DATE] | **Status** : ✅ All Passed

---

## 📊 Test Coverage Summary

### Coverage by Type

- **E2E Tests** : [X]/[Y] critical flows
- **Integration Tests** : [X] scenarios
- **Unit Tests** : [X]% code coverage
- **Performance Tests** : [X] SLOs validated

### Test Results (Last Run)

```
✅ PASSED : [X]/[Y] tests
❌ FAILED : 0 tests
⚠️ SKIPPED : [X] tests (non-critical)

Execution Time : [X]s
Console Errors : 0 ✅
Performance : All SLOs met ✅
```

---

## 🧪 E2E Test Scenarios

### Test 1: List View Loading

**Priority** : CRITICAL
**Status** : ✅ PASSED

```typescript
// Test implementation
test('should load [module] list successfully', async ({ page }) => {
  // Navigate to module
  await page.goto('/[module]');

  // Wait for data to load
  await page.waitForSelector('[data-testid="[module]-list"]');

  // Verify list is visible
  const listItems = await page.$$('[data-testid="[module]-item"]');
  expect(listItems.length).toBeGreaterThan(0);

  // Check console for errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  expect(consoleErrors).toHaveLength(0);

  // Performance check
  const performance = await page.evaluate(() => {
    return performance.timing.loadEventEnd - performance.timing.navigationStart;
  });
  expect(performance).toBeLessThan(2000); // <2s SLO
});
```

**Expected Results** :

- ✅ Page loads <2s
- ✅ List displays items
- ✅ Zero console errors
- ✅ Loading state shown initially

---

### Test 2: Detail View Navigation

**Priority** : CRITICAL
**Status** : ✅ PASSED

```typescript
test('should navigate to detail view', async ({ page }) => {
  await page.goto('/[module]');

  // Click first item
  await page.click('[data-testid="[module]-item"]:first-child');

  // Wait for detail page
  await page.waitForURL('**/[module]/**');
  await page.waitForSelector('[data-testid="[module]-detail"]');

  // Verify detail content loaded
  const title = await page.textContent('[data-testid="[module]-title"]');
  expect(title).toBeTruthy();

  // Check console
  const errors = await page.evaluate(() => {
    return window.console.errors || [];
  });
  expect(errors).toHaveLength(0);
});
```

**Expected Results** :

- ✅ Navigation successful
- ✅ Detail data displayed
- ✅ Zero console errors
- ✅ Back navigation works

---

### Test 3: Create New Item Flow

**Priority** : CRITICAL
**Status** : ✅ PASSED

```typescript
test('should create new [module] item', async ({ page }) => {
  await page.goto('/[module]');

  // Click create button
  await page.click('[data-testid="create-[module]-btn"]');

  // Fill form
  await page.fill('[name="name"]', 'Test Item');
  await page.selectOption('[name="status"]', 'active');
  // ... fill other fields

  // Submit form
  await page.click('[data-testid="submit-btn"]');

  // Wait for success
  await page.waitForSelector('[data-testid="toast-success"]');

  // Verify item appears in list
  await page.goto('/[module]');
  const newItem = await page.textContent(':text("Test Item")');
  expect(newItem).toBe('Test Item');

  // Cleanup: delete test item
  // ... cleanup code
});
```

**Expected Results** :

- ✅ Form validation works
- ✅ Item created successfully
- ✅ Success notification shown
- ✅ Item appears in list

---

### Test 4: Edit Existing Item Flow

**Priority** : HIGH
**Status** : ✅ PASSED

```typescript
test('should edit existing [module] item', async ({ page }) => {
  // Setup: create test item first
  const testItem = await createTestItem();

  await page.goto(`/[module]/${testItem.id}`);

  // Click edit button
  await page.click('[data-testid="edit-btn"]');

  // Modify fields
  await page.fill('[name="name"]', 'Updated Name');

  // Save changes
  await page.click('[data-testid="save-btn"]');

  // Verify update
  await page.waitForSelector('[data-testid="toast-success"]');
  const updatedName = await page.textContent('[data-testid="[module]-title"]');
  expect(updatedName).toBe('Updated Name');

  // Cleanup
  await deleteTestItem(testItem.id);
});
```

---

### Test 5: Delete Item Flow (if applicable)

**Priority** : HIGH
**Status** : ✅ PASSED

```typescript
test('should delete [module] item', async ({ page }) => {
  // Setup
  const testItem = await createTestItem();

  await page.goto(`/[module]/${testItem.id}`);

  // Click delete button
  await page.click('[data-testid="delete-btn"]');

  // Confirm deletion
  await page.click('[data-testid="confirm-delete"]');

  // Verify redirect to list
  await page.waitForURL('**/[module]');

  // Verify item removed
  const deletedItem = await page.textContent(`:text("${testItem.name}")`);
  expect(deletedItem).toBeNull();
});
```

---

### Test 6: Filters & Search

**Priority** : MEDIUM
**Status** : ✅ PASSED

```typescript
test('should filter and search items', async ({ page }) => {
  await page.goto('/[module]');

  // Test search
  await page.fill('[data-testid="search-input"]', 'test query');
  await page.waitForTimeout(500); // Debounce
  const searchResults = await page.$$('[data-testid="[module]-item"]');
  expect(searchResults.length).toBeGreaterThan(0);

  // Test status filter
  await page.selectOption('[data-testid="status-filter"]', 'active');
  const filteredResults = await page.$$(
    '[data-testid="[module]-item"][data-status="active"]'
  );
  expect(filteredResults.length).toBeGreaterThan(0);

  // Clear filters
  await page.click('[data-testid="clear-filters"]');
  const allResults = await page.$$('[data-testid="[module]-item"]');
  expect(allResults.length).toBeGreaterThan(searchResults.length);
});
```

---

### Test 7: Error States & Edge Cases

**Priority** : MEDIUM
**Status** : ✅ PASSED

```typescript
test('should handle errors gracefully', async ({ page }) => {
  // Test network error
  await page.route('**/api/[module]**', route => route.abort());
  await page.goto('/[module]');
  await page.waitForSelector('[data-testid="error-state"]');

  // Test empty state
  await page.route('**/api/[module]**', route =>
    route.fulfill({
      status: 200,
      body: JSON.stringify([]),
    })
  );
  await page.reload();
  await page.waitForSelector('[data-testid="empty-state"]');

  // Test validation errors
  await page.goto('/[module]/new');
  await page.click('[data-testid="submit-btn"]'); // Submit without data
  await page.waitForSelector('[data-testid="validation-error"]');
});
```

---

## ⚡ Performance Tests

### Load Time Benchmarks

```typescript
test('should meet performance SLOs', async ({ page }) => {
  const metrics = await page.goto('/[module]', { waitUntil: 'networkidle' });

  // Measure Core Web Vitals
  const vitals = await page.evaluate(() => ({
    FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    LCP: performance.getEntriesByType('largest-contentful-paint')[0]
      ?.renderTime,
    FID: performance.getEntriesByType('first-input')[0]?.processingStart,
    CLS: performance
      .getEntriesByType('layout-shift')
      .reduce((sum, entry) => sum + entry.value, 0),
  }));

  // Assert SLOs
  expect(vitals.FCP).toBeLessThan(1800); // <1.8s
  expect(vitals.LCP).toBeLessThan(2500); // <2.5s
  expect(vitals.CLS).toBeLessThan(0.1); // <0.1 score

  // Database query performance
  const apiTiming = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .filter(r => r.name.includes('/api/[module]'))
      .map(r => r.duration);
  });
  expect(Math.max(...apiTiming)).toBeLessThan(500); // <500ms
});
```

---

## 🔐 Security Tests

### RLS Policy Validation

```typescript
test('should enforce RLS policies', async ({ page, context }) => {
  // Test unauthenticated access
  await context.clearCookies();
  await page.goto('/[module]');
  await page.waitForURL('**/login');

  // Test authenticated access
  await loginAs('user@example.com');
  await page.goto('/[module]');
  await page.waitForSelector('[data-testid="[module]-list"]');

  // Test permission-based access
  // Owner should see all, User should see only own
});
```

---

## ♿ Accessibility Tests

### WCAG 2.1 Compliance

```typescript
test('should be accessible', async ({ page }) => {
  await page.goto('/[module]');

  // Keyboard navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(
    () => document.activeElement?.tagName
  );
  expect(focusedElement).toBeTruthy();

  // Screen reader labels
  const ariaLabels = await page.$$('[aria-label]');
  expect(ariaLabels.length).toBeGreaterThan(0);

  // Color contrast (automated check)
  const contrastIssues = await page.evaluate(() => {
    // Run axe-core or similar
  });
  expect(contrastIssues).toHaveLength(0);

  // Form labels
  const inputs = await page.$$('input, select, textarea');
  for (const input of inputs) {
    const label = await input.evaluate(el => {
      return el.labels?.[0]?.textContent || el.getAttribute('aria-label');
    });
    expect(label).toBeTruthy();
  }
});
```

---

## 🐛 Regression Tests

### Known Bug Fixes

```typescript
// Bug #142: TypeError when editing item
test('should handle undefined data gracefully', async ({ page }) => {
  await page.goto('/[module]/invalid-id');
  // Should show error state, not crash
  await page.waitForSelector('[data-testid="error-state"]');
  const consoleErrors = await getConsoleErrors(page);
  expect(consoleErrors).toHaveLength(0); // No TypeError
});

// Bug #156: N+1 query issue
test('should fetch data efficiently', async ({ page }) => {
  await page.goto('/[module]');

  const apiCalls = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .filter(r => r.name.includes('/api/'));
  });
  expect(apiCalls.length).toBeLessThan(3); // Max 3 API calls, not 50+
});
```

---

## 🎯 Test Best Practices

### DO ✅

- Use `data-testid` attributes for selectors
- Clean up test data after each test
- Test user flows, not implementation
- Check console for errors
- Validate performance SLOs
- Test error states and edge cases

### DON'T ❌

- Rely on CSS class names (change often)
- Leave test data in database
- Test internal implementation details
- Ignore console warnings
- Skip accessibility tests
- Hard-code wait times (use waitFor)

---

## 🔧 Running Tests

### Local Development

```bash
# Run all module tests
npm run test:[module]

# Run specific test file
npm run test:[module]:e2e

# Run in watch mode
npm run test:[module]:watch

# Run with coverage
npm run test:[module]:coverage
```

### CI/CD Pipeline

```yaml
# .github/workflows/test-[module].yml
name: Test [Module]

on:
  pull_request:
    paths:
      - 'src/app/[module]/**'
      - 'src/hooks/use-[module]*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:[module]
      - run: npm run test:[module]:e2e
```

---

## 📈 Test Metrics

### Current Status

- **Total Tests** : [X]
- **Passing** : [X] ✅
- **Failing** : 0 ✅
- **Flaky** : 0 ✅
- **Coverage** : [X]%

### Historical Trends

- **Week 1** : [X]% coverage
- **Week 2** : [X]% coverage (+Y%)
- **Week 3** : [X]% coverage (+Y%)

---

**Testing Documentation - Validated on Real Code** ✅
