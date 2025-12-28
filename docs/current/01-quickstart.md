---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - package.json
  - turbo.json
  - pnpm-workspace.yaml
---

# Quickstart Verone

Guide de demarrage rapide pour nouveaux developpeurs.

## Prerequis

- Node.js 20+
- pnpm 10+
- Git
- Acces Supabase (demander credentials)

## Installation

```bash
# Cloner le repo
git clone git@github.com:Verone2021/Verone-V1.git
cd Verone-V1

# Installer dependencies
pnpm install

# Configurer environnement
cp apps/back-office/.env.example apps/back-office/.env.local
# Remplir les variables (demander au team lead)
```

## Lancer en dev

```bash
# Toutes les apps (back-office:3000, site-internet:3001, linkme:3002)
npm run dev

# Ou une seule app
cd apps/back-office && npm run dev
```

## Commandes essentielles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Dev server (turbo) |
| `npm run build` | Build production |
| `npm run type-check` | Verification TypeScript |
| `npm run lint:fix` | Auto-fix ESLint |

## Structure projet

```
apps/
  back-office/     # CRM/ERP (port 3000)
  site-internet/   # E-commerce (port 3001)
  linkme/          # Commissions (port 3002)

packages/@verone/
  ui/              # Composants partages
  types/           # Types TypeScript
  products/        # Logic produits
  orders/          # Logic commandes
  ...
```

## Imports

```typescript
// Depuis une app, importer un package
import { Button } from '@verone/ui';
import { useProducts } from '@verone/products';
import type { Database } from '@verone/types';

// Local a l'app
import { Sidebar } from '@/components/Sidebar';
```

## Workflow quotidien

1. `git pull origin main`
2. `pnpm install` (si package.json change)
3. `npm run dev`
4. Coder sur branche `feature/nom`
5. `npm run type-check && npm run build`
6. PR vers main

## Documentation

- [Architecture](./02-architecture.md) - Structure complete
- [Database](./03-database.md) - Schema Supabase
- [Auth](./04-auth.md) - Roles, permissions
- [Deployment](./07-deployment.md) - CI/CD

---

*Derniere verification: 2025-12-17*
