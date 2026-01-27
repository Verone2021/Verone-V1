# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

---

## AVANT DE COMMENCER (OBLIGATOIRE)

**Consulter SYSTEMATIQUEMENT:**

1. **Credentials**: `.serena/memories/` → Chercher `*-credentials-*.md`
2. **Context metier**: `docs/current/serena/INDEX.md`
3. **Database**: `.mcp.env` → DATABASE_URL
4. **Supabase Cloud**: `.serena/memories/supabase-*.md` → OBLIGATOIRE avant toute migration

**Voir `AGENTS.md` pour instructions detaillees.**

**Regle d'or:** JAMAIS inventer credentials. TOUJOURS chercher dans `.serena/memories/`.

---

## 🌐 MCP Browsers (Playwright + Chrome DevTools)

**Configuration** : Les deux MCP sont ACTIFS simultanément.

**⚠️ IMPORTANT** : Toujours préciser QUEL MCP utiliser pour éviter confusion.

### Quand Utiliser Quel MCP ?

| Tâche | MCP à Utiliser | Raison |
|-------|---------------|--------|
| Tests E2E automatisés | **PLAYWRIGHT** | Cross-browser, accessibility tree |
| Debug bugs critiques (500s) | **CHROME DEVTOOLS** | Network tab, console errors détaillés |
| Performance audit (LCP, CLS) | **CHROME DEVTOOLS** | Performance profiler |
| Automation workflows | **PLAYWRIGHT** | Multi-étapes fiable |
| Scraping données | **PLAYWRIGHT** | Structured data via accessibility |

### Gestion des Conflits

**Si confusion détectée** : Désactiver temporairement un MCP dans `.claude/settings.json` (commenter la ligne), puis redémarrer Claude Code.

**Documentation complète** : `.serena/memories/mcp-chrome-devtools-playwright-cohabitation.md`

### Prérequis Chrome DevTools

```bash
# Lancer Chrome avec remote debugging (obligatoire)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

---

## Commandes

```bash
pnpm dev             # Dev (localhost:3000)
pnpm build           # Production build
pnpm type-check      # TypeScript validation
pnpm lint            # ESLint validation
pnpm lint:fix        # ESLint auto-fix
```

### 🛡️ Prévention ESLint (Automatique)

**Protection 3 couches** (Phase 0 implémentée ✅) :

1. **Pre-commit Hook** (Husky + lint-staged)
   - Valide fichiers modifiés uniquement
   - Bloque si ERREURS (bugs async)
   - Tolère WARNINGS (type-safety)

2. **Configuration ESLint**
   - Règles async = ERROR (no-floating-promises, no-misused-promises)
   - Règles type-safety = WARN (migration graduelle)

3. **CI/CD** (GitHub Actions)
   - Valide chaque PR
   - Bloque merge si erreurs

**Documentation complète** : `docs/current/eslint-strategy-2026.md`

**État actuel** :
- 🔴 119 erreurs async (DOIT FIXER - bugs production)
- 🟡 1,946 warnings type-safety (tolérés, migration graduelle)

**Bypass pre-commit** (découragé) :
```bash
git commit --no-verify
```

### Tests E2E

**Guide rapide**: `packages/e2e-linkme/QUICKSTART.md` 📖

```bash
# Démarrer apps (un seul terminal - Turborepo démarre tout)
pnpm dev

# Lancer tests E2E LinkMe (depuis root OU depuis packages/e2e-linkme)
cd packages/e2e-linkme
pnpm test:e2e

# Mode UI pour déboguer
pnpm test:e2e:ui

# Voir le guide complet
cat packages/e2e-linkme/QUICKSTART.md
```

---

## 🔄 Workflow de Développement (5 Étapes)

### Méthodologie Standard

**TOUJOURS suivre cet ordre** :

#### 1. 🔍 RESEARCH (Comprendre l'existant)

Lire fichiers pertinents SANS coder :
- Comprendre architecture actuelle
- Identifier patterns existants
- Localiser fichiers critiques

**Outils** : Glob, Grep, Read, Serena (symbolic search)

#### 2. 📝 PLAN (Concevoir la solution)

Créer plan détaillé AVANT de coder :
- Utiliser EnterPlanMode ou `/plan` pour tasks complexes
- Recommander LA meilleure solution (pas d'options multiples)
- Identifier edge cases et risques

**Outils** : EnterPlanMode, AskUserQuestion (pour clarifications)

#### 3. 🧪 TEST (TDD si applicable)

Écrire tests AVANT le code (quand pertinent) :
```bash
npm run test:e2e          # Tests E2E avec Playwright
npm run type-check        # Validation TypeScript
```

**Pattern TDD** : RED (test échoue) → GREEN (code minimal) → REFACTOR

> "TDD est un superpower quand on travaille avec des AI agents" — Kent Beck

#### 4. ⚙️ EXECUTE (Implémenter le minimum)

Coder en suivant le plan :
- Suivre patterns existants
- Minimum nécessaire (pas de sur-engineering)
- Commits petits et fréquents (save points)

#### 5. ✅ VERIFY (Valider)

Valider à chaque modification :
```bash
npm run type-check        # TypeScript sans erreurs
npm run build             # Build production réussit
npm run e2e:smoke         # Tests UI si modification frontend
```

---

### Actions Git (après VERIFY réussi)

**COMMIT** - Sauvegardes fréquentes sur feature branch :
```bash
git commit -m "[APP-DOMAIN-NNN] step: description"
git push  # Backup + CI check
```

**PR** - Une seule PR à la fin de la feature :
```bash
gh pr create --title "[APP-DOMAIN-NNN] feat: description"
```

**Règle d'or** : 1 feature = 1 branche = N commits = **1 PR**

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

## Structure `.claude/` (Standards Anthropic 2026)

### Dossiers Requis

- **`agents/`** - Agents spécialisés (4 agents core)
- **`commands/`** - Commandes slash (5 commandes actives)
- **`rules/`** - Règles comportement (nouveau 2026)
- **`scripts/`** - Scripts hooks (statusline, task-completed, etc.)
- **`audits/`** - Documentation audit + rapports générés

### Fichiers Configuration

- **`settings.json`** - Config MCP + permissions (tracké Git)
- **`settings.local.json`** - Overrides locaux (gitignored)
- **`README.md`** - Documentation structure kit
- **`MANUAL_MODE.md`** - Règles workflow manuel

### ❌ À NE PAS METTRE dans `.claude/`

- **Mémoires** → `.serena/memories/` (MCP Serena)
- **Plans** → `.tasks/plans/` (Task management)
- **Documentation** → `docs/` (canonique) ou `docs/claude/` (spécifique)
- **Archives** → `docs/archive/YYYY-MM/`

### Portabilité

Cette structure `.claude/` est portable entre repos :
1. Copier dossier `.claude/` complet
2. Adapter `settings.json` (chemins absolus → `$CLAUDE_PROJECT_DIR`)
3. Installer dépendances globales : `bun install -g ccusage@17.2.1`

---

## Ports

| Application | Port |
|-------------|------|
| back-office | 3000 |
| site-internet | 3001 |
| linkme | 3002 |

---

**Version**: 9.1.0 (Audit Conformité 2026-01-21)
