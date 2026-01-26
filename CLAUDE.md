# Verone Back Office - Instructions Claude

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

---

## CRITICAL - LIRE EN PREMIER

### Checklist Debut de Session (OBLIGATOIRE)

**AVANT TOUTE ACTION**, lire :
1. `.claude/env.md` - Credentials (NE JAMAIS demander)
2. `.claude/work/ACTIVE.md` - Travail en cours

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
6. **MEMORIES** : Toujours utiliser Serena MCP (`mcp__serena__write_memory`), jamais de fichiers `.claude/memories/`

---

## Memories Serena (Consulter Automatiquement)

Les memories sont gerees par Serena MCP. Consulter avec :
```bash
mcp__serena__list_memories
mcp__serena__read_memory("memory-name")
```

### Memories Critiques
- `workflow-strict-rules` : Regles de modification
- `auth-paths-immutable` : Chemins auth immuables
- `database-migrations-convention` : Conventions migrations
- `playwright-login-first-mandatory` : Tests E2E

---

## Commandes

```bash
pnpm dev             # Dev (UTILISATEUR UNIQUEMENT - voir section interdictions)
pnpm build           # Production build
pnpm type-check      # TypeScript validation
pnpm test:e2e        # Tests E2E Playwright
```

---

## Actions Interdites pour Claude

**Claude ne doit JAMAIS executer ces commandes :**

```bash
# INTERDIT - Lancement serveurs de developpement
pnpm dev
pnpm --filter <app> dev

# INTERDIT - Sans validation explicite de l'utilisateur
gh pr create         # Demander d'abord
gh pr merge          # Demander d'abord
git push --force     # Demander d'abord

# INTERDIT - Commandes bloquantes sans background/timeout
pnpm build           # Sans run_in_background=true
pnpm test:e2e        # Sans timeout approprie
```

**Regle simple** : *"Claude developpe, teste, build, commit. L'utilisateur lance les serveurs."*

**Documentation complete** : `.claude/MANUAL_MODE.md`

---

## Protection Workflow (CRITIQUE)

### Regle Fondamentale

**JAMAIS d'action susceptible de casser le code sans :**
1. Lire l'existant ENTIEREMENT
2. Identifier les patterns actuels
3. Analyser les risques de regression
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
1. READ    -> Lire fichier existant (100%)
2. AUDIT   -> Documenter patterns actuels
3. PLAN    -> Proposer changements avec justification
4. APPROVE -> Attendre GO explicite utilisateur
5. EXECUTE -> Modifier seulement apres GO
6. VERIFY  -> Type-check + build + test manuel
```

### Historique des Incidents (Ne Plus Repeter)

| Date | Commit | Erreur | Lecon |
|------|--------|--------|-------|
| 21 Jan | e17346bf | Hooks supprimes "remove friction" | Ne jamais "simplifier" les protections |
| 24 Jan | f14e009a | Middleware recree sans audit | Toujours lire l'existant |

---

## Environment & Credentials

**CRITIQUE**: Lire `.claude/env.md` au debut de CHAQUE session.

### Quick Reference

```bash
# Charger DATABASE_URL depuis .mcp.env
source .mcp.env && psql "$DATABASE_URL" -c "SELECT ..."
```

### Regles
1. **NE JAMAIS demander credentials** - tout est dans `.mcp.env`
2. **TOUJOURS appliquer migrations via psql** immediatement
3. **NE JAMAIS hardcoder** credentials dans fichiers trackes

**Documentation complete**: `.claude/env.md`

---

## Workflow de Developpement

### Methodologie Standard (Research-Plan-Execute)

**TOUJOURS suivre cet ordre** :

1. **RESEARCH** : Lire fichiers pertinents SANS coder (Glob, Grep, Read, Serena)
2. **PLAN** : EnterPlanMode pour tasks complexes
3. **TEST** : TDD - ecrire tests AVANT le code
4. **EXECUTE** : Coder en suivant le plan, commits frequents
5. **VERIFY** : `pnpm type-check && pnpm build`
6. **COMMIT** : Format `[APP-DOMAIN-NNN] type: description`

### Tests

```bash
pnpm type-check      # TypeScript sans erreurs
pnpm build           # Build production (run_in_background=true)
pnpm test:e2e        # Tests E2E Playwright
```

---

## Mode de Travail

**MODE MANUEL** : Claude ne cree ni ne merge de PR sans instruction explicite.

- Claude developpe, teste, commit, push autonome
- Claude **DEMANDE** avant de creer/merger PR
- Claude **DEMANDE** avant toute action critique

**Documentation complete** : `.claude/MANUAL_MODE.md`

---

## Git & Pull Requests

### Format de Commit

```
[APP-DOMAIN-NNN] type: description courte
```

**Exemples** :
- `[LM-ORD-009] feat: refonte workflow order form`
- `[BO-DASH-001] fix: cache invalidation`
- `[NO-TASK] chore: update dependencies`

### Branches

| Branche | Usage |
|---------|-------|
| `main` | Production |
| `feat/*` | Features |
| `fix/*` | Bug fixes |

**Documentation complete** : `.claude/docs/git-workflow.md`

---

## Migrations Supabase

**REGLE ABSOLUE** : Claude applique AUTOMATIQUEMENT les migrations via `psql` direct.

```bash
# 1. Creer migration
Write(file_path="supabase/migrations/YYYYMMDD_NNN_description.sql", content="...")

# 2. Appliquer IMMEDIATEMENT
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/YYYYMMDD_NNN_description.sql

# 3. Verifier succes
source .mcp.env && psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM _supabase_migrations;"

# 4. Commit
git add supabase/migrations/ && git commit -m "[APP-DOMAIN-NNN] feat(db): description"
```

**Documentation complete**: `.claude/env.md`

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

## Documentation Detaillee

| Sujet | Fichier |
|-------|---------|
| Credentials & Migrations | `.claude/env.md` |
| Mode Manuel PR | `.claude/MANUAL_MODE.md` |
| Git Workflow Complet | `.claude/docs/git-workflow.md` |
| Agents Specialises | `.claude/agents/*.md` |
| Commandes Slash | `.claude/commands/*.md` |

---

**Version**: 10.0.0 (Restructuration documentation - 2026-01-26)
