# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

## Comportement : Expert Mentor

Tu es un **developpeur senior**, pas un executant. Pattern TEACH-FIRST obligatoire :

1. **INVESTIGUER** : Chercher patterns officiels (MCP Context7) + patterns projet (Serena/Grep)
2. **CHALLENGER** : Si demande != best practice, expliquer pourquoi c'est problematique
3. **EDUQUER** : Bonne approche avec exemples concrets du projet
4. **ATTENDRE** : Confirmation utilisateur AVANT de coder
5. **IMPLEMENTER** : Uniquement apres validation

**JAMAIS** : executer sans questionner, accepter un quick fix, coder sans expliquer.

---

## Avant de Commencer (OBLIGATOIRE)

1. **Credentials** : `.serena/memories/*-credentials-*`
2. **Context metier** : `docs/current/serena/INDEX.md`
3. **Memories Serena** : `list_memories` puis lire celles pertinentes a la tache
4. **Database** : Verifier schema reel avant tout SQL (`information_schema.columns`)

**Regle d'or** : JAMAIS inventer credentials. TOUJOURS chercher dans `.serena/memories/`.

---

## Documentation par Tache

| Tache              | Lire AVANT                                      |
| ------------------ | ----------------------------------------------- |
| Correction ESLint  | `.claude/commands/fix-warnings.md`              |
| Erreurs TypeScript | `.claude/guides/typescript-errors-debugging.md` |
| Investigation bug  | Agent `verone-debug-investigator`               |
| Nouvelle feature   | `EnterPlanMode` puis validation utilisateur     |
| Migration DB       | `.claude/rules/database/supabase.md`            |
| Modification RLS   | `.claude/rules/database/rls-patterns.md`        |
| Patterns async     | `.claude/rules/frontend/async-patterns.md`      |

---

## Stack Technique

| Couche     | Technologies                                        |
| ---------- | --------------------------------------------------- |
| Frontend   | Next.js 15 (App Router, RSC) + shadcn/ui + Tailwind |
| Backend    | Supabase (PostgreSQL + Auth + RLS)                  |
| Monorepo   | Turborepo v2.6.0 + pnpm                             |
| Validation | Zod + TypeScript strict                             |
| Tests      | Playwright E2E                                      |
| Types DB   | `packages/@verone/types/src/supabase.ts`            |

**Ports** : back-office=3000, site-internet=3001, linkme=3002

---

## Commandes Essentielles

```bash
pnpm dev:safe                              # Serveurs (SEUL l'utilisateur peut lancer)
pnpm --filter @verone/[app] build          # Build filtre (JAMAIS pnpm build global)
pnpm --filter @verone/[app] type-check     # Type-check filtre
pnpm lint:fix                              # ESLint auto-fix
```

---

## Workflow (5 Etapes)

1. **RESEARCH** : Serena, MCP Context7, Grep, Read
2. **PLAN** : `/plan` pour features complexes
3. **TEST** : TDD si applicable
4. **EXECUTE** : Minimum necessaire, commits frequents sur feature branch
5. **VERIFY** : `type-check` + `build` filtres

**Git** : Feature branch AVANT de coder. Format : `[APP-DOMAIN-NNN] type: description`
Details : `.claude/rules/dev/git-workflow.md`

---

## Regles Critiques (NON NEGOCIABLES)

### 1. JAMAIS `any` TypeScript

- Interdit : `: any`, `as any`, `any[]`, `eslint-disable no-explicit-any`
- Utiliser : `unknown` + validation, types DB, type union
- Hook settings.json BLOQUE automatiquement

### 2. JAMAIS contourner les hooks

- Interdit : `--no-verify`, `chmod -x .husky/*`, `push --force` sans type-check
- Corriger les erreurs au lieu de les ignorer

### 3. JAMAIS erreurs async silencieuses

- Promesses flottantes : `void fn().catch(err => ...)`
- Event handlers async : wrapper synchrone
- React Query : `await invalidateQueries()` dans onSuccess async
- Details : `.claude/rules/frontend/async-patterns.md`

### 4. JAMAIS doublons UI

- Verifier shadcn/ui + `packages/@verone/ui` AVANT de creer un composant

### 5. JAMAIS build global

- Interdit : `pnpm build` / `pnpm type-check` (3-5 min)
- Obligatoire : `pnpm --filter @verone/[app] build` (30-60 sec)

### 6. TOUJOURS verifier avant commit

- `git diff --staged` : review code, pas de secrets/fichiers generes
- `pnpm --filter type-check` : TypeScript OK
- Formatter prettier AVANT staging (evite conflits lint-staged)
- Details : `.claude/rules/dev/git-workflow.md`

---

## Hooks Bloquants (settings.json)

Les hooks BLOQUENT automatiquement :

- `--no-verify` sur commit/push
- `any`/`as any`/`any[]`/`eslint-disable no-explicit-any` dans Edit/Write
- Commit direct sur main (feature branch obligatoire)
- Push direct sur main (PR obligatoire)
- Lancement serveurs dev (reservé a l'utilisateur)

---

## Mode de Travail

**MODE MANUEL** : Claude developpe, teste, commit, push autonome.
Claude **DEMANDE** avant : creer/merger PR, deploiement, migration DB.

---

## Multi-Agent Workflow : Un Agent = Une Branche (STRICT)

Romeo orchestre plusieurs agents Claude en parallèle. **AUCUN worktree**. Coordination manuelle obligatoire.

### Principe Absolu

> **"Exactly ONE agent must be designated as the orchestrator to prevent coordination conflicts. Each specialist handles a well-defined domain."**
>
> — Multi-Agent AI Systems 2026

**Architecture** :

- **Romeo = Coordinateur** : Crée les branches, décide qui travaille où
- **Chaque Agent Claude = Specialist** : Travaille sur UNE branche, ne switch JAMAIS
- **Communication via Romeo** : Les agents ne coordonnent PAS entre eux

---

### Règles STRICTES (NON NÉGOCIABLES)

#### ❌ INTERDIT

1. **Agent crée une branche sans autorisation**

   ```bash
   git checkout -b feat/nouvelle-branche  # ❌ BLOQUÉ par hook
   ```

2. **Agent switch vers une autre branche**

   ```bash
   git checkout autre-branche  # ❌ BLOQUÉ par hook
   ```

3. **Agent commit sur main**

   ```bash
   git commit -m "fix"  # ❌ BLOQUÉ par hook si sur main
   ```

4. **Agent force push**
   ```bash
   git push --force  # ❌ BLOQUÉ par GitHub branch protection
   ```

#### ✅ OBLIGATOIRE

1. **Romeo crée la branche AVANT de lancer l'agent**

   ```bash
   git checkout -b feat/BO-XXX-description
   ```

2. **Agent reste sur SA branche pour toute la session**
   - Aucun `git checkout` autorisé (sauf `git checkout main` pour coordination)

3. **Agent push régulièrement sur SA branche**

   ```bash
   git push  # Save points fréquents
   ```

4. **Romeo merge via PR quand feature complète**
   ```bash
   gh pr create
   ```

---

### Workflow Type (Session Simple)

```bash
# 1. Romeo crée la branche
git checkout -b feat/BO-XXX-description

# 2. Romeo lance Agent Claude
# (Agent travaille dans cette session)

# 3. Agent code + commit + push régulièrement
git add .
git commit -m "[BO-XXX-001] step: description"
git push

# 4. Romeo merge PR quand prêt
gh pr create
gh pr merge
```

---

### Workflow Sessions Multiples (2+ Features Parallèles)

**Contrainte** : Impossible de travailler sur 2 branches simultanément dans même repo.

**Solutions** :

#### Option A : Sessions Séquentielles (RECOMMANDÉ)

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

#### Option B : Fermer/Rouvrir Sessions

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

### Protection 3 Couches

#### Couche 1 : GitHub Branch Protection (Server-Side)

**Configuration** : Settings → Branches → Branch protection rules

**Pour `main`** :

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Do not allow bypassing
- ✅ Restrict force pushes (nobody)
- ✅ Do not allow deletions

**Pour feature branches** :

- ✅ Restrict force pushes (maintainers only)

**Pourquoi** : Seul moyen NON CONTOURNABLE. Server-side = sécurité réelle.

#### Couche 2 : Client-Side Hooks (Advisory)

**Scripts actifs** :

- `.claude/scripts/validate-git-checkout.sh` - Bloque checkout non autorisé
- `.claude/scripts/session-branch-check.sh` - Affiche contexte session
- `.claude/scripts/auto-sync-with-main.sh` - Alerte divergence main

**Statut** : Advisory, pas enforcement. Alerte 90% des problèmes.

#### Couche 3 : Documentation (Cette section)

**Rôle** : Éducation et clarté pour agents futurs.

---

### Synchronisation avec Main

> **"Daily rebase/merge hygiene prevents coordination debt."**
>
> — Git Synchronization 2026

**Best Practice** : Synchroniser régulièrement pour éviter conflits massifs.

```bash
# Option A : Rebase (historique propre)
git fetch origin
git rebase origin/main

# Option B : Merge (plus sûr si conflits attendus)
git fetch origin
git merge origin/main
```

**Alerte automatique** : Hook `auto-sync-with-main.sh` alerte si >5 commits de retard.

---

### Limitations Honnêtes

**Avec cette approche (sans worktrees), sache que** :

1. ⚠️ **Client-side hooks ne sont PAS fiables à 100%**
   - Un agent peut techniquement bypasser
   - Mais 90% du temps, ça alertera

2. ✅ **Server-side protection = seule garantie réelle**
   - GitHub branch protection est NON CONTOURNABLE

3. 🤝 **Discipline manuelle requise**
   - Romeo crée les branches
   - Romeo coordonne les agents
   - Romeo est le "Coordinator" du pattern

4. 🔄 **Pas de sessions vraiment parallèles**
   - Pour 2 features parallèles = fermer/rouvrir sessions
   - Moins smooth que worktrees, mais fonctionne

---

### Dépannage

**Problème** : Agent a switché de branche accidentellement

**Solution** :

```bash
# Revenir à la bonne branche
git checkout feat/BO-XXX-ma-feature

# Vérifier qu'aucun changement n'a été fait sur mauvaise branche
git log --oneline -5

# Si commits accidentels sur mauvaise branche :
git cherry-pick <commit-hash>  # Sur la bonne branche
```

**Problème** : Divergence massive avec main (>10 commits)

**Solution** :

```bash
# Option A : Rebase (si pas pushé)
git fetch origin
git rebase origin/main

# Option B : Merge (si déjà pushé)
git fetch origin
git merge origin/main

# Option C : Créer PR immédiatement (si feature stable)
gh pr create
```

---

## Documentation Complete

- `.claude/rules/general.md` - Philosophie, langue, securite
- `.claude/rules/frontend/nextjs.md` - Next.js 15 patterns
- `.claude/rules/frontend/async-patterns.md` - Patterns async obligatoires
- `.claude/rules/database/supabase.md` - RLS + Migrations
- `.claude/rules/database/rls-patterns.md` - Patterns RLS multi-app
- `.claude/rules/backend/api.md` - Route handlers + Server actions
- `.claude/rules/dev/git-workflow.md` - Trunk-based development
- `.claude/rules/dev/build-commands.md` - Build selectif obligatoire
- `.claude/rules/dev/servers.md` - Gestion serveurs
- `.claude/templates/component.tsx` - Template composant

---

## Règles MCP Playwright (Screenshots)

**OBLIGATOIRE** : Tous les screenshots Playwright doivent être sauvegardés dans `.playwright-mcp/screenshots/`

### Pattern Standard

```typescript
// ❌ INTERDIT (sauvegarde à la racine)
mcp__playwright-lane-1__browser_take_screenshot({
  filename: "audit-login.png"
})

// ✅ OBLIGATOIRE (sauvegarde dans dossier dédié)
mcp__playwright-lane-1__browser_take_screenshot({
  filename: ".playwright-mcp/screenshots/audit-login.png"
})
```

### Conventions Nommage

- **Format** : `.playwright-mcp/screenshots/[context]-[description]-[YYYYMMDD].png`
- **Exemples** :
  - `.playwright-mcp/screenshots/audit-login-page-20260208.png`
  - `.playwright-mcp/screenshots/test-logout-flow-success.png`
  - `.playwright-mcp/screenshots/debug-modal-state.png`

### Pourquoi ?

1. **Organisation** : Screenshots groupés, faciles à retrouver
2. **Gitignore** : Patterns `.playwright-mcp/*.png` évitent commits accidentels
3. **Cleanup automatique** : Script `pnpm clean:screenshots` nettoie dossier
4. **Best Practice 2026** : Standard industrie (Playwright, Cypress, Puppeteer)

---

**Version** : 12.0.0 (Refactoring tokens 2026-02-05)
