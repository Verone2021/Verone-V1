# Multi-Agent Workflow : Un Agent = Une Branche (STRICT)

Romeo orchestre plusieurs agents Claude en parallele. **AUCUN worktree**. Coordination manuelle obligatoire.

## Principe Absolu

> **"Exactly ONE agent must be designated as the orchestrator to prevent coordination conflicts. Each specialist handles a well-defined domain."**

**Architecture** :

- **Romeo = Coordinateur** : Cree les branches, decide qui travaille ou
- **Chaque Agent Claude = Specialist** : Travaille sur UNE branche, ne switch JAMAIS
- **Communication via Romeo** : Les agents ne coordonnent PAS entre eux

---

## Regles STRICTES (NON NEGOCIABLES)

### INTERDIT

1. **Agent cree une branche sans autorisation**

   ```bash
   git checkout -b feat/nouvelle-branche  # BLOQUE par hook
   ```

2. **Agent switch vers une autre branche**

   ```bash
   git checkout autre-branche  # BLOQUE par hook
   ```

3. **Agent commit sur main**

   ```bash
   git commit -m "fix"  # BLOQUE par hook si sur main
   ```

4. **Agent force push**
   ```bash
   git push --force  # BLOQUE par GitHub branch protection
   ```

### OBLIGATOIRE

1. **Romeo cree la branche AVANT de lancer l'agent**

   ```bash
   git checkout -b feat/BO-XXX-description
   ```

2. **Agent reste sur SA branche pour toute la session**
   - Aucun `git checkout` autorise (sauf `git checkout main` pour coordination)

3. **Agent push regulierement sur SA branche**

   ```bash
   git push  # Save points frequents
   ```

4. **Romeo merge via PR quand feature complete**
   ```bash
   gh pr create
   ```

---

## Workflow Type (Session Simple)

```bash
# 1. Romeo cree la branche
git checkout -b feat/BO-XXX-description

# 2. Romeo lance Agent Claude
# (Agent travaille dans cette session)

# 3. Agent code + commit + push regulierement
git add .
git commit -m "[BO-XXX-001] step: description"
git push

# 4. Romeo merge PR quand pret
gh pr create
gh pr merge
```

---

## Workflow Sessions Multiples (2+ Features Paralleles)

**Contrainte** : Impossible de travailler sur 2 branches simultanement dans meme repo.

### Option A : Sessions Sequentielles (RECOMMANDE)

```bash
# Feature 1
git checkout -b feat/BO-XXX-feature1
# Agent travaille...
git push
gh pr create

# Attendre merge Feature 1, PUIS :

# Feature 2
git checkout main
git pull
git checkout -b feat/BO-YYY-feature2
# Agent travaille...
```

### Option B : Fermer/Rouvrir Sessions

```bash
# Session 1 : Feature A
git checkout -b feat/BO-AAA-featureA
# Agent 1 travaille...
git push  # Save point
# FERMER session Agent 1

# Session 2 : Feature B
git checkout main
git checkout -b feat/BO-BBB-featureB
# Agent 2 travaille...
git push  # Save point
# FERMER session Agent 2

# Reprendre Session 1
git checkout feat/BO-AAA-featureA
# Relancer Agent 1...
```

**Important** : Toujours `git push` avant de fermer session pour sauvegarder.

---

## Protection 3 Couches

### Couche 1 : GitHub Branch Protection (Server-Side)

**Pour `main`** :

- Require pull request reviews before merging
- Require status checks to pass
- Do not allow bypassing
- Restrict force pushes (nobody)
- Do not allow deletions

**Pour feature branches** :

- Restrict force pushes (maintainers only)

**Pourquoi** : Seul moyen NON CONTOURNABLE. Server-side = securite reelle.

### Couche 2 : Client-Side Hooks (Advisory)

**Scripts actifs** :

- `.claude/scripts/validate-git-checkout.sh` - Bloque checkout non autorise
- `.claude/scripts/session-branch-check.sh` - Affiche contexte session
- `.claude/scripts/auto-sync-with-main.sh` - Alerte divergence main

**Statut** : Advisory, pas enforcement. Alerte 90% des problemes.

### Couche 3 : Documentation

Role : Education et clarte pour agents futurs.

---

## Synchronisation avec Main

**Best Practice** : Synchroniser regulierement pour eviter conflits massifs.

```bash
# Option A : Rebase (historique propre)
git fetch origin
git rebase origin/main

# Option B : Merge (plus sur si conflits attendus)
git fetch origin
git merge origin/main
```

**Alerte automatique** : Hook `auto-sync-with-main.sh` alerte si >5 commits de retard.

---

## Limitations Honnetes

1. **Client-side hooks ne sont PAS fiables a 100%** - Un agent peut techniquement bypasser, mais 90% du temps ca alertera
2. **Server-side protection = seule garantie reelle** - GitHub branch protection est NON CONTOURNABLE
3. **Discipline manuelle requise** - Romeo cree les branches, coordonne les agents, est le "Coordinator"
4. **Pas de sessions vraiment paralleles** - Pour 2 features paralleles = fermer/rouvrir sessions

---

## Depannage

**Agent a switche de branche accidentellement** :

```bash
git checkout feat/BO-XXX-ma-feature
git log --oneline -5
# Si commits accidentels sur mauvaise branche :
git cherry-pick <commit-hash>  # Sur la bonne branche
```

**Divergence massive avec main (>10 commits)** :

```bash
# Rebase (si pas pushe)
git fetch origin && git rebase origin/main

# Merge (si deja pushe)
git fetch origin && git merge origin/main

# Creer PR immediatement (si feature stable)
gh pr create
```
