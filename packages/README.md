# 📦 Packages Turborepo - Phase 4

**Architecture Monorepo** : 25 packages @verone/\* partagés entre 3 applications.

✅ **Phase 4 Active** depuis 2025-11-08 : Migration monorepo terminée, production stable.

---

## 🏗️ Architecture Turborepo

### 3 Applications

```
apps/
├── back-office/      # CRM/ERP complet (port 3000)
├── site-internet/    # E-commerce public (port 3001)
└── linkme/           # Commissions vendeurs (port 3002)
```

### 25 Packages Partagés

```
packages/@verone/
├── UI & Design (3 packages)
│   ├── ui/              # 54 composants Design System
│   ├── ui-business/     # Composants business réutilisables
│   └── eslint-config/   # Configuration ESLint partagée
│
├── Modules Business (12 packages)
│   ├── products/        # 32 composants produits
│   ├── orders/          # Composants commandes
│   ├── stock/           # Composants stock
│   ├── customers/       # Composants clients
│   ├── suppliers/       # Composants fournisseurs
│   ├── organisations/   # Composants organisations
│   ├── categories/      # Composants catégories
│   ├── collections/     # Composants collections
│   ├── channels/        # Composants canaux vente
│   ├── finance/         # Composants finance
│   ├── consultations/   # Composants consultations
│   └── logistics/       # Composants logistique
│
├── Dashboard & Admin (3 packages)
│   ├── dashboard/       # Composants dashboard & KPI
│   ├── notifications/   # Composants notifications
│   └── admin/           # Composants administration
│
├── Utils & Config (5 packages)
│   ├── types/           # Types TypeScript partagés
│   ├── utils/           # Utilitaires communs
│   ├── common/          # Hooks et composants communs
│   ├── kpi/             # Configuration KPI YAML
│   └── prettier-config/ # Configuration Prettier partagée
│
└── Testing & Integrations (2 packages)
    ├── testing/         # Utilities tests
    └── integrations/    # Intégrations externes (Abby, Google Merchant, Qonto)
```

**Total** : 25 packages @verone/\*

---

## 📚 Packages Détaillés

### 🎨 UI & Design

#### @verone/ui

- **54 composants** Design System shadcn/ui + Radix
- **Tokens** : Colors, spacing, typography, shadows
- **Thèmes** : Light/Dark mode support
- **Usage** : `import { Button, Card, Dialog } from '@verone/ui'`

#### @verone/ui-business

- Composants business réutilisables cross-modules
- Ex: DataTable, EntityCard, StatusBadge
- **Usage** : `import { DataTable } from '@verone/ui-business'`

#### @verone/eslint-config

- Configuration ESLint stricte TypeScript
- Rules: no-explicit-any, naming-convention, etc.
- **Usage** : `{ "extends": "@verone/eslint-config" }`

---

### 📦 Modules Business

#### @verone/products

- **32 composants** : ProductCard, ProductThumbnail, ProductModal
- Hooks : useProducts, useVariants, usePackages
- **Usage** : `import { ProductCard, useProducts } from '@verone/products'`

#### @verone/orders

- Composants : OrderCard, OrderForm, QuickPurchaseOrderModal
- Hooks : useSalesOrders, usePurchaseOrders, useShipments
- **Usage** : `import { QuickPurchaseOrderModal } from '@verone/orders'`

#### @verone/stock

- Composants : StockAlertCard, MovementHistory
- Hooks : useStockMovements, useStockAlerts
- **Usage** : `import { StockAlertCard } from '@verone/stock'`

#### @verone/customers

- Composants : CustomerCard, CustomerSelector
- Hooks : useCustomers, useContacts
- **Usage** : `import { useCustomers } from '@verone/customers'`

#### @verone/suppliers

- Composants : SupplierCard, SupplierSelector
- Hooks : useSuppliers
- **Usage** : `import { SupplierSelector } from '@verone/suppliers'`

#### @verone/organisations

- Composants : OrganisationCard, OrganisationLogo
- Hooks : useOrganisations
- **Usage** : `import { useOrganisations } from '@verone/organisations'`

#### @verone/categories

- Composants : CategorySelector, CategorizeModal
- Hooks : useCategories, useFamilies
- **Usage** : `import { CategorySelector } from '@verone/categories'`

#### @verone/collections

- Composants : CollectionCard, CollectionSelector
- Hooks : useCollections
- **Usage** : `import { useCollections } from '@verone/collections'`

#### @verone/channels

- Composants : ChannelBadge, GoogleMerchantSync
- Hooks : useGoogleMerchant
- **Usage** : `import { useGoogleMerchant } from '@verone/channels'`

#### @verone/finance

- Composants : InvoiceCard, PaymentForm
- Hooks : useInvoices, useTreasury
- **Usage** : `import { useInvoices } from '@verone/finance'`

#### @verone/consultations

- Composants : ConsultationCard, ConsultationForm
- Hooks : useConsultations
- **Usage** : `import { useConsultations } from '@verone/consultations'`

#### @verone/logistics

- Composants : ShipmentCard, DeliveryTracking
- Hooks : useShipments, useReceptions
- **Usage** : `import { useShipments } from '@verone/logistics'`

---

### 📊 Dashboard & Admin

#### @verone/dashboard

- Composants : KpiCardUnified, DashboardWidget
- Hooks : useCompleteDashboardMetrics, useMetrics
- **Usage** : `import { KpiCardUnified, useCompleteDashboardMetrics } from '@verone/dashboard'`

#### @verone/notifications

- Composants : NotificationsDropdown, NotificationItem
- Hooks : useNotifications
- **Usage** : `import { NotificationsDropdown } from '@verone/notifications'`

#### @verone/admin

- Composants : UserManagement, ActivityLog
- Hooks : useUsers, useActivity
- **Usage** : `import { UserManagement } from '@verone/admin'`

---

### 🔧 Utils & Config

#### @verone/types

- Types Database (Supabase generated)
- Types Business (Product, Order, Stock, etc.)
- **Usage** : `import type { Database, Tables } from '@verone/types'`

#### @verone/utils

- Utilitaires : cn, formatPrice, generateSKU
- Helpers : Supabase client, validators
- **Usage** : `import { cn, formatPrice } from '@verone/utils'`

#### @verone/common

- Hooks communs : useToast, useMobile, useDebounce
- Composants UI communs cross-modules
- **Usage** : `import { useToast } from '@verone/common'`

#### @verone/kpi

- Configuration KPI YAML (6 catégories)
- Types KPI, registry, formules calcul
- **Usage** : `import { kpiRegistry } from '@verone/kpi'`

#### @verone/prettier-config

- Configuration Prettier partagée
- **Usage** : `"@verone/prettier-config"`

---

### 🧪 Testing & Integrations

#### @verone/testing

- Utilities tests Vitest + Playwright
- Mocks, fixtures, test helpers
- **Usage** : `import { mockProduct } from '@verone/testing'`

#### @verone/integrations

- **Abby** : Client synchronisation stock
- **Google Merchant** : Feeds XML, sync produits
- **Qonto** : Rapprochement bancaire
- **Usage** : `import { GoogleMerchantClient } from '@verone/integrations/google-merchant'`

---

## 🔧 Configuration Turborepo

### turbo.json

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

### package.json (root)

```json
{
  "workspaces": ["apps/*", "packages/@verone/*"],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

---

## ⚡ Scripts Disponibles

### Build

```bash
# Build tous les packages + apps
turbo build

# Build package spécifique
turbo build --filter=@verone/products
```

### Dev

```bash
# Dev tous les apps en parallèle
turbo dev

# Dev app spécifique
turbo dev --filter=back-office
```

### Type Check

```bash
# Type check tous les packages + apps
turbo type-check

# Type check package spécifique
turbo type-check --filter=@verone/ui
```

### Lint

```bash
# Lint tous les packages + apps
turbo lint

# Lint avec auto-fix
turbo lint -- --fix
```

---

## 📊 Métriques Phase 4

| Métrique                | Valeur                                 |
| ----------------------- | -------------------------------------- |
| **Packages @verone/**   | 25                                     |
| **Applications**        | 3 (back-office, site-internet, linkme) |
| **Composants UI**       | 54 (Design System)                     |
| **Composants Products** | 32                                     |
| **Composants Total**    | 86+                                    |
| **Hooks Custom**        | 87+                                    |
| **Types TypeScript**    | Database + Business (strict mode)      |
| **Configuration**       | ESLint + Prettier partagés             |
| **Erreurs TypeScript**  | 0                                      |

---

## 📖 Documentation

### Architecture

- [`CLAUDE.md`](../CLAUDE.md) § Architecture Turborepo Phase 4
- [`docs/architecture/MONOREPO-STRUCTURE.md`](../docs/architecture/MONOREPO-STRUCTURE.md) (si créé)

### Archives Migration

- [`docs/archives/migration-turborepo/`](../docs/archives/migration-turborepo/) - Documentation historique migration Phase 4

### Composants Catalogue

- [`docs/architecture/COMPOSANTS-CATALOGUE.md`](../docs/architecture/COMPOSANTS-CATALOGUE.md) - Catalogue exhaustif 86 composants

---

## 🚀 Ajout Nouveau Package

### Template Création

```bash
# 1. Créer structure
mkdir -p packages/@verone/nouveau-package/src
cd packages/@verone/nouveau-package

# 2. Créer package.json
cat > package.json <<EOF
{
  "name": "@verone/nouveau-package",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@verone/types": "workspace:*",
    "@verone/utils": "workspace:*"
  }
}
EOF

# 3. Créer tsconfig.json
cat > tsconfig.json <<EOF
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
EOF

# 4. Créer index.ts
echo "export { default as Component } from './Component';" > src/index.ts

# 5. Installer dépendances
npm install
```

### Checklist Nouveau Package

- [ ] Structure créée (`packages/@verone/nom/`)
- [ ] `package.json` configuré avec exports
- [ ] `tsconfig.json` extends root
- [ ] `src/index.ts` avec exports
- [ ] Documentation README.md
- [ ] Tests si applicable
- [ ] Build valide : `turbo build --filter=@verone/nom`
- [ ] Type-check valide : `turbo type-check --filter=@verone/nom`
- [ ] Mettre à jour ce README.md (liste packages)
- [ ] Mettre à jour `COMPOSANTS-CATALOGUE.md` si composants UI

---

## ✅ Validation

### Commandes Vérification

```bash
# Vérifier tous les packages buildent
turbo build
# Résultat attendu : 25 packages + 3 apps = SUCCESS

# Vérifier type-check
turbo type-check
# Résultat attendu : 0 erreurs TypeScript

# Vérifier symlinks npm workspaces
ls -la node_modules/@verone/
# Résultat attendu : 25 symlinks vers packages/@verone/*

# Vérifier structure
tree -L 2 packages/@verone/
# Résultat attendu : 25 dossiers
```

---

## 🎯 Statut Actuel

✅ **25/25 packages** créés et fonctionnels
✅ **3/3 apps** déployées en production
✅ **Turborepo** configuré et actif
✅ **npm workspaces** symlinks opérationnels
✅ **0 erreurs** TypeScript
✅ **Build** successful (<20s)

**Dernière mise à jour** : 2025-11-11 (Phase 4 cleanup finalisée)
**Mainteneur** : Romeo Dos Santos
