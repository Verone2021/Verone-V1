# Règles Générales Verone Back Office

## Philosophy

- **Minimum viable** : Faire le minimum nécessaire, pas plus
- **Patterns existants** : Réutiliser avant de créer
- **Clarté > Concision** : Code lisible > code compact
- **TDD** : Tests d'abord quand applicable

## Langue

Toujours répondre en français sauf pour :
- Code (commentaires en anglais)
- Commits (format anglais conventionnel)
- Documentation technique (anglais si standard industrie)

## Workflow (5 étapes)

1. **RESEARCH** - Comprendre l'existant (Serena, docs, code)
2. **PLAN** - Concevoir la solution (checklist actionable)
3. **TEST** - TDD si applicable (test avant code)
4. **EXECUTE** - Implémenter le minimum nécessaire
5. **VERIFY** - Valider (type-check, build, tests)

- Commits fréquents (save points) sur feature branch
- UNE PR par feature (N commits → 1 PR)
- Tests obligatoires avant PR

## Format Commits

`[APP-DOMAIN-NNN] type: description`

Exemples :
- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

## Sécurité

- JAMAIS de credentials dans le code
- Variables d'environnement pour secrets
- RLS Supabase obligatoire
- Validation Zod sur tous les inputs
- Pas de SQL brut (utiliser client Supabase)

## Code Quality

- TypeScript strict mode
- Zero `any` sauf cas documenté
- Pas de `// @ts-ignore` sans justification
- ESLint sans warnings
- Prettier pour formatage
