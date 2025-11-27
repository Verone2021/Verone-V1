# Exploration: Page Inventaire des Stocks et Système de Gestion des Stocks

**Date** : 2025-11-26  
**Auteur** : Claude Code  
**Statut** : Rapport d'exploration READ-ONLY  
**Mode** : PLAN (aucune modification)

---

## 🎯 Résumé Exécutif

La page d'inventaire des stocks (`/stocks/inventaire`) est **OPÉRATIONNELLE** avec une architecture **correcte** basée sur trois tables principales : `products`, `stock_movements`, et les colonnes calculées `stock_forecasted_in/out`.

**Bonne nouvelle **: Le système prévisionnel est partiellement implémenté via une migration (2025-11-25) qui crée des mouvements `stock_forecasted_in` quand une commande fournisseur est validée.

**Problème identifié** : **AUCUNE TABLE `stock_levels` N'EXISTE** - c'était une approche envisagée mais jamais implémentée. Les lignes "d'inventaire" sont construites dynamiquement en frontend à partir des données produit + mouvements.

---

## 📂 Architecture Réelle du Système de Stock

### 1. Tables Principales Impactées

| Table                    | Colonnes Stock                                                                         | Rôle                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **products**             | `stock_quantity` (legacy), `stock_real`, `stock_forecasted_in`, `stock_forecasted_out` | Agrégations par produit du stock actuel + commandes en cours         |
| **stock_movements**      | `quantity_change`, `affects_forecast`, `forecast_type`, `movement_type`                | Historique détaillé de chaque mouvement (entrée, sortie, ajustement) |
| **purchase_orders**      | `status` (draft→validated→...)                                                         | Déclencheur des mouvements prévisionnels IN                          |
| **purchase_order_items** | `quantity`, `quantity_received`                                                        | Lignes individuelles avec suivi réceptions partielles                |
| **sales_orders**         | `status` (draft→validated→...)                                                         | Déclencheur des mouvements prévisionnels OUT                         |
| **sales_order_items**    | `quantity`, `quantity_shipped`                                                         | Lignes individuelles avec suivi expéditions partielles               |

**⚠️ REMARQUE IMPORTANTE** : PAS de table `stock_levels` - tout est agrégé en frontend depuis `products` + JOIN sur `stock_movements`.

---

## 🔄 Workflow Actuel de Gestion des Stocks

### Workflow 1 : Commande Fournisseur (Purchase Order)

```
1. PO créée (statut: "draft")
   └─ Aucun changement stock

2. PO validée (draft → "validated")
   ├─ TRIGGER: trg_po_validation_forecasted_stock
   ├─ FONCTION: update_forecasted_stock_on_po_validation()
   └─ ACTION: products.stock_forecasted_in += SUM(purchase_order_items.quantity)
            Exemple: PO avec 20 unités → stock_forecasted_in +20

3. Réception fournisseur (mouvement réel)
   ├─ Table: purchase_order_receptions (INSERT)
   ├─ Crée stock_movement (type='IN', affects_forecast=FALSE)
   └─ ACTION: products.stock_real += quantity_received
            Exemple: Réception de 20 unités → stock_real +20

4. PO annulée (validated → "cancelled")
   ├─ TRIGGER: même fonction with décrémentation
   └─ ACTION: products.stock_forecasted_in -= (quantity - quantity_received)
            Exemple: Annulation partielle si 10 reçues → stock_forecasted_in -10
```

### Workflow 2 : Commande Client (Sales Order)

```
⚠️ ATTENTION: PRÉVISIONNEL CLIENTS **NON IMPLÉMENTÉ** (voir section problèmes)

1. Commande client créée (statut: "draft")
   └─ Aucun changement stock

2. Commande validée (draft → "validated")
   └─ ❌ MANQUANT: Pas de trigger pour incrémenter stock_forecasted_out

3. Expédition confirmée
   ├─ Crée stock_movement (type='OUT', affects_forecast=FALSE)
   └─ ACTION: products.stock_real -= quantity_shipped
```

---

## 📊 Page Inventaire (`/stocks/inventaire`)

### Architecture Frontend

**Fichier** : `/apps/back-office/src/app/stocks/inventaire/page.tsx`  
**Hook** : `@verone/stock` → `useStockInventory()`

### Query SQL Derrière `useStockInventory()`

```typescript
// Hook: packages/@verone/stock/src/hooks/use-stock-inventory.ts

1. SELECT produits (id, name, sku, stock_real, stock_forecasted_in/out, cost_price)
2. LEFT JOIN product_images (pour image principale)
3. WHERE archived_at IS NULL

4. Pour chaque produit, PARALLEL QUERY:
   - SELECT stock_movements WHERE product_id = ? AND affects_forecast IS NULL/FALSE
   - Filtre par dates optionnelles
   - Groupe par movement_type pour calculs

5. Calculs côté frontend:
   - total_in = SUM(quantity_change WHERE movement_type='IN')
   - total_out = SUM(ABS(quantity_change) WHERE movement_type='OUT')
   - total_adjustments = SUM(quantity_change WHERE movement_type='ADJUST')
   - stock_prévisionnel_total = stock_real + stock_forecasted_in - stock_forecasted_out
```

### Colonnes Affichées

| Colonne           | Source                        | Calcul                                  |
| ----------------- | ----------------------------- | --------------------------------------- |
| Produit           | products.name                 | -                                       |
| Entrées           | stock_movements agrégés       | SUM(qty WHERE movement_type='IN')       |
| Sorties           | stock_movements agrégés       | SUM(ABS(qty) WHERE movement_type='OUT') |
| Ajust.            | stock_movements agrégés       | SUM(qty WHERE movement_type='ADJUST')   |
| **Stock Réel**    | products.stock_real           | Frontend: stock_movements sommes        |
| **Prév. Entrant** | products.stock_forecasted_in  | Commandes fournisseurs validées         |
| **Prév. Sortant** | products.stock_forecasted_out | ❌ VIDE (non implémenté)                |
| Prév. Total       | Calculé                       | stock_real + in - out                   |
| Dernière MAJ      | stock_movements.performed_at  | MAX(date)                               |

---

## 🔧 Triggers Existants de Synchronisation

### 1. ✅ Trigger: `trg_po_validation_forecasted_stock`

**Fichier** : `supabase/migrations/20251125_001_add_forecasted_stock_on_po_validation.sql`

```sql
TRIGGER: AFTER UPDATE ON purchase_orders
WHEN: OLD.status != NEW.status
FONCTION: update_forecasted_stock_on_po_validation()

LOGIQUE:
- Si draft → validated:
    FOR EACH item IN purchase_order_items:
      products.stock_forecasted_in += quantity

- Si validated → cancelled:
    FOR EACH item IN purchase_order_items:
      products.stock_forecasted_in -= (quantity - quantity_received)
```

**Couverture** : ✅ Commandes fournisseurs uniquement

---

### 2. ✅ Trigger: `trg_sync_product_stock_after_movement`

**Fichier** : `supabase/migrations/20251125_001_add_stock_movement_sync_trigger.sql`

```sql
TRIGGER: AFTER INSERT ON stock_movements
FONCTION: update_product_stock_after_movement()

LOGIQUE:
- Synchronise products.stock_real = quantity_after du mouvement
- S'exécute APRÈS chaque INSERT dans stock_movements
```

**Couverture** : ✅ Tous les mouvements réels (réceptions, expéditions, ajustements)

---

### 3. ✅ Trigger: `trg_reverse_stock_on_movement_delete`

**Fichier** : `supabase/migrations/20251125_002_trigger_delete_stock_movement_reverse.sql`

```sql
TRIGGER: BEFORE DELETE ON stock_movements
FONCTION: reverse_stock_on_movement_delete()

LOGIQUE:
- Inverse products.stock_real lors suppression mouvement
- Si mouvement était +10 → stock_real -= 10
- Si mouvement était -5 → stock_real += 5
```

**Couverture** : ✅ Mouvements manuels supprimés par utilisateur

---

## 🔍 Triggers MANQUANTS ou À VÉRIFIER

### ❌ 1. Stock Prévisionnel Sortant (Sales Orders)

**PROBLÈME** : Aucun trigger pour incrémenter `stock_forecasted_out` quand une commande client est validée.

**Impact** :

- Page inventaire affiche "Prév. Sortant: -" (vide)
- Dashboard ne montre pas les commandes clients en attente
- Risk: Surstock/underselling invisible

**À implémenter** :

```sql
CREATE TRIGGER trg_so_validation_forecasted_stock
AFTER UPDATE ON sales_orders
WHEN: OLD.status != NEW.status
LOGIC:
  IF draft → validated:
    FOR EACH item IN sales_order_items:
      products.stock_forecasted_out += quantity
  IF validated → cancelled:
    FOR EACH item IN sales_order_items:
      products.stock_forecasted_out -= (quantity - quantity_shipped)
```

---

### ❓ 2. Réceptions Partielles (purchase_order_receptions)

**STATUT** : Migration créée mais triggers manquants ou non testés

**Fichiers** :

- `20251124_003_trigger_update_reception_adjust_stock.sql` (créé)
- `20251124_001_trigger_delete_reception_reverse_stock.sql` (créé)

**Questions** :

- Décrémente-t-on `stock_forecasted_in` à chaque réception partielle ?
- Que se passe-t-il lors annulation partielle réception ?

---

### ❓ 3. Expéditions Partielles (sales_order_shipments)

**STATUT** : Même situation que réceptions

**Fichiers** :

- `20251124_004_trigger_update_shipment_adjust_stock.sql` (créé)
- `20251124_002_trigger_delete_shipment_reverse_stock.sql` (créé)

---

## 📋 Structure de `stock_movements` (Détail)

```sql
TABLE stock_movements (

  -- Identifiants
  id UUID PRIMARY KEY
  product_id UUID (FK products.id)

  -- Mouvement
  movement_type ENUM('IN', 'OUT', 'ADJUST', 'TRANSFER')
  quantity_change INT (peut être négatif)
  quantity_before INT
  quantity_after INT

  -- Prévisionnel (critère séparation stock réel/prévisionnel)
  affects_forecast BOOLEAN (DEFAULT FALSE)
  forecast_type TEXT ('in' | 'out' | NULL) -- seulement si affects_forecast=TRUE

  -- Référence
  reference_type TEXT ('purchase_order', 'sales_order', 'reception', 'shipment', 'adjustment')
  reference_id UUID (produit, commande, etc.)
  purchase_order_item_id UUID (optionnel, pour traçabilité réceptions item par item)

  -- Auditage
  performed_by UUID (FK user_profiles.user_id)
  performed_at TIMESTAMPTZ (DEFAULT NOW())

  -- Motif détaillé
  reason_code ENUM (25+ codes: 'sale', 'transfer_out', 'damage_transport', 'theft', etc.)

  -- Métadonnées expédition/réception
  carrier_name TEXT (ex: Chronopost)
  tracking_number TEXT
  delivery_note TEXT (référence BL)
  received_by_name TEXT
  shipped_by_name TEXT

  -- Multi-canal
  channel_id UUID (NULL pour IN; FK sales_channels pour OUT)

  -- Dates standards
  created_at, updated_at TIMESTAMPTZ
)
```

**Clés pour comprendre** :

- `affects_forecast = FALSE` → Stock RÉEL (page Mouvements affiche ces lignes)
- `affects_forecast = TRUE` → Stock PRÉVISIONNEL (dashboard INFO uniquement)
- Page inventaire agrège TOUS les `affects_forecast = FALSE`

---

## 📈 Flux de Données: Inventaire → Dashboard

```
FRONTEND CALL: useStockInventory()
    ↓
HOOK QUERY: SELECT * FROM products WHERE archived_at IS NULL
    ↓
POUR CHAQUE produit: PARALLEL SELECT FROM stock_movements
    │
    ├─ WHERE product_id = X
    ├─ AND (affects_forecast IS NULL OR affects_forecast = FALSE)
    ├─ ORDER BY performed_at DESC
    │
    └─ Agrégations en frontend:
        • total_in = SUM(quantity_change WHERE movement_type='IN')
        • total_out = SUM(ABS(quantity_change) WHERE movement_type='OUT')
        • stock_prévisionnel_total = stock_real + stock_forecasted_in - stock_forecasted_out

        └─ AFFICHAGE: Tableau 11 colonnes

STATS CALCULÉES:
    • total_products = COUNT(products)
    • total_stock_value = SUM(stock_real * cost_price) [valorisation]
    • total_movements = COUNT(stock_movements groupes)
    • products_with_activity = COUNT(DISTINCT product_id de stock_movements)
```

---

## 🚨 Problèmes Identifiés et Solutions

### Problème 1 : Prévisionnel Sortant Manquant

| Aspect                | Valeur                                                           |
| --------------------- | ---------------------------------------------------------------- |
| **Colonne concernée** | `products.stock_forecasted_out`                                  |
| **Quand affectée**    | Jamais ! Aucun trigger                                           |
| **Impact**            | Dashboard/inventaire affiche `stock_forecasted_out = 0` toujours |
| **Sévérité**          | 🔴 HAUTE - Visibilité manquante sur commandes clients            |
| **Trigger à ajouter** | Voir section "Triggers MANQUANTS" → #1                           |

---

### Problème 2 : Synchronisation Réceptions Partielles Floue

| Aspect       | Valeur                                                                   |
| ------------ | ------------------------------------------------------------------------ |
| **Table**    | `purchase_order_receptions` + `stock_movements`                          |
| **Question** | Quand PO partiellement reçue : `stock_forecasted_in` est-il décrémenté ? |
| **Fichiers** | Migrations 20251124_001/003 existent mais non testées                    |
| **Sévérité** | 🟡 MOYENNE - Risk de comptabilité incorrecte                             |

---

### Problème 3 : Pas de `stock_levels` Table

| Aspect                  | Valeur                                                      |
| ----------------------- | ----------------------------------------------------------- |
| **Recherche initiale**  | Cherchait table `stock_levels`                              |
| **Résultat**            | N'existe pas                                                |
| **Architecture réelle** | Frontend agrège `products` + `stock_movements`              |
| **Implication**         | Pas de "snapshot" par entrepôt/emplacement (future feature) |
| **Sévérité**            | 🟢 BASSE - Design actuel correct pour mono-entrepôt         |

---

## ✅ Éléments Fonctionnels Validés

| Fonctionnalité                   | Fichier                                     | Statut     |
| -------------------------------- | ------------------------------------------- | ---------- |
| Page inventaire affichage        | `/stocks/inventaire/page.tsx`               | ✅ Complet |
| Hook récupération données        | `use-stock-inventory.ts`                    | ✅ Complet |
| Mouvements réels (IN/OUT/ADJUST) | `stock_movements` table + triggers          | ✅ Complet |
| Stock réel par produit           | `products.stock_real`                       | ✅ Complet |
| Prévisionnel fournisseur (IN)    | `products.stock_forecasted_in` + trigger PO | ✅ Complet |
| Synchronisation stock réel       | `trg_sync_product_stock_after_movement`     | ✅ Complet |
| Annulation mouvements            | `trg_reverse_stock_on_movement_delete`      | ✅ Complet |
| Export CSV inventaire            | Hook `exportInventoryCSV()`                 | ✅ Complet |
| Statistiques KPI                 | Hook calculs `InventoryStats`               | ✅ Complet |
| Dashboard intégration            | `/stocks/page.tsx`                          | ✅ Complet |

---

## 📦 Fichiers Critiques à Modifier

### Si Implémenter Prévisionnel Sortant:

1. **Migration SQL** (créer nouvelle)
   - Créer fonction `update_forecasted_stock_on_so_validation()`
   - Créer trigger `trg_so_validation_forecasted_stock`
   - Tester décrémentation partielles

2. **Tests SQL** (ajouter)
   - `supabase/tests/validate_so_forecasted_out.sql`
   - Cas: création, validation, annulation, expéditions partielles

3. **Aucune modification frontend** (déjà prêt)
   - Page inventaire affichera automatiquement `stock_forecasted_out`
   - Dashboard aussi

---

## 🗂️ Fichiers Clés du Système

### Frontend

- `/apps/back-office/src/app/stocks/inventaire/page.tsx` - Page principale
- `/apps/back-office/src/app/stocks/page.tsx` - Dashboard (navigation)

### Hooks (@verone/stock)

- `packages/@verone/stock/src/hooks/use-stock-inventory.ts` - Récupération données inventaire
- `packages/@verone/stock/src/hooks/use-stock-dashboard.ts` - Métriques dashboard
- `packages/@verone/stock/src/hooks/use-stock-movements.ts` - Mouvements détaillés
- `packages/@verone/stock/src/hooks/use-stock-alerts.ts` - Alertes stock faible

### Database - Migrations (Supabase)

- `20251125_001_add_forecasted_stock_on_po_validation.sql` - ✅ Prévisionnel PO
- `20251125_001_add_stock_movement_sync_trigger.sql` - ✅ Sync mouvement
- `20251125_002_trigger_delete_stock_movement_reverse.sql` - ✅ Annulation mouvement
- `20251124_001/002/003/004_trigger_*.sql` - Réceptions/expéditions partielles
- `20251012_001_smart_stock_alerts_system.sql` - Système d'alertes

### Documentation

- `docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md` - Architecture stock réel vs prévisionnel
- `docs/audits/2025-10/RAPPORT-AUDIT-MODULE-STOCK-COMPLET-2025-11-01.md` - Audit complet

---

## 💡 Recommandations

### Court Terme (Critical)

1. **Implémenter trigger `stock_forecasted_out` pour sales_orders**
   - Effort: 1-2h (migration SQL + test)
   - Impact: Visibilité complète stocks prévus

2. **Valider réceptions/expéditions partielles**
   - Vérifier decrements `stock_forecasted_in/out` corrects
   - Tester edge cases (annulation après réception partielle)

### Moyen Terme

1. **Ajouter widget "Timeline 30 jours" au dashboard**
   - RPC existant dans `real-vs-forecast-separation.md`
   - Permet visualiser stock cumulé futur

2. **Notifications stock faible**
   - Infrastructure `stock_alert_tracking` existe
   - Intégrer avec webhooks utilisateurs

### Long Terme (Phase 5+)

1. **Support multi-entrepôts**
   - Ajouter colonne `warehouse_id` aux stock_movements
   - Créer vraie table `stock_levels` (product_id, warehouse_id) pour performances
   - RLS policies par entrepôt

2. **Prévisions sur commandes**
   - Timeline intégrant lead times fournisseurs
   - Recommandations auto réapprovisionnement

---

## 📊 Métriques Actuelles

| Métrique            | Valeur     | Source                                                                              |
| ------------------- | ---------- | ----------------------------------------------------------------------------------- |
| Nombre tables stock | 5          | products, stock_movements, purchase_orders, sales_orders, purchase_order_receptions |
| Triggers stock      | 3 ✅ + 2❓ | 2025-11-25 migrations                                                               |
| Colonnes forecasted | 2          | stock_forecasted_in (✅), stock_forecasted_out (❌ non peuplée)                     |
| Page inventaire     | 1          | /stocks/inventaire (affiche 11 colonnes)                                            |
| Hooks stock         | 12         | use-stock-\*.ts (complète ecosystem)                                                |

---

## ✨ Conclusion

Le système d'inventaire est **architecturalement sain** mais **incomplet** :

- ✅ Stock réel = bien suivi (table + triggers + frontend)
- ✅ Prévisionnel entrées fournisseurs = implémenté
- ❌ Prévisionnel sorties clients = **MANQUANT** (cf. trigger `trg_so_validation_forecasted_stock`)
- ✅ Réceptions partielles = structures créées, nécessite validation
- ✅ Expéditions partielles = structures créées, nécessite validation

**La page `/stocks/inventaire` affichera correctement les données dès que le prévisionnel sortant sera implémenté.**

---

**Document généré automatiquement par Claude Code**  
**Mode**: Plan (lectures uniquement)  
**Date**: 2025-11-26
