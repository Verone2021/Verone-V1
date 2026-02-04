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

## VÉRIFICATION OBLIGATOIRE AVANT COMMIT (CRITIQUE)

**Cette checklist est NON NÉGOCIABLE. Claude DOIT exécuter ces étapes AVANT chaque commit.**

### Étape 1 : Voir ce qui sera commité

```bash
# Voir les fichiers stagés
git diff --staged --name-only

# Voir le contenu des changements (OBLIGATOIRE pour review)
git diff --staged
```

**Vérifier** :
- ✅ Seuls les fichiers pertinents sont inclus
- ✅ Pas de fichiers `.claude/`, `CLAUDE.md` (sauf si explicitement demandé)
- ✅ Pas de fichiers secrets (`.env`, credentials)
- ✅ Pas de fichiers générés (`.next/`, `node_modules/`, `dist/`)

### Étape 2 : Type-check sur les packages modifiés

```bash
# Identifier les packages touchés
git diff --staged --name-only | grep -E "^(apps|packages)" | cut -d'/' -f1-3 | sort -u

# Type-check FILTRÉ (JAMAIS pnpm type-check global)
pnpm --filter @verone/[package-modifié] type-check
```

**Règle** : Si type-check échoue → CORRIGER avant commit, JAMAIS commiter du code qui ne compile pas.

### Étape 3 : ESLint sur les fichiers modifiés

```bash
# ESLint sur les fichiers stagés uniquement
git diff --staged --name-only -- '*.ts' '*.tsx' | xargs pnpm eslint --max-warnings=0
```

**Règle** :
- Erreurs ESLint → CORRIGER avant commit
- Warnings sur code EXISTANT → OK (pré-existants, hors scope)
- Warnings sur code NOUVEAU → CORRIGER avant commit

### Étape 4 : Commit uniquement si tout passe

```bash
# Seulement après validation des étapes 1-3
git commit -m "[APP-DOMAIN-NNN] type: description"
```

### Résumé Workflow Pro

```
┌─────────────────────────────────────────────────┐
│  AVANT CHAQUE COMMIT (OBLIGATOIRE)              │
├─────────────────────────────────────────────────┤
│  1. git diff --staged          → Review code    │
│  2. pnpm --filter type-check   → TypeScript OK  │
│  3. eslint fichiers modifiés   → Qualité OK     │
│  4. git commit                 → Si tout passe  │
└─────────────────────────────────────────────────┘
```

### ❌ INTERDIT

- Commiter sans `git diff --staged` préalable
- Commiter avec des erreurs TypeScript
- Commiter avec des erreurs ESLint sur nouveau code
- Inclure des fichiers de config Claude sans demande explicite
- Utiliser `git add .` aveuglément (toujours vérifier ce qui est stagé)

---

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
