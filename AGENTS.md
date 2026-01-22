# AGENTS.md - Verone Back Office

> README for AI coding agents. Standard ouvert utilise par 60k+ repos.
> Reduit bugs agent de 35-55%, setup time de 20-40min a < 2min.

---

## Quick Reference

### Before ANY Task

```bash
# 1. Credentials (OBLIGATOIRE)
ls .serena/memories/*credentials*.md

# 2. Context metier
cat docs/current/serena/INDEX.md

# 3. Database
cat .mcp.env | grep DATABASE_URL

# 4. Workflow
cat CLAUDE.md
```

### Commands

```bash
npm run dev          # All apps (:3000, :3001, :3002)
npm run build        # Production build
npm run type-check   # TypeScript validation (REQUIRED)
npm run test:e2e     # Playwright E2E tests
npm run lint:fix     # ESLint auto-fix
```

---

## Critical Context

### 1. Credentials (OBLIGATOIRE)

| App | File |
|-----|------|
| Back-Office | `.serena/memories/back-office-login-credentials-2026-01.md` |
| LinkMe | `.serena/memories/linkme-test-credentials-2026-01.md` |

**JAMAIS inventer. TOUJOURS chercher dans `.serena/memories/`.**

### 2. 15 Memories CRITICAL

Versionnees dans `docs/current/serena/`:

| # | Memory | Role |
|---|--------|------|
| 1 | `project-overview.md` | Vue ensemble projet |
| 2 | `business-context.md` | Contexte metier deco/mobilier |
| 3 | `database-schema-mappings.md` | Anti-hallucination colonnes |
| 4 | `database-implementation.md` | 91 tables, RLS policies |
| 5 | `linkme-architecture.md` | Roles, triggers affiliation |
| 6 | `linkme-commissions.md` | Formules calcul commissions |
| 7 | `products-architecture.md` | Architecture produits centrale |
| 8 | `stock-orders-logic.md` | Logique stock et alertes |
| 9 | `migrations-workflow.md` | Workflow Supabase |
| 10 | `claude-code-workflow.md` | Workflow 5 etapes |
| 11 | `project-decisions.md` | Decisions non-negociables |
| 12 | `turborepo-paths.md` | Chemins corrects monorepo |
| 13 | `vercel-no-docker.md` | JAMAIS Docker |
| 14 | `qonto-never-finalize.md` | JAMAIS finaliser factures |
| 15 | `user-expectations.md` | Pas d'options, resoudre |

### 3. Database

| Element | Location |
|---------|----------|
| Connection | `.mcp.env` → `DATABASE_URL` |
| Types | `packages/@verone/types/src/supabase.ts` |
| Migrations | `supabase/migrations/` (313 fichiers) |
| Tables | 91 tables avec RLS |

**Workflow migrations:**
```bash
supabase migration new nom
# Edit supabase/migrations/YYYYMMDDHHMMSS_nom.sql
supabase db push
```

---

## Project Structure

### Apps

| App | Port | Role | Imports @verone/ |
|-----|------|------|------------------|
| back-office | 3000 | CRM/ERP central (22 modules) | 832 |
| linkme | 3002 | Affiliation (commissions) | 105 |
| site-internet | 3001 | E-commerce B2C | 11 |

### Packages Hierarchy

```
FOUNDATION (modifier = impact total monorepo)
├── @verone/types       → Types Supabase (91 tables)
├── @verone/utils       → Logger, validation, supabase client
├── @verone/hooks       → Hooks React partages
└── @verone/ui          → 54 composants shadcn/ui

BUSINESS (18 packages metier)
├── @verone/products    → Catalogue, pricing, variantes
├── @verone/orders      → Commandes, shipments, workflow
├── @verone/stock       → Mouvements, alertes, inventaire
├── @verone/finance     → PCG, TVA, tresorerie, factures
├── @verone/customers   → CRM, contacts, historique
├── @verone/suppliers   → Fournisseurs, achats
├── @verone/quotes      → Devis, conversions
├── @verone/crm         → Pipeline, activites
├── @verone/linkme-*    → 5 packages affiliation
└── ... (8 autres)

TOTAL: 26 packages @verone/
```

### Directory Structure

```
verone-back-office/
├── apps/                       # 3 Next.js 15 applications
│   ├── back-office/            # CRM/ERP (port 3000)
│   ├── linkme/                 # Affiliation (port 3002)
│   └── site-internet/          # E-commerce B2C (port 3001)
├── packages/@verone/           # 26 shared packages
├── supabase/migrations/        # 313 SQL migrations
├── docs/
│   ├── current/                # 9 docs canoniques
│   └── business-rules/         # 93 dossiers regles
├── .serena/memories/           # 47 fichiers context
├── .tasks/                     # Task management
└── .claude/                    # Claude Code config
    ├── agents/                 # 4 agents specialises
    ├── commands/               # 5 slash commands
    └── rules/                  # 3 domains regles
```

---

## Development

### Testing

```bash
# E2E Playwright
npm run test:e2e              # Full suite
npm run test:e2e:critical     # Critical paths only
npm run test:e2e:headed       # With browser UI

# Validation (REQUIRED before commit)
npm run type-check            # TypeScript - 0 errors
npm run build                 # Production build
npm run lint:fix              # ESLint auto-fix
```

### Conventions

#### Commits (Format OBLIGATOIRE)

```bash
[APP-DOMAIN-NNN] type: description

# Exemples valides:
[LM-ORD-010] feat: order form improvements
[BO-DASH-001] fix: cache invalidation issue
[BO-PARAMS-003] refactor: settings menu structure
[NO-TASK] chore: update dependencies
[NO-TASK] docs: update README
```

#### Branches

```bash
feat/APP-DOMAIN-NNN-description
fix/APP-DOMAIN-NNN-description
docs/APP-DOMAIN-NNN-description

# Exemples:
feat/LM-ORD-010-order-form
fix/BO-DASH-001-cache-issue
```

### Specialized Agents

| Agent | Role | When to Use |
|-------|------|-------------|
| `verone-orchestrator` | Lead Tech Orchestrator | Tasks complexes multi-fichiers |
| `database-architect` | SQL migrations | Schema changes, RLS policies |
| `frontend-architect` | UI components | Next.js 15, shadcn/ui |
| `verone-debug-investigator` | Investigation | Bugs, errors, behavior |

### Slash Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `/plan` | Enter plan mode | Avant implementation complexe |
| `/implement` | Explore → Plan → Code → Verify | Feature complete |
| `/explore` | Codebase discovery | Comprendre architecture |
| `/db` | Supabase operations | Migrations, queries |
| `/pr` | PR automation | Creation PR |

### MCP Servers

| Server | Purpose |
|--------|---------|
| serena | Memories + symbolic search |
| playwright-mcp | Browser automation back-office |
| playwright-linkme | Browser automation linkme |
| context7 | Documentation fetching |
| magic | UI component generation |
| supabase | Database operations |

---

## Boundaries

### JAMAIS

- Inventer credentials ou URLs
- Editer migrations SQL existantes (append-only)
- Force push sur main
- Creer/merger PR sans instruction explicite
- Commiter `.env` ou secrets
- Utiliser Docker (TOUJOURS Vercel)
- Finaliser factures Qonto automatiquement
- Sauter `type-check` avant commit
- Proposer options au user (resoudre directement)
- Modifier packages FOUNDATION sans impact analysis
- Supprimer migrations existantes

### TOUJOURS

- Consulter `.serena/memories/` pour credentials
- Lire `.mcp.env` pour DATABASE_URL
- `npm run type-check` avant commit
- `npm run build` avant PR
- Format commit `[APP-DOMAIN-NNN] type: description`
- Demander avant action critique (PR, merge, deploy)
- Suivre workflow 5 etapes (voir `CLAUDE.md`)
- Verifier impact sur 3 apps avant modifier @verone/
- Utiliser agents specialises pour taches complexes
- Creer task file `.tasks/APP-DOMAIN-NNN.md`

---

## PR Instructions

### Checklist (OBLIGATOIRE)

```markdown
- [ ] Branch: feat/APP-DOMAIN-NNN-* (pas main)
- [ ] Commits: Format [APP-DOMAIN-NNN] type: description
- [ ] type-check: 0 errors
- [ ] build: succeeded
- [ ] lint: no errors
- [ ] Tests E2E: critical passed (si frontend)
- [ ] No console.log/debugger in prod code
- [ ] Task file updated (.tasks/APP-DOMAIN-NNN.md)
```

### PR Title Format

```
[APP-DOMAIN-NNN] type: description courte
```

### PR Body Template

```markdown
## Summary
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

## Test Plan
- [x] type-check passes
- [x] build succeeds
- [x] E2E tests pass (critical paths)
- [x] Manual testing completed

## Files Changed
- `path/to/file1.ts` - Description
- `path/to/file2.tsx` - Description

---
Generated with [Claude Code](https://claude.com/claude-code)
```

---

## Tech Stack

| Category | Technologies |
|----------|--------------|
| Framework | Next.js 15.5.7, React 18.3.1, TypeScript 5.3.3 |
| UI | shadcn/ui, Radix UI, Tailwind CSS 3.4.1 |
| Database | Supabase (PostgreSQL), @supabase/ssr |
| Validation | Zod 4.1.12, React Hook Form |
| State | TanStack Query 5.20.1, SWR 2.3.6 |
| Monorepo | Turborepo 2.6.0, pnpm 10.13.1 |
| Testing | Playwright 1.55.0 |
| Deploy | Vercel (JAMAIS Docker) |

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Type errors | `npm run type-check` puis fix |
| Build fails | Check imports, types generation |
| E2E fails | Check credentials in memories |
| DB connection | Verify `.mcp.env` DATABASE_URL |
| Missing types | `npm run generate:types` |
| Package not found | `pnpm install` at root |

---

**Version**: 2.0.0 - Professional Edition
**Based on**: Deep 3-agent audit (2026-01-21)
**Standard**: AGENTS.md (60k+ repos)
