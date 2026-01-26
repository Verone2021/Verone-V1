# Module Stocks - Vérone Back Office

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-23
**Responsable**: Romeo Dos Santos

---

## Vue d'ensemble

Le module Stocks gère l'inventaire, les mouvements de stock, les alertes et le système prévisionnel au sein de Vérone CRM/ERP. C'est un module **critique** car il orchestre la disponibilité produits pour les commandes clients et fournisseurs.

### Scope fonctionnel

- Gestion de l'inventaire produits
- Mouvements de stock (entrées/sorties)
- Stock prévisionnel (forecasting)
- Alertes de rupture et stock faible
- Réceptions fournisseurs
- Expéditions clients
- Ajustements d'inventaire

---

## Architecture

### Tables Supabase principales

```
products                     # Stock réel et prévisionnel
├── stock_movements          # Historique mouvements (1:N)
├── stock_alert_tracking     # Alertes actives (1:N)
│
purchase_order_receptions    # Réceptions fournisseurs
sales_order_shipments        # Expéditions clients
│
stock_alerts_unified_view    # Vue agrégée alertes (VIEW)
```

#### Champs stock dans `products`

| Colonne | Type | Description |
|---------|------|-------------|
| stock_real | integer | Stock physique réel |
| stock_forecasted_in | integer | Stock attendu (PO validées) |
| stock_forecasted_out | integer | Stock réservé (SO validées) |
| min_stock | integer | Seuil alerte stock faible |

---

## Formules de Calcul

### Stock Prévisionnel

```
stock_previsionnel = stock_real + stock_forecasted_in - stock_forecasted_out
```

**Interprétation**:
- `stock_real`: Ce qui est physiquement en stock
- `stock_forecasted_in`: Ce qui va arriver (PO validées, en transit)
- `stock_forecasted_out`: Ce qui est réservé (SO validées, pas encore expédiées)

### Stock Prévisionnel avec Brouillons

```
stock_previsionnel_avec_draft = stock_previsionnel + quantity_in_draft
```

**Note**: `quantity_in_draft` = quantités dans les PO brouillon (non encore validées).

### Calcul du Shortage (Manque)

```typescript
function calculateShortage(product: Product): number {
  const stockPrev = product.stock_real
    + product.stock_forecasted_in
    - product.stock_forecasted_out;

  if (stockPrev < 0) {
    // Rupture: manque absolu
    return Math.abs(stockPrev);
  } else if (stockPrev < product.min_stock) {
    // Stock faible: manque pour atteindre seuil
    return product.min_stock - stockPrev;
  }

  return 0; // Pas de manque
}
```

---

## Types d'Alertes

### 1. `out_of_stock` (Rupture)

**Définition**: `stock_previsionnel < 0`

**Caractéristiques**:
- Indépendant de `min_stock`
- Signifie que les commandes clients dépassent le stock disponible + prévu
- **Priorité CRITIQUE**

### 2. `low_stock` (Stock Faible)

**Définition**: `stock_previsionnel >= 0 AND stock_previsionnel < min_stock`

**Caractéristiques**:
- Nécessite `min_stock > 0` configuré
- Seuil de réapprovisionnement
- **Priorité WARNING**

---

## Workflow des Couleurs (États Visuels)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW COULEURS ALERTES                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🔴 CRITICAL_RED                                                     │
│     └─ stock_previsionnel < 0 ET brouillon ne couvre pas            │
│        → Action URGENTE requise                                      │
│                                                                      │
│  🔴 RED                                                              │
│     └─ stock_previsionnel < min_stock (seuil non atteint)           │
│        → Commande fournisseur à créer                                │
│                                                                      │
│  🟠 ORANGE                                                           │
│     └─ stock insuffisant MAIS brouillon PO couvre le besoin         │
│        → PO en brouillon, à valider                                  │
│                                                                      │
│  🟢 GREEN (VERT)                                                     │
│     └─ stock_previsionnel >= 0 GRÂCE à PO validée en transit        │
│        → Attendre réception                                          │
│                                                                      │
│  ✅ RESOLVED / DISPARAÎT                                            │
│     └─ stock_real >= besoins (après réception effective)            │
│        → Alerte supprimée                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Triggers Critiques

### A. Validation Commande Fournisseur (PO)

```sql
-- Trigger: trg_po_validation_forecasted_stock
-- Événement: UPDATE purchase_orders SET status = 'validated'
-- Action: +stock_forecasted_in

UPDATE products
SET stock_forecasted_in = stock_forecasted_in + poi.quantity
FROM purchase_order_items poi
WHERE products.id = poi.product_id
  AND poi.purchase_order_id = NEW.id;
```

### B. Validation Commande Client (SO)

```sql
-- Trigger: trigger_so_update_forecasted_out
-- Événement: UPDATE sales_orders SET status = 'validated'
-- Action: +stock_forecasted_out

UPDATE products
SET stock_forecasted_out = stock_forecasted_out + soi.quantity
FROM sales_order_items soi
WHERE products.id = soi.product_id
  AND soi.sales_order_id = NEW.id;
```

### C. Réception Fournisseur

```sql
-- Trigger: trigger_reception_update_stock
-- Événement: INSERT purchase_order_receptions
-- Action: +stock_real, -stock_forecasted_in

UPDATE products
SET
  stock_real = stock_real + NEW.quantity_received,
  stock_forecasted_in = GREATEST(0, stock_forecasted_in - NEW.quantity_received)
WHERE id = NEW.product_id;
```

### D. Expédition Client

```sql
-- Trigger: trigger_shipment_update_stock
-- Événement: INSERT sales_order_shipments
-- Action: -stock_real, -stock_forecasted_out

UPDATE products
SET
  stock_real = stock_real - NEW.quantity_shipped,
  stock_forecasted_out = GREATEST(0, stock_forecasted_out - NEW.quantity_shipped)
WHERE id = NEW.product_id;
```

### E. Annulation Commande Client

```sql
-- Trigger: rollback_so_forecasted
-- Événement: UPDATE sales_orders SET status = 'cancelled'
-- Condition: OLD.status IN ('validated', 'partially_shipped')
-- Action: -stock_forecasted_out (quantité non expédiée)

IF OLD.status IN ('validated', 'partially_shipped') THEN
  UPDATE products
  SET stock_forecasted_out = GREATEST(0, stock_forecasted_out - (soi.quantity - soi.quantity_shipped))
  FROM sales_order_items soi
  WHERE products.id = soi.product_id
    AND soi.sales_order_id = OLD.id;
END IF;
```

**ATTENTION**: Pas de rollback si annulation depuis `draft` (aucune réservation).

---

## Mouvements de Stock

### Types de mouvements

| Type | Code | Impact stock_real | Impact forecasted |
|------|------|-------------------|-------------------|
| Réception | `IN_RECEPTION` | +quantity | -forecasted_in |
| Expédition | `OUT_SHIPMENT` | -quantity | -forecasted_out |
| Ajustement + | `ADJUST_IN` | +quantity | - |
| Ajustement - | `ADJUST_OUT` | -quantity | - |
| Transfert | `TRANSFER` | ±quantity | - |
| Inventaire | `INVENTORY` | =quantity | - |

### Table `stock_movements`

```sql
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  reference_type text, -- 'purchase_order', 'sales_order', 'manual'
  reference_id uuid,
  affects_forecast boolean DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

### Flag `affects_forecast`

- `true`: Mouvement prévisionnel (validation PO/SO) - NE modifie PAS stock_real
- `false`: Mouvement réel (réception, expédition, ajustement) - Modifie stock_real

---

## Vue Alertes Unifiée

### `stock_alerts_unified_view`

```sql
CREATE VIEW stock_alerts_unified_view AS
SELECT
  p.id,
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.stock_real AS current_stock,
  p.stock_forecasted_in,
  p.stock_forecasted_out,
  p.min_stock AS threshold_low,
  0 AS threshold_critical, -- Rupture = stock_prev < 0
  s.name AS supplier_name,
  -- Calcul stock prévisionnel
  (p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out) AS stock_previsionnel,
  -- Type alerte
  CASE
    WHEN (p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out) < 0 THEN 'out_of_stock'
    WHEN (p.stock_real + p.stock_forecasted_in - p.stock_forecasted_out) < p.min_stock THEN 'low'
    ELSE 'none'
  END AS alert_type
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.status = 'catalogue';
```

---

## Réceptions

### Workflow réception

```
PO Validée → Réception Partielle → Réception Complète → Clôture
     │              │                     │
     v              v                     v
 stock_forecasted_in = 100   -50 reçus    -50 reçus restants
 stock_real = 0              +50 réel     +50 réel = 100
```

### Server Action réception

```typescript
'use server'

export async function createReception(formData: FormData) {
  const { purchaseOrderId, items } = schema.parse(Object.fromEntries(formData));

  const supabase = createServerClient(/* ... */);

  // Créer les réceptions (les triggers gèrent stock)
  for (const item of items) {
    await supabase.from('purchase_order_receptions').insert({
      purchase_order_id: purchaseOrderId,
      purchase_order_item_id: item.itemId,
      product_id: item.productId,
      quantity_received: item.quantity,
      received_at: new Date().toISOString(),
    });
  }

  // Mettre à jour statut PO si réception complète
  await updatePurchaseOrderStatus(purchaseOrderId);

  revalidatePath('/stocks/receptions');
  return { success: true };
}
```

---

## Expéditions

### Workflow expédition

```
SO Validée → Expédition Partielle → Expédition Complète → Livrée
     │              │                     │
     v              v                     v
 stock_forecasted_out = 20   -10 expédiés  -10 expédiés restants
 stock_real = 50             -10 réel      -10 réel = 30
```

---

## Alertes et Notifications

### Table `stock_alert_tracking`

```sql
CREATE TABLE stock_alert_tracking (
  id uuid PRIMARY KEY,
  product_id uuid REFERENCES products(id),
  alert_type text, -- 'out_of_stock', 'low_stock'
  shortage_quantity integer,
  draft_order_id uuid, -- PO brouillon couvrant
  validated_order_id uuid, -- PO validée couvrant
  status text, -- 'active', 'in_progress', 'resolved'
  created_at timestamptz,
  resolved_at timestamptz
);
```

### Trigger sync alertes

```sql
-- Trigger: sync_stock_alert_tracking_v4
-- Événement: INSERT/UPDATE products
-- Action: Sync table stock_alert_tracking

-- Si stock_previsionnel < 0 → Créer/maintenir alerte out_of_stock
-- Si stock_previsionnel < min_stock → Créer/maintenir alerte low_stock
-- Si condition résolue → Supprimer alerte
```

---

## Règles Métier Critiques

### JAMAIS

- ❌ Rollback forecasted_out sur annulation SO depuis `draft`
- ❌ Modifier stock_real si `affects_forecast = true`
- ❌ Permettre stock_forecasted_out négatif (utiliser `GREATEST(0, ...)`)
- ❌ Supprimer alerte out_of_stock si PO en transit couvre des SO

### TOUJOURS

- ✅ Vérifier OLD.status avant rollback
- ✅ Utiliser `GREATEST(0, ...)` pour éviter valeurs négatives
- ✅ Logger avec `RAISE NOTICE` pour traçabilité
- ✅ Mettre à jour `updated_at` dans les triggers

---

## Tests de Validation

### Script de validation stock

```sql
-- supabase/tests/validate_stock_triggers.sql

-- Test 1: Validation PO augmente forecasted_in
BEGIN;
  INSERT INTO purchase_orders (id, status) VALUES ('test-po', 'draft');
  INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity)
    VALUES ('test-po', 'test-product', 10);

  -- Avant validation
  SELECT stock_forecasted_in FROM products WHERE id = 'test-product';
  -- Expected: 0

  UPDATE purchase_orders SET status = 'validated' WHERE id = 'test-po';

  -- Après validation
  SELECT stock_forecasted_in FROM products WHERE id = 'test-product';
  -- Expected: 10

ROLLBACK;
```

---

## Fichiers de référence

| Type | Chemin |
|------|--------|
| Types | `packages/@verone/types/src/stock.ts` |
| Hooks | `packages/@verone/stock/src/hooks/` |
| Composants | `apps/back-office/src/components/stocks/` |
| Migrations | `supabase/migrations/*_stock*.sql` |
| Vue alertes | `supabase/migrations/20251208_003*.sql` |
| Tests | `supabase/tests/validate_*.sql` |

---

## Monitoring

### Métriques clés

| Métrique | Description | Alerte si |
|----------|-------------|-----------|
| `stock.alerts.critical` | Produits en rupture | > 0 |
| `stock.alerts.low` | Produits stock faible | > 10 |
| `stock.movements.daily` | Mouvements/jour | Anomalie |
| `stock.negative_values` | Stock négatif détecté | > 0 |

---

**Changelog**:
- 2026-01-23: Création documentation module
- Source: Triggers audit 2025-11-28, migrations 20251208
