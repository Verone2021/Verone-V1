# Worktrees - Guide Rapide

## Pourquoi Worktrees ?

- ❌ **Avant** : 2-3 sessions = conflits constants, chaos
- ✅ **Après** : 2 worktrees = isolation parfaite, zéro conflit

## Setup (2 worktrees max)

### Worktree PRIMARY (feature longue durée)

```bash
./scripts/worktree-create.sh PRIMARY feat/LM-AUTH-001-session
cd ../verone-worktrees/PRIMARY && code .
```

### Worktree SECONDARY (features courtes/hotfix)

```bash
./scripts/worktree-create.sh SECONDARY feat/BO-ORDER-003-tri
cd ../verone-worktrees/SECONDARY && code .
```

## Workflow Quotidien (2-3 features)

**Cas 1 : 2 features** → 2 worktrees

```
PRIMARY   : Feature auth (longue)
SECONDARY : Feature orders (courte)
```

**Cas 2 : 3 features** → 2 worktrees + repo principal

```
PRIMARY   : Feature auth (longue)
SECONDARY : Feature orders (moyenne)
REPO      : Hotfix urgent (très courte)
```

## Rotation Worktrees

Quand feature terminée :

```bash
# 1. Merger
cd ../verone-worktrees/SECONDARY
git checkout main && git merge feat/BO-ORDER-003-tri
git push

# 2. Cleanup
cd ~/verone-back-office-V1
./scripts/worktree-cleanup.sh SECONDARY

# 3. Nouvelle feature
./scripts/worktree-create.sh SECONDARY feat/BO-NEXT-004
```

## Commandes Utiles

```bash
# Statut worktrees
./scripts/worktree-status.sh

# Lister tous
git worktree list

# Supprimer
./scripts/worktree-cleanup.sh [NOM]
```

## Erreurs Communes

**"Maximum 2 worktrees atteint"**
→ Cleanup un worktree d'abord

**"Branch déjà checkout ailleurs"**
→ Créer nouvelle branche ou cleanup worktree existant

**"node_modules manquants"**
→ `pnpm install` dans le worktree
