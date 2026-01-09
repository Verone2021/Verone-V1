# Branching Strategy - Verone Monorepo

**Date** : 2025-12-13
**Repository** : Verone2021/Verone-V1

---

## Branches Principales

| Branche      | Rôle                            | Protection                  |
| ------------ | ------------------------------- | --------------------------- |
| `main`       | Production (Vercel auto-deploy) | Ruleset "Protect main"      |
| `production` | Legacy (gelée, lecture seule)   | Ruleset "Freeze production" |

---

## Conventions de Nommage

### Préfixes Obligatoires

| Préfixe     | Usage                                   | Exemple                    |
| ----------- | --------------------------------------- | -------------------------- |
| `feature/`  | Nouvelle fonctionnalité                 | `feature/dark-mode`        |
| `fix/`      | Correction de bug                       | `fix/login-redirect`       |
| `chore/`    | Maintenance, docs, config               | `chore/update-deps`        |
| `hotfix/`   | Correction urgente production           | `hotfix/critical-auth-fix` |
| `refactor/` | Refactoring sans changement fonctionnel | `refactor/api-layer`       |

### Règles de Nommage

- Tout en minuscules
- Mots séparés par des tirets `-`
- Descriptif et concis (max 50 caractères)
- Pas de caractères spéciaux sauf `-`

```bash
# Correct
feature/user-profile-page
fix/cart-calculation-error

# Incorrect
Feature/UserProfile
fix_cart_error
feature/add-new-user-profile-page-with-avatar-upload-and-settings
```

---

## Workflow Standard

### 1. Créer une branche feature

```bash
git checkout main
git pull origin main
git checkout -b feature/ma-feature
```

### 2. Développer et committer

```bash
git add .
git commit -m "feat: description concise"
```

### 3. Pousser et créer PR

```bash
git push -u origin feature/ma-feature
gh pr create --base main --title "feat: Ma feature" --body "Description..."
```

### 4. Review et merge

- Attendre validation status check Vercel
- Review par un pair (si configuré)
- Merge via GitHub UI (squash recommandé)

### 5. Nettoyer

```bash
git checkout main
git pull origin main
git branch -d feature/ma-feature
```

---

## Procédure Hotfix

Pour les corrections urgentes en production :

```bash
# 1. Créer depuis main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Corriger et committer
git add .
git commit -m "fix: correction critique [HOTFIX]"

# 3. PR avec label urgence
git push -u origin hotfix/critical-issue
gh pr create --base main --title "HOTFIX: Correction critique" --body "..."

# 4. Merge rapide (après validation Vercel)
# Via GitHub UI
```

---

## Protections Actives (GitHub Rulesets)

### Ruleset "Protect main"

- Require pull request before merging
- Require status checks: `Vercel – verone-back-office`
- Block force pushes
- Restrict deletions

### Ruleset "Freeze production"

- Block force pushes
- Restrict deletions
- (Branche legacy, ne pas utiliser)

---

## Bonnes Pratiques

1. **Toujours partir de `main` à jour**
2. **Commits atomiques** : un commit = une modification logique
3. **Messages descriptifs** : utiliser conventional commits (`feat:`, `fix:`, `chore:`)
4. **PR courtes** : facilite la review
5. **Supprimer les branches après merge**

---

## Commandes Utiles

```bash
# Voir toutes les branches
git branch -a

# Supprimer branche locale mergée
git branch -d feature/ma-feature

# Supprimer branche remote
git push origin --delete feature/ma-feature

# Lister branches mergées dans main
git branch --merged main

# Diagnostic repo
./scripts/repo-doctor.sh
```

---

**Dernière mise à jour** : 2025-12-13
