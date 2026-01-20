# Hooks Inventory

**Generated:** 2026-01-19
**Source:** Code analysis (apps/ + packages/)
**Total Hooks:** 415

## Executive Summary

### By Location
- **Packages:** 177 hooks (43%)
- **Apps:** 238 hooks (57%)

### By Domain
| Domain | Count | % |
|--------|-------|---|
| LinkMe | 119 | 29% |
| Products | 81 | 20% |
| Common | 68 | 16% |
| Finance | 41 | 10% |
| Orders | 40 | 10% |
| Stock | 15 | 4% |
| Mutation | 14 | 3% |
| Customers | 12 | 3% |
| Dashboard | 10 | 2% |
| Utility | 6 | 1% |
| Notifications | 5 | 1% |
| Query | 4 | 1% |

### Critical Findings
- **25 duplicate hooks** found across packages and apps
- **3 different implementations** of `useSupabaseQuery`
- **LinkMe domain heavily duplicated** between back-office and linkme app
- **Utility hooks scattered** across multiple packages

## Duplicates Analysis

### 1. useSupabaseQuery (3 implementations)

**Critical Issue:** Three different query abstractions competing

#### Implementation A: packages/@verone/common/src/hooks/use-supabase-query.ts
```typescript
useSupabaseQuery<T = any>(
  queryKey: string,
  queryFn: (supabase) => Promise<{ data, error }>
)
```
- **Usage:** 3 files
- **Pattern:** React Query wrapper
- **Side effects:** Database queries

#### Implementation B: packages/@verone/common/src/hooks/use-supabase-query-builder.ts
```typescript
useSupabaseQuery<T>(options: QueryOptions<T>): QueryState<T>
```
- **Usage:** 3 files
- **Pattern:** Query builder pattern
- **Side effects:** Database queries

#### Implementation C: apps/back-office/src/hooks/base/use-supabase-query.ts
```typescript
useSupabaseQuery<T>(options: QueryOptions<T>): QueryState<T>
```
- **Usage:** 3 files
- **Pattern:** Query builder (duplicate of B)
- **Side effects:** Database queries

**Recommendation:**
- **Action:** MERGE to single implementation
- **Target:** packages/@verone/common/src/hooks/use-supabase-query.ts
- **Strategy:** Combine best features of all three
- **Impact:** ~20 files need refactoring
- **Breaking:** YES - consolidate APIs

---

### 2. useMobile / useIsMobile (2 implementations)

#### Implementation A: packages/@verone/hooks/src/use-mobile.ts
```typescript
useMobile(): boolean
// Uses useMediaQuery, breakpoint: 768px
```
- **Usage:** Unknown (package recently added)
- **Pattern:** Utility
- **Dependencies:** useMediaQuery

#### Implementation B: packages/@verone/ui-business/src/hooks/use-mobile.tsx
```typescript
useIsMobile(): boolean
// Direct matchMedia, breakpoint: 768px
```
- **Usage:** Used in UI components
- **Pattern:** Utility
- **Dependencies:** window.matchMedia

**Recommendation:**
- **Action:** MERGE to @verone/hooks
- **Target:** packages/@verone/hooks/src/use-mobile.ts
- **Reason:** Canonical utility hooks package
- **Impact:** 5-10 files
- **Breaking:** NO (same API)

---

### 3. LinkMe Hooks (10 duplicate pairs)

All LinkMe hooks duplicated between:
- `packages/@verone/orders/src/hooks/linkme/*`
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/*`

Examples:
- useLinkMeAffiliates
- useLinkMeAffiliate
- useLinkMeEnseignes
- useLinkMeSelection
- useLinkMeSelectionsByEnseigne
- useCreateLinkMeOrder

**Recommendation:**
- **Action:** DELETE app versions, use package versions
- **Target:** Keep packages/@verone/orders/src/hooks/linkme/*
- **Reason:** Shared domain logic should be in packages
- **Impact:** ~30 files in back-office app
- **Breaking:** NO (update imports only)

---

### 4. useCategories (2 implementations)

#### Implementation A: packages/@verone/categories/src/hooks/use-categories.ts
```typescript
useCategories()
```
- **Usage:** 7 files
- **Pattern:** Query
- **Domain:** Categories

#### Implementation B: apps/site-internet/src/hooks/use-categories.ts
```typescript
useCategories()
```
- **Usage:** 7 files (same count - likely the same hook)
- **Pattern:** Query
- **Domain:** Categories

**Recommendation:**
- **Action:** INVESTIGATE then MERGE
- **Target:** packages/@verone/categories
- **Reason:** Check if implementations differ
- **Impact:** 2-5 files
- **Breaking:** Depends on API differences

---

### 5. useProductImages (2 implementations)

#### packages/@verone/products
- Full-featured with batch support
- Usage: 9 files

#### apps/linkme
- Simplified version for affiliate use
- Usage: 9 files (likely different files)

**Recommendation:**
- **Action:** KEEP BOTH (different use cases)
- **Alternative:** Rename linkme version to `useAffiliateProductImages`
- **Reason:** Different domains, different requirements
- **Impact:** 0 files (just documentation)

---

## Normalization Plan

### Phase 1: Critical Merges (High Impact)

#### 1.1 Consolidate Supabase Query Hooks
**Priority:** P0 (Critical)
**Effort:** High (2-3 days)

```
Actions:
1. Analyze all three implementations
2. Design unified API (backward compatible if possible)
3. Migrate to packages/@verone/common
4. Update all consumers (~20 files)
5. Add migration guide
6. Deprecate old versions
```

#### 1.2 Merge LinkMe Hooks
**Priority:** P1 (High)
**Effort:** Medium (1-2 days)

```
Actions:
1. Delete apps/back-office LinkMe hooks
2. Update imports to use packages/@verone/orders/hooks/linkme
3. Run tests to verify behavior unchanged
4. Update documentation

Files affected:
- apps/back-office: ~30 files
- Keep: packages/@verone/orders/src/hooks/linkme/*
```

### Phase 2: Utility Consolidation (Medium Impact)

#### 2.1 Standardize Mobile Detection
**Priority:** P2 (Medium)
**Effort:** Low (2-4 hours)

```
Actions:
1. Keep packages/@verone/hooks/src/use-mobile.ts
2. Update useIsMobile consumers to use useMobile
3. Delete packages/@verone/ui-business/src/hooks/use-mobile.tsx
4. Update barrel exports

Target structure:
packages/@verone/hooks/src/
├── use-mobile.ts ← CANONICAL
└── index.ts (export { useMobile })
```

### Phase 3: Domain Reorganization (Lower Priority)

#### 3.1 Products Domain
**Current state:** Scattered across packages

```
Proposed structure:
packages/@verone/products/src/hooks/
├── queries/
│   ├── use-products.ts
│   ├── use-product.ts
│   ├── use-product-images.ts
│   └── use-product-variants.ts
├── mutations/
│   ├── use-create-product.ts
│   ├── use-update-product.ts
│   └── use-delete-product.ts
└── index.ts
```

#### 3.2 Orders Domain
**Already well-organized**, minor cleanup needed

#### 3.3 Finance Domain
**Well-organized**, keep as-is

### Phase 4: Dead Code Removal

Hooks with **0 usage** (to investigate):
- useActiveAffiliates
- useActiveEnseignes
- useGoogleMerchantStats (duplicate)
- Many LinkMe analytics hooks

**Action:** Audit + remove or document as public API

---

## Hooks by Domain (Top Hooks Per Domain)

### LinkMe (119 hooks)

**Top hooks:**
- useLinkMeOrders (2 implementations)
- useLinkMeAffiliates (2 implementations)
- useLinkMeCatalogProducts (2 implementations)
- useApproveOrder (2 implementations)
- useStoragePricingTiers (2 implementations)

**Pattern:** Heavy duplication between back-office and linkme app

### Products (81 hooks)

**Top hooks:**
- useProducts (1 implementation, packages)
- useProduct (1 implementation, packages)
- useProductImages (2 implementations)
- useProductVariants (2 implementations)
- useSourcingProducts (2 implementations)

**Pattern:** Some duplication for channel-specific needs

### Finance (41 hooks)

**Well-organized:**
- usePriceLists, usePriceList, usePriceListItems
- useFinancialDocuments, useFinancialPayments
- useBankReconciliation
- useUnifiedTransactions

**Pattern:** Good separation of concerns (queries vs mutations)

### Orders (40 hooks)

**Includes:**
- useSalesOrders, usePurchaseOrders
- useOrderItems
- useSampleOrder, useSampleEligibility
- LinkMe order hooks (duplicated)

**Pattern:** Mix of core + LinkMe domain

---

## Recommended Target Architecture

```
packages/@verone/
├── hooks/ (utility hooks only)
│   ├── use-mobile.ts
│   ├── use-debounce.ts
│   ├── use-local-storage.ts
│   └── index.ts
│
├── common/src/hooks/ (shared infrastructure)
│   ├── use-supabase-query.ts ← SINGLE implementation
│   ├── use-supabase-mutation.ts ← SINGLE implementation
│   ├── use-current-user.ts
│   ├── use-toast.ts
│   └── index.ts
│
├── products/src/hooks/
│   ├── queries/ (use*Query naming)
│   ├── mutations/ (use*Mutation naming)
│   └── index.ts
│
├── orders/src/hooks/
│   ├── queries/
│   ├── mutations/
│   ├── linkme/ ← Keep here (domain-specific)
│   └── index.ts
│
└── (other domains follow same pattern)

apps/
├── back-office/src/hooks/
│   └── (ONLY back-office-specific hooks)
│
├── linkme/src/hooks/
│   └── (ONLY linkme UI-specific hooks)
│
└── site-internet/src/hooks/
    └── (ONLY site-internet-specific hooks)
```

---

## Action Items Summary

### Immediate (P0)
- [ ] Consolidate 3 useSupabaseQuery implementations
- [ ] Merge LinkMe hooks to packages

### Short-term (P1-P2)
- [ ] Standardize useMobile
- [ ] Audit 0-usage hooks
- [ ] Update documentation

### Long-term (P3)
- [ ] Reorganize by query/mutation pattern
- [ ] Establish naming conventions
- [ ] Add hook generator template

---

## Naming Conventions (Proposed)

### Queries (read data)
```typescript
use<Entity>()           // List: useProducts()
use<Entity>s()          // Alternative list
use<Entity>(id)         // Single: useProduct(id)
use<Entity><Suffix>()   // Specialized: useProductImages()
```

### Mutations (write data)
```typescript
useCreate<Entity>()     // Create
useUpdate<Entity>()     // Update
useDelete<Entity>()     // Delete
useToggle<Entity>()     // Toggle boolean
```

### Utilities
```typescript
use<Action>()           // useMobile(), useDebounce()
```

---

**Version:** 1.0
**Last Updated:** 2026-01-19
**Next Review:** After Phase 1 completion
