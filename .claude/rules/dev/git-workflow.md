# Règle Git : Feature Branch Systématique

## Workflow Standard (Trunk-Based Development)

### TOUJOURS créer feature branch AVANT de coder

**Pattern Obligatoire** :

```bash
# 1. Créer branche AVANT toute modification de code
git checkout -b feat/APP-DOMAIN-NNN-description
# Exemples:
# - feat/LM-ORD-009-refonte-workflow
# - fix/BO-DASH-001-cache-invalidation
# - feat/LM-AUTH-001-spinner-fix

# 2. Développer normalement
# ... modifications code ...

# 3. Commits fréquents (save points)
git add .
git commit -m "[APP-DOMAIN-NNN] step: description"
git push -u origin feat/APP-DOMAIN-NNN-description  # Premier push
# ou
git push  # Pushs suivants

# 4. Une PR à la fin (quand feature complète)
gh pr create --title "[APP-DOMAIN-NNN] feat: description"
```

## INTERDIT

- ❌ Travailler directement sur `main`
- ❌ Commit sur `main` locale
- ❌ `git push origin main` (bloqué par règle GitHub "Changes must be made through PR")

## Pourquoi cette règle est ABSOLUE

### Problème du workflow "commit sur main puis feature branch"

**Scénario incorrect** :

```bash
# 1. Code changes sur main
git commit -m "fix"

# 2. Tentative push
git push origin main
# → REJECTED par GitHub (PR obligatoire)

# 3. Refactoring git après coup
git reset HEAD~1
git stash
git checkout -b fix/feature
git stash pop
git commit -m "fix"
git push
# → Pre-push hook s'exécute 2 fois = 2 builds complets
```

**Temps perdu** : ~8-10 minutes (2 builds complets) + frustration

### Workflow correct

**Scénario correct** :

```bash
# 1. Créer branche D'ABORD
git checkout -b fix/feature

# 2. Code changes
git commit -m "fix"

# 3. Push
git push -u origin fix/feature
# → Pre-push hook s'exécute 1 seule fois
```

**Temps** : ~2-3 minutes (1 build avec cache Turbo) ✅

## Avantages Feature Branch Systématique

1. ✅ **1 seul build** (pas de rebuild inutile)
2. ✅ **Workflow propre** dès le départ (pas de refactoring git)
3. ✅ **Conforme règle GitHub** (PR obligatoire)
4. ✅ **Backup continu** (chaque push sauvegardé sur GitHub)
5. ✅ **CI validation** (chaque push validé par CI/CD)
6. ✅ **Historique clair** (commits logiques par étape)

## Commits Fréquents (Save Points)

**Pattern recommandé** : Commit à chaque étape logique

```bash
git commit -m "[LM-AUTH-001] step 1: add timeout constant"
git push

git commit -m "[LM-AUTH-001] step 2: implement timeout logic"
git push

git commit -m "[LM-AUTH-001] step 3: add error handling"
git push

git commit -m "[LM-AUTH-001] step 4: update tests"
git push
```

**Avantages** :

- Facile de revenir en arrière (`git reset HEAD~1`)
- Backup continu sur GitHub
- CI valide chaque étape
- Historique compréhensible

## Une PR par Feature

**Règle d'or** : 1 feature = 1 branche = N commits = **1 PR**

```bash
# Quand feature complète :
gh pr create \
  --title "[LM-AUTH-001] feat: fix spinner infini login" \
  --body "
## Summary
- Add 8s timeout to prevent infinite spinner
- Add error handling for timeout case
- Update tests

## Test Plan
- [x] Type-check passes
- [x] Build succeeds
- [x] E2E tests pass
- [x] Manual testing on localhost:3002

## Commits
- step 1: add timeout constant
- step 2: implement timeout logic
- step 3: add error handling
- step 4: update tests
"
```

## Exceptions

**Aucune.** Feature branch = TOUJOURS.

Même pour :

- Typo simple (créer `fix/typo-readme`)
- Update documentation (créer `docs/update-readme`)
- Hotfix critique (créer `fix/critical-bug`)

**Raison** : Cohérence > cas particuliers. Workflow uniforme = moins d'erreurs.

## Format de Commit

**Pattern obligatoire** :

```
[APP-DOMAIN-NNN] type: description courte
```

**Exemples valides** :

- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

**Validation automatique** : Hook PreToolUse bloque si format invalide

## Référence

Cette règle suit les best practices de :

- **Trunk-Based Development** : https://trunkbaseddevelopment.com/
- **Vercel** : Pattern utilisé dans tous leurs repos open source
- **Tailwind Labs** : shadcn/ui ecosystem
- **Claude Code Best Practices** : https://www.anthropic.com/engineering/claude-code-best-practices
