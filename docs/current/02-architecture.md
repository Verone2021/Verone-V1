---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - turbo.json
  - pnpm-workspace.yaml
  - package.json
  - apps/
  - packages/@verone/
merged_from:
  - docs/architecture/TURBOREPO-FINAL-CHECKLIST.md
  - docs/architecture/README.md
  - docs/architecture/tech-stack.md
  - docs/architecture/decisions/0001-turborepo-monorepo.md
  - docs/DEPLOYMENT.md
  - docs/guides/01-onboarding/guide-novice-personnalise.md
---

# Architecture Verone

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

## Vue d'ensemble

| Composant           | Technologie           | Version |
| ------------------- | --------------------- | ------- |
| **Runtime**         | Node.js               | 20+     |
| **Framework**       | Next.js (App Router)  | 15.5.7  |
| **UI**              | React                 | 18.3.1  |
| **Langage**         | TypeScript (strict)   | 5.3.3   |
| **Monorepo**        | Turborepo             | 2.6.0   |
| **Package Manager** | pnpm                  | 10.13.1 |
| **Database**        | Supabase (PostgreSQL) | Cloud   |
| **Auth**            | Supabase Auth + RLS   | -       |
| **UI Components**   | shadcn/ui + Radix UI  | -       |
| **Styling**         | Tailwind CSS          | 3.4.1   |
| **Hosting**         | Vercel                | -       |

## Structure Turborepo

```
verone-back-office-V1/
├── apps/                          # 3 applications Next.js
│   ├── back-office/               # CRM/ERP (port 3000)
│   ├── site-internet/             # E-commerce public (port 3001)
│   └── linkme/                    # Commissions affilies (port 3002)
│
├── packages/@verone/              # 26 packages partages
│   ├── ui/                        # Design System (54 composants)
│   ├── types/                     # Types TypeScript + Supabase
│   ├── utils/                     # Utilitaires communs
│   ├── products/                  # Composants produits
│   ├── orders/                    # Composants commandes
│   ├── stock/                     # Composants stock
│   ├── customers/                 # Composants clients
│   ├── organisations/             # Composants organisations
│   ├── integrations/              # Google Merchant, Qonto, Abby
│   └── ...                        # 17 autres packages
│
├── supabase/                      # Database
│   └── migrations/                # Migrations SQL versionnees
│
├── tests/                         # Tests E2E Playwright
├── docs/                          # Documentation
│   ├── current/                   # Docs canoniques (source of truth)
│   ├── decisions/                 # ADRs
│   └── archives/                  # Historique
│
├── turbo.json                     # Config Turborepo
├── pnpm-workspace.yaml            # Config workspaces
├── package.json                   # Dependencies racine
└── CLAUDE.md                      # Instructions Claude Code
```

### Applications (apps/)

| App             | Port | Description            | URL Vercel |
| --------------- | ---- | ---------------------- | ---------- |
| `back-office`   | 3000 | CRM/ERP complet        | Production |
| `site-internet` | 3001 | E-commerce public      | Planifie   |
| `linkme`        | 3002 | Commissions apporteurs | Planifie   |

### Packages (@verone/\*)

**UI & Design System:**

- `@verone/ui` - 54 composants shadcn/ui
- `@verone/ui-business` - Composants metier

**Business Logic:**

- `@verone/products`, `@verone/orders`, `@verone/stock`
- `@verone/customers`, `@verone/organisations`, `@verone/suppliers`
- `@verone/finance`, `@verone/logistics`, `@verone/notifications`

**Infrastructure:**

- `@verone/types` - Types TypeScript + Supabase generated
- `@verone/utils` - Helpers, Supabase client
- `@verone/integrations` - APIs externes
- `@verone/eslint-config`, `@verone/prettier-config`

## Ou mettre quoi

| Type de fichier            | Emplacement                            | Exemple                                               |
| -------------------------- | -------------------------------------- | ----------------------------------------------------- |
| **Page/Route**             | `apps/[app]/src/app/`                  | `apps/back-office/src/app/produits/page.tsx`          |
| **Composant app-specific** | `apps/[app]/src/components/`           | `apps/back-office/src/components/Sidebar.tsx`         |
| **Composant partage**      | `packages/@verone/ui/src/`             | `packages/@verone/ui/src/components/ui/button.tsx`    |
| **Hook partage**           | `packages/@verone/[domain]/src/hooks/` | `packages/@verone/products/src/hooks/use-products.ts` |
| **Type TypeScript**        | `packages/@verone/types/src/`          | `packages/@verone/types/src/supabase.ts`              |
| **Migration SQL**          | `supabase/migrations/`                 | `supabase/migrations/20251217_001_description.sql`    |
| **Test E2E**               | `tests/`                               | `tests/e2e/catalogue.spec.ts`                         |
| **Doc canonique**          | `docs/current/`                        | `docs/current/02-architecture.md`                     |
| **ADR**                    | `docs/decisions/`                      | `docs/decisions/0001-turborepo.md`                    |
| **Script Claude**          | `.claude/scripts/`                     | `.claude/scripts/validate-command.js`                 |
| **Config Claude**          | `.claude/`                             | `.claude/settings.json`                               |

## Commandes

```bash
# Developpement
npm run dev              # Toutes les apps (turbo dev)
npm run build            # Build production (turbo build)
npm run type-check       # Verification TypeScript
npm run lint:fix         # Auto-fix ESLint

# Tests
npm run test:e2e         # Tests Playwright

# Database
supabase db push         # Appliquer migrations
supabase gen types typescript --local > packages/@verone/types/src/supabase.ts
```

## Imports

```typescript
// Depuis une app, importer un package
import { Button, Card } from '@verone/ui';
import { useProducts } from '@verone/products';
import type { Database } from '@verone/types';

// Path aliases configures dans tsconfig.json de chaque app
import { Sidebar } from '@/components/Sidebar'; // local a l'app
```

## Monorepo → Turborepo : ce qui est faux aujourd'hui

Ces patterns sont **obsoletes** et ne doivent plus etre utilises :

| Ancien pattern                  | Realite actuelle                                                  |
| ------------------------------- | ----------------------------------------------------------------- |
| `yarn install`                  | `pnpm install`                                                    |
| `npm install`                   | `pnpm install`                                                    |
| `lerna publish`                 | Non utilise (packages internes)                                   |
| `src/components/` (racine)      | `apps/back-office/src/components/` ou `packages/@verone/ui/src/`  |
| `src/hooks/` (racine)           | `apps/[app]/src/hooks/` ou `packages/@verone/[domain]/src/hooks/` |
| Import relatif `../../` profond | Import package `@verone/*`                                        |

## Liens

- [Database](./03-database.md) - Schema Supabase, triggers, RLS
- [Auth](./04-auth.md) - Authentification, roles, permissions
- [Deployment](./07-deployment.md) - Vercel, CI/CD
- [ADR Turborepo](../decisions/0001-turborepo.md) - Decision architecture

---

_Derniere verification : 2025-12-17_
