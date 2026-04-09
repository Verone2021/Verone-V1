# Reference Chemins Turborepo

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- apps/
- packages/@verone/
  Owner: Romeo Dos Santos
  Created: 2025-11-20
  Updated: 2026-01-10

---

## Chemins Corrects (Turborepo)

### Applications

**Back Office (CRM/ERP)** :

```typescript
apps/back-office/src/app/          // Pages Next.js (App Router)
apps/back-office/src/components/   // Composants specifiques back-office
apps/back-office/src/lib/          // Utilitaires back-office
```

**Site Internet (E-commerce)** :

```typescript
apps/site-internet/src/app/         // Pages e-commerce public
apps/site-internet/src/components/  // Composants site public
```

**LinkMe (Commissions Apporteurs)** :

```typescript
apps/linkme/src/app/                // Pages systeme commissions
apps/linkme/src/components/         // Composants LinkMe
```

### Packages Partages (@verone/\*)

**Design System** :

```typescript
packages/@verone/ui/src/components/         // Composants UI (Button, Card, etc.)
packages/@verone/ui/src/lib/design-system/  // Tokens, themes, utils
```

**Business Logic** :

```typescript
packages/@verone/products/src/      // Composants & hooks produits
packages/@verone/orders/src/        // Composants commandes
packages/@verone/stock/src/         // Composants stock & alertes
packages/@verone/customers/src/     // Composants clients
```

**Types & Utils** :

```typescript
packages/@verone/types/src/         // Types partages (Database, etc.)
packages/@verone/utils/src/lib/     // Utilitaires (cn, formatPrice, etc.)
```

---

## Imports Corrects

```typescript
// Design System
import { Button, Card, Dialog } from '@verone/ui';

// Composants Business
import { ProductCard, ProductThumbnail } from '@verone/products';
import { StockAlertCard } from '@verone/stock';
import { QuickPurchaseOrderModal } from '@verone/orders';

// Types
import type { Database } from '@verone/types';

// Utils
import { cn, formatPrice } from '@verone/utils';
```

---

## Chemins Obsoletes (N'EXISTENT PLUS)

```typescript
// PHASE 1-3 OBSOLETE
src/app/                            // → apps/back-office/src/app/
src/components/                     // → packages/@verone/ui/src/components/
src/lib/                            // → packages/@verone/utils/src/lib/
src/shared/modules/                 // → packages/@verone/* (eclate par domaine)
```

---

## Commandes Essentielles

```bash
# Build (depuis racine monorepo)
npm run build                       # Build toutes apps + packages
npm run build:back-office          # Build back-office seulement

# Type-check
npm run type-check                 # Verifier TypeScript strict

# Dev
npm run dev                         # Tous services (Turborepo --parallel)
```

---

## Anti-Hallucination

**Si erreur "fichier introuvable"** :

1. **NE PAS** chercher dans `src/` (n'existe plus)
2. **Chercher** dans `apps/*/src/` ou `packages/@verone/*/src/`
3. **Valider** avec `ls -la [chemin]`

---

## Regles Absolues

1. **JAMAIS** utiliser les anciens chemins `src/`
2. **TOUJOURS** importer via `@verone/*`
3. **JAMAIS** creer de chemins absolus fragiles

---

## References

- `CLAUDE.md` - Instructions projet
- `turbo.json` - Configuration Turborepo
- `pnpm-workspace.yaml` - Workspaces pnpm
