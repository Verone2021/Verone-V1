# Verone

Monorepo CRM/ERP pour decoration et mobilier d'interieur haut de gamme.

---

## Architecture Overview

```mermaid
graph TB
    subgraph Apps["Applications Next.js 15"]
        BO["Back-Office<br/>:3000"]
        LM["LinkMe<br/>:3002"]
        SI["Site Internet<br/>:3001"]
    end

    subgraph Packages["26 Packages @verone"]
        CORE["Core: types, utils, ui, hooks"]
        BIZ["Business: products, orders, stock, customers"]
        INT["Integrations: Google, Qonto, Abby"]
    end

    subgraph Supabase["Supabase PostgreSQL"]
        DB[("74 Tables")]
        AUTH["Auth + RLS"]
    end

    BO --> CORE
    LM --> CORE
    SI --> CORE
    CORE --> BIZ
    BIZ --> DB
    BIZ --> AUTH
    INT --> DB
```

### Repo Map

```
verone-back-office/
├── apps/                       # 3 applications Next.js 15
│   ├── back-office/            # CRM/ERP (port 3000)
│   ├── linkme/                 # Affiliation (port 3002)
│   └── site-internet/          # E-commerce B2C (port 3001)
├── packages/@verone/           # 26 packages partages
│   ├── types/                  # Types TypeScript + Supabase
│   ├── ui/                     # 54 composants shadcn/ui
│   ├── utils/                  # Helpers (logger, excel, upload)
│   ├── products/               # Gestion produits
│   ├── orders/                 # Commandes
│   ├── stock/                  # Stock & alertes
│   └── ...                     # +20 autres packages
├── supabase/
│   └── migrations/             # 74 migrations SQL
├── docs/
│   ├── current/                # 12 docs canoniques
│   └── business-rules/         # 93 dossiers regles metier
├── tests/                      # E2E Playwright
└── .github/workflows/          # 8 pipelines CI/CD
```

---

## Applications

| App               | Port | Public                | Description                              | Routes Principales                                                       |
| ----------------- | ---- | --------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| **back-office**   | 3000 | Admin, Gestionnaires  | CRM/ERP central - pilotage de l'activite | `/dashboard`, `/produits/catalogue`, `/commandes`, `/stocks`, `/finance` |
| **linkme**        | 3002 | Affilies, Partenaires | Plateforme commissions & selections      | `/dashboard`, `/ma-selection`, `/commissions`, `/statistiques`           |
| **site-internet** | 3001 | Clients B2C           | E-commerce luxury mobilier               | `/catalogue`, `/produit/[id]`, `/panier`, `/checkout`                    |

### Details par Application

**Back-Office** (CRM/ERP)

- 28 modules metier : produits, commandes, stocks, finance, contacts
- 4 canaux de vente : LinkMe, Site Internet, Google Merchant, Prix clients
- Integrations : Google Merchant, Qonto, Revolut, Analytics

**LinkMe** (Affiliation)

- Dashboard affilie avec KPIs
- Gestion selections produits (drag & drop)
- Suivi commissions et demandes de paiement
- Analytics performance (Tremor charts)

**Site Internet** (E-commerce)

- Design luxury (Playfair Display + Inter)
- Catalogue produits avec variantes
- Panier et checkout
- Animations Framer Motion

---

## Data Layer (Supabase)

### Tables Principales

| Domaine       | Tables                                                          | Description               |
| ------------- | --------------------------------------------------------------- | ------------------------- |
| **Produits**  | `products`, `categories`, `collections`, `product_images`       | Catalogue et organisation |
| **Commandes** | `sales_orders`, `purchase_orders`, `sample_orders`              | Ventes et achats          |
| **Stock**     | `stock_movements`, `stock_alert_tracking`, `stock_reservations` | Gestion inventaire        |
| **Clients**   | `individual_customers`, `contacts`, `customer_groups`           | CRM                       |
| **Finance**   | `invoices`, `payments`, `bank_transactions`                     | Comptabilite              |
| **LinkMe**    | `linkme_affiliates`, `linkme_commissions`, `linkme_selections`  | Affiliation               |
| **Auth**      | `user_app_roles`, `user_profiles`, `user_sessions`              | Utilisateurs              |

### Authentification & RLS

**Table centrale** : `user_app_roles`

- Un utilisateur peut avoir un role par app (back-office, linkme, site-internet)
- Roles back-office : `admin`, `manager`, `user`
- Roles linkme : `enseigne_admin`, `organisation_admin`, `client`
- RLS policies actives sur toutes les tables sensibles

---

## Getting Started

### Prerequisites

```
node >= 20
pnpm >= 10.13.1
```

### Installation

```bash
# Clone
git clone <repo-url>
cd verone-back-office

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Editer .env.local avec vos credentials Supabase
```

### Development

```bash
# Toutes les apps
npm run dev

# App specifique
npm run dev --filter=back-office
npm run dev --filter=linkme
npm run dev --filter=site-internet
```

### Build & Validation

```bash
npm run build        # Build production
npm run type-check   # Validation TypeScript
npm run lint:fix     # Auto-fix ESLint
```

---

## Scripts & Commands

### Developpement

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Demarre toutes les apps en mode dev |
| `npm run build`      | Build production                    |
| `npm run type-check` | Validation TypeScript               |
| `npm run lint:fix`   | Correction automatique ESLint       |

### Tests

| Script                           | Description                |
| -------------------------------- | -------------------------- |
| `npm run test:e2e`               | Tests Playwright E2E       |
| `npm run test:e2e:critical`      | Tests critiques uniquement |
| `npm run test:e2e:headed`        | Tests avec UI visible      |
| `npm run playwright:show-report` | Afficher rapport tests     |

### Audits Qualite

| Script                     | Description                 |
| -------------------------- | --------------------------- |
| `npm run audit:all`        | Tous les audits             |
| `npm run audit:duplicates` | Code duplique (jscpd)       |
| `npm run audit:cycles`     | Cycles dependencies (madge) |
| `npm run audit:deadcode`   | Code mort (knip)            |

### Validations

| Script                   | Description            |
| ------------------------ | ---------------------- |
| `npm run validate:all`   | Toutes les validations |
| `npm run validate:types` | Alignement types DB    |
| `npm run validate:hooks` | Hooks dupliques        |
| `npm run check:console`  | Erreurs console        |

### Database

| Script                   | Description              |
| ------------------------ | ------------------------ |
| `npm run generate:types` | Regenerer types Supabase |

---

## Documentation

**Source de verite** : [`docs/current/`](./docs/current/) (9 fichiers)

Voir [`docs/README.md`](./docs/README.md) pour l'index complet.

---

## Security

- **Secrets** : Variables d'environnement Vercel (jamais en code)
- **`.env`** : Gitignored, ne jamais commit
- **RLS** : Row Level Security actif sur tables sensibles
- **RGPD** : Conformite documentee dans [`docs/legal/`](./docs/legal/)

---

## CI/CD

8 workflows GitHub Actions dans [`.github/workflows/`](./.github/workflows/)

| Workflow                 | Trigger   | Description                                  |
| ------------------------ | --------- | -------------------------------------------- |
| `deploy-production.yml`  | Push main | Deploy Vercel + tests E2E                    |
| `pr-validation.yml`      | PR main   | Validation TypeScript, lint, tests critiques |
| `typescript-quality.yml` | Push/PR   | Check TypeScript (limite 1000 errors)        |

### Pipeline Production

```
Push main → Quality Gates → E2E Tests → Security Scan → Deploy Staging → Deploy Production
```

---

## Contributing

### Workflow Git

```bash
# 1. Creer branche
git checkout -b feature/ma-feature

# 2. Developper
# ...

# 3. Valider
npm run build      # Doit passer
npm run type-check # Doit passer

# 4. Commit (avec autorisation)
git add .
git commit -m "feat: description"

# 5. Push & PR
git push -u origin feature/ma-feature
# Creer PR vers main
```

### Regles

- **Build obligatoire** avant commit
- **PR review** requise pour merge
- **Auto-deploy** sur merge vers main

---

## Tech Stack

| Categorie      | Technologies                                   |
| -------------- | ---------------------------------------------- |
| **Framework**  | Next.js 15.5.7, React 18.3.1, TypeScript 5.3.3 |
| **UI**         | shadcn/ui, Radix UI, Tailwind CSS 3.4.1        |
| **Database**   | Supabase (PostgreSQL), @supabase/ssr           |
| **Validation** | Zod 4.1.12, React Hook Form                    |
| **State**      | TanStack Query 5.20.1, SWR 2.3.6               |
| **Monorepo**   | Turborepo 2.6.0, pnpm 10.13.1                  |
| **Testing**    | Playwright 1.55.0                              |
| **Deploy**     | Vercel (auto-deploy main)                      |

---

**Proprietary** - Verone 2025. Tous droits reserves.

_Version 5.1.0 - 2026-01-09 - Docs cleanup Sprint 2_
