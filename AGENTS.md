# Agent Instructions - Verone Back Office

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

---

## CRITICAL: Read Before ANY Task

**TOUJOURS consulter ces fichiers AVANT de commencer toute tache:**

### 1. Credentials (OBLIGATOIRE)

```bash
# Chercher les credentials dans .serena/memories/
ls .serena/memories/*credentials*.md
```

| App | Fichier |
|-----|---------|
| Back-Office | `.serena/memories/back-office-login-credentials-*.md` |
| LinkMe | `.serena/memories/linkme-test-credentials-*.md` |

**JAMAIS inventer de credentials. TOUJOURS chercher dans `.serena/memories/`.**

### 2. Context Metier

- `docs/current/serena/INDEX.md` - Index memories CRITICAL
- `docs/current/` - 12 docs canoniques (architecture, database, API)
- `docs/business-rules/` - 93 dossiers regles metier

### 3. Database

- `.mcp.env` - DATABASE_URL pour migrations SQL
- `supabase/migrations/` - 74 migrations existantes

### 4. Workflow

- `CLAUDE.md` - Workflow developpement professionnel

---

## Commands

```bash
# Development
npm run dev                  # All apps (back-office:3000, site-internet:3001, linkme:3002)
npm run dev --filter=back-office  # Single app

# Build & Validation
npm run build               # Production build
npm run type-check          # TypeScript validation (REQUIRED before commit)

# Tests
npm run test:e2e            # E2E Playwright tests
npm run e2e:smoke           # Quick smoke tests

# Database
npm run generate:types      # Regenerate Supabase types
```

---

## Project Structure

```
verone-back-office/
├── apps/                       # 3 Next.js 15 applications
│   ├── back-office/            # CRM/ERP (port 3000)
│   ├── linkme/                 # Affiliation (port 3002)
│   └── site-internet/          # E-commerce B2C (port 3001)
├── packages/@verone/           # 26 shared packages
│   ├── types/                  # TypeScript + Supabase types
│   ├── ui/                     # 54 shadcn/ui components
│   ├── utils/                  # Helpers (logger, excel, upload)
│   └── ...                     # +20 business packages
├── supabase/migrations/        # 74 SQL migrations
├── docs/current/               # 12 canonical docs
├── .serena/memories/           # CRITICAL context files
├── .tasks/                     # Task management
└── .claude/                    # Claude Code configuration
```

---

## Conventions

### Commits

```bash
# Format REQUIS
git commit -m "[APP-DOMAIN-NNN] type: description"

# Exemples
git commit -m "[LM-ORD-009] feat: refonte workflow order form"
git commit -m "[BO-DASH-001] fix: cache invalidation"
git commit -m "[NO-TASK] chore: update dependencies"
```

### Tests

- TOUJOURS `npm run type-check` avant commit
- TOUJOURS `npm run build` avant PR
- Tests E2E pour modifications frontend critiques

### Migrations SQL

1. Lire `.mcp.env` pour DATABASE_URL
2. Creer migration: `supabase migration new nom`
3. Ecrire SQL dans `supabase/migrations/YYYYMMDDHHMMSS_nom.sql`
4. JAMAIS editer migrations existantes (append-only)

---

## Critical Paths

| Categorie | Chemin | Usage |
|-----------|--------|-------|
| **Credentials** | `.serena/memories/*-credentials-*.md` | Login test apps |
| **Context** | `docs/current/serena/INDEX.md` | Memories index |
| **Database** | `.mcp.env` | DATABASE_URL |
| **Workflow** | `CLAUDE.md` | Dev methodology |
| **Types** | `packages/@verone/types/` | TypeScript types |
| **UI** | `packages/@verone/ui/` | shadcn components |
| **Tasks** | `.tasks/` | Task management |

---

## Error Prevention

### JAMAIS

- Inventer credentials ou URLs
- Editer migrations SQL existantes
- Force push sur main
- Creer PR sans instruction explicite
- Commiter `.env` ou secrets

### TOUJOURS

- Consulter `.serena/memories/` pour credentials
- Lire `.mcp.env` pour database
- `npm run type-check` avant commit
- `npm run build` avant PR
- Format commit `[APP-DOMAIN-NNN]`

---

## Tech Stack

| Categorie | Technologies |
|-----------|--------------|
| **Framework** | Next.js 15.5.7, React 18.3.1, TypeScript 5.3.3 |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS 3.4.1 |
| **Database** | Supabase (PostgreSQL), @supabase/ssr |
| **Validation** | Zod 4.1.12, React Hook Form |
| **State** | TanStack Query 5.20.1, SWR 2.3.6 |
| **Monorepo** | Turborepo 2.6.0, pnpm 10.13.1 |
| **Testing** | Playwright 1.55.0 |

---

**Version**: 1.0.0 - 2026-01-21
