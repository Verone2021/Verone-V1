# Drift Resolution Plan

**Generated:** 2026-01-20
**Context:** 75 tables in DB but not in Git migrations (base schema drift)
**Status:** ⏸️ PLAN ONLY - No execution, awaiting Phase 5 decision

---

## Executive Summary

**Base Schema Drift:** 75 tables exist in production DB but not in Git migrations.

**Recommendation:** **Option B (Current)** - Accept external source + document governance.

**Rationale:**
- ✅ Zero risk to production database
- ✅ Fast: documentation only, no DB changes
- ✅ Sufficient for current needs: types generation works, DB is stable
- ⏸️ Option A (zero drift) deferred to Phase 5 with proper staging/backup/rollback

---

## Context from Phase 4.1 Audit

**Database State (actual):**
- Tables in DB: **101**
- Tables in Git: **37**
- **Base schema drift: 75 tables**

**Impact:**
- Cannot reproduce database from Git migrations alone
- Onboarding requires access to existing DB (or DB dump)
- Zero drift policy violated

**Risk Assessment:**
- Production database is stable and running
- Types are up-to-date (`packages/@verone/types/src/supabase.ts`)
- No immediate operational impact from drift
- Risk = future onboarding complexity, not current stability

---

## Option B: Accept External Source (RECOMMENDED - Current)

### Approach

**Accept that the base schema (75 tables) comes from an external source**, and establish governance to maintain alignment.

### Source of Truth

**Production Database = Source of Truth** for base schema.

**Git Migrations = Source of Truth** for incremental changes (37 tables + 23 views already in Git).

**TypeScript Types = Generated Artifact** from production DB (via `supabase gen types`).

### Governance Model

#### 1. TypeScript Types Generation

**Current process:**
```bash
npx supabase gen types typescript --project-id xyshyhqovnuhbzkjhulp > packages/@verone/types/src/supabase.ts
```

**Frequency:** On-demand, or when schema changes in production.

**Validation:** Types must always reflect production DB state.

**Documentation:** See `docs/database/source-of-truth.md`

#### 2. Inventory Tracking

**Maintain inventory.md accuracy:**
- Update `docs/database/inventory.md` whenever base schema changes
- Run audit quarterly to verify counts (tables/views/functions)
- Use `table-vs-view-audit.md` as template for future audits

**Commands to track drift:**
```bash
# Count tables in DB (from TypeScript types)
sed -n '/^    Tables: {/,/^    Views: {/p' packages/@verone/types/src/supabase.ts \
  | grep -E "^      [a-z_]+: {$" | wc -l

# Count tables in Git
grep -Eoh "CREATE\s+TABLE[^(]+" supabase/migrations/*.sql \
  | grep -v "^_" | sort -u | wc -l
```

#### 3. New Table Creation Policy

**For all new tables:**
- ✅ Create via Git migration (NOT manually in Supabase dashboard)
- ✅ Follow convention: `YYYYMMDDHHMMSS_descriptive_name.sql`
- ✅ Include IF NOT EXISTS for idempotency
- ✅ Regenerate types after migration

**Example:**
```sql
-- supabase/migrations/20260120120000_add_new_feature.sql
CREATE TABLE IF NOT EXISTS public.new_feature_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_new_feature_name ON public.new_feature_table(name);
```

#### 4. Onboarding Process

**New developer setup:**
1. Clone repo
2. Request DB access (Supabase credentials)
3. Pull types: `npx supabase gen types typescript --project-id xyshyhqovnuhbzkjhulp`
4. No local DB reset required (connect directly to staging/dev instance)

**Alternative (local dev with DB dump):**
1. Request production DB dump (pgdump)
2. Restore locally: `psql -U postgres < dump.sql`
3. Apply incremental migrations: `npx supabase db reset`

#### 5. Documentation Requirements

**Maintain these docs:**
- `docs/database/inventory.md` - Current table/view counts
- `docs/database/table-vs-view-audit.md` - Detailed audit (quarterly update)
- `docs/database/source-of-truth.md` - Governance rules
- `docs/database/drift-resolution-plan.md` (this file)

### Advantages

✅ **Zero risk** - No changes to production database
✅ **Fast** - Documentation only, implemented immediately
✅ **Pragmatic** - Accepts reality (base schema already in production)
✅ **Sufficient** - Types generation works, developers can onboard
✅ **Flexible** - Can migrate to Option A later (Phase 5) when ready

### Disadvantages

⚠️ **No full reproducibility** - Cannot spin up DB from Git alone
⚠️ **Onboarding friction** - New devs need DB access or dump
⚠️ **Drift risk** - Manual DB changes could bypass Git

### Mitigation

1. **Enforce "all new tables via Git migration"** policy (see section 3)
2. **Quarterly audits** to detect new drift
3. **Document base schema provenance** (imported from legacy system, etc.)
4. **Plan Option A for Phase 5** when ready for full zero-drift

---

## Option A: Import Base Schema to Git (FUTURE - Phase 5)

### Approach

**Generate a migration** (`20260120000000_base_schema.sql`) containing DDL for all 75 missing tables.

### Prerequisites (CRITICAL)

**Before executing Option A, MUST have:**

1. ✅ **Staging environment clone** of production DB
2. ✅ **Full DB backup** with tested restore procedure
3. ✅ **Rollback plan** documented and validated
4. ✅ **DDL extraction validated** on staging first
5. ✅ **Types regeneration tested** (must match current)
6. ✅ **Zero breaking changes** to existing tables

### Steps (High-Level)

#### 1. Extract DDL from Production

**Tools:**
- `pg_dump --schema-only --table=<table_name>` for each of 75 tables
- OR: Parse TypeScript types + reverse-engineer DDL
- OR: Supabase dashboard export (if available)

**Challenges:**
- Correct order (dependencies, FK constraints)
- Extensions (uuid-ossp, pg_trgm, etc.)
- Custom types/enums (must be created first)
- RLS policies (if not already in migrations)
- Triggers (updated_at, audit, etc.)
- Indexes (performance-critical)
- Default values, check constraints, etc.

#### 2. Generate Migration File

**Structure:**
```sql
-- 20260120000000_base_schema.sql
-- Base schema import - 75 tables from production
-- WARNING: This migration is idempotent (IF NOT EXISTS everywhere)

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Custom types/enums
CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pending', 'paid', 'failed');

-- 3. Tables (ordered by dependencies)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- [... 74 more tables ...]

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- 5. RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "categories_select" ON public.categories FOR SELECT USING (true);

-- 6. Triggers
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Rollback (commented, for manual execution if needed):
-- DROP TABLE IF EXISTS public.categories CASCADE;
-- [... reverse order ...]
```

#### 3. Validation Checklist

**On staging environment:**

- [ ] Apply migration: `npx supabase db reset`
- [ ] Regenerate types: `npx supabase gen types typescript`
- [ ] Diff types: `diff old_types.ts new_types.ts` (must be identical)
- [ ] Run type-check: `npm run type-check` (must pass)
- [ ] Test queries: Verify data access works
- [ ] Test RLS: Verify policies apply correctly
- [ ] Test triggers: Verify updated_at, audit logs work
- [ ] Rollback test: Drop all tables, verify clean state

**On production:**

- [ ] Backup DB: `pg_dump > backup_before_base_schema.sql`
- [ ] Apply migration (should be no-op due to IF NOT EXISTS)
- [ ] Verify no data loss: `SELECT COUNT(*) FROM <each_table>`
- [ ] Regenerate types: Must match staging
- [ ] Monitor errors: Sentry, logs, etc.

#### 4. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Wrong DDL order (FK errors) | Test on staging first, use dependency graph |
| Missing extensions/enums | Extract from production, include in migration |
| RLS policy conflicts | Use IF NOT EXISTS, test on staging |
| Migration fails midway | Wrap in transaction, test rollback |
| Types mismatch after | Diff types before/after, must be identical |
| Data loss | IF NOT EXISTS prevents drops, backup before |

### Advantages

✅ **Full reproducibility** - Can spin up DB from Git alone
✅ **Zero drift** - All tables in Git migrations
✅ **Onboarding simplified** - `npx supabase db reset` works
✅ **Compliance** - Meets "infrastructure as code" standards

### Disadvantages

⚠️ **High risk** - Touching production schema requires extreme care
⚠️ **Complex** - 75 tables with dependencies, RLS, triggers
⚠️ **Time-consuming** - Extract DDL, test, validate, rollback plan
⚠️ **No immediate value** - DB already works, types already work

### Recommendation

**Defer to Phase 5** when:
- Staging environment is set up
- Full backup/restore tested
- DDL extraction validated
- Team capacity available for validation

---

## Comparison: Option B vs Option A

| Criteria | Option B (Current) | Option A (Phase 5) |
|----------|--------------------|--------------------|
| **Risk** | ✅ Zero (docs only) | ⚠️ High (schema changes) |
| **Speed** | ✅ Immediate | ⚠️ Days/weeks |
| **Reproducibility** | ⚠️ No (needs DB dump) | ✅ Yes (Git migrations) |
| **Onboarding** | ⚠️ DB access required | ✅ `db reset` works |
| **Current value** | ✅ Sufficient | ⚠️ Low (DB already stable) |
| **Future value** | ⚠️ Drift risk | ✅ Zero drift forever |
| **Complexity** | ✅ Simple (docs) | ⚠️ Complex (DDL extraction) |

---

## Decision: Option B (Current)

**Chosen approach:** **Option B - Accept external source + document governance**

**Rationale:**
1. Production DB is stable - no immediate need to change schema
2. Types generation works - developers have accurate types
3. Zero risk approach - documentation doesn't break anything
4. Fast implementation - complete in Phase 4.2-4.4
5. Option A can be done later - not mutually exclusive

**Next steps:**
1. ✅ Document governance model (this file)
2. ✅ Update `docs/database/source-of-truth.md` to reflect Option B
3. ✅ Establish quarterly audit process
4. ✅ Enforce "new tables via Git migration" policy
5. ⏸️ Defer Option A to Phase 5 (with proper staging/backup)

---

## Phase 5: Option A Implementation (Future)

**When to execute:**
- Staging environment ready
- Full backup/restore tested
- Team capacity available
- Business value identified (e.g., compliance requirement)

**Pre-execution checklist:**
- [ ] Staging DB clone created
- [ ] DDL extraction script validated on staging
- [ ] Migration file generated and tested on staging
- [ ] Types diff validated (before/after identical)
- [ ] Rollback script written and tested
- [ ] Backup procedure tested (dump + restore)
- [ ] Team review completed
- [ ] Go/no-go decision approved

**Execution plan:**
1. Create feature branch: `feat/base-schema-import`
2. Generate migration: `20260120000000_base_schema.sql`
3. Test on staging: `npx supabase db reset`
4. Validate types: `diff old_types.ts new_types.ts`
5. Apply to production (if validation passes)
6. Monitor for 48 hours
7. Merge to main if stable

---

## Conclusion

**Current state:**
- 75 tables in DB, not in Git
- Types are accurate (generated from production)
- DB is stable and operational

**Chosen approach:**
- **Option B (now):** Accept drift, document governance
- **Option A (later):** Import base schema in Phase 5 with full safety net

**Risk mitigation:**
- Enforce "all new tables via Git migration" policy
- Quarterly audits to detect new drift
- Document source-of-truth clearly

**Success criteria:**
- ✅ Documentation complete (this file + governance docs)
- ✅ Zero production impact
- ✅ Developers can onboard (with DB access)
- ✅ Types stay in sync with DB
- ⏸️ Option A available as future enhancement

---

**Status:** ✅ PLAN COMPLETE - Option B recommended, Option A deferred to Phase 5
**Next:** Phase 4.3 (artifacts policy) + Phase 4.4 (known issues + README)
