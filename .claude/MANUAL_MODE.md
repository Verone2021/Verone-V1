# Mode Manuel - Verone Back Office

**Actif depuis** : 2026-01-19

---

## 🛑 Règle Fondamentale

**Approche équilibrée** : Protection contre accidents + Workflow fluide sur demandes explicites

### 🔒 Protections Techniques (Hooks)

**BLOQUÉ automatiquement** :

- ❌ `git commit` sur branche main/master (hook PreToolUse)
- ❌ `git push origin main` (hook PreToolUse)

**Effet** : Impossible de commit/push accidentellement sur main. Force passage par feature branch + PR.

### 💡 Bonnes Pratiques (Recommandations)

**Recommandé** (mais pas bloqué) :

- 💡 Demander avant `gh pr create` (sauf si user demande explicitement)
- 💡 Demander avant `gh pr merge` (sauf si user demande explicitement)

**Effet** : Claude propose et demande confirmation, MAIS peut exécuter directement si l'utilisateur le demande.

## ✅ Actions Autorisées (Claude autonome)

Claude peut faire SANS demander :

### Développement

- Explorer le codebase (Glob, Grep, Read, Serena)
- Planifier implémentations (EnterPlanMode)
- Écrire/modifier code (Edit, Write)
- Créer tests (Playwright, Jest)
- Vérifier qualité (type-check, build, lint)
- **Corriger warnings ESLint** (workflow `/fix-warnings` - documentation-first 2026)
- Créer commits locaux (format convention)
- Pousser sur feature branch (`git push origin feature-branch`)

### Investigation

- Analyser bugs (logs, stack traces)
- Proposer solutions
- Rechercher documentation (WebSearch, WebFetch)
- Vérifier production (curl, logs Vercel)

## 🤝 Actions Nécessitant Validation Humaine

Claude **DEVRAIT DEMANDER** avant (recommandé, mais pas bloqué techniquement) :

### Git & GitHub

- 💡 **Créer Pull Request (`gh pr create`)** ← Recommandé de demander d'abord
- 💡 Merger Pull Request (`gh pr merge`)
- ⚠️ Supprimer branches distantes
- ⚠️ Force push (`git push --force`)

**📋 BONNES PRATIQUES : Claude devrait proposer et demander confirmation avant de créer/merger des PR, sauf si l'utilisateur demande explicitement.**

**⚠️ Note** : Si l'utilisateur dit "crée une PR" ou "merge sur main", Claude peut le faire directement sans friction supplémentaire.

### Déploiement

- ⚠️ Merger vers main/production
- ⚠️ Modifier variables env production (Vercel, Supabase)
- ⚠️ Déployer manuellement en production
- ⚠️ Modifier configuration production (feature flags)

### Données

- ⚠️ Supprimer tables/colonnes en production
- ⚠️ Modifier schéma database production
- ⚠️ Exécuter migrations irréversibles
- ⚠️ Supprimer ressources cloud (S3, etc.)

## 📋 Workflow Standard

### 1. Développement (Autonome)

```bash
# Claude fait seul
git checkout -b feat/APP-DOMAIN-NNN-description
# ... développement ...
git add .
git commit -m "[APP-DOMAIN-NNN] feat: description"
git push origin feat/APP-DOMAIN-NNN-description
```

### 2. Pull Request (Workflow Recommandé)

**✅ WORKFLOW RECOMMANDÉ** :

```
Claude propose à l'utilisateur:
"J'ai terminé l'implémentation et tous les tests passent.
La branche `feat/APP-DOMAIN-NNN-description` est prête et poussée sur origin.

Tous les checks sont verts:
- ✅ TypeScript compile
- ✅ Build production réussit
- ✅ Tests E2E passent

Veux-tu que je crée une Pull Request maintenant ?"
```

**Utilisateur répond "oui"** → Claude exécute :

```bash
gh pr create --title "[APP-DOMAIN-NNN] feat: description" --body "..."
```

**OU si l'utilisateur demande directement** : "crée une PR maintenant"

```bash
Claude exécute directement gh pr create (pas de friction supplémentaire)
```

### 3. Merge (Workflow Recommandé)

**WORKFLOW RECOMMANDÉ** :

> "La PR #123 a été approuvée et tous les checks passent.
>
> Veux-tu que je merge cette PR ?"

**Utilisateur approuve** → Claude exécute :

```bash
gh pr merge 123 --squash --delete-branch
```

**OU si l'utilisateur demande directement** : "merge sur main" ou "merge la PR #123"

```bash
Claude exécute directement gh pr merge (pas de friction supplémentaire)
```

## 🚫 GitHub Actions - Aucune PR Automatique

Tous les workflows GitHub Actions qui créent des PR sont :

- Soit **supprimés**
- Soit **workflow_dispatch uniquement** (pas de schedule)
- Soit **nécessitent un label "maintenance-approved"**

Exemple :

```yaml
on:
  workflow_dispatch: # ✅ Manuel seulement
    inputs:
      confirm:
        description: 'Confirm PR creation'
        required: true
        type: boolean
  # ❌ PAS de schedule
  # schedule:
  #   - cron: '0 6 * * 0'
```

## 🔄 Migration depuis Autonomy Guidelines

**Avant (DEPRECATED)** :

- Claude mergeait automatiquement les PRs
- Claude configurait Vercel sans demander
- Workflows GitHub créaient des PR auto

**Maintenant (MANUEL)** :

- Claude demande avant de créer/merger PR
- Claude propose actions, utilisateur approuve
- Workflows GitHub sont workflow_dispatch uniquement

## 📚 Références

- `archive/claude/claude-autonomy-guidelines-2026-01-17.md` (DEPRECATED)
- `CLAUDE.md` - Workflow professionnel
- `.claude/README.md` - Configuration Claude Code

---

**Version** : 2.0.0 (Approche Simplifiée)
**Date** : 2026-01-21
**Auteur** : Romeo + Claude Sonnet 4.5
