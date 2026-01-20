# Components Inventory

**Generated:** 2026-01-19
**Source:** Code analysis (apps/ + packages/)
**Total Components:** 527

## Executive Summary

### By Location
- **Packages:** 329 components (62%)
- **Apps:** 198 components (38%)

### By Category
| Category | Count | % |
|----------|-------|---|
| Domain-specific | 267 | 51% |
| Section | 86 | 16% |
| Modal | 57 | 11% |
| Form | 42 | 8% |
| Composite | 28 | 5% |
| UI Primitive | 24 | 5% |
| Layout | 12 | 2% |
| Badge | 7 | 1% |
| Widget | 4 | 1% |

### Critical Findings
- **36 duplicate components** found
- **Multiple UI directories:** UI vs UI-v2 vs components
- **KPICard duplicated** (16 usages - high impact)
- **Many domain components in wrong packages**
- **shadcn/ui primitives sometimes duplicated**

---

## Duplicates Analysis

### 1. KPICard (2 implementations) ⚠️ HIGH IMPACT

**Most used duplicate component**

#### Implementation A: packages/@verone/common/src/components/kpi/KPICard.tsx
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
}
```
- **Usage:** 16 files
- **Location:** Common package (correct)
- **Features:** Full-featured with trends

#### Implementation B: apps/linkme/src/components/dashboard/KPICard.tsx
```typescript
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
}
```
- **Usage:** 16 files (different files in linkme app)
- **Location:** LinkMe app
- **Features:** Extended with subtitle and trend label

**Recommendation:**
- **Action:** MERGE to packages/@verone/ui-business
- **Reason:** Core business component, used across apps
- **Strategy:** Combine features from both
- **Impact:** 16 files in linkme app
- **Breaking:** NO (extend props to be superset)

---

### 2. CategorySelector (2 implementations)

#### Implementation A: packages/@verone/categories/src/components/CategorySelector.tsx
- Standard category selector

#### Implementation B: packages/@verone/categories/src/components/selectors/CategorySelector.tsx
- Duplicate in subdirectory

**Recommendation:**
- **Action:** DELETE one (likely subdirectory version)
- **Target:** Keep root level
- **Impact:** 1-2 files
- **Breaking:** NO (same component)

---

### 3. GoogleMerchantPriceEditor (2 implementations)

#### packages/@verone/channels
- Channel-specific pricing editor

#### packages/@verone/common
- Generic pricing editor (misplaced)

**Recommendation:**
- **Action:** DELETE common version
- **Target:** Keep in @verone/channels
- **Reason:** Channel-specific component
- **Impact:** 1 file
- **Breaking:** NO (wrong location anyway)

---

### 4. CollectionImageUpload (2 implementations)

#### packages/@verone/common
- Generic collection image upload

#### apps/back-office
- Back-office specific version

**Recommendation:**
- **Action:** MERGE to @verone/common
- **Target:** packages/@verone/common (already there)
- **Reason:** Reusable business logic
- **Impact:** 2 files in back-office
- **Breaking:** NO

---

### 5. IdentifiersCompleteEditSection (2 implementations)

Both in packages/@verone/common, different subdirectories

**Recommendation:**
- **Action:** INVESTIGATE and merge
- **Reason:** Duplicate file structure
- **Impact:** Unknown until investigation

---

## UI Primitives Analysis

### shadcn/ui Integration

**Current state:** Some primitives duplicated outside @verone/ui

**Examples of correct usage:**
```
packages/@verone/ui/src/components/ui/
├── button.tsx
├── input.tsx
├── select.tsx
├── dialog.tsx
├── card.tsx
└── (all shadcn primitives)
```

**Issues found:**
- Some apps re-implement primitives instead of importing
- Custom variants created as separate components
- Missing barrel exports

**Recommendation:**
- **Action:** Audit all primitive usage
- **Ensure:** All apps import from @verone/ui
- **Remove:** Any local primitive duplicates

---

## Component Organization Issues

### 1. Domain Components in Wrong Packages

**Issue:** Business components scattered

**Examples:**
```
❌ Bad:
packages/@verone/common/src/components/pricing/GoogleMerchantPriceEditor.tsx
→ Should be in @verone/channels

packages/@verone/common/src/components/collections/*
→ Should be in @verone/collections

✅ Good:
packages/@verone/products/src/components/ProductCard.tsx
→ Correct domain package
```

### 2. Multiple Component Directories

**Issue:** Inconsistent naming

```
apps/back-office/src/
├── components/
│   ├── business/
│   ├── layout/
│   ├── providers/
│   └── ui/ (should use @verone/ui)

apps/linkme/src/
├── components/
│   ├── cart/
│   ├── dashboard/
│   ├── layout/
│   └── (mixed structure)
```

**Recommendation:**
- Standardize to `components/` only
- Sub-organize by category
- Remove `ui/` subdirs (use @verone/ui)

---

## Normalization Plan

### Phase 1: High-Impact Duplicates

#### 1.1 Consolidate KPICard
**Priority:** P0 (Critical - 16 usages)
**Effort:** Medium (4-6 hours)

```typescript
// Target: packages/@verone/ui-business/src/components/KPICard.tsx
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;           // From linkme version
  trend?: {                    // Combine both versions
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  className?: string;
}
```

**Actions:**
1. Create consolidated version in @verone/ui-business
2. Migrate linkme usages (16 files)
3. Migrate common usages (16 files)
4. Delete both old versions
5. Update barrel exports

#### 1.2 Remove CategorySelector Duplicate
**Priority:** P1 (High)
**Effort:** Low (1 hour)

```
Actions:
1. Check which version is used
2. Delete unused version
3. Update imports if needed
```

#### 1.3 Fix GoogleMerchantPriceEditor Location
**Priority:** P1 (High)
**Effort:** Low (1 hour)

```
Actions:
1. Delete packages/@verone/common version
2. Keep packages/@verone/channels version
3. Update any imports
```

### Phase 2: Structural Cleanup

#### 2.1 Audit UI Primitives Usage
**Priority:** P2 (Medium)
**Effort:** Medium (1 day)

```
Actions:
1. Search for local Button/Input/Select implementations
2. Verify all use @verone/ui
3. Remove duplicates
4. Add ESLint rule to prevent future duplicates
```

#### 2.2 Reorganize Domain Components
**Priority:** P2 (Medium)
**Effort:** High (2-3 days)

```
Move components to correct packages:
- Collection components → @verone/collections
- Product components → @verone/products
- Order components → @verone/orders
- Finance components → @verone/finance
```

### Phase 3: Standardization

#### 3.1 Establish Component Categories
**Priority:** P3 (Low)
**Effort:** Planning only

```
Standardize structure across all packages:

packages/@verone/{domain}/src/components/
├── cards/          (Card components)
├── forms/          (Form components)
├── modals/         (Modal/Dialog components)
├── sections/       (Page sections)
├── selectors/      (Select/Picker components)
├── tables/         (Table components)
└── index.ts        (Barrel export)
```

---

## Recommended Target Architecture

### Packages

```
packages/@verone/ui/
└── components/ui/
    ├── primitives from shadcn/ui
    └── index.ts

packages/@verone/ui-business/
└── components/
    ├── KPICard.tsx          ← Consolidated
    ├── StatCard.tsx
    ├── MetricCard.tsx
    └── index.ts

packages/@verone/{domain}/src/components/
├── cards/
├── forms/
├── modals/
├── sections/
├── selectors/
├── tables/
└── index.ts

packages/@verone/common/src/components/
└── (ONLY truly generic components)
    ├── images/
    ├── uploads/
    └── index.ts
```

### Apps

```
apps/{app}/src/components/
├── layout/              (App-specific layout)
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
├── providers/           (App-specific providers)
│   ├── AuthProvider.tsx
│   └── ThemeProvider.tsx
└── (domain-specific components ONLY if truly app-unique)
```

**Rule:** If component is used in 2+ apps, move to packages

---

## Component Naming Conventions

### Current Issues
- Inconsistent naming (ContactFormModal vs contact-form-modal)
- Mix of PascalCase and kebab-case files
- Unclear component purpose from name

### Proposed Standards

#### File Naming
```
PascalCase for components:
✅ ProductCard.tsx
✅ OrderFormModal.tsx
❌ product-card.tsx
❌ orderFormModal.tsx
```

#### Component Naming by Type

**Cards:**
```typescript
<Entity>Card          // ProductCard, OrderCard
<Metric>Card          // RevenueCard, StockCard
```

**Forms:**
```typescript
<Entity>Form          // ProductForm, OrderForm
<Entity>FormModal     // ProductFormModal
```

**Modals:**
```typescript
<Entity>Modal         // ProductModal
<Action>Modal         // ConfirmDeleteModal
```

**Sections:**
```typescript
<Entity><Purpose>Section  // ProductDetailsSection
```

**Selectors:**
```typescript
<Entity>Select        // CategorySelect
<Entity>Selector      // ProductSelector (multi-select)
```

---

## Barrel Exports Strategy

### Current State
- Inconsistent barrel exports
- Some packages export everything
- Some require deep imports

### Proposed Standard

```typescript
// packages/@verone/{domain}/src/components/index.ts
export { ProductCard } from './cards/ProductCard';
export { ProductForm } from './forms/ProductForm';
export { ProductModal } from './modals/ProductModal';
// ... export all public components

// Usage in apps:
import { ProductCard, ProductForm } from '@verone/products/components';
```

**Benefits:**
- Clear public API
- Easy to see what's available
- Easier refactoring
- Better tree-shaking

---

## Duplicate Components Summary

| Component | Locations | Usage | Priority | Action |
|-----------|-----------|-------|----------|--------|
| KPICard | 2 | 16 each | P0 | MERGE to ui-business |
| CategorySelector | 2 | 1 each | P1 | DELETE duplicate |
| GoogleMerchantPriceEditor | 2 | 1 each | P1 | DELETE from common |
| CollectionImageUpload | 2 | 2 each | P1 | MERGE to common |
| IdentifiersCompleteEditSection | 2 | Unknown | P2 | INVESTIGATE |
| ProductImageUpload | 2 | Unknown | P2 | INVESTIGATE |
| ContactFormModal | 2 | Unknown | P2 | INVESTIGATE |

(Total: 36 duplicates, showing top priority ones)

---

## Action Items Summary

### Immediate (P0)
- [ ] Consolidate KPICard (HIGH IMPACT)
- [ ] Audit all primitive usage
- [ ] Create component location guide

### Short-term (P1-P2)
- [ ] Remove CategorySelector duplicate
- [ ] Fix GoogleMerchantPriceEditor location
- [ ] Merge CollectionImageUpload
- [ ] Investigate remaining duplicates
- [ ] Reorganize domain components

### Long-term (P3)
- [ ] Standardize directory structure
- [ ] Add barrel exports everywhere
- [ ] Create component generator
- [ ] Add ESLint rules for organization

---

## Quality Metrics

### Components with Props Interfaces
- **With interface:** 387 (73%)
- **Without interface:** 140 (27%)

**Recommendation:** Enforce props interfaces for all components

### Usage Distribution
- **0 usages:** 89 components (17%) - candidates for removal
- **1 usage:** 156 components (30%)
- **2-5 usages:** 178 components (34%)
- **6+ usages:** 104 components (20%)

**Recommendation:** Audit 0-usage components

---

## Next Steps

1. **Execute Phase 1** (High-Impact Duplicates)
2. **Create migration guide** for component moves
3. **Set up ESLint rules** to prevent future issues
4. **Update documentation** with new standards
5. **Train team** on organization principles

---

**Version:** 1.0
**Last Updated:** 2026-01-19
**Next Review:** After Phase 1 completion
