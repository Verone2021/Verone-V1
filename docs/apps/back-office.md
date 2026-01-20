# Back Office - CRM/ERP Verone

**Derniere mise a jour:** 2026-01-19

Application principale de gestion back-office.

---

## Informations Generales

| Element      | Valeur                                   |
| ------------ | ---------------------------------------- |
| Port         | 3000                                     |
| URL Locale   | http://localhost:3000                    |
| URL Prod     | https://verone-back-office.vercel.app    |
| Framework    | Next.js 15 (App Router, RSC)             |
| Auth         | Supabase (Google OAuth + Email/Password)|

---

## Structure

```
apps/back-office/src/
├── app/
│   ├── (auth)/              # Pages publiques (login)
│   └── (protected)/         # Pages authentifiees
│       ├── accueil/         # Dashboard
│       ├── admin/           # Administration
│       ├── canaux-vente/    # Canaux vente (LinkMe, Google Merchant)
│       ├── catalogue/       # Catalogue produits
│       ├── clients/         # Clients & Contacts
│       ├── commandes/       # Commandes vente
│       ├── consultations/   # Consultations clients
│       ├── fournisseurs/    # Fournisseurs & Achats
│       ├── stocks/          # Gestion stocks
│       ├── tresorerie/      # Finance & Qonto
│       ├── ventes/          # Ventes & Statistiques
│       └── parametres/      # Parametres
├── components/              # Composants locaux app
├── contexts/                # Contexts React (Auth, Theme)
└── lib/                     # Utilitaires app

packages/@verone/            # Packages partages (voir packages/README.md)
```

---

## Modules Principaux

### 1. Dashboard (/accueil)

**KPIs affichees:**
- Stocks critiques
- Commandes en cours
- CA du mois
- Clients actifs

**Code:**
- `apps/back-office/src/app/(protected)/accueil/page.tsx`
- Package: `@verone/dashboard`

---

### 2. Catalogue (/catalogue)

**Fonctionnalites:**
- CRUD produits
- Gestion variantes
- Packages/Conditionnements
- Categories & Collections
- Import/Export

**Code:**
- `apps/back-office/src/app/(protected)/catalogue/`
- Package: `@verone/products`

---

### 3. Commandes (/commandes)

**Fonctionnalites:**
- Commandes vente (clients)
- Commandes achat (fournisseurs)
- Expeditions
- Receptions
- Historique

**Code:**
- `apps/back-office/src/app/(protected)/commandes/`
- Packages: `@verone/orders`, `@verone/logistics`

---

### 4. Stocks (/stocks)

**Fonctionnalites:**
- Vue stock temps reel
- Mouvements stock
- Alertes seuils
- Ajustements manuels

**Code:**
- `apps/back-office/src/app/(protected)/stocks/`
- Package: `@verone/stock`

---

### 5. Tresorerie (/tresorerie)

**Fonctionnalites:**
- Integration Qonto (solde, transactions)
- Factures (creation, PDF)
- Devis
- Avoirs
- Rapprochement bancaire

**Code:**
- `apps/back-office/src/app/(protected)/tresorerie/`
- Package: `@verone/finance`

---

### 6. Canaux Vente (/canaux-vente)

**Sous-modules:**
- **LinkMe** - Plateforme affiliation B2B
- **Google Merchant** - Feed produits e-commerce
- **Futurs canaux** - Marketplaces (prevu)

**Code:**
- `apps/back-office/src/app/(protected)/canaux-vente/`
- Packages: `@verone/channels`, `@verone/integrations`

---

### 7. Admin (/admin)

**Fonctionnalites:**
- Gestion users
- Roles & Permissions
- Logs activite
- Parametres globaux

**Code:**
- `apps/back-office/src/app/(protected)/admin/`
- Package: `@verone/admin`

---

## Authentification

### Flux Login

```
/login
    ↓
Supabase Auth (Google OAuth ou Email/Password)
    ↓
Cookie: sb-back-office-auth
    ↓
Middleware check session
    ↓
Redirection /accueil
```

### Roles

Voir `docs/security-auth.md` pour matrice complete.

Roles principaux:
- `owner` - Acces total
- `admin` - Gestion complete
- `catalog_manager` - Catalogue uniquement
- `viewer` - Lecture seule

---

## API Routes

### Structure

```
apps/back-office/src/app/api/
├── qonto/           # Integration Qonto (39 routes)
├── supabase/        # Helpers Supabase
├── admin/           # Admin operations
└── health/          # Health checks
```

### Exemples

- `POST /api/qonto/invoices` - Creer facture
- `GET /api/qonto/balance` - Solde Qonto
- `GET /api/admin/users` - Liste users

---

## Composants Partages

L'app utilise massivement les packages `@verone/*`:

**Exemples:**
```typescript
import { ProductCard } from '@verone/products'
import { OrderForm } from '@verone/orders'
import { KpiCardUnified } from '@verone/dashboard'
import { Button, Card } from '@verone/ui'
```

Voir `packages/README.md` pour catalogue complet (25 packages).

---

## Scripts

```bash
# Dev
pnpm dev:back-office          # Port 3000

# Build
pnpm build:back-office        # Production build

# Type-check
pnpm type-check:back-office   # Validation TS

# Tests E2E
pnpm test:e2e:back-office     # Playwright tests
```

---

## Deploiement

### Vercel

**URL:** https://verone-back-office.vercel.app

**Branches:**
- `main` → Production (auto-deploy)
- `feat/*` → Preview deploys

**Env Vars (Vercel):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QONTO_API_KEY`
- `QONTO_ORGANIZATION_ID`
- `SENTRY_DSN`

Voir `docs/runbooks/deploy.md` pour procedure complete.

---

## Reference

- Architecture: `docs/architecture.md`
- Database: `docs/database.md`
- Auth: `docs/security-auth.md`
- Integrations: `docs/integrations/`
- Packages: `packages/README.md`
