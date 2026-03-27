# Security Rules Reference

Version: 1.0.0

## RLS Policies (BLOCKING)

### Rule: rls-enabled-all-tables

Every public table must have Row Level Security (RLS) enabled.

**Verification SQL** :

```sql
-- Find tables WITHOUT RLS enabled
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND rowsecurity = false;
```

A table without RLS is accessible to any authenticated user — full read/write.

**Severity** : BLOCKING if table contains user data, financial data, or PII.

### Rule: rls-policy-exists

RLS enabled but with no policies = table is inaccessible (locked). Verify policies exist:

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Rule: rls-uses-helper-functions

Policies must use `is_backoffice_user()` and `is_back_office_admin()` helper functions. Direct JWT access is fragile.

```sql
-- BLOCKING — fragile JWT access
CREATE POLICY "staff_access" ON table_name
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin'));

-- CORRECT — helper function
CREATE POLICY "staff_access" ON table_name
  USING (is_backoffice_user());
```

## Credentials in Code (BLOCKING)

### Rule: no-hardcoded-secrets

No passwords, API keys, tokens, or secrets hardcoded in source code.

**Detection patterns** (Grep):

```
password\s*[:=]\s*['"`]
api_key\s*[:=]\s*['"`]
secret\s*[:=]\s*['"`]
token\s*[:=]\s*['"`]
SUPABASE_SERVICE_ROLE_KEY
private_key
```

**Exclusions** :

- `.env.example` with placeholder values (`your-key-here`, `xxx`)
- Type definitions (`password: string`)
- Form field names (`name="password"`)
- Test files with obviously fake values

**Severity** : BLOCKING if actual credential found. SUGGESTION if pattern looks suspicious but is a false positive.

### Rule: no-secrets-in-client

Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. They must never contain secrets.

**Detection patterns** :

- `NEXT_PUBLIC_.*SECRET`
- `NEXT_PUBLIC_.*KEY` (except `NEXT_PUBLIC_SUPABASE_ANON_KEY` which is safe by design)
- `NEXT_PUBLIC_.*PASSWORD`
- `NEXT_PUBLIC_.*TOKEN`

**Severity** : BLOCKING

### Rule: env-not-committed

`.env` files must not be committed to git.

**Verification** :

- Check `.gitignore` includes `.env`, `.env.local`, `.env.production`
- `Grep` for `.env` files in the repository (excluding `.env.example`)

## Input Validation (IMPORTANT)

### Rule: zod-on-all-inputs

All API route handlers (`app/api/**/route.ts`) must validate inputs with Zod.

```typescript
// IMPORTANT — no validation
export async function POST(request: Request) {
  const body = await request.json();
  await supabase.from('orders').insert(body); // SQL injection risk via crafted JSON
}

// CORRECT
const schema = z.object({
  /* ... */
});
export async function POST(request: Request) {
  const body: unknown = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  await supabase.from('orders').insert(result.data);
}
```

### Rule: no-raw-sql

Never use raw SQL queries. Always use the Supabase client for type-safe queries.

**Detection patterns** :

- `supabase.rpc(` with inline SQL strings
- Template literals containing SQL keywords (`SELECT`, `INSERT`, `UPDATE`, `DELETE`)
- `execute_sql` or `raw` in application code (not migration files)

**Exclusions** :

- Migration files in `supabase/migrations/`
- Database seed files
- Admin scripts explicitly marked

**Severity** : IMPORTANT

## Authentication (IMPORTANT)

### Rule: auth-check-all-routes

Every API route must verify the user is authenticated before processing.

```typescript
// IMPORTANT — no auth check
export async function GET(request: Request) {
  const { data } = await supabase.from('orders').select('*');
  return NextResponse.json(data);
}

// CORRECT — auth verified
export async function GET(request: Request) {
  const supabase = createServerClient(/* ... */);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data } = await supabase.from('orders').select('id, status');
  return NextResponse.json(data);
}
```

**Detection patterns** :

- `route.ts` files without `auth.getUser()`, `getUser()`, or `auth.getSession()`
- Note: Some public routes (e.g., health check) may legitimately skip auth

### Rule: no-select-star

Never use `.select('*')` — always specify needed columns to minimize data exposure.

```typescript
// IMPORTANT — selects all columns including sensitive ones
const { data } = await supabase.from('users').select('*');

// CORRECT — explicit columns
const { data } = await supabase.from('users').select('id, name, email, role');
```

**Detection patterns** :

- `.select('*')`
- `.select("*")`

**Severity** : IMPORTANT

## Severity Classification

| Rule                                    | Severity   |
| --------------------------------------- | ---------- |
| Table without RLS (user/financial data) | BLOCKING   |
| Hardcoded credentials                   | BLOCKING   |
| Secrets in NEXT*PUBLIC* env vars        | BLOCKING   |
| .env committed to git                   | BLOCKING   |
| RLS uses fragile JWT access             | IMPORTANT  |
| API route without auth check            | IMPORTANT  |
| API route without Zod validation        | IMPORTANT  |
| Raw SQL in application code             | IMPORTANT  |
| `select('*')` usage                     | IMPORTANT  |
| RLS enabled but no policies             | SUGGESTION |
| Missing rate limiting on public API     | SUGGESTION |
