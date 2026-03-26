# Verone Back Office

CRM/ERP modulaire — decoration et mobilier haut de gamme.

## Avant de coder : EXPLORER L'EXISTANT

1. Schema DB : `mcp__supabase__execute_sql` (colonnes, types, contraintes)
2. RLS policies : `.claude/rules/database/rls-patterns.md`
3. Code existant : Serena `find_symbol` / `Grep` dans le meme domaine
4. Patterns : identifier comment les features similaires sont implementees

> Pas fait ? → `/research <domaine>` avant toute modification.

## 6 regles non negociables

1. **Explorer avant coder** — jamais supposer, toujours verifier
2. **Zero `any` TypeScript** — `unknown` + validation Zod ou types DB
3. **Build filtre** — `pnpm --filter @verone/[app] build` (jamais global)
4. **Feature branch** — depuis `staging`, format `[APP-DOMAIN-NNN] type: desc`
5. **Demander a Romeo** — avant commit/push/PR/migration
6. **JAMAIS de donnees test en SQL** — pas d'INSERT/UPDATE/DELETE sur donnees metier via SQL. Donnees test = UI Playwright uniquement. `mcp__supabase__execute_sql` = SELECT + DDL schema only

## Commandes

```bash
pnpm --filter @verone/[app] build       # Build filtre
pnpm --filter @verone/[app] type-check  # Type-check filtre
pnpm lint:fix                           # ESLint auto-fix
```

## Workflow : Research → Plan → Execute → Verify

- `/research` : DB + code + RLS avant implementation
- `/plan` : features complexes
- `/implement` : explore → code → verify
- `/pr` : push + PR (jamais manuellement)

## Pointeurs

| Sujet            | Fichier                              |
| ---------------- | ------------------------------------ |
| Doc par tache    | `.claude/rules/doc-index.md`         |
| Git workflow     | `.claude/rules/dev/git-workflow.md`  |
| Base de donnees  | `.claude/rules/database/supabase.md` |
| Regles generales | `.claude/rules/general.md`           |
| App CLAUDE.md    | `apps/[app]/CLAUDE.md`               |

Langue : francais (code/commits en anglais). Comportement TEACH-FIRST : dire NON si != best practice.

**Version** : 16.0.0 (2026-03-26)
