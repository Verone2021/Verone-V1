# 🏗️ MONOREPO CONTEXT - Vérone Back Office

**Chargement** : Architecture Turborepo Phase 4 COMPLÉTÉE (2025-11-19)

---

## 🎯 ARCHITECTURE ACTUELLE

### 3 Applications

```
apps/
├── back-office/      # CRM/ERP Complet (Port 3000)
├── site-internet/    # E-commerce Public (Port 3001)
└── linkme/           # Commissions Apporteurs (Port 3002)
```

### 28 Packages @verone/\*

```
packages/@verone/
├── admin/            # Administration
├── categories/       # Catégories produits
├── channels/         # Canaux de vente
├── collections/      # Collections
├── common/           # Code commun
├── consultations/    # Consultations
├── customers/        # Clients
├── dashboard/        # Tableaux de bord
├── eslint-config/    # Config ESLint
├── finance/          # Finance
├── hooks/            # Hooks React partagés
├── integrations/     # Intégrations externes
├── kpi/              # KPIs
├── logistics/        # Logistique
├── notifications/    # Notifications
├── orders/           # Commandes
├── organisations/    # Organisations
├── prettier-config/  # Config Prettier
├── products/         # Produits
├── stock/            # Stock
├── suppliers/        # Fournisseurs
├── testing/          # Tests
├── types/            # Types TypeScript
├── ui/               # Design System (54 composants)
├── ui-business/      # Composants métier
└── utils/            # Utilitaires
```

---

## 🚀 COMMANDES TURBO

```bash
# Dev simultané (tous apps)
npm run dev

# Dev spécifique
turbo dev --filter=@verone/back-office
turbo dev --filter=@verone/linkme

# Build tous packages
npm run build

# Type-check
npm run type-check

# Lint
npm run lint
```

---

## 📦 IMPORTS PACKAGES

```typescript
// Composants UI
import { Button, Card, Badge } from '@verone/ui';

// Composants métier
import { ProductThumbnail } from '@verone/products';
import { StockAlertCard } from '@verone/stock';

// Types
import type { Database } from '@verone/types';

// Utilitaires
import { cn, formatPrice } from '@verone/utils';
```

---

## 📚 RÉFÉRENCES

- **Audit migration** : `docs/architecture/AUDIT-MIGRATION-TURBOREPO.md`
- **Checklist** : `docs/architecture/TURBOREPO-FINAL-CHECKLIST.md`
- **Catalogue composants** : `docs/architecture/COMPOSANTS-CATALOGUE.md`

---

**Statut** : ✅ Phase 4 COMPLÉTÉE (2025-11-19)
**Dernière mise à jour** : 2025-12-17
**Mainteneur** : Romeo Dos Santos
