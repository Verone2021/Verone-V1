# Known Issues

**Generated:** 2026-01-20
**Context:** Phase 4.4 - Document pre-existing issues discovered during cleanroom audit
**Status:** 🔴 Issues documented, not fixed (out of scope for tolerance zero)

---

## Overview

This document tracks **known issues** that were discovered during Phase 2-4 cleanroom audit but are **NOT fixed** as part of the tolerance zero initiative.

**Rationale:** Tolerance zero focused on **documentation completeness**, not on fixing all pre-existing bugs. These issues are documented for future resolution.

---

## 1. StockKPICard Missing Component

### Summary

**Component:** `StockKPICard`
**Status:** 🔴 Imported but doesn't exist
**Discovered:** Phase 3 (2026-01-20)
**Severity:** Medium (blocks type-check)

### Problem

`StockKPICard` is imported from `@verone/ui` package in 8 files, but the component doesn't exist in that package.

**Error:**
```
Cannot find module '@verone/ui' or its corresponding type declarations.
  Module '"@verone/ui"' has no exported member 'StockKPICard'.
```

### Affected Files (8 total)

#### Apps (4 files)
1. `apps/back-office/src/app/(protected)/stocks/page.tsx`
2. `apps/back-office/src/app/(protected)/stocks/entries/page.tsx`
3. `apps/back-office/src/app/(protected)/stocks/exits/page.tsx`
4. `apps/back-office/src/app/(protected)/stocks/movements/page.tsx`

#### Packages (4 files)
5. `packages/@verone/stock/src/components/stats/MovementsStats.tsx`
6. `packages/@verone/organisations/src/components/sections/EnseigneKPIGrid.tsx`
7. `packages/@verone/common/src/components/kpi/KPICard.tsx`
8. `apps/back-office/src/app/demo-stock-ui/page.tsx`

### Root Cause

**Hypothesis:** Component was renamed or moved, but imports were not updated.

**Evidence:**
- `KPICard` component exists in `@verone/common/src/components/kpi/KPICard.tsx`
- `StockKPICard` might be an alias or specialized version that was planned but not implemented

### Impact

**Current:**
- ❌ `npm run type-check` **fails** (expected failure, documented)
- ⚠️ Affected pages may not render correctly (if components are used)
- ⚠️ Build may fail in production mode (TypeScript strict checks)

**Workaround:**
- Skip type-check validation for now
- Known failure is documented and tracked

### Proposed Fix (Not Executed)

**Option A: Create `StockKPICard` as alias** (Recommended)

Create in `packages/@verone/stock/src/components/kpi/StockKPICard.tsx`:
```typescript
// Alias for KPICard with stock-specific defaults
export { KPICard as StockKPICard } from '@verone/common/src/components/kpi/KPICard';
```

Update `packages/@verone/stock/src/index.ts`:
```typescript
export { StockKPICard } from './components/kpi/StockKPICard';
```

Update imports in all 8 files:
```typescript
// Before:
import { StockKPICard } from '@verone/ui';

// After:
import { StockKPICard } from '@verone/stock';
```

**Option B: Update all imports to use `KPICard`** (Simpler)

Replace in all 8 files:
```typescript
// Before:
import { StockKPICard } from '@verone/ui';

// After:
import { KPICard } from '@verone/common';
// Or:
import { KPICard as StockKPICard } from '@verone/common';
```

**Option C: Create actual `StockKPICard` component** (More work)

If `StockKPICard` should have stock-specific features:
- Create new component in `@verone/stock` package
- Add stock-specific props (e.g., `showMovements`, `stockThreshold`)
- Update all imports to use `@verone/stock`

### Recommendation

**Option A** - Create alias in `@verone/stock` package:
- ✅ Minimal changes to existing code
- ✅ Semantically correct (stock KPI card in stock package)
- ✅ Allows future customization if needed
- ✅ Type-safe

### Next Steps

1. **Separate task:** Create `[BO-COMPONENTS-XXX] fix: resolve StockKPICard missing import`
2. **Include in:** Phase 2B follow-up (duplicate components cleanup)
3. **Priority:** Medium (blocks type-check, but doesn't block runtime)
4. **Effort:** 1 hour (create component, update 8 imports, test)

---

## 2. Type-Check Failures (Expected)

### Summary

**Command:** `npm run type-check`
**Status:** 🔴 Expected failure (StockKPICard issue)
**Severity:** Low (known issue, tracked)

### Problem

Type-check fails due to StockKPICard missing import (see issue #1 above).

### Impact

- ❌ `npm run type-check` fails
- ⚠️ Cannot validate TypeScript correctness until fixed
- ✅ `npm run build` may still work (Next.js more permissive)

### Workaround

**Skip type-check temporarily:**
```bash
# Use build instead (Next.js checks types during build)
npm run build

# Or manually check specific files
npx tsc --noEmit --project apps/back-office/tsconfig.json
```

### Next Steps

- Fix when StockKPICard issue (#1) is resolved
- Expected to pass after fix

---

## Future Issues (Placeholder)

### Template for New Issues

```markdown
## X. [Issue Title]

### Summary
**Component/Feature:** [Name]
**Status:** 🔴 Open / 🟡 In Progress / 🟢 Resolved
**Discovered:** [Date]
**Severity:** High / Medium / Low

### Problem
[Description of the issue]

### Affected Files
- file1.ts
- file2.tsx

### Root Cause
[Hypothesis or confirmed cause]

### Impact
**Current:**
- [List impacts]

**Workaround:**
- [Temporary solution if available]

### Proposed Fix (Not Executed)
[Describe solution options]

### Next Steps
- [Action items]
```

---

## Issue Tracking

### Status Legend

- 🔴 **Open** - Issue documented, not started
- 🟡 **In Progress** - Fix in development
- 🟢 **Resolved** - Fix merged to main
- ❌ **Won't Fix** - Issue accepted as-is

### Priority Levels

- **High** - Blocks production deployment
- **Medium** - Blocks development (type-check, tests)
- **Low** - Minor inconvenience, documented workaround exists

### Current Issues Summary

| # | Issue | Status | Severity | Affected | Next Action |
|---|-------|--------|----------|----------|-------------|
| 1 | StockKPICard Missing | 🔴 Open | Medium | 8 files | Create [BO-COMPONENTS-XXX] task |
| 2 | Type-Check Failures | 🔴 Open | Low | All TS files | Fix when #1 resolved |

---

## Exclusions (Not Tracked Here)

**What's NOT in this document:**
- ✅ **Base schema drift** - Tracked in `docs/database/drift-resolution-plan.md`
- ✅ **Test artifacts** - Tracked in `docs/engineering/artifacts-policy.md`
- ✅ **Migration issues** - Tracked in `docs/database/source-of-truth.md`
- ✅ **Deployment issues** - Should go in separate operational docs

**Purpose:** This document tracks **code/component issues only**, not infrastructure/database/deployment issues.

---

## Resolution Process

### When to Add an Issue

**Criteria:**
- Issue discovered during development/audit
- Issue is **NOT** being fixed immediately
- Issue has visible impact (type-check, tests, runtime)
- Issue needs tracking for future resolution

### When to Remove an Issue

**Criteria:**
- Issue is **resolved** (fix merged to main)
- Issue is **no longer relevant** (code deleted, refactored)
- Issue is **moved** to another tracking system (Jira, GitHub Issues)

### Template Usage

1. Copy template from "Future Issues" section
2. Fill in all fields
3. Add to "Current Issues Summary" table
4. Commit to Git

---

## Conclusion

**Total known issues:** 2

**Blocking development:** 1 (StockKPICard)

**Blocking production:** 0

**Next steps:**
1. Create task [BO-COMPONENTS-XXX] to fix StockKPICard
2. Include in Phase 2B follow-up (duplicate components cleanup)
3. Update this document when resolved

---

**Status:** ✅ COMPLETE - Issues documented, tracking process established
**Next:** README.md root (if missing)
