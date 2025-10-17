# /audit-module - Audit Complet Module + Documentation Officielle

**Workflow 7 phases** : Code Analysis → Doc Review → Testing → Error Report → Fixes → Official Docs → Cleanup Obsolete

## Usage
```bash
/audit-module <module-name>
```

## Modules Disponibles
- `dashboard` - Dashboard analytics & KPIs
- `produits` - Catalogue + Sourcing + Validation
- `stocks` - Inventory management + Movements
- `commandes` - Orders (fournisseurs + clients)
- `contacts-organisations` - CRM contacts & organisations
- `factures` - Invoicing & billing
- `tresorerie` - Treasury & payments
- `ventes` - Sales channels & management
- `consultations` - Customer consultations

## Workflow Complet

### Phase 1 : Code Discovery (Serena Symbolic Analysis)

**Objectif** : Inventaire complet code RÉEL du module

**Actions** :
```typescript
// 1. List all files module
mcp__serena__list_dir(`src/app/${module}`, recursive: true)

// 2. Analyze main page
mcp__serena__get_symbols_overview(`src/app/${module}/page.tsx`)

// 3. Find all hooks related
mcp__serena__find_symbol("*", `src/hooks/*${module}*`, substring_matching: true)
mcp__serena__find_symbol("*", `src/hooks/metrics/use-${module}-*`)

// 4. Find all components related
mcp__serena__find_symbol("*", `src/components/business/*${module}*`)

// 5. Find all API routes
mcp__serena__list_dir(`src/app/api/${module}`)
```

**Output** :
```markdown
## Code Inventory : [MODULE]

### Pages (3)
- src/app/[module]/page.tsx - Main page
- src/app/[module]/[id]/page.tsx - Detail page
- src/app/[module]/new/page.tsx - Creation page

### Hooks (7)
- src/hooks/use-[module].ts - Main hook
- src/hooks/use-[module]-filters.ts - Filtering
- src/hooks/metrics/use-[module]-metrics.ts - Metrics
[...]

### Components (12)
- src/components/business/[module]-card.tsx
- src/components/business/[module]-modal.tsx
[...]

### API Routes (2)
- src/app/api/[module]/route.ts - CRUD
- src/app/api/[module]/[id]/route.ts - Single resource
```

### Phase 2 : Documentation Analysis

**Objectif** : Identifier docs existantes (officielles vs obsolètes)

**Actions** :
```typescript
// 1. Search official docs
Grep("docs/", pattern: module, output_mode: "files_with_matches")
Grep("manifests/", pattern: module)

// 2. Search provisional docs
Grep("TASKS/", pattern: module)
Grep("MEMORY-BANK/sessions/", pattern: module)
Grep("archive/", pattern: module)

// 3. Read existing docs
Read("docs/workflows/*[module]*.md")
Read("docs/metrics/*[module]*.md")
```

**Output** :
```markdown
## Documentation Existante : [MODULE]

### Official Docs ✅
- docs/workflows/[module]-workflow.md (valid, current)
- docs/metrics/[module]-kpis.md (valid, current)

### Provisional Docs ⚠️
- TASKS/completed/[module]-fix-2025-10-10.md (obsolete)
- MEMORY-BANK/sessions/[module]-debug-2025-09-15.md (obsolete)
- archive/documentation-2025-10-16/[module]-old.md (archived)

### Missing Docs ❌
- Hooks usage documentation
- API routes documentation
- Components props documentation
- Performance tuning guide

### Divergences Detected 🔍
1. docs/workflows/[module]-workflow.md mentions removed feature X
2. docs/metrics/ missing new KPI Y (added in code)
3. Business rules docs outdated (old validation logic)
```

### Phase 3 : Testing Complet

**Objectif** : Tests E2E + Console + DB + Performance

**Test Suite** :
```typescript
// 1. Browser E2E Tests (Playwright)
mcp__playwright__browser_navigate(`http://localhost:3000/${module}`)
mcp__playwright__browser_console_messages() // Zero errors mandatory

// Test main flows
// - List view loading
// - Detail view navigation
// - Create new item flow
// - Edit existing item flow
// - Delete item flow (if applicable)

mcp__playwright__browser_click("[data-testid='create-button']")
// ... user flow simulation

// 2. Performance Testing
// Measure load times vs SLOs
// Dashboard <2s, Catalogue <3s, Others <4s

// 3. Database Queries Validation
mcp__supabase__execute_sql(`
  EXPLAIN ANALYZE
  SELECT * FROM [module_table]
  WHERE [conditions]
  LIMIT 50
`)
// Identify slow queries >500ms

// 4. Accessibility Check
mcp__playwright__browser_snapshot()
// Verify keyboard navigation, ARIA labels

// 5. Console Error Checking (CRITICAL)
// Zero tolerance: 1 error = FAIL
```

**Output** :
```markdown
## Tests Results : [MODULE]

### E2E Tests (7 flows)
- ✅ List view loading : PASSED (1.2s)
- ✅ Detail navigation : PASSED
- ✅ Create flow : PASSED
- ❌ Edit flow : FAILED (console error line 42)
- ✅ Delete flow : PASSED
- ✅ Filters : PASSED
- ⚠️ Search : WARNING (slow 3.5s, target <2s)

### Console Errors (CRITICAL)
❌ 3 errors detected:
1. CRITICAL - TypeError: Cannot read 'id' of undefined
   File: src/app/[module]/page.tsx:42
   Impact: Edit flow broken

2. HIGH - Warning: Missing key prop in list
   File: src/components/business/[module]-list.tsx:67
   Impact: Performance degradation

3. MEDIUM - Deprecated API usage
   File: src/hooks/use-[module].ts:123
   Impact: Future breaking change

### Performance Metrics
- Page load : 1.8s ✅ (Target <2s)
- API response : 450ms ✅ (Target <500ms)
- Database query : 2.1s ❌ (Target <1s)
- Total interactive : 2.5s ⚠️ (Target <2s)

### Database Analysis
❌ 2 slow queries detected:
1. SELECT with N+1 problem (2.1s)
   Suggestion: Add JOIN to fetch related data

2. Missing index on filter column (890ms)
   Suggestion: CREATE INDEX idx_[table]_[column]

### Accessibility
✅ WCAG 2.1 AA compliant
✅ Keyboard navigation functional
✅ Screen reader compatible
```

### Phase 4 : Error Reporting Structuré

**Objectif** : Rapport complet issues détectées

**Format** :
```markdown
# 📊 Rapport Audit : [MODULE] - [DATE]

## Executive Summary

- **Status** : ⚠️ WARNINGS (3 issues)
- **Code Files** : 22 analyzed
- **Tests** : 7/7 flows (1 failed, 1 warning)
- **Console Errors** : 3 (1 CRITICAL, 1 HIGH, 1 MEDIUM)
- **Performance** : Below target (-20%)
- **Documentation** : 40% coverage

## 🔍 Code Analysis

[Inventory from Phase 1]

## 📚 Documentation Status

[Analysis from Phase 2]

## 🧪 Tests Results

[Results from Phase 3]

## ❌ Issues Priority Matrix

### CRITICAL (Must Fix Before Phase 2)
1. **TypeError page.tsx:42**
   - Impact: Edit flow broken
   - Root cause: Missing null check
   - Fix: Add optional chaining `data?.id`

### HIGH (Should Fix Soon)
2. **N+1 Query Problem**
   - Impact: Performance 2.1s (target <1s)
   - Root cause: Loop queries
   - Fix: Replace with JOIN

3. **Missing key prop**
   - Impact: React performance warning
   - Root cause: Map without stable key
   - Fix: Use item.id as key

### MEDIUM (Can Fix Later)
4. **Deprecated API usage**
   - Impact: Future breaking change
   - Root cause: Old Next.js API
   - Fix: Migrate to new API

## 💡 Optimization Recommendations

### Performance Optimizations
1. Add database index : `CREATE INDEX idx_[table]_[column]`
2. Implement useMemo for expensive computations
3. Add React.memo for pure components
4. Lazy load images with next/image

### Code Quality Improvements
1. Add TypeScript strict types (remove 3 `any`)
2. Extract repeated logic to custom hook
3. Implement error boundaries
4. Add loading states UI

### Documentation Gaps
1. Create docs/modules/[module]/hooks.md
2. Document API routes with examples
3. Add performance tuning guide
4. Update business rules (3 divergences)

## 🎯 Next Steps

### Immediate (This Session)
- [ ] Fix CRITICAL error (TypeError)
- [ ] Add database index
- [ ] Fix HIGH warning (key prop)
- [ ] Generate official documentation

### Short Term (This Week)
- [ ] Optimize N+1 query
- [ ] Add missing docs
- [ ] Cleanup obsolete docs (12 files)

### Medium Term (Phase 2 Prep)
- [ ] Implement remaining optimizations
- [ ] Add comprehensive tests
- [ ] Update all documentation
- [ ] Establish performance baseline
```

### Phase 5 : Fixes & Optimizations

**Objectif** : Corriger erreurs + appliquer optimisations

**Actions** :
```typescript
// 1. Auto-fix SAFE issues (Serena)
mcp__serena__replace_symbol_body(
  "page.tsx:42",
  `data.id`, // old
  `data?.id` // new (null-safe)
)

// 2. Database optimizations
mcp__supabase__execute_sql(`
  CREATE INDEX IF NOT EXISTS idx_[table]_[column]
  ON [table]([column])
`)

// 3. Suggest complex fixes (Manual review required)
// - N+1 query refactoring
// - Component architecture changes
// - Hook optimization with useMemo/useCallback

// 4. Validate fixes
// Re-run Phase 3 tests to confirm fixes work
```

**Output** :
```markdown
## Fixes Applied : [MODULE]

### Auto-Fixed (3 issues)
✅ TypeError fixed with optional chaining
✅ Missing key prop added
✅ Database index created

### Optimization Suggestions (Manual)
💡 Refactor use-[module].ts:
   - Replace loop queries with single JOIN
   - Add useMemo for filtered data
   - Implement debounce for search

💡 Component optimization:
   - Wrap [Module]Card with React.memo
   - Extract [Module]Form to separate component
   - Add error boundary around [Module]List

### Validation Results
✅ Console errors : 3 → 0 (-100%)
✅ Performance : 2.5s → 1.6s (-36%)
✅ Tests : 7/7 flows PASSED (was 6/7)
```

### Phase 6 : Documentation Officielle

**Objectif** : Créer docs/modules/[module]/ basée sur CODE RÉEL

**Structure Documentation Module** :
```
docs/modules/[module]/
├── README.md              # Overview + Quick Start
├── architecture.md        # Code structure détaillée
├── hooks.md              # Hooks usage + examples
├── components.md         # Components props + usage
├── api-routes.md         # API endpoints documentation
├── database.md           # Tables + queries + RLS
├── testing.md            # Tests coverage + guides
├── performance.md        # SLOs + optimizations
└── troubleshooting.md    # Common issues + solutions
```

**Templates** :
```markdown
# README.md
# [Module] - Overview

**Status** : ✅ Phase 1 Complete
**Last Audit** : [DATE]
**Coverage** : [X]% code documented

## Quick Start
[How to use module in 3 steps]

## Architecture Overview
[Diagram + explanation]

## Key Features
- Feature 1
- Feature 2

## Performance Targets
- Page load : <2s
- API response : <500ms

## Documentation Index
- [Architecture](./architecture.md)
- [Hooks](./hooks.md)
- [Components](./components.md)
[...]
```

**Génération Automatique** :
- Inventory code → architecture.md
- Symbol analysis → hooks.md, components.md
- API routes discovered → api-routes.md
- Tests results → testing.md
- Performance metrics → performance.md

### Phase 7 : Cleanup Documentation Obsolète

**Objectif** : Supprimer docs provisoires, garder officielle uniquement

**Règles Cleanup** :
```typescript
// ✅ GARDER (Documentation Officielle)
docs/modules/[module]/          // Nouvelle doc officielle
manifests/business-rules/       // Règles métier (toujours valides)
docs/workflows/                 // Workflows validés Phase 1

// ❌ SUPPRIMER (Documentation Provisoire/Obsolète)
TASKS/completed/*[module]* >30 jours
MEMORY-BANK/sessions/*[module]* rapports provisoires
archive/documentation-2025-10-16/*[module]*

// 📦 ARCHIVER (Référence Historique)
TASKS/completed/PHASE-1-* → archive/phase-1-tasks/
MEMORY-BANK/debug-reports/[module]* → archive/phase-1-debug/
```

**Actions** :
```bash
# 1. Identify obsolete docs (from Phase 2 analysis)
# 2. Backup to archive/phase-1-cleanup/[module]/
# 3. Delete from active locations
# 4. Update index files (README.md in docs/, MEMORY-BANK/)

# Example :
mv TASKS/completed/[module]-fix-*.md archive/phase-1-cleanup/[module]/
mv MEMORY-BANK/sessions/[module]-debug-*.md archive/phase-1-cleanup/[module]/
rm -rf archive/documentation-2025-10-16/[module]-*.md
```

**Output** :
```markdown
## Cleanup Summary : [MODULE]

### Deleted (12 files)
❌ TASKS/completed/[module]-fix-2025-09-15.md (obsolete)
❌ TASKS/completed/[module]-test-2025-10-01.md (obsolete)
❌ MEMORY-BANK/sessions/[module]-debug-2025-09-20.md (provisional)
[...]

### Archived (5 files)
📦 TASKS/completed/PHASE-1-[module].md → archive/phase-1-tasks/
📦 MEMORY-BANK/debug-reports/[module]-*.md → archive/phase-1-debug/
[...]

### Kept (Official Docs)
✅ docs/modules/[module]/ (7 files) - NEW OFFICIAL
✅ manifests/business-rules/[module]-rules.md
✅ docs/workflows/[module]-workflow.md

### Documentation Status
Before : 24 files (17 obsolete, 7 current)
After : 7 files (0 obsolete, 7 official)
Cleanup : -71% files, +100% clarity
```

## Final Output

```markdown
# 🎉 Audit Complété : [MODULE]

## Summary
✅ Code analyzed : 22 files
✅ Tests executed : 7/7 PASSED
✅ Errors fixed : 3 CRITICAL → 0
✅ Performance improved : 2.5s → 1.6s (-36%)
✅ Documentation created : docs/modules/[module]/ (7 files)
✅ Cleanup : 12 obsolete files removed

## Outputs Generated

### 1. Rapport Audit Complet
📊 MEMORY-BANK/audits/[module]-[date].md

### 2. Documentation Officielle
📁 docs/modules/[module]/
   ├── README.md
   ├── architecture.md
   ├── hooks.md
   ├── components.md
   ├── api-routes.md
   ├── database.md
   ├── testing.md
   ├── performance.md
   └── troubleshooting.md

### 3. Archive Cleanup
📦 archive/phase-1-cleanup/[module]/

## Next Steps

### Immediate
- [x] Review rapport audit
- [ ] Validate fixes applied
- [ ] Review official documentation

### Before Phase 2
- [ ] Apply remaining optimizations
- [ ] Add comprehensive E2E tests
- [ ] Establish performance baseline
- [ ] Update business rules if needed

## Performance Baseline (Phase 2 Reference)
- Page load : 1.6s (Target <2s) ✅
- API response : 420ms (Target <500ms) ✅
- Database query : 680ms (Target <1s) ✅
- Console errors : 0 ✅

---

**Module [MODULE] ready for Phase 2** 🚀
```

## Best Practices

### Zero Tolerance Console Errors
❌ 1 console error = AUDIT FAILED
✅ Fix ALL errors before declaring success

### Documentation Basée sur Code Réel
❌ Ne JAMAIS copier vieille documentation
✅ TOUJOURS générer depuis code analysis

### Performance SLOs Mandatory
- Dashboard : <2s
- Catalogue : <3s
- Other modules : <4s
- API calls : <500ms
- Database queries : <1s

### Cleanup Safety Rules
✅ Backup avant suppression (archive/)
✅ Garder manifests/ (business rules)
✅ Supprimer uniquement docs provisoires
❌ Jamais supprimer code source

## Integration Workflow

```bash
# Standard usage
/audit-module dashboard

# Before Phase 2 : Audit all modules
/audit-module dashboard
/audit-module produits
/audit-module stocks
/audit-module commandes
/audit-module contacts-organisations
/audit-module factures
/audit-module tresorerie
/audit-module ventes

# Result:
# - docs/modules/ complete (8 modules)
# - All tests validated
# - Performance baselines established
# - Obsolete docs cleaned (>80%)
# - Ready for Phase 2 development
```

**AVANTAGE : Phase 1 → Phase 2 transition clean et documentée !**
