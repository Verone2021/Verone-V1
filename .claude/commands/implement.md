---
description: Feature implementation - Explore then Code then Verify
argument-hint: <feature-description> [--fast]
allowed-tools:
  [
    Read,
    Edit,
    Write,
    Glob,
    Grep,
    Bash,
    mcp__serena__*,
    mcp__supabase__execute_sql,
    mcp__supabase__list_tables,
    mcp__supabase__get_advisors,
  ]
---

You are an implementation specialist. Follow the workflow rigorously.

**Always ULTRA THINK before starting.**

## Modes

- **Default**: Full verification (type-check + build + smoke tests if UI)
- **--fast**: Quick mode (type-check only, no smoke tests)

## Workflow

### 1. RESEARCH (OBLIGATOIRE — ne jamais sauter)

**REGLE : NE JAMAIS ecrire de code si tu n'as pas verifie le schema DB des tables concernees.**

Execute automatiquement ces etapes AVANT de coder :

#### a) Identifier les tables DB concernees

Parser la demande pour determiner quelles tables sont impactees.

#### b) Explorer le schema DB (mcp**supabase**execute_sql)

Pour chaque table concernee :

```sql
-- Schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<TABLE>'
ORDER BY ordinal_position;

-- Foreign keys
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '<TABLE>';

-- RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = '<TABLE>';
```

#### c) Explorer le code existant (Serena + Grep)

- Trouver les composants/hooks/fonctions lies au domaine
- Identifier les patterns utilises par les features similaires
- Lire les types TypeScript existants

#### d) Presenter le resume

Resumer ce qui existe AVANT de proposer une solution.

### 2. PLAN (Default mode only)

- Create implementation strategy based on research findings
- Identify edge cases
- **STOP and ASK** user if unclear

### 3. CODE

- Follow existing codebase style and patterns discovered in RESEARCH
- Stay **STRICTLY IN SCOPE** - change only what's needed
- Run autoformatting when done
- Fix linter warnings

### 4. VERIFY (MANDATORY)

**YOU MUST run after EVERY modification:**

```bash
# Always required — TOUJOURS filtrer sur le package concerne
pnpm --filter @verone/[app] type-check    # Must = 0 errors

# Default mode (skip with --fast)
pnpm --filter @verone/[app] build         # Must = Build succeeded
```

**NE JAMAIS dire "done" sans ces preuves.**

If checks fail: **return to CODE phase** and fix.

## Rules

- Correctness > Speed
- Test what you changed
- Never exceed task boundaries
- Follow repo standards
- **NEVER use `npm run` — always `pnpm --filter`**
- **NEVER skip RESEARCH step**

---

User: $ARGUMENTS
