# Mode Manuel - Verone Back Office

**Actif depuis** : 2026-01-19

---

## 🛑 Règle Fondamentale

**Claude NE DOIT JAMAIS créer de PR automatiquement ni merger sans instruction explicite.**

## ✅ Actions Autorisées (Claude autonome)

Claude peut faire SANS demander :

### Développement
- Explorer le codebase (Glob, Grep, Read, Serena)
- Planifier implémentations (EnterPlanMode)
- Écrire/modifier code (Edit, Write)
- Créer tests (Playwright, Jest)
- Vérifier qualité (type-check, build, lint)
- Créer commits locaux (format convention)
- Pousser sur feature branch (`git push origin feature-branch`)

### Investigation
- Analyser bugs (logs, stack traces)
- Proposer solutions
- Rechercher documentation (WebSearch, WebFetch)
- Vérifier production (curl, logs Vercel)

## 🤝 Actions Nécessitant Validation Humaine

Claude **DOIT DEMANDER** avant :

### Git & GitHub
- ⚠️ **Créer Pull Request (`gh pr create`)** ← **JAMAIS sans demander !**
- ⚠️ Merger Pull Request (`gh pr merge`)
- ⚠️ Supprimer branches distantes
- ⚠️ Force push (`git push --force`)

**🚨 RÈGLE ABSOLUE : Claude NE DOIT JAMAIS exécuter `gh pr create` sans avoir reçu une confirmation explicite de l'utilisateur.**

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

### 2. Pull Request (DEMANDER d'abord)

**❌ CE QUE CLAUDE NE DOIT JAMAIS FAIRE** :
```bash
# ❌ INTERDIT - Ne jamais exécuter directement
gh pr create --title "..." --body "..."
```

**✅ CE QUE CLAUDE DOIT FAIRE** :
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

**Utilisateur répond "oui"** → Alors seulement Claude exécute :
```bash
gh pr create --title "[APP-DOMAIN-NNN] feat: description" --body "..."
```

**Si l'utilisateur ne répond pas ou dit "non"** → Claude NE FAIT RIEN

### 3. Merge (DEMANDER d'abord)

**Claude dit** :
> "La PR #123 a été approuvée et tous les checks passent.
>
> Veux-tu que je merge cette PR ?"

**Utilisateur approuve** → Claude exécute :
```bash
gh pr merge 123 --squash --delete-branch
```

## 🚫 GitHub Actions - Aucune PR Automatique

Tous les workflows GitHub Actions qui créent des PR sont :
- Soit **supprimés**
- Soit **workflow_dispatch uniquement** (pas de schedule)
- Soit **nécessitent un label "maintenance-approved"**

Exemple :
```yaml
on:
  workflow_dispatch:  # ✅ Manuel seulement
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

**Version** : 1.0.0
**Date** : 2026-01-19
**Auteur** : Romeo + Claude
