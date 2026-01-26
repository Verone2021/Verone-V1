# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

---

## CRITICAL - LIRE EN PREMIER

### Checklist Debut de Session (OBLIGATOIRE)

**AVANT TOUTE ACTION**, lire :
1. `.claude/env.md` - Credentials (NE JAMAIS demander)
2. `.claude/work/ACTIVE.md` - Travail en cours
3. `.claude/memories/INDEX.md` - Lecons apprises

### MCP Disponibles (UTILISER)

| MCP | Usage | Quand Utiliser |
|-----|-------|----------------|
| **serena** | Recherche symboles + Memoire | `mcp__serena__*` - Code symbolique, `write_memory`/`read_memory` |
| **supabase** | Database operations | `mcp__supabase__*` - DB queries |
| **context7** | Documentation live | `mcp__context7__*` - Docs librairies |
| **playwright** | Tests UI | `mcp__playwright-lane-1__*` - E2E tests |

### Agents Disponibles (LANCER)

| Situation | Agent | Description |
|-----------|-------|-------------|
| Bug/Erreur | `verone-debug-investigator` | Sequential thinking, diagnostics |
| Migration/DB | `database-architect` | Supabase, RLS, triggers |
| UI/Frontend | `frontend-architect` | Next.js 15, components |
| Tache complexe | `verone-orchestrator` | Coordination, delegation |

### Regles Absolues

1. **NE JAMAIS** demander credentials a l'utilisateur (tout est dans `.claude/env.md`)
2. **TOUJOURS** utiliser les MCP au lieu de commandes manuelles quand disponibles
3. **TOUJOURS** lancer agents specialises pour taches complexes
4. **TOUJOURS** appliquer migrations via psql immediatement apres creation
5. **EN MODE PLAN** : AUCUNE modification de fichier sauf le fichier plan - READ-ONLY uniquement

---

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

## 🛡️ Protection Workflow (CRITIQUE)

### Règle Fondamentale

**JAMAIS d'action susceptible de casser le code sans :**
1. Lire l'existant ENTIÈREMENT
2. Identifier les patterns actuels
3. Analyser les risques de régression
4. DEMANDER approbation si fichier critique

### Fichiers Critiques (Approbation OBLIGATOIRE)

| Pattern | Raison | Action |
|---------|--------|--------|
| `*/middleware.ts` | Auth routing | AskUserQuestion |
| `*/app/login/**` | Login pages | AskUserQuestion |
| `*_rls_*.sql` | RLS policies | AskUserQuestion |
| `*_auth_*.sql` | Auth migrations | AskUserQuestion |

### Workflow OBLIGATOIRE pour Modifications

```
1. READ    → Lire fichier existant (100%)
2. AUDIT   → Documenter patterns actuels
3. PLAN    → Proposer changements avec justification
4. APPROVE → Attendre GO explicite utilisateur
5. EXECUTE → Modifier seulement après GO
6. VERIFY  → Type-check + build + test manuel
```

### Historique des Incidents (Ne Plus Répéter)

| Date | Commit | Erreur | Leçon |
|------|--------|--------|-------|
| 21 Jan | e17346bf | Hooks supprimés "remove friction" | Ne jamais "simplifier" les protections |
| 24 Jan | f14e009a | Middleware recréé sans audit | Toujours lire l'existant |

---

## 🔑 Environment Setup & Credentials (READ FIRST)

**CRITIQUE**: Lire `.claude/env.md` au début de CHAQUE session.

### Quick Reference

**Supabase Database Connection (TOUJOURS utiliser celle-ci):**
```bash
# Location: .mcp.env (line 1)
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -c "SELECT ..."
```

### Règles Absolues

1. **NE JAMAIS demander credentials** à l'utilisateur
   - DATABASE_URL est dans `.mcp.env` (ligne 1)
   - Lire automatiquement: `grep DATABASE_URL .mcp.env`

2. **TOUJOURS appliquer migrations via psql**
   - Créer fichier SQL → Appliquer immédiatement
   - Ne JAMAIS laisser migrations non-appliquées

3. **Vérifier connexion en cas de doute**
   ```bash
   psql "postgresql://postgres.aorroydfjsrygmosnzrl:..." -c "SELECT version();"
   ```

**Documentation complète**: `.claude/env.md`

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

## 🗄️ Migrations Supabase - Workflow Automatique

**RÈGLE ABSOLUE** : Claude applique AUTOMATIQUEMENT les migrations via `psql` direct.

### Workflow Standard (TOUJOURS suivre)

```bash
# 1. Créer migration
Write(file_path="supabase/migrations/YYYYMMDD_NNN_description.sql", content="...")

# 2. Appliquer IMMÉDIATEMENT via psql (DATABASE_URL depuis .mcp.env)
Bash(command='psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f supabase/migrations/YYYYMMDD_NNN_description.sql')

# 3. Vérifier succès
Bash(command='psql "postgresql://..." -c "SELECT COUNT(*) FROM _supabase_migrations;"')

# 4. Commit
Bash(command='git add supabase/migrations/ && git commit -m "[APP-DOMAIN-NNN] feat(db): description"')
```

### Règles Critiques

1. **NE JAMAIS** créer migration sans l'appliquer immédiatement
2. **NE JAMAIS** demander à l'utilisateur d'appliquer manuellement
3. **TOUJOURS** utiliser connection string complète depuis `.mcp.env`
4. **TOUJOURS** vérifier que la migration s'est appliquée avec succès

### Vérification Rapide

```bash
# Tester connexion
psql "postgresql://postgres.aorroydfjsrygmosnzrl:..." -c "SELECT version();"

# Lister migrations appliquées
psql "postgresql://postgres.aorroydfjsrygmosnzrl:..." -c "SELECT name FROM _supabase_migrations ORDER BY inserted_at DESC LIMIT 10;"
```

### Générer types TypeScript

```bash
# Après migration appliquée
SUPABASE_ACCESS_TOKEN="..." npx supabase@latest gen types typescript \
  --project-id aorroydfjsrygmosnzrl > packages/@verone/types/src/supabase.ts
```

**Documentation complète**: `.claude/env.md`

---

**Version**: 9.2.0 (Ajout workflow migrations Supabase Cloud 2026-01-24)
