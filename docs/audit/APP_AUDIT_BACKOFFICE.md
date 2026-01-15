# APP_AUDIT_BACKOFFICE.md - Audit Application Back-Office

**Date** : 2025-12-15
**Scope** : apps/back-office/
**Mode** : READ-ONLY Audit

---

## 1. Ce qui est en place

### Métriques Globales

| Métrique            | Valeur |
| ------------------- | ------ |
| Fichiers TypeScript | 390    |
| Taille source       | 4.6 MB |
| Pages principales   | 51     |
| API routes          | 30     |
| Composants business | 110    |
| Hooks custom        | 15+    |

### Structure Routes Principales

#### Dashboard

- `/dashboard` - KPIs principal (CA, stock, commandes)
  - Hook: `useCompleteDashboardMetrics()` (@verone/dashboard)
  - 4 KPIs + activité récente + notifications

#### Produits/Catalogue (19 pages)

- `/produits` - Vue principale avec métriques
- `/produits/catalogue/[productId]` - Détail produit (1024 lignes)
- `/produits/catalogue/stocks` - Tableau stock (607 lignes)
- `/produits/catalogue/categories` - Gestion catégories
- `/produits/catalogue/collections` - Collections
- `/produits/sourcing` - Sourcing fournisseurs

#### Stocks (14 pages)

- `/stocks` - Dashboard principal (auto-refresh 30s)
- `/stocks/mouvements` - Liste mouvements
- `/stocks/entrees` - Entrées
- `/stocks/sorties` - Sorties
- `/stocks/expeditions` - Expéditions
- `/stocks/receptions` - Réceptions
- `/stocks/alertes` - Alertes critiques

#### Commandes (6 pages)

- `/commandes` - Vue principale
- `/commandes/clients` - Commandes ventes
- `/commandes/fournisseurs` - Commandes achats

#### Contacts/Organisations (12 pages)

- `/contacts-organisations` - Liste
- `/contacts-organisations/customers/[id]` - Clients
- `/contacts-organisations/suppliers/[id]` - Fournisseurs
- `/contacts-organisations/enseignes/[id]` - Enseignes

#### Canaux Vente

- `/canaux-vente/google-merchant` - GMC intégration
- `/canaux-vente/linkme` - LinkMe admin
- `/canaux-vente/site-internet` - E-commerce

### Auth & Sécurité

**Pattern** : Server Client + Context React

```typescript
// Singleton Supabase (src/components/providers/supabase-provider.tsx)
const supabase = useMemo(() => createBrowserClient(...), []);

// Auth Wrapper (src/components/layout/auth-wrapper.tsx)
- Vérifie session: supabase.auth.getSession()
- Écoute changements: supabase.auth.onAuthStateChange()
- Redirige si non-auth: router.push('/login')
- PUBLIC_PAGES: ['/', '/login']

// API Route Pattern
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
```

### Dépendances Packages Monorepo

```typescript
// Design System
import { ButtonUnified, KPICardUnified, Dialog } from '@verone/ui';

// Métier
import { ProductThumbnail } from '@verone/products';
import { useStockDashboard, StockMovementModal } from '@verone/stock';
import { useSalesOrders, usePurchaseOrders } from '@verone/orders';
import { useCompleteDashboardMetrics } from '@verone/dashboard';

// Utils
import { createClient, createServerClient } from '@verone/utils/supabase/...';
import type { Database } from '@verone/types';
```

---

## 2. Risques / Dettes

### TypeScript Safety

| Issue          | Count | Impact                 | Fichiers Exemples                                             |
| -------------- | ----- | ---------------------- | ------------------------------------------------------------- |
| `as any` casts | 110   | Type safety compromise | `/stocks/expeditions/page.tsx`, `/stocks/receptions/page.tsx` |
| `any` types    | 50+   | Missing types          | Filtres, metadata, responses                                  |

**Exemple problématique** :

```typescript
// apps/back-office/src/app/stocks/expeditions/page.tsx
const filters: any = {};

// apps/back-office/src/app/produits/catalogue/stocks/page.tsx
let aValue: any = a[filters.sortBy as keyof typeof a];
```

### Fichiers Complexes

| Fichier                                               | Lignes | Recommandation       |
| ----------------------------------------------------- | ------ | -------------------- |
| `/produits/catalogue/[productId]/page.tsx`            | 1024   | Refactor en sections |
| `/produits/catalogue/stocks/page.tsx`                 | 607    | Extraire composants  |
| `/api/exports/google-merchant-excel/route.ts`         | 441    | Tests unitaires      |
| `/api/google-merchant/sync-product/[id]/route.ts`     | 318    | Modulariser          |
| `/components/business/contact-form-modal-wrapper.tsx` | 1592   | Refactor urgent      |

### TODOs Identifiés (21)

```
LinkMe:
  - TODO: Modal ajout organisations
  - TODO: Implémenter toggle is_linkme_active
  - TODO: Calculer ordersCount quand commandes LinkMe

Google Merchant:
  - TODO: Créer table google_merchant_config
  - TODO: Implémenter API update prix custom
  - TODO: Implémenter API hide/remove product

Catalogue:
  - TODO: Implémenter actions en lot (variantes)
  - TODO: Implémenter changement catégorie en lot

Site Internet:
  - TODO: Intégrer Recharts/Chart.js pour graphiques
```

### Performance Concerns

| Issue                    | Impact         | Mitigation      |
| ------------------------ | -------------- | --------------- |
| Stock auto-refresh 30s   | Charge serveur | Monitor en prod |
| Dashboard RPC call       | Query complexe | Index optimisés |
| Product images waterfall | UX slow        | Combine queries |

---

## 3. Ce qui manque pour phase data + tests

### Checklist

- [ ] Types stricts pour filtres (remplacer `any`)
- [ ] Tests API routes Google Merchant
- [ ] Tests hooks useSupabaseQuery/Mutation
- [ ] Refactor pages > 600 lignes
- [ ] Documentation flows métier
- [ ] Error boundaries user-facing
- [ ] Logging structuré (@verone/utils/logger)

### Pages Demo à Nettoyer

```
/demo-stock-ui
/demo-universal-selector
/test-components/button-unified
/test-purchase-order
/test-client-enseigne-selector
```

---

## 4. Preuves

### Commandes Exécutées

```bash
# Structure
find apps/back-office/src/app -type d | sort
find apps/back-office/src/app/api -name "route.ts" | wc -l → 30

# Type safety
grep -r "as any" apps/back-office/src/app --include="*.tsx" | wc -l → 110

# Fichiers complexes
wc -l apps/back-office/src/app/produits/catalogue/[productId]/page.tsx → 1024

# TODOs
grep -r "TODO\|FIXME" apps/back-office/src --include="*.tsx" | wc -l → 21
```

### Fichiers Référencés

- `apps/back-office/src/app/` - 51 pages
- `apps/back-office/src/components/business/` - 110 composants
- `apps/back-office/src/hooks/` - Hooks custom
- `apps/back-office/src/types/supabase.ts` - Types générés

---

## 5. Décisions à prendre

### Decision 1: Refactoring Priorité

**Options** :

1. **Types first** - Éliminer tous les `any` (effort important)
2. **Pages first** - Refactor > 600 lignes (UX immédiat)
3. **Tests first** - Coverage avant refactor (safety net)

**Recommandation** : Option 3 puis 1 - Tests d'abord pour sécuriser le refactor.

### Decision 2: Pages Demo

**Options** :

1. **Supprimer** - Clean codebase
2. **Archiver** - Déplacer dans `/sandbox`
3. **Garder** - Utile pour dev

**Recommandation** : Option 2 - Archiver pour référence future.

---

**Dernière mise à jour** : 2025-12-15 13:25 UTC+1
