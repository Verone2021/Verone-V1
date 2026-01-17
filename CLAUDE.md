# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

## Commandes

```bash
npm run dev          # Dev (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run e2e:smoke    # Smoke tests UI
```

---

## 🔄 Workflow de Développement Professionnel

### Méthodologie Standard (Research-Plan-Execute)

**TOUJOURS suivre cet ordre** :

#### 1. 🔍 RESEARCH (Audit de l'existant)

Lire fichiers pertinents SANS coder :
- Comprendre architecture actuelle
- Identifier patterns existants
- Localiser fichiers critiques
- Documenter dépendances

**Outils** : Glob, Grep, Read, Serena (symbolic search)

#### 2. 📝 PLAN (Conception)

Créer plan détaillé AVANT de coder :
- Utiliser EnterPlanMode pour tasks complexes
- Tester plusieurs approches (au moins 2)
- Identifier edge cases
- Estimer impact (fichiers touchés, breaking changes)

**Outils** : EnterPlanMode, AskUserQuestion (pour clarifications)

#### 3. 🧪 TEST (TDD - Test-Driven Development)

Écrire tests AVANT le code :
```bash
npm run test:e2e          # Tests E2E avec Playwright
npm run test:unit         # Tests unitaires (si disponibles)
npm run type-check        # Validation TypeScript
```

**Pattern TDD** :
1. Écrire test qui échoue (RED)
2. Écrire code minimal pour passer (GREEN)
3. Refactorer (REFACTOR)

> "TDD est un superpower quand on travaille avec des AI agents"
> — Kent Beck, [TDD, AI agents and coding](https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent)

#### 4. ⚙️ EXECUTE (Implémentation)

Coder en suivant le plan :
- Suivre patterns existants
- Commits petits et fréquents (save points)
- Minimum nécessaire (pas de sur-engineering)

#### 5. ✅ VERIFY (Vérification)

Valider à chaque étape :
```bash
npm run type-check        # TypeScript sans erreurs
npm run build             # Build production réussit
npm run e2e:smoke         # Tests UI si modification frontend
```

#### 6. 📦 COMMIT (Sauvegarde continue)

Commits fréquents sur feature branch :
```bash
# Commits atomiques à chaque étape logique
git add .
git commit -m "[APP-DOMAIN-NNN] step: description"
git push origin feature-branch

# Chaque push = backup + CI check
```

#### 7. 🔀 PULL REQUEST (À la fin seulement)

UNE SEULE PR pour toute la feature :
```bash
gh pr create --title "[APP-DOMAIN-NNN] feat: description" \
             --body "Résumé des commits + test plan"

# PR doit être traitée rapidement (< 1 heure idéalement)
```

**Source** : [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices)

---

## 🤖 Autonomie de Claude

### Principe de Base

Claude travaille **autonome pour maximiser productivité**, avec **validation humaine pour actions critiques**.

### ✅ Actions Autonomes (90% du travail)

Claude fait SEUL :

**Développement** :
- Explorer codebase (Glob, Grep, Read, Serena)
- Planifier implémentation (EnterPlanMode)
- Écrire/modifier code (Edit, Write)
- Créer/exécuter tests (Playwright, Jest)
- Vérifier qualité (type-check, build, lint)
- Créer commits (format convention respecté)
- Créer PRs (via `gh pr create`)
- Documenter changements (README, CLAUDE.md)

**Investigation** :
- Analyser bugs (logs, stack traces)
- Proposer solutions (plusieurs approches)
- Rechercher best practices (WebSearch)
- Lire documentation externe (WebFetch)

### 🤝 Actions Nécessitant Validation (10% - Critiques)

Claude **propose**, utilisateur **approuve** :

**Déploiement** :
- ⚠️ Merger PR vers main/production
- ⚠️ Déployer en environnement production
- ⚠️ Modifier variables env production (Vercel, Supabase)
- ⚠️ Modifier configuration production (feature flags)

**Données** :
- ⚠️ Supprimer tables/colonnes en production
- ⚠️ Modifier schéma database production
- ⚠️ Exécuter migrations irréversibles
- ⚠️ Supprimer ressources cloud (S3, etc.)

**Pourquoi ces checkpoints ?**
> "Actions avec conséquences réelles nécessitent validation humaine"
> — [AI Agent Deployment Best Practices 2026](https://blog.n8n.io/best-practices-for-deploying-ai-agents-in-production/)

### ❌ Ce que Claude NE DOIT JAMAIS Demander

Ne **PAS** demander à l'utilisateur de :
- Lire des fichiers du projet
- Exécuter des commandes CLI basiques (npm install, git add)
- Écrire du code que Claude peut écrire
- Chercher de la documentation
- Créer des commits/PRs

**Règle** : Si Claude peut le faire, Claude le fait.

### 🛡️ Sécurité et Rollback

**Checkpoints automatiques** :
- Chaque commit = save point
- CI/CD bloque si tests échouent
- Feature flags pour rollback rapide
- Logs détaillés des actions critiques

### 🛠️ Outils Disponibles

- **gh CLI**: `gh pr create`, `gh issue create`, `gh pr view`
- **MCP Playwright**: Automatiser navigation web (Vercel Dashboard)
- **Vercel CLI**: `vercel env pull`, `vercel logs`
- **Bash**: Tous les outils CLI (git, npm, curl, etc.)

---

## 🌳 Stratégie Git & Pull Requests

### Trunk-Based Development (TBD)

**Principe** : Short-lived feature branches, intégration rapide.

**Référence** : [Trunk-based Development](https://trunkbaseddevelopment.com/continuous-review/)

### Workflow Standard

#### 1. Créer Feature Branch
```bash
git checkout -b feat/APP-DOMAIN-NNN-description
# Exemples:
# - feat/BO-PARAMS-003-settings-menu
# - fix/LM-ORD-042-validation-bug
```

#### 2. Commits Fréquents (Save Points)
```bash
# Commits petits et atomiques
git add .
git commit -m "[BO-PARAMS-003] step 1: add settings icon"
git push

git commit -m "[BO-PARAMS-003] step 2: create submenu"
git push

git commit -m "[BO-PARAMS-003] step 3: add tests"
git push

# Chaque push = backup + CI check
```

**Avantages** :
- ✅ Backup continu sur GitHub
- ✅ CI valide chaque étape
- ✅ Facile de revenir en arrière
- ✅ Historique clair des étapes

#### 3. UNE PR à la Fin (Tous les Commits)
```bash
# Quand feature complète :
gh pr create \
  --title "[BO-PARAMS-003] feat: add settings menu with tests" \
  --body "
## Summary
- Added settings icon to sidebar
- Created submenu with 4 items
- Added comprehensive Playwright tests

## Test Plan
- [x] Type-check passes
- [x] Build succeeds
- [x] E2E tests pass
- [x] Manual testing on localhost:3000

## Commits
- step 1: add settings icon
- step 2: create submenu
- step 3: add tests
"
```

**Règle d'or** : 1 feature = 1 branche = N commits = **1 PR**

### Format de Commit Requis

```
[APP-DOMAIN-NNN] type: description courte

Details optionnels...
```

**Exemples** :
- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

**Validation automatique** : Hook PreToolUse bloque si format invalide

### Revue de PR

**Délai cible** : < 1 heure (idéalement quelques minutes)

**Checklist automatique** :
- [ ] CI passe (tests, build, type-check)
- [ ] Pas de conflits
- [ ] Format commits respecté
- [ ] Tests ajoutés si nouvelle feature

**Checklist humaine** :
- [ ] Code review (logique, sécurité)
- [ ] Validation fonctionnelle
- [ ] Approbation déploiement si prod

### Merge Strategy

```bash
# Pour feature branches (User merge après validation)
gh pr merge 123 --squash  # Squash commits en 1

# Pour hotfix critique (après validation)
gh pr merge 124 --merge --admin  # Preserve commits
```

**⚠️ Jamais de force push sur main** : Protégé en production

### Branches

- `main`: Production
- `feat/*`: Features
- `fix/*`: Bug fixes
- `docs/*`: Documentation

---

## Task Management (.tasks/)

### Structure
```
.tasks/
├── LM-ORD-009.md        # 1 fichier = 1 task
├── BO-DASH-001.md
├── INDEX.md             # Généré auto (gitignored)
└── TEMPLATE.md          # Template
```

### Créer nouvelle task
```bash
cp .tasks/TEMPLATE.md .tasks/LM-ORD-XXX.md
# Éditer frontmatter YAML
# git add .tasks/LM-ORD-XXX.md
```

### Générer index
```bash
.tasks/generate-index.sh
cat .tasks/INDEX.md
```

---

## Stack Technique

- Next.js 15 (App Router, RSC)
- shadcn/ui + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Turborepo v2.6.0 + pnpm

---

## Ports

| Application | Port |
|-------------|------|
| back-office | 3000 |
| site-internet | 3001 |
| linkme | 3002 |

---

**Version**: 9.0.0 (Refonte Workflow Professionnel 2026-01-17)
