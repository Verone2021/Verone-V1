# Verone Back Office

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

---

## Stack Technique

```
Frontend  : Next.js 15 (App Router, RSC, Server Actions)
UI        : shadcn/ui + Radix UI + Tailwind CSS
Database  : Supabase (PostgreSQL + Auth + RLS)
Validation: Zod + React Hook Form
Monorepo  : Turborepo v2.6.0 + pnpm workspaces
Deploy    : Vercel (auto-deploy main)
```

---

## Architecture Turborepo

**3 Applications** :
- `apps/back-office` (Port 3000) - CRM/ERP
- `apps/site-internet` (Port 3001) - E-commerce
- `apps/linkme` (Port 3002) - Commissions

**25 Packages** (@verone/*) :
- UI : `@verone/ui` (54 composants)
- Business : `@verone/products`, `@verone/orders`, `@verone/stock`, `@verone/customers`
- Utils : `@verone/types`, `@verone/utils`

### Chemins Corrects

```typescript
// Applications
apps/back-office/src/app/
apps/back-office/src/components/

// Packages
packages/@verone/ui/src/
packages/@verone/products/src/
```

### Imports

```typescript
import { Button, Card } from '@verone/ui';
import { ProductCard } from '@verone/products';
import type { Database } from '@verone/types';
```

---

## Commandes Essentielles

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint:fix     # Auto-fix ESLint

# Database
supabase db push
supabase gen types typescript --local > apps/back-office/src/types/supabase.ts
```

---

## Regles d'Or

1. **Documentation First** : Consulter docs AVANT modifier
2. **Console Zero** : 1 erreur console = echec complet
3. **Build Always** : Verifier build AVANT et APRES modifications
4. **Authorization Always** : JAMAIS commit sans autorisation explicite
5. **Simple First** : Proposer solution la plus simple EN PREMIER

---

## Git Workflow

```
main       → Production Vercel (auto-deploy)
feature/*  → Branches de developpement
```

**JAMAIS commit/push SANS autorisation explicite.**

```bash
# Workflow
1. Modifications
2. npm run build (doit passer)
3. DEMANDER AUTORISATION
4. git add && git commit && git push
```

---

## Workflow P.D.C.A.

Voir `.claude/workflows/PDCA.md` pour le workflow complet.

**Resume** : Plan → Do → Check (preuves obligatoires) → Act

```bash
# Preuves requises avant commit
npm run type-check   # 0 erreurs
npm run build        # Build succeeded
```

---

## Definition of Done (Obligatoire)

**Apres chaque feature UI (LinkMe ou CMS)**, executer :

```bash
# 1. Validation TypeScript + Lint
pnpm -w lint
pnpm -w type-check

# 2. Smoke tests Playwright (echoue sur pageerror / console.error)
cd apps/linkme && npm run e2e:smoke
```

**Criteres obligatoires** :
- Les tests doivent echouer si `page.on('pageerror')` ou `console.error` apparait
- Verifier au moins 1 element UI cle (heading/table) par page
- Ne JAMAIS conclure "c'est OK" sans report Playwright (ou trace si echec)

**Prompt de verification** :
> Apres chaque modification front (LinkMe ou CMS), lance un smoke test Playwright qui :
> 1. ouvre /ventes, /profil, /login, /dashboard
> 2. echoue si page.on('pageerror') ou console.error
> 3. verifie 1 element UI cle (heading/table)
> 4. genere trace "on-first-retry"
> Ne conclus pas "done" tant que ces smoke tests ne passent pas.

---

## Configuration Claude Code

- **MCP** : `.mcp.json` (context7, serena, playwright)
- **Permissions** : `.claude/settings.json`
- **Agents** : `.claude/agents/` (6 agents)
- **Commands** : `.claude/commands/` (slash commands)
- **Contexts** : `.claude/contexts/` (charger a la demande)

Voir `.claude/README.md` pour details complets.

---

## Documentation

```
docs/
├── architecture/     # Turborepo, composants
├── database/         # Schema, migrations, RLS
├── business-rules/   # Regles metier (93 dossiers)
└── guides/           # Developpement, integrations
```

**Catalogue composants** : `docs/architecture/COMPOSANTS-CATALOGUE.md`

---

## Langue

**Francais** pour communication et docs.
**Anglais** pour code (variables, fonctions).

---

*Version 5.0.0 - 2025-12-17*
*Best practices Anthropic - ~140 lignes*
