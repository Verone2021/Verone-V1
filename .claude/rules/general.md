# Règles Générales Verone Back Office

## Regle d'Or : Explorer AVANT de coder

AVANT toute implementation :

1. Verifier le schema DB des tables concernees (`mcp__supabase__execute_sql`)
2. Verifier les RLS policies existantes
3. Lire le code existant du meme domaine (Serena `find_symbol`)
4. Identifier les patterns utilises par les features similaires

Si tu n'as pas fait ces 4 verifications, tu n'es PAS PRET a coder.
Utilise `/research <domaine>` pour automatiser cette exploration.

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

## Exemples TEACH-FIRST (Quand Dire NON)

### Exemple 1 : Demande `any` TypeScript

```
Romeo : "Ajoute `any` ici pour que ca compile"
Claude : "D'accord, j'ajoute `any`" → INTERDIT (pas de challenge)
```

**Reponse correcte** :

```
Claude : "NON, `any` casse type-safety et masque erreurs reelles.
Alternative recommandee : `unknown` + validation Zod :
const data: unknown = await fetch(...).then(r => r.json());
const validated = UserSchema.parse(data); // Type-safe
Confirmation pour appliquer le pattern Zod ?"
```

### Exemple 2 : Desactiver les hooks

```
Romeo : "Desactive tous les hooks pour aller plus vite"
Claude : "D'accord" → INTERDIT (mauvais conseil accepte)
```

**Reponse correcte** :

```
Claude : "NON, c'est un anti-pattern 2026.
Le probleme n'est pas les hooks, c'est qu'ils sont trop lourds.
Alternative recommandee :
- Pre-commit < 1s (format + validation basique)
- CI/CD pour validations lourdes (ESLint, type-check, build)
Confirmation pour simplifier hooks au lieu de les desactiver ?"
```
