# Stack Technique Verone

**Derniere mise a jour:** 2026-01-09

---

## Technologies Actives

### Core

| Categorie       | Technologie          | Version | Notes               |
| --------------- | -------------------- | ------- | ------------------- |
| Runtime         | Node.js              | 20+     | LTS                 |
| Framework       | Next.js (App Router) | 15.5.7  | RSC, Server Actions |
| UI              | React                | 18.3.1  | -                   |
| Langage         | TypeScript (strict)  | 5.3.3   | -                   |
| Monorepo        | Turborepo            | 2.6.0   | -                   |
| Package Manager | pnpm                 | 10.13.1 | Workspaces          |

### Database & Auth

| Categorie | Technologie           | Notes        |
| --------- | --------------------- | ------------ |
| Database  | Supabase (PostgreSQL) | Cloud hosted |
| Auth      | Supabase Auth         | JWT + RLS    |
| Storage   | Supabase Storage      | Images, PDFs |

### UI/UX

| Categorie  | Technologie           | Notes         |
| ---------- | --------------------- | ------------- |
| Components | shadcn/ui + Radix UI  | 54 composants |
| Styling    | Tailwind CSS 3.4.1    | -             |
| Forms      | React Hook Form + Zod | Validation    |
| Icons      | Lucide React          | -             |

### Hosting & CI/CD

| Categorie | Technologie    | Notes         |
| --------- | -------------- | ------------- |
| Hosting   | Vercel         | Auto-deploy   |
| CI/CD     | GitHub Actions | PR validation |
| Repo      | GitHub         | Private       |

---

## Integrations Actives

| Service          | Usage                                    | Status |
| ---------------- | ---------------------------------------- | ------ |
| **Qonto**        | Facturation, PDF, rapprochement bancaire | ACTIF  |
| **Sentry**       | Monitoring erreurs                       | ACTIF  |
| **Google OAuth** | Authentification                         | ACTIF  |
| **Supabase**     | Database, Auth, Storage                  | ACTIF  |
| **Vercel**       | Hosting, Deploy                          | ACTIF  |

---

## Integrations Planifiees

| Service         | Usage           | Status   |
| --------------- | --------------- | -------- |
| Google Merchant | E-commerce feed | PLANIFIE |
| Stripe          | Paiements       | PLANIFIE |
| Packlink        | Expeditions     | PLANIFIE |

---

## Outils Remplaces/Obsoletes

| Ancien             | Remplace par | Date    |
| ------------------ | ------------ | ------- |
| Abby (facturation) | Qonto        | 2025-12 |
| yarn               | pnpm         | 2025-11 |
| npm install        | pnpm install | 2025-11 |
| Lerna              | Turborepo    | 2025-11 |

---

## Commandes Essentielles

```bash
# Dev
pnpm install          # Installer dependencies
npm run dev           # Dev server (all apps)
npm run build         # Build production
npm run type-check    # TypeScript validation

# Database
supabase db push                    # Appliquer migrations
supabase gen types typescript       # Generer types

# Tests
npm run e2e:smoke     # Tests Playwright
```

---

## Ports Locaux

| App           | Port | URL                   |
| ------------- | ---- | --------------------- |
| back-office   | 3000 | http://localhost:3000 |
| site-internet | 3001 | http://localhost:3001 |
| linkme        | 3002 | http://localhost:3002 |

---

_Voir [architecture.md](./architecture.md) pour la structure complete_
