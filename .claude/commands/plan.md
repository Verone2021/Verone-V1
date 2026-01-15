---
description: PLAN mode - Transform observations into actionable checklist
argument-hint: TASK=<TASK-ID>
allowed-tools: [Read, Edit, mcp__serena__*, Grep, Glob]
---

# /plan — PLAN (transformation observations → checklist)

## Rôle

Tu es en **mode PLAN**.

- Tu peux lire tout le code.
- Tu peux écrire **UNIQUEMENT** dans `.claude/work/ACTIVE.md`.
- **ZÉRO** modification de code applicatif.
- **ZÉRO** commit.
- **ZÉRO** `pnpm dev`.

## Source de vérité

1. Lis `CLAUDE.md`
2. Lis `.claude/work/ACTIVE.md`

## Workflow

1. **Identifier le Task ID** :
   - Si fourni par l'utilisateur (ex: `TASK=BO-BUG-001`) → utiliser celui-ci
   - Sinon → identifier le Task ID le plus récent dans ACTIVE.md qui a des observations mais pas encore de plan

2. **Lire les observations** :
   - Lire la section complète du Task ID dans ACTIVE.md
   - Comprendre le contexte, les steps to reproduce, les evidences, les hypothèses

3. **Explorer le code** :
   - Utiliser les outils Serena (find_symbol, get_symbols_overview, search_for_pattern)
   - Lire les fichiers mentionnés dans les "Hypothèses"
   - Comprendre l'architecture existante

4. **Concevoir la solution** :
   - Mode "think hard" ou "ultrathink" si la tâche est complexe
   - Identifier LA meilleure approche (pas d'options multiples selon CLAUDE.md règle ligne 180)
   - Considérer les risques et impacts

5. **Écrire le plan dans ACTIVE.md** :
   - Ajouter une section `### Implementation Plan` sous le Task ID
   - Suivre le format ci-dessous

## Format de plan dans ACTIVE.md

```markdown
### Implementation Plan

**Approche**: [Description de l'approche retenue en 2-3 phrases]

**Fichiers à modifier**:
- `apps/back-office/src/app/page.tsx` - [Action précise : Ajouter X, Modifier Y, Supprimer Z]
- `packages/@verone/ui/src/components/Button.tsx` - [Action précise]
- `apps/back-office/src/lib/utils.ts` - [Action précise]

**Étapes**:
- [ ] Étape 1: [Description précise et actionnable]
- [ ] Étape 2: [Description précise et actionnable]
- [ ] Étape 3: [Description précise et actionnable]
- [ ] Étape 4: Vérifications (type-check + build)

**Risques identifiés**:
- Risque 1: [Description + impact + mitigation]
- Risque 2: [Description + impact + mitigation]

**Critères de validation**:
- [ ] Fonctionnalité X fonctionne comme attendu
- [ ] Tests passent (si applicables)
- [ ] Build réussit sans warnings
- [ ] Console Zero (0 erreurs)
```

## Sortie attendue dans le chat

- `✅ Plan ajouté dans .claude/work/ACTIVE.md (Task ID: XXX-YYY-NNN)`
- Résumé en 5 bullets maximum :
  - Approche retenue
  - Nombre de fichiers à modifier
  - Risques principaux
  - Temps estimé
  - Prérequis éventuels

## Règles importantes

- **Une seule approche** : Selon CLAUDE.md ligne 180, ne pas proposer plusieurs options. Recommander LA meilleure solution.
- **Actionnable** : Chaque étape doit être claire et exécutable par un agent WRITE sans ambiguïté.
- **Scope strict** : Suivre le scope défini dans les observations, pas de scope creep.
- **Patterns existants** : Respecter l'architecture et les patterns du codebase (lire CLAUDE.md, consulter docs/current/).

## Interdits (strict)

- Ne jamais utiliser `/plan` pour créer un plan ailleurs que dans ACTIVE.md
- Ne jamais écrire dans `~/.claude/plans/`
- Ne jamais modifier du code applicatif
- Ne jamais commit

---

User: $ARGUMENTS
