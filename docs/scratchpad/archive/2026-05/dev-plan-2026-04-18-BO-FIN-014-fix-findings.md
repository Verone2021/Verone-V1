# Dev Plan — BO-FIN-014 Fix Findings (2026-04-18)

## Contexte

Branche : `fix/BO-FIN-014-fix-proforma-format`
Commit de base : `1fe37c137`
Reviewer-agent a identifié 2 bugs + 1 tracking warning.

## Actions

### 1. CRITICAL — Migration partial index (DB)

**Fichier** : `supabase/migrations/20260422_partial_unique_document_number.sql`

L'index `unique_document_number_per_type` est non-partiel. Après soft-delete
(`deleted_at = now()`), l'INSERT de la nouvelle proforma avec le même
`document_number` viole la contrainte 23505 → HTTP 500.

Fix : drop l'index existant, recréer en `WHERE deleted_at IS NULL`.

Application : `mcp__supabase__execute_sql`

### 2. HIGH — Soft-delete bloquant dans route.ts

**Fichier** : `apps/back-office/src/app/api/qonto/invoices/route.ts`
**Lignes** : ~359-368

Si `softDeleteError` non-null, le code logue et continue → 2 proformas actives
possibles (Qonto delete OK, soft-delete local KO).

Fix : ajouter un `return NextResponse.json(..., { status: 500 })` immédiat si
`softDeleteError` est non-null.

### 3. WARNING — Tracking finance.md

**Fichier** : `.claude/rules/finance.md`
**Section** : table Tracking (bas de fichier)

Remplacer `BO-FIN-005 | R4 (guard écrasement proforma) | En cours (commit pending)`
par `BO-FIN-014 | R4 (guard écrasement proforma) | En cours (PR pending)`.

## Vérification

- `pnpm --filter @verone/back-office type-check` doit passer
- Migration appliquée via MCP sans erreur

## Commit

Amend sur `1fe37c137` avec message aligné BO-FIN-014.
