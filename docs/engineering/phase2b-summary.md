# Phase 2B: Components & Hooks Inventory - Executive Summary

**Completed:** 2026-01-19
**Duration:** ~45 minutes
**Scope:** Full codebase analysis (apps/ + packages/)

---

## Deliverables

### 1. Documentation (Markdown)
- ✅ `docs/engineering/hooks-inventory.md` (415 hooks analyzed)
- ✅ `docs/engineering/components-inventory.md` (527 components analyzed)

### 2. Data Reports (JSON)
- ✅ `tools/reports/hooks-usage.json` (142KB - full analysis)
- ✅ `tools/reports/components-usage.json` (168KB - full analysis)
- ✅ `tools/reports/hooks-duplicates-only.json` (18KB - 25 duplicates)
- ✅ `tools/reports/components-duplicates-only.json` (24KB - 36 duplicates)

### 3. Analysis Scripts
- ✅ `tools/scripts/analyze-hooks-components.js` (reusable scanner)

---

## Key Findings

### Hooks (415 total)

#### Distribution
| Location | Count | Percentage |
|----------|-------|------------|
| Packages | 177 | 43% |
| Apps | 238 | 57% |

#### Top Domains
1. **LinkMe:** 119 hooks (29%) - HEAVILY DUPLICATED
2. **Products:** 81 hooks (20%)
3. **Common:** 68 hooks (16%)
4. **Finance:** 41 hooks (10%)
5. **Orders:** 40 hooks (10%)

#### Critical Issues
- **25 duplicate hooks** identified
- **3 different `useSupabaseQuery` implementations** (critical merge needed)
- **10 LinkMe hook pairs duplicated** between packages and back-office app
- **Inconsistent naming:** useX vs useXQuery vs useXMutation

#### Duplicate Examples (High Priority)
```
1. useSupabaseQuery (3 implementations)
   - packages/@verone/common/use-supabase-query.ts
   - packages/@verone/common/use-supabase-query-builder.ts
   - apps/back-office/hooks/base/use-supabase-query.ts
   → IMPACT: ~20 files affected
   → ACTION: Merge to single implementation

2. LinkMe hooks (10 duplicate pairs)
   - packages/@verone/orders/hooks/linkme/*
   - apps/back-office/...linkme/hooks/*
   → IMPACT: ~30 files in back-office
   → ACTION: Delete app versions, use package versions

3. useMobile / useIsMobile (2 implementations)
   - packages/@verone/hooks/use-mobile.ts
   - packages/@verone/ui-business/hooks/use-mobile.tsx
   → IMPACT: 5-10 files
   → ACTION: Consolidate to @verone/hooks
```

---

### Components (527 total)

#### Distribution
| Location | Count | Percentage |
|----------|-------|------------|
| Packages | 329 | 62% |
| Apps | 198 | 38% |

#### By Category
1. **Domain-specific:** 267 (51%)
2. **Sections:** 86 (16%)
3. **Modals:** 57 (11%)
4. **Forms:** 42 (8%)
5. **Composite:** 28 (5%)
6. **UI Primitives:** 24 (5%)

#### Critical Issues
- **36 duplicate components** identified
- **KPICard duplicated** (16 usages each = HIGH IMPACT)
- **Components in wrong packages** (e.g., GoogleMerchantPriceEditor in common)
- **Inconsistent directory structure** across apps/packages
- **Some shadcn/ui primitives re-implemented** instead of imported

#### Duplicate Examples (High Priority)
```
1. KPICard (2 implementations)
   - packages/@verone/common/components/kpi/KPICard.tsx (16 usages)
   - apps/linkme/components/dashboard/KPICard.tsx (16 usages)
   → IMPACT: 16 files in linkme app
   → ACTION: Merge to @verone/ui-business

2. CategorySelector (2 implementations)
   - packages/@verone/categories/components/CategorySelector.tsx
   - packages/@verone/categories/components/selectors/CategorySelector.tsx
   → IMPACT: 1-2 files
   → ACTION: Delete duplicate subdirectory version

3. GoogleMerchantPriceEditor (misplaced)
   - packages/@verone/channels/... (correct)
   - packages/@verone/common/... (wrong location)
   → IMPACT: 1 file
   → ACTION: Delete from common
```

---

## Normalization Plan

### Hooks Normalization

#### Phase 1: Critical Merges (P0-P1)
**Estimated effort:** 3-5 days

1. **Consolidate useSupabaseQuery** (P0)
   - Design unified API
   - Migrate ~20 files
   - Breaking change likely
   - Effort: 2-3 days

2. **Merge LinkMe hooks** (P1)
   - Delete back-office versions
   - Update ~30 imports
   - Non-breaking (import changes only)
   - Effort: 1-2 days

3. **Standardize useMobile** (P1)
   - Keep @verone/hooks version
   - Update 5-10 files
   - Non-breaking
   - Effort: 2-4 hours

#### Phase 2: Organization (P2)
**Estimated effort:** 2-3 days

- Reorganize by domain
- Separate queries/mutations
- Audit 0-usage hooks
- Update documentation

#### Phase 3: Standards (P3)
**Estimated effort:** 1-2 days

- Establish naming conventions
- Add hook generator
- Update barrel exports

---

### Components Normalization

#### Phase 1: High-Impact Duplicates (P0-P1)
**Estimated effort:** 2-3 days

1. **Consolidate KPICard** (P0)
   - Merge both versions to @verone/ui-business
   - Update 32 files total
   - Non-breaking (extend props)
   - Effort: 4-6 hours

2. **Fix component locations** (P1)
   - Move domain components to correct packages
   - Remove duplicates
   - Effort: 1-2 days

3. **Audit UI primitives** (P1)
   - Ensure all use @verone/ui
   - Remove local duplicates
   - Effort: 4-6 hours

#### Phase 2: Structural Cleanup (P2)
**Estimated effort:** 2-3 days

- Standardize directory structure
- Fix misplaced components
- Update barrel exports

#### Phase 3: Standards (P3)
**Estimated effort:** 1-2 days

- Enforce naming conventions
- Add component generator
- Add ESLint rules

---

## Target Architecture

### Hooks Organization
```
packages/@verone/
├── hooks/                      ← Utility hooks only
│   ├── use-mobile.ts
│   ├── use-debounce.ts
│   └── index.ts
│
├── common/src/hooks/           ← Shared infrastructure
│   ├── use-supabase-query.ts   ← SINGLE implementation
│   ├── use-current-user.ts
│   └── index.ts
│
└── {domain}/src/hooks/         ← Domain-specific
    ├── queries/                ← use*Query
    ├── mutations/              ← use*Mutation
    └── index.ts

apps/{app}/src/hooks/
└── (ONLY app-specific hooks)
```

### Components Organization
```
packages/@verone/
├── ui/                         ← shadcn/ui primitives
│   └── components/ui/
│
├── ui-business/                ← Business components
│   └── components/
│       ├── KPICard.tsx
│       └── index.ts
│
└── {domain}/src/components/    ← Domain components
    ├── cards/
    ├── forms/
    ├── modals/
    ├── sections/
    └── index.ts

apps/{app}/src/components/
├── layout/                     ← App-specific only
└── providers/
```

---

## Impact Analysis

### Hooks
- **Files to modify:** ~50-70 files
- **Breaking changes:** useSupabaseQuery consolidation
- **Non-breaking:** LinkMe hooks (import path changes only)
- **Risk level:** Medium (extensive testing required)

### Components
- **Files to modify:** ~40-50 files
- **Breaking changes:** None (props extensions only)
- **Non-breaking:** All moves/consolidations
- **Risk level:** Low (mostly organizational)

---

## Quality Metrics

### Before Normalization

**Hooks:**
- Duplicates: 25 (6% of total)
- 0-usage hooks: Unknown (needs audit)
- Inconsistent naming: High
- Wrong location: ~40 hooks (LinkMe duplicates)

**Components:**
- Duplicates: 36 (7% of total)
- 0-usage: 89 components (17%)
- Without props interface: 140 (27%)
- Wrong location: ~20 components

### After Normalization (Target)

**Hooks:**
- Duplicates: 0
- 0-usage hooks: Documented or removed
- Naming: 100% consistent
- Location: 100% correct

**Components:**
- Duplicates: 0
- 0-usage: Removed or documented
- Props interfaces: 100%
- Location: 100% correct

---

## Recommended Execution Order

### Week 1: Critical Hooks
1. Day 1-3: Consolidate useSupabaseQuery
2. Day 4-5: Merge LinkMe hooks

### Week 2: Critical Components
1. Day 1: Consolidate KPICard
2. Day 2-3: Fix component locations
3. Day 4-5: Audit primitives

### Week 3: Organization
1. Reorganize hooks by pattern
2. Standardize component structure
3. Update all barrel exports

### Week 4: Quality & Documentation
1. Add ESLint rules
2. Create generators
3. Update team documentation
4. Training session

---

## Success Criteria

### Immediate (2 weeks)
- [ ] All critical duplicates resolved
- [ ] Single useSupabaseQuery implementation
- [ ] All LinkMe hooks in packages
- [ ] KPICard consolidated
- [ ] All components in correct packages

### Short-term (1 month)
- [ ] 0 hook duplicates
- [ ] 0 component duplicates
- [ ] All hooks follow naming convention
- [ ] All components have props interfaces
- [ ] Comprehensive barrel exports

### Long-term (2-3 months)
- [ ] ESLint rules prevent duplicates
- [ ] Generators for hooks/components
- [ ] Team trained on standards
- [ ] Documentation complete
- [ ] Regular audits scheduled

---

## Next Steps

1. **Review this report** with team
2. **Prioritize phases** based on business needs
3. **Assign ownership** for each phase
4. **Create detailed tickets** for Phase 1
5. **Schedule kickoff** for normalization work

---

## Files Reference

**Documentation:**
- `/docs/engineering/hooks-inventory.md`
- `/docs/engineering/components-inventory.md`

**Data:**
- `/tools/reports/hooks-usage.json`
- `/tools/reports/components-usage.json`
- `/tools/reports/hooks-duplicates-only.json`
- `/tools/reports/components-duplicates-only.json`

**Scripts:**
- `/tools/scripts/analyze-hooks-components.js`

---

**Report prepared by:** Claude Code (Serena + Analysis Tools)
**Date:** 2026-01-19
**Status:** Complete ✅
