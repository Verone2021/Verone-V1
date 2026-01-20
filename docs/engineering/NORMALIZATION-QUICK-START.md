# Normalization Quick Start Guide

**Purpose:** Fast reference for executing Phase 2B normalization plan
**Audience:** Developers implementing the fixes

---

## Critical Duplicates (Do First)

### 🔴 P0: useSupabaseQuery (3 implementations)

**Problem:** Three competing query abstractions causing confusion

**Files:**
```
1. packages/@verone/common/src/hooks/use-supabase-query.ts
2. packages/@verone/common/src/hooks/use-supabase-query-builder.ts
3. apps/back-office/src/hooks/base/use-supabase-query.ts
```

**Action:**
1. Analyze all three implementations
2. Design unified API (choose best features from each)
3. Create single implementation at `packages/@verone/common/src/hooks/use-supabase-query.ts`
4. Migrate ~20 consumer files
5. Delete implementations #2 and #3

**Impact:** ~20 files
**Effort:** 2-3 days
**Breaking:** Yes

---

### 🟠 P1: LinkMe Hooks (10 duplicate pairs)

**Problem:** All LinkMe hooks duplicated between package and app

**Duplicates:**
```
packages/@verone/orders/src/hooks/linkme/
├── use-linkme-affiliates.ts
├── use-linkme-enseignes.ts
├── use-linkme-orders.ts
├── use-linkme-selection.ts
└── (6 more...)

apps/back-office/.../linkme/hooks/
├── use-linkme-affiliates.ts     ← DELETE
├── use-linkme-enseignes.ts      ← DELETE
├── use-linkme-orders.ts         ← DELETE
├── use-linkme-selection.ts      ← DELETE
└── (6 more...)                  ← DELETE
```

**Action:**
1. Delete ALL app versions
2. Update imports in ~30 back-office files:
   ```typescript
   // Before:
   import { useLinkMeAffiliates } from '@/app/.../hooks/use-linkme-affiliates'

   // After:
   import { useLinkMeAffiliates } from '@verone/orders/hooks/linkme'
   ```
3. Run tests
4. Verify no behavioral changes

**Impact:** ~30 files
**Effort:** 1-2 days
**Breaking:** No (import paths only)

---

### 🟠 P1: useMobile (2 implementations)

**Problem:** Two different implementations, different names

**Files:**
```
✅ KEEP: packages/@verone/hooks/src/use-mobile.ts
❌ DELETE: packages/@verone/ui-business/src/hooks/use-mobile.tsx
```

**Action:**
1. Find all `useIsMobile` usages
2. Replace with `useMobile` from @verone/hooks
3. Delete ui-business version
4. Update barrel exports

**Impact:** 5-10 files
**Effort:** 2-4 hours
**Breaking:** No (same API)

---

### 🔴 P0: KPICard Component (2 implementations)

**Problem:** Most-used duplicate component (16 usages each)

**Files:**
```
packages/@verone/common/src/components/kpi/KPICard.tsx
apps/linkme/src/components/dashboard/KPICard.tsx
```

**Action:**
1. Create consolidated version at `packages/@verone/ui-business/src/components/KPICard.tsx`
2. Combine props from both versions:
   ```typescript
   interface KPICardProps {
     title: string;
     value: string | number;
     subtitle?: string;        // From linkme
     trend?: {
       value: number;
       label?: string;         // From linkme
     };
     icon?: React.ReactNode;
     className?: string;
   }
   ```
3. Migrate 16 common usages
4. Migrate 16 linkme usages
5. Delete both old versions

**Impact:** 32 files
**Effort:** 4-6 hours
**Breaking:** No (props are superset)

---

## Quick Commands

### Find Hook Usages
```bash
# Find where a hook is imported
rg "import.*useHookName" apps packages -g '*.{ts,tsx}'

# Find where a hook is used
rg "useHookName\(" apps packages -g '*.{ts,tsx}'
```

### Find Component Usages
```bash
# Find component imports
rg "import.*ComponentName" apps packages -g '*.tsx'

# Find component usage in JSX
rg "<ComponentName" apps packages -g '*.tsx'
```

### Update Imports (Example)
```bash
# Find and replace pattern
fd -e ts -e tsx -x sd 'from "@/app/.*use-linkme-affiliates"' 'from "@verone/orders/hooks/linkme"'
```

### Run Tests After Changes
```bash
npm run type-check              # TypeScript validation
npm run build                   # Production build test
npm run e2e:smoke              # UI smoke tests
```

---

## Barrel Export Pattern

### Before (Direct imports)
```typescript
// Consumer file
import { useProduct } from '@verone/products/src/hooks/use-products';
import { ProductCard } from '@verone/products/src/components/cards/ProductCard';
```

### After (Barrel exports)
```typescript
// packages/@verone/products/src/hooks/index.ts
export { useProduct, useProducts } from './use-products';
export { useProductImages } from './use-product-images';

// packages/@verone/products/src/components/index.ts
export { ProductCard } from './cards/ProductCard';
export { ProductForm } from './forms/ProductForm';

// Consumer file (clean imports)
import { useProduct } from '@verone/products/hooks';
import { ProductCard } from '@verone/products/components';
```

---

## Naming Convention Reference

### Hooks

**Queries (read data):**
```typescript
use<Entity>()           // useProducts() - list all
use<Entity>(id)         // useProduct(id) - get one
use<Entity><Suffix>()   // useProductImages(id)
```

**Mutations (write data):**
```typescript
useCreate<Entity>()     // useCreateProduct()
useUpdate<Entity>()     // useUpdateProduct()
useDelete<Entity>()     // useDeleteProduct()
useToggle<Entity>()     // useToggleProductActive()
```

**Utilities:**
```typescript
use<Action>()           // useMobile(), useDebounce()
```

### Components

**By Type:**
```typescript
<Entity>Card            // ProductCard
<Entity>Form            // ProductForm
<Entity>FormModal       // ProductFormModal
<Entity>Modal           // ConfirmModal
<Entity>Select          // CategorySelect
<Entity>Selector        // ProductSelector (multi)
<Entity><Purpose>Section // ProductDetailsSection
```

---

## Migration Checklist Template

When consolidating a hook/component:

- [ ] Identify all implementations
- [ ] List all consumer files
- [ ] Design unified API (combine best features)
- [ ] Create new consolidated version
- [ ] Update first consumer (test thoroughly)
- [ ] Update remaining consumers (one by one)
- [ ] Run full test suite
- [ ] Delete old implementations
- [ ] Update barrel exports
- [ ] Update documentation
- [ ] Create git commit

---

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Mixing old and new imports
import { useOldQuery } from '@/hooks/old';
import { useNewQuery } from '@verone/common';

// Keeping both implementations "just in case"
// Delete old code once migration complete!

// Forgetting barrel exports
import { SomeHook } from '@verone/package/src/hooks/some-hook';
// Should be:
import { SomeHook } from '@verone/package/hooks';
```

### ✅ Do This
```typescript
// Complete migration in one go
import { useQuery, useMutation } from '@verone/common';

// Delete old code immediately after migration
// (backed up in git anyway)

// Use barrel exports
import { SomeHook, AnotherHook } from '@verone/package/hooks';
```

---

## Testing Strategy

After each migration:

1. **Type-check:** `npm run type-check`
2. **Build:** `npm run build`
3. **Unit tests:** `npm test` (if available)
4. **E2E:** `npm run e2e:smoke`
5. **Manual:** Test affected features

---

## Git Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b refactor/normalize-hooks-phase1

# Small commits per migration
git add .
git commit -m "[NO-TASK] refactor: consolidate useSupabaseQuery"

# Push frequently
git push origin refactor/normalize-hooks-phase1
```

### Commit Messages
```
[NO-TASK] refactor: consolidate useSupabaseQuery
[NO-TASK] refactor: merge LinkMe hooks to packages
[NO-TASK] refactor: consolidate KPICard component
[NO-TASK] chore: update barrel exports
```

---

## Need Help?

**Documentation:**
- `/docs/engineering/hooks-inventory.md` - Full hooks analysis
- `/docs/engineering/components-inventory.md` - Full components analysis
- `/docs/engineering/phase2b-summary.md` - Executive summary

**Data:**
- `/tools/reports/hooks-usage.json` - All hooks with usage data
- `/tools/reports/components-usage.json` - All components with usage data
- `/tools/reports/*-duplicates-only.json` - Just the duplicates

**Scripts:**
- `/tools/scripts/analyze-hooks-components.js` - Re-run analysis anytime

---

**Last Updated:** 2026-01-19
**Status:** Ready for implementation
