---
globs: supabase/migrations/**, packages/@verone/types/**
---

# Regles Supabase

## Migrations

1. Creer fichier dans `supabase/migrations/YYYYMMDDHHMMSS_nom.sql`
2. Appliquer avec `mcp__supabase__execute_sql`
3. Verifier les changements
4. Ne JAMAIS editer migrations existantes (append-only)

## RLS

- TOUJOURS activer RLS sur nouvelles tables
- 1 policy par action (SELECT, INSERT, UPDATE, DELETE)
- Patterns : voir `.claude/rules/database/rls-patterns.md`

## Queries

```typescript
// Toujours select explicite (jamais select("*"))
const { data } = await supabase.from('table').select('id, name').limit(10);
```

## INTERDIT

- `select("*")` sans limit
- INSERT/UPDATE/DELETE de donnees metier via SQL
- Recalculer retrocession_rate (vient de `margin_rate / 100`)

## Types

- Generer : `supabase gen types typescript` ou `/db types`
- Centraliser dans `packages/@verone/types/`
- Regenerer apres chaque migration
