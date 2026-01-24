# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

## Commandes

```bash
pnpm dev             # Dev (UTILISATEUR UNIQUEMENT - voir section interdictions)
pnpm build           # Production build
pnpm type-check      # TypeScript validation
pnpm e2e:smoke       # Smoke tests UI
```

---

## 🚫 Actions Interdites pour Claude

**Claude ne doit JAMAIS exécuter ces commandes :**

```bash
# ❌ INTERDIT - Lancement serveurs de développement
pnpm dev
pnpm --filter <app> dev
npm run dev
next dev

# ❌ INTERDIT - Sans validation explicite de l'utilisateur
gh pr create         # Demander d'abord
gh pr merge          # Demander d'abord
git push --force     # Demander d'abord

# ❌ INTERDIT - Commandes bloquantes sans background/timeout
pnpm build                    # Sans run_in_background=true
pnpm e2e:smoke               # Sans timeout approprié
# → Utiliser: Bash(command="pnpm build", run_in_background=true)
# → Ou: Bash(command="pnpm type-check", timeout=60000)
```

**Pourquoi ?** Le lancement de serveurs par Claude occupe les ports et empêche l'utilisateur de lancer ses propres serveurs.

**Règle simple** : *"Claude développe, teste, build, commit. L'utilisateur lance les serveurs."*

**Documentation complète** : Voir `.claude/MANUAL_MODE.md`

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

## 🔧 Mode de Travail

**MODE MANUEL** : Claude ne crée ni ne merge de PR sans instruction explicite.

**Documentation complète** : Voir `.claude/MANUAL_MODE.md`

**En bref** :
- ✅ Claude développe, teste, commit, push autonome
- ⚠️ Claude **DEMANDE** avant de créer/merger PR
- ⚠️ Claude **DEMANDE** avant toute action critique (déploiement, migration DB, etc.)

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

**Version**: 9.1.0 (Ajout section Interdictions Claude 2026-01-24)
