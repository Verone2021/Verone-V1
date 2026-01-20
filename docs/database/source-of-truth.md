# Database Source of Truth

**Version:** 1.0
**Last Updated:** 2026-01-19
**Status:** ⚠️ Policy defined, enforcement pending drift resolution

---

## Principle

**Git migrations = single source of truth for app schema (public.\*)**

- **System schemas** (auth.\*, storage.\*, realtime.\*) are managed by Supabase, not in our repo ✅ OK
- **App tables** (public.\*) MUST be declared in `supabase/migrations/` ⚠️ Currently violated (71/101 tables missing)
- **Zero drift policy:** If a table exists in DB but not in migrations → critical bug 🚨

---

## Current State (2026-01-19)

### 🚨 Drift Detected

| Metric | Count | Status |
|--------|-------|--------|
| **Tables in DB** (public.\* schema) | 101 | ✅ Production state |
| **Tables in Git migrations** | 39 | ⚠️ Incomplete |
| **Base schema tables not in Git** | 71 | 🚨 DRIFT |
| **Incremental tables in Git** | 39 | ✅ Tracked |

**Root cause:** Base schema (71 tables) was created outside Git, likely via:
- Database dump import
- Manual schema creation in early development
- Migration from legacy system

**Impact:**
- Cannot reproduce database from Git alone
- New developers cannot understand full schema from migrations
- Risk of environment drift (local ≠ staging ≠ prod)
- No rollback capability for base schema

**See:** [Database Inventory](./inventory.md) for complete drift analysis.

---

## Target State (Zero Drift)

### Goal

**100% of app schema (public.\*) in Git migrations**

| Schema | Source of Truth | Notes |
|--------|----------------|-------|
| `public.*` | **Git migrations** | App tables, views, functions, policies |
| `auth.*` | Supabase managed | ✅ OK to be outside repo |
| `storage.*` | Supabase managed | ✅ OK to be outside repo |
| `realtime.*` | Supabase managed | ✅ OK to be outside repo |
| `extensions.*` | PostgreSQL/Supabase | ✅ OK to be outside repo |

### Enforcement

**Zero Drift Policy:**
- ✅ **DO:** Create/alter tables via migrations only
- ✅ **DO:** Test migrations locally before merging
- ✅ **DO:** Commit migrations + types + code together
- ❌ **DON'T:** Create tables manually in Supabase Studio
- ❌ **DON'T:** Run raw SQL in prod without migration
- ❌ **DON'T:** Alter tables outside migration files

**Detection:**
- Quarterly audits (compare Git migrations vs prod DB)
- CI check (future): Fail if types diverge from migrations
- Monitoring: Alert on unexpected schema changes

**Resolution:**
- If drift detected → investigate immediately
- Document in audit log
- Create migration to sync Git with DB state
- Or drop drifted object if not needed

---

## Workflow: Development

### 1. Create Migration

**Local development:**

```bash
# Create new migration file
supabase migration new add_user_preferences_table

# File created: supabase/migrations/20260120123456_add_user_preferences_table.sql
```

**Write migration SQL:**

```sql
-- Migration: Add user_preferences table
-- Author: [Your Name]
-- Date: 2026-01-20

-- Create table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark')),
  CONSTRAINT valid_language CHECK (language IN ('en', 'fr'))
);

-- Add index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own preferences
CREATE POLICY select_own_preferences
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own preferences
CREATE POLICY update_own_preferences
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own preferences
CREATE POLICY insert_own_preferences
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger: Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Rollback (for down migration)
-- DROP TABLE IF EXISTS public.user_preferences CASCADE;
```

**Best practices:**
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Include rollback SQL in comments
- Add indexes on foreign keys
- Enable RLS on all tables with user data
- Add triggers for `updated_at` automation
- Validate constraints (CHECK, NOT NULL, UNIQUE)

---

### 2. Apply Migration Locally

```bash
# Apply all pending migrations
supabase db reset

# This will:
# 1. Drop local DB
# 2. Recreate from scratch
# 3. Apply ALL migrations in order
# 4. Seed data (if seed.sql exists)
```

**Why `db reset` instead of `db push`?**
- Ensures clean state (no drift)
- Tests full migration history
- Catches migration order issues
- Simulates fresh environment

**For development speed:**
```bash
# Quick push (does NOT reset, just applies new migrations)
supabase db push

# Use only for rapid iteration, always test with `db reset` before committing
```

---

### 3. Regenerate Types

**After applying migration, regenerate TypeScript types:**

```bash
# Generate types from local DB
npx supabase gen types typescript --local > packages/@verone/types/src/supabase.ts

# Or use npm script if available
npm run types:generate
```

**This creates/updates:**
- `packages/@verone/types/src/supabase.ts`
- Type definitions for all tables, views, functions
- Used by Supabase client for type-safe queries

**⚠️ Always commit types with migration:**
```bash
git add supabase/migrations/20260120123456_*.sql
git add packages/@verone/types/src/supabase.ts
git commit -m "[BO-DB-001] feat: add user preferences table"
```

---

### 4. Update Code

**Use generated types in code:**

```typescript
import { Database } from '@verone/types/supabase';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type NewUserPreferences = Database['public']['Tables']['user_preferences']['Insert'];

// Type-safe query
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// data is typed as UserPreferences | null
```

**Benefits:**
- Compile-time type checking
- Autocomplete in IDE
- Catch breaking changes early
- Refactoring safety

---

### 5. Test Locally

**Run tests:**

```bash
# Type check
npm run type-check

# Build (catches TypeScript errors)
npm run build

# E2E tests (if relevant)
npm run e2e:smoke
```

**Manual testing:**
- Test new queries/mutations in app
- Verify RLS policies work (try as different users)
- Check performance (no N+1 queries)
- Test edge cases

---

### 6. Commit Everything Together

**Atomic commit = migration + types + code:**

```bash
git add supabase/migrations/20260120123456_add_user_preferences_table.sql
git add packages/@verone/types/src/supabase.ts
git add apps/back-office/src/features/user-preferences/*.ts
git commit -m "[BO-DB-001] feat: add user preferences table

- Create user_preferences table with RLS
- Add indexes on user_id FK
- Generate TypeScript types
- Implement preferences UI in back-office
"
git push
```

**Why atomic?**
- Code depends on types, types depend on migration
- If one fails, all fail (no partial state)
- Easy to rollback (one commit)
- Clear history

---

## Workflow: Production

### Supabase Cloud Auto-Apply

**How it works:**

1. **Push to Git:**
   ```bash
   git push origin main
   ```

2. **Supabase detects new migrations:**
   - Monitors `supabase/migrations/` folder
   - Compares with applied migrations in DB

3. **Auto-applies pending migrations:**
   - Runs migrations in order (by filename timestamp)
   - Logs success/failure
   - Updates `supabase_migrations` table

4. **Verifies deployment:**
   ```bash
   # Check Supabase dashboard
   # Or via CLI:
   supabase db remote list
   ```

**⚠️ Migrations are irreversible in prod:**
- No auto-rollback
- Test thoroughly in local + staging
- Have rollback plan ready

---

### Manual Migration (if needed)

**For emergency fixes or manual deployments:**

```bash
# Connect to prod DB (requires credentials)
supabase db execute \
  --project-ref <project-id> \
  --file supabase/migrations/20260120123456_fix_critical_bug.sql

# Or via psql
psql $DATABASE_URL -f supabase/migrations/20260120123456_fix_critical_bug.sql
```

**⚠️ Only for emergencies. Always commit migration to Git afterward.**

---

### Rollback Strategy

**If migration breaks prod:**

**Option 1: Forward fix (preferred)**
```bash
# Create new migration to fix issue
supabase migration new fix_broken_migration
# Write fix SQL
supabase db push
git add supabase/migrations/20260120234567_fix_broken_migration.sql
git commit -m "[HOTFIX] fix broken migration"
git push
```

**Option 2: Revert migration (use with caution)**
```sql
-- Run rollback SQL manually
-- (the commented rollback section in original migration)
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- Mark migration as reverted in supabase_migrations table
-- (manual cleanup required)
```

**⚠️ Never delete migration files from Git.** They are history.

---

## Migration Conventions

### Naming

**Format:** `YYYYMMDDHHMMSS_description.sql`

**Examples:**
- `20260120120000_add_user_preferences_table.sql`
- `20260120130000_add_index_on_products_sku.sql`
- `20260120140000_alter_orders_add_notes_column.sql`

**Auto-generated by:**
```bash
supabase migration new <description>
```

---

### Structure

**Every migration should have:**

```sql
-- Migration: [Title]
-- Author: [Your Name]
-- Date: YYYY-MM-DD
-- Description: [What this migration does]

-- Forward migration (UP)
CREATE TABLE ...;
CREATE INDEX ...;
ALTER TABLE ...;

-- Rollback instructions (DOWN) - commented
-- DROP TABLE IF EXISTS ...;
-- DROP INDEX IF EXISTS ...;
```

---

### Reversibility

**Design migrations to be reversible:**

- Use `IF NOT EXISTS` / `IF EXISTS`
- Include rollback SQL in comments
- Test rollback locally
- Document side effects (data loss, etc.)

**Breaking changes:**
- Avoid renaming columns (create new + copy data + drop old)
- Avoid dropping tables without backup
- Coordinate with code deployments

---

### Atomic Operations

**Keep migrations focused:**

✅ **Good:** One table per migration
```
20260120120000_add_user_preferences_table.sql
20260120130000_add_notification_settings_table.sql
```

❌ **Bad:** Everything in one migration
```
20260120120000_add_all_new_tables.sql  # 1000 lines
```

**Why?**
- Easier to rollback specific changes
- Clear history
- Faster reviews
- Less merge conflicts

---

## Type Generation

### Generated File

**Location:** `packages/@verone/types/src/supabase.ts`

**Generated from:** Local DB schema (after applying migrations)

**Used by:** All Supabase queries in TypeScript code

---

### Command

```bash
# Generate from local DB
npx supabase gen types typescript --local > packages/@verone/types/src/supabase.ts

# Generate from prod DB (requires project ref)
npx supabase gen types typescript \
  --project-id <project-ref> \
  > packages/@verone/types/src/supabase.ts
```

---

### When to Regenerate

**Regenerate types after:**
- ✅ Creating new table
- ✅ Adding/removing columns
- ✅ Changing column types
- ✅ Creating new views
- ✅ Creating new RPC functions
- ❌ Adding indexes (no type impact)
- ❌ Adding RLS policies (no type impact)

---

### Bridge: DB → TypeScript

**Workflow:**

```
1. Migration (SQL)
   ↓
2. Apply to local DB (supabase db reset)
   ↓
3. Generate types (supabase gen types)
   ↓
4. Use types in code (import from @verone/types)
   ↓
5. TypeScript compiler validates queries
```

**This ensures:**
- Code always matches DB schema
- Breaking changes caught at compile time
- Refactoring safety
- IDE autocomplete

---

## Drift Resolution

### Detection

**How drift occurs:**

1. **Manual schema changes** (Supabase Studio, SQL editor)
2. **Migrations applied but not committed** to Git
3. **External tools** creating tables (data loaders, scripts)
4. **Hotfixes** applied directly to prod DB

**Detection methods:**

1. **Quarterly audits** (compare Git vs prod DB)
2. **CI checks** (future: validate types match migrations)
3. **Developer reports** ("This table doesn't exist in my local DB")

---

### Process

**If drift detected:**

#### Step 1: Document Drift

Create audit ticket:
- Tables/objects affected
- When drift occurred (estimate)
- Why (manual change, hotfix, external tool, unknown)
- Impact (blocking new devs? causing bugs?)

#### Step 2: Choose Resolution

**Option A: Export to Git (preferred for app tables)**

1. Extract DDL from prod DB:
   ```bash
   # Via Supabase CLI
   supabase db dump --data-only=false > schema_drift.sql

   # Or via pg_dump
   pg_dump $DATABASE_URL --schema-only --table=drifted_table > drift.sql
   ```

2. Create migration:
   ```bash
   supabase migration new import_drifted_table
   # Paste DDL into migration file
   ```

3. Test locally:
   ```bash
   supabase db reset
   npm run type-check
   ```

4. Commit:
   ```bash
   git add supabase/migrations/20260120_import_drifted_table.sql
   git commit -m "[NO-TASK] chore: import drifted table from prod"
   ```

**Option B: Drop Drifted Object (if not needed)**

1. Verify unused (check code references)
2. Backup data (if any):
   ```sql
   CREATE TABLE _backup_drifted_table AS SELECT * FROM drifted_table;
   ```
3. Drop:
   ```sql
   DROP TABLE IF EXISTS drifted_table CASCADE;
   ```
4. Document in audit log

**Option C: Document as External (for system tables)**

If drift is intentional (e.g., Supabase-managed tables):
- Tag as `system` in audit
- Update `expected_db_structure` in inventory
- No action needed

#### Step 3: Update Audit Log

Add to `docs/database/inventory.md`:
```markdown
## Audit History
- 2026-01-19: Initial inventory - Drift detected (71 tables)
- 2026-01-25: Drift resolved - Exported 71 base tables to Git
- Next audit: 2026-04-01
```

---

### Current Drift (2026-01-19)

**Status:** 71 base schema tables not in Git

**Recommended resolution:** **Option A (Export to Git)**

**Action plan:**

1. **Create base schema migration:**
   ```bash
   supabase migration new base_schema_import
   ```

2. **Extract DDL for 71 tables:**
   - Use Supabase Studio or `pg_dump`
   - Include: CREATE TABLE, indexes, constraints, RLS policies, triggers
   - Exclude: data (unless seed data needed)

3. **Test locally:**
   ```bash
   # Backup current local DB
   supabase db dump > backup_before_base_schema.sql

   # Apply new migration
   supabase db reset

   # Verify all tables exist
   supabase db execute --file tools/scripts/verify_tables.sql

   # Regenerate types
   npm run types:generate

   # Type-check entire codebase
   npm run type-check
   ```

4. **Commit to Git:**
   ```bash
   git add supabase/migrations/20260120000000_base_schema_import.sql
   git add packages/@verone/types/src/supabase.ts
   git commit -m "[NO-TASK] chore: import 71 base schema tables to Git

   - Resolves drift detected in Phase 2A audit
   - All public.* tables now tracked in migrations
   - Enables zero drift policy enforcement
   "
   ```

5. **Update audit log** in `inventory.md`

6. **Communicate to team:**
   - Announce zero drift policy enforcement
   - Document new workflow in team docs
   - Update onboarding checklist

---

## Enforcement & Monitoring

### Pre-Commit Hooks

**Future:** Add Git hook to verify migration format

```bash
# .git/hooks/pre-commit
if [[ $(git diff --cached --name-only | grep supabase/migrations) ]]; then
  echo "✓ Migration detected, verifying format..."
  # Check naming convention
  # Check for ROLLBACK section
  # Run lint on SQL
fi
```

---

### CI Checks

**Future:** Add CI step to validate migrations

```yaml
# .github/workflows/ci.yml
- name: Validate migrations
  run: |
    supabase db reset
    npm run types:generate
    git diff --exit-code packages/@verone/types/src/supabase.ts
    # Fail if types diverged (indicates drift)
```

---

### Quarterly Audits

**Schedule:** Every 3 months

**Process:**
1. Run audit script (compare Git migrations vs prod DB)
2. Generate drift report
3. Resolve any drift found
4. Update inventory.md audit log

**Script:**
```bash
# tools/scripts/audit-db-drift.sh
# (to be created)
```

---

## Related Documentation

- [Database Inventory](./inventory.md) - Current state, drift analysis
- [Database Migrations Convention](../conventions/database-migrations-convention.md) - Naming, structure
- [Supabase Workflow](../../memories/supabase-workflow-correct.md) - Step-by-step guide
- [RLS Audit](../../memories/rls-performance-audit-2026-01-11.md) - Security policies

---

## Audit History

- **2026-01-19:** Source of truth policy defined (Phase 2A)
  - Status: ⚠️ 71 base tables not in Git (drift detected)
  - Next step: Decide on drift resolution approach
- **Next audit:** TBD (after drift resolution)

---

**End of Source of Truth Document**
