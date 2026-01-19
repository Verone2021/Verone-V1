# 🚀 GOVERNANCE FINALE - Quality Gate Unique

**Date**: 2026-01-19
**Mode**: POMPIER FULL SPEED
**Objectif**: 1 SEUL CHECK BLOQUANT + 0 AUTO-PR

---

## 📊 TABLEAU: BLOCKING vs OPTIONAL vs SCHEDULED

### ✅ BLOCKING (Required sur PR → main)

| Workflow | Check Name | Job | Trigger | Déterministe | Dépendances |
|----------|------------|-----|---------|--------------|-------------|
| **quality-gate.yml** | `Quality Gate / quality-gate` | `quality-gate` | PR + push main | ✅ 100% | AUCUNE |

**Steps quality-gate** :
1. checkout (fetch-depth: 0)
2. setup node 20 + pnpm + cache
3. pnpm install --frozen-lockfile
4. lint (errors only)
5. type-check
6. turbo build ciblé (filter safe + fallback)

**Timeout**: 15 min max

---

### ⚪ OPTIONAL (Non-bloquant sur PR)

| Workflow | Description | Trigger | Fragile | Note |
|----------|-------------|---------|---------|------|
| `pr-validation.yml` | Playwright + console + E2E | PR → main (paths) | ⚠️ OUI (Playwright, dev server, secrets) | Utile mais non-bloquant |
| `typescript-quality.yml` | Type-check + metrics | PR + push | ✅ NON | Redondant avec quality-gate (métriques/badge) |
| `audit.yml` | Lint + duplicates + cycles + deadcode | PR + manual | ✅ NON | Extras utiles |
| `linkme-validation.yml` | Build LinkMe (turbo filter) | PR paths linkme/ | ✅ NON | Spécifique LinkMe |
| `validate-docs-paths.yml` | Paths Turborepo validation | PR docs/ | ✅ NON | Validation structure |
| `database-audit.yml` | Audit DB schema | PR (no paths) + **manual** | ⚠️ OUI (secrets Supabase) | **schedule DISABLED** |

---

### 📅 SCHEDULED/MANUAL ONLY (Jamais sur PR)

| Workflow | Description | Trigger | Auto-PR | Status |
|----------|-------------|---------|---------|--------|
| `docs-governance.yml` | Docs audit + triage | PR docs/ + **manual** | ❌ **DISABLED** | schedule DISABLED, manual workflow_dispatch only |
| `cleanup-screenshots.yml` | Cleanup .playwright-mcp | **manual** | ❌ NO | schedule DISABLED |
| `monitoring-2025.yml` | Console + perf monitoring | **manual** | ❌ NO | schedule DISABLED |
| `deploy-production.yml` | Deploy prod | push main + PR | ❌ NO | Jamais required |
| `deploy-safety.yml` | Deploy preview + backup | PR → [main,preview] | ❌ NO | Jamais required |

**⚠️ RÈGLE AUTO-PR** : Tous les workflows avec `create-pull-request` ou `git push` auto = **schedule DISABLED**, workflow_dispatch UNIQUEMENT.

---

## 🎯 REQUIRED CHECKS - ÉTAT ACTUEL vs CIBLE

### ÉTAT ACTUEL

**Branch Protection** (5 required checks) :
1. `typescript-check`
2. `Audit Database Schema`
3. `🧪 Vitest Unit Tests` ⚠️ **FANTÔME** (script n'existe pas)
4. `🎭 Playwright E2E + Console Check`
5. `🏗️ Next.js Build Check`

**Repository Ruleset** "Protect main" (2 required checks) :
1. `Vercel – verone-back-office`
2. `Vercel – linkme`

### CIBLE FINALE

**Branch Protection** (1 required check UNIQUEMENT) :
1. **`Quality Gate / quality-gate`** ✅ SEUL BLOQUANT

**Repository Ruleset** "Protect main" :
- ❌ Retirer rule `required_status_checks` (Vercel checks)
- ✅ Garder rules: `deletion`, `non_fast_forward`, `pull_request`

---

## 🔧 CHANGEMENT MINIMAL - 2 OPTIONS

### OPTION A (ULTRA SAFE - Recommandée)

**Étape 1** : Merger cette PR (workflows modifiés)
**Étape 2** : **VOUS modifiez manuellement** via GitHub UI :

1. **Settings** → **Branches** → **main** → **Edit**
2. Section "Require status checks to pass before merging"
3. **Retirer les 5 checks actuels** :
   - ❌ `typescript-check`
   - ❌ `Audit Database Schema`
   - ❌ `🧪 Vitest Unit Tests`
   - ❌ `🎭 Playwright E2E + Console Check`
   - ❌ `🏗️ Next.js Build Check`
4. **Ajouter 1 SEUL check** :
   - Taper dans search bar : `quality-gate`
   - Sélectionner : **`Quality Gate / quality-gate`**
5. **Save changes**

**Étape 3** : **VOUS modifiez Ruleset** via GitHub UI :

1. **Settings** → **Rules** → **Rulesets** → **Protect main**
2. Éditer ruleset
3. Retirer rule **"Require status checks to pass"** (Vercel checks)
4. **Save**

### OPTION B (SAFE mais API)

Je fournis commandes `gh api` pour modifier Branch Protection + Ruleset.

**⚠️ VOUS décidez** quelle option.

---

## 🛡️ NOM EXACT DU CHECK REQUIRED

**String exacte à chercher dans Branch Protection UI** :

```
Quality Gate / quality-gate
```

**Format** : `Workflow Name / Job ID`
- Workflow name: `Quality Gate` (ligne 1 de quality-gate.yml)
- Job ID: `quality-gate` (ligne 13 de quality-gate.yml)

**⚠️ À CONFIRMER** : Créer PR dummy → lancer quality-gate → vérifier nom exact dans GitHub UI checks.

---

## 💻 COMMANDE LOCALE ÉQUIVALENTE

**Reproduire quality-gate en local** (copier-coller) :

```bash
# EXACTEMENT ce que CI exécute
pnpm install --frozen-lockfile && \
pnpm lint && \
pnpm type-check && \
pnpm turbo build --filter="apps/back-office..." --filter="apps/linkme..." --filter="apps/site-internet..."

# Note: Pas de tests unitaires (script n'existe pas dans ce repo)
```

**Si erreur lint** :
```bash
pnpm lint:fix  # Auto-fix linting issues
```

**Si erreur type-check** :
```bash
pnpm type-check  # Voir détails erreurs TypeScript
```

**Si erreur build** :
```bash
pnpm turbo build --filter="apps/back-office..."  # Build app spécifique
```

---

## 📦 LIVRABLES PR

### Fichiers Modifiés

**Créé** :
- `.github/workflows/quality-gate.yml` ✅ LE SEUL REQUIRED

**Modifiés (déclassés NON-BLOQUANT)** :
- `.github/workflows/pr-validation.yml` → "(NON-BLOQUANT)" dans name
- `.github/workflows/typescript-quality.yml` → "(NON-BLOQUANT)" dans name
- `.github/workflows/audit.yml` → "(NON-BLOQUANT)" dans name

**Modifiés (schedule DISABLED)** :
- `.github/workflows/database-audit.yml` → schedule commenté
- `.github/workflows/docs-governance.yml` → schedule commenté + if clause modifiée
- `.github/workflows/cleanup-screenshots.yml` → schedule commenté
- `.github/workflows/monitoring-2025.yml` → schedule commenté

**Total fichiers touchés** : 8 workflows

---

## ⚠️ GARDE-FOUS

### AUCUN changement code prod
- ✅ Gouvernance workflows uniquement
- ✅ Aucune modification apps/**, packages/** (code métier)

### AUCUN changement Vercel
- ✅ Projets Vercel non touchés
- ✅ Env vars Vercel non touchées
- ✅ Git Integration Vercel inchangée

### Réversibilité
- ✅ Workflows déclassés restent actifs (non supprimés)
- ✅ Branch Protection modifiable via UI
- ✅ Ruleset backup disponible : `.claude/backups/ruleset-protect-main-backup-20260119-105606.json`

---

## 🎉 RÉSULTAT POST-MERGE

### Ce qui change
1. **1 SEUL check bloquant** : Quality Gate (déterministe, 5-10 min)
2. **0 PR automatique** : Tous workflows schedule disabled
3. **0 blocage Vercel/Playwright** : Checks optional
4. **0 stop hook error** : Wrappers .claude/scripts/ (depuis PR #71)

### Ce qui reste pareil
1. **Vercel Git Integration** : Déploiements auto PR + prod inchangés
2. **Workflows utiles** : Restent actifs (optional/manual)
3. **Protection main** : Toujours protégée (1 check required au lieu de 5+2)

### Développement déblocké
- ✅ PRs docs/.claude/.github ne sont plus bloquées par Vercel
- ✅ PRs code passent quality-gate rapide (pas Playwright lent)
- ✅ Aucune surprise auto-PR/auto-merge

---

## 📋 NEXT STEPS

1. **Review cette PR** : `chore/quality-gate-unique-2026`
2. **Merger** (quality-gate.yml actif)
3. **Modifier Branch Protection** manuellement (Option A)
4. **Tester** : Créer PR dummy → vérifier quality-gate run → confirmer string exacte check name
5. **Documenter** : Mettre à jour PULL_REQUEST_TEMPLATE.md avec nouvelle checklist

---

**Version**: 1.0 POMPIER
**Status**: ✅ PRÊT À MERGER
