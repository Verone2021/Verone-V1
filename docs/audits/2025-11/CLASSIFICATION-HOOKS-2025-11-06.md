# CLASSIFICATION HOOKS - 87 HOOKS

**Date** : 2025-11-06
**Objectif** : Classifier les 87 hooks de `apps/back-office/src/hooks/` par module cible

---

## 📊 RÉSUMÉ PAR MODULE

| Module            | Hooks | Priorité | Complexité |
| ----------------- | ----- | -------- | ---------- |
| **Stock**         | 16    | P1       | Haute      |
| **Products**      | 13    | P1       | Haute      |
| **Orders**        | 11    | P1       | Haute      |
| **Dashboard**     | 8     | P1       | Moyenne    |
| **Finance**       | 8     | P2       | Moyenne    |
| **Customers**     | 3     | P2       | Basse      |
| **Organisations** | 4     | P2       | Basse      |
| **Categories**    | 4     | P2       | Basse      |
| **Collections**   | 3     | P2       | Basse      |
| **Consultations** | 2     | P2       | Basse      |
| **Channels**      | 3     | P2       | Basse      |
| **Notifications** | 2     | P2       | Basse      |
| **UI/Common**     | 9     | P3       | Basse      |
| **Admin**         | 2     | P3       | Basse      |
| **Testing**       | 3     | P3       | Basse      |

**Total** : 87 hooks

---

## 🎯 MODULE 1 : STOCK (16 hooks)

**Destination** : `src/shared/modules/stock/hooks/`

### Hooks

- `use-stock.ts` - Hook principal stock
- `use-stock-alerts.ts` - Gestion alertes stock
- `use-stock-alerts-count.ts` - Compteur alertes
- `use-stock-analytics.ts` - Analytics stock
- `use-stock-dashboard.ts` - Dashboard stock
- `use-stock-inventory.ts` - Inventaire
- `use-stock-movements.ts` - Mouvements stock
- `use-stock-optimized.ts` - Stock optimisé
- `use-stock-orders-metrics.ts` - Métriques commandes
- `use-stock-reservations.ts` - Réservations stock
- `use-stock-status.ts` - Status stock
- `use-stock-ui.ts` - UI stock
- `use-movements-history.ts` - Historique mouvements

**Total** : 13 hooks

---

## 🎯 MODULE 2 : PRODUCTS (13 hooks)

**Destination** : `src/shared/modules/products/hooks/`

### Hooks

- `use-products.ts` - Hook principal produits
- `use-product-colors.ts` - Couleurs produits
- `use-product-images.ts` - Images produits
- `use-product-packages.ts` - Packages produits
- `use-product-primary-image.ts` - Image principale
- `use-product-status.ts` - Status produits
- `use-product-variants.ts` - Variantes produits
- `use-variant-groups.ts` - Groupes variantes
- `use-variant-products.ts` - Produits variantes
- `use-sourcing-products.ts` - Produits sourcing
- `use-archived-products.ts` - Produits archivés
- `use-completion-status.ts` - Status complétion
- `use-top-products.ts` - Top produits

**Total** : 13 hooks

---

## 🎯 MODULE 3 : ORDERS (11 hooks)

**Destination** : `src/shared/modules/orders/hooks/`

### Hooks

#### Purchase Orders (4)

- `use-purchase-orders.ts` - Commandes fournisseurs
- `use-purchase-receptions.ts` - Réceptions commandes
- `use-draft-purchase-order.ts` - Brouillons commandes

#### Sales Orders (3)

- `use-sales-orders.ts` - Commandes ventes
- `use-sales-shipments.ts` - Expéditions ventes
- `use-sales-dashboard.ts` - Dashboard ventes

#### Common (4)

- `use-order-items.ts` - Items commandes
- `use-orders-status.ts` - Status commandes
- `use-shipments.ts` - Expéditions
- `use-sample-order.ts` - Commandes échantillons
- `use-sample-eligibility-rule.ts` - Règles éligibilité échantillons
- `use-unified-sample-eligibility.ts` - Éligibilité échantillons unifiée

**Total** : 11 hooks

---

## 🎯 MODULE 4 : DASHBOARD (8 hooks)

**Destination** : `src/shared/modules/dashboard/hooks/` (nouveau module)

### Hooks

- `use-complete-dashboard-metrics.ts` - Métriques dashboard complètes
- `use-real-dashboard-metrics.ts` - Métriques réelles
- `use-dashboard-analytics.ts` - Analytics dashboard
- `use-dashboard-notifications.ts` - Notifications dashboard
- `use-recent-activity.ts` - Activité récente
- `use-sales-dashboard.ts` - Dashboard ventes (doublon avec orders ?)

**Total** : 6 hooks dashboard-specific

**Note** : `use-sales-dashboard.ts` pourrait aller dans orders/hooks

---

## 🎯 MODULE 5 : FINANCE (8 hooks)

**Destination** : `src/shared/modules/finance/hooks/`

### Hooks

#### Reports (3)

- `use-abc-analysis.ts` - Analyse ABC
- `use-aging-report.ts` - Rapport vieillissement
- `use-bank-reconciliation.ts` - Rapprochement bancaire

#### Payments & Documents (2)

- `use-financial-documents.ts` - Documents financiers
- `use-financial-payments.ts` - Paiements

#### Pricing (2)

- `use-pricing.ts` - Gestion prix
- `use-price-lists.ts` - Listes de prix

#### Treasury (1)

- `use-treasury-stats.ts` - Stats trésorerie

**Total** : 8 hooks

---

## 🎯 MODULE 6 : CUSTOMERS (3 hooks)

**Destination** : `src/shared/modules/customers/hooks/`

### Hooks

- `use-customers.ts` - Hook principal clients
- `use-contacts.ts` - Gestion contacts
- `use-customer-samples.ts` - Échantillons clients

**Total** : 3 hooks

---

## 🎯 MODULE 7 : ORGANISATIONS (4 hooks)

**Destination** : `src/shared/modules/organisations/hooks/`

### Hooks

- `use-organisations.ts` - Hook principal organisations
- `use-organisation-tab-counts.ts` - Compteurs onglets
- `use-suppliers.ts` - Fournisseurs
- `use-logo-upload.ts` - Upload logo

**Total** : 4 hooks

---

## 🎯 MODULE 8 : CATEGORIES (4 hooks)

**Destination** : `src/shared/modules/categories/hooks/`

### Hooks

- `use-categories.ts` - Catégories principales
- `use-subcategories.ts` - Sous-catégories
- `use-families.ts` - Familles produits
- `use-catalogue.ts` - Catalogue

**Total** : 4 hooks

---

## 🎯 MODULE 9 : COLLECTIONS (3 hooks)

**Destination** : `src/shared/modules/common/hooks/collections/`

### Hooks

- `use-collections.ts` - Collections principales
- `use-collection-images.ts` - Images collections
- `use-collection-products.ts` - Produits collections

**Total** : 3 hooks

---

## 🎯 MODULE 10 : CONSULTATIONS (2 hooks)

**Destination** : `src/shared/modules/consultations/hooks/`

### Hooks

- `use-consultations.ts` - Consultations principales
- `use-consultation-images.ts` - Images consultations

**Total** : 2 hooks

---

## 🎯 MODULE 11 : CHANNELS (3 hooks)

**Destination** : `src/shared/modules/channels/hooks/google-merchant/`

### Hooks

- `use-google-merchant-config.ts` - Config Google Merchant
- `use-google-merchant-products.ts` - Produits Google Merchant
- `use-google-merchant-sync.ts` - Sync Google Merchant

**Total** : 3 hooks

---

## 🎯 MODULE 12 : NOTIFICATIONS (2 hooks)

**Destination** : `src/shared/modules/notifications/hooks/`

### Hooks

- `use-notifications.ts` - Notifications principales
- `use-dashboard-notifications.ts` - Notifications dashboard (doublon ?)

**Total** : 2 hooks

**Note** : `use-dashboard-notifications.ts` pourrait aller dans dashboard/hooks

---

## 🎯 MODULE 13 : UI/COMMON (9 hooks)

**Destination** : `src/shared/modules/ui/hooks/`

### Hooks

#### UI State (4)

- `use-toast.ts` - Toasts notifications
- `use-mobile.tsx` - Détection mobile
- `use-inline-edit.ts` - Édition inline
- `use-section-locking.ts` - Verrouillage sections

#### Utils (5)

- `use-image-upload.ts` - Upload images
- `use-simple-image-upload.ts` - Upload simple
- `use-toggle-favorite.ts` - Toggle favoris
- `use-error-reporting.ts` - Rapport erreurs
- `use-smart-suggestions.ts` - Suggestions intelligentes

**Total** : 9 hooks

---

## 🎯 MODULE 14 : COMMON/UTILS (2 hooks)

**Destination** : `src/shared/modules/common/hooks/`

### Hooks

- `use-base-hook.ts` - Hook de base
- `use-supabase-query.ts` - Queries Supabase

**Total** : 2 hooks

---

## 🎯 MODULE 15 : ADMIN (2 hooks)

**Destination** : `src/shared/modules/admin/hooks/`

### Hooks

- `use-user-activity-tracker.ts` - Tracking activité utilisateur
- `use-automation-triggers.ts` - Déclencheurs automation

**Total** : 2 hooks

---

## 🎯 MODULE 16 : TESTING (3 hooks)

**Destination** : `src/shared/modules/testing/hooks/` ou à supprimer

### Hooks

- `use-critical-testing.ts` - Tests critiques
- `use-test-persistence.ts` - Persistance tests
- `use-mcp-resolution.ts` - Résolution MCP

**Total** : 3 hooks

**Action recommandée** : Supprimer si non utilisés en production

---

## 📋 ROADMAP BATCHES MIGRATION

### BATCH 1 : Stock Hooks (16 hooks) - 1.5h

**Hooks** :

- use-stock.ts
- use-stock-alerts.ts
- use-stock-alerts-count.ts
- use-stock-analytics.ts
- use-stock-dashboard.ts
- use-stock-inventory.ts
- use-stock-movements.ts
- use-stock-optimized.ts
- use-stock-orders-metrics.ts
- use-stock-reservations.ts
- use-stock-status.ts
- use-stock-ui.ts
- use-movements-history.ts

**Destination** : `src/shared/modules/stock/hooks/`

---

### BATCH 2 : Products Hooks (13 hooks) - 1h

**Hooks** :

- use-products.ts
- use-product-colors.ts
- use-product-images.ts
- use-product-packages.ts
- use-product-primary-image.ts
- use-product-status.ts
- use-product-variants.ts
- use-variant-groups.ts
- use-variant-products.ts
- use-sourcing-products.ts
- use-archived-products.ts
- use-completion-status.ts
- use-top-products.ts

**Destination** : `src/shared/modules/products/hooks/`

---

### BATCH 3 : Orders Hooks (11 hooks) - 1h

**Hooks** :

- use-purchase-orders.ts
- use-purchase-receptions.ts
- use-draft-purchase-order.ts
- use-sales-orders.ts
- use-sales-shipments.ts
- use-sales-dashboard.ts
- use-order-items.ts
- use-orders-status.ts
- use-shipments.ts
- use-sample-order.ts
- use-sample-eligibility-rule.ts
- use-unified-sample-eligibility.ts

**Destination** : `src/shared/modules/orders/hooks/`

---

### BATCH 4 : Dashboard + Finance Hooks (14 hooks) - 1h

**Dashboard (6)** :

- use-complete-dashboard-metrics.ts
- use-real-dashboard-metrics.ts
- use-dashboard-analytics.ts
- use-dashboard-notifications.ts
- use-recent-activity.ts

**Finance (8)** :

- use-abc-analysis.ts
- use-aging-report.ts
- use-bank-reconciliation.ts
- use-financial-documents.ts
- use-financial-payments.ts
- use-pricing.ts
- use-price-lists.ts
- use-treasury-stats.ts

**Destination** :

- `src/shared/modules/dashboard/hooks/`
- `src/shared/modules/finance/hooks/`

---

### BATCH 5 : Modules Secondaires (21 hooks) - 1.5h

**Customers (3)** : use-customers, use-contacts, use-customer-samples
**Organisations (4)** : use-organisations, use-organisation-tab-counts, use-suppliers, use-logo-upload
**Categories (4)** : use-categories, use-subcategories, use-families, use-catalogue
**Collections (3)** : use-collections, use-collection-images, use-collection-products
**Consultations (2)** : use-consultations, use-consultation-images
**Channels (3)** : use-google-merchant-\*
**Notifications (2)** : use-notifications, use-dashboard-notifications

**Destination** : Modules respectifs

---

### BATCH 6 : UI + Common + Admin + Testing (16 hooks) - 1h

**UI (9)** : use-toast, use-mobile, use-inline-edit, etc.
**Common (2)** : use-base-hook, use-supabase-query
**Admin (2)** : use-user-activity-tracker, use-automation-triggers
**Testing (3)** : use-critical-testing, use-test-persistence, use-mcp-resolution

**Destination** :

- `src/shared/modules/ui/hooks/`
- `src/shared/modules/common/hooks/`
- `src/shared/modules/admin/hooks/`
- Supprimer testing si non utilisés

---

## 📊 MÉTRIQUES

- **Total hooks** : 87
- **Total batches** : 6
- **Durée totale estimée** : 7-8 heures
- **Modules impactés** : 16 modules (14 existants + dashboard + admin nouveaux)

---

## 🔄 DÉPENDANCES

### Stock → Orders

- `use-stock-orders-metrics` dépend potentiellement de `use-orders-status`

### Products → Categories

- `use-products` peut dépendre de `use-categories`

### Orders → Products + Stock

- `use-order-items` dépend de `use-products` et `use-stock`

### Dashboard → All

- Hooks dashboard dépendent de tous les autres modules

---

**Next Step** : Commencer migration BATCH 1 (Stock Hooks - 16 hooks)
