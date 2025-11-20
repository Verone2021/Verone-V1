# 📋 PLAN DE TESTS COMPLET - TRIGGERS STOCK & ALERTES

**Date** : 2025-11-20
**Contexte** : Validation post-reconstruction triggers (Migrations 017-021)
**Statut** : ✅ PRÊT À EXÉCUTER
**Demandeur** : Romeo Dos Santos
**Exécutant** : Claude Code (verone-test-expert)

---

## 📊 RÉSUMÉ EXÉCUTIF

### Objectif

Valider le bon fonctionnement des 6 triggers de gestion stock et alertes après reconstruction complète suite aux erreurs matinales du 2025-11-20.

### Triggers à Tester (6 actifs)

| #   | Trigger                                           | Migration | Fonction                                    | Priorité |
| --- | ------------------------------------------------- | --------- | ------------------------------------------- | -------- |
| 1   | `trigger_sync_stock_alert_tracking_v2`            | 020       | `sync_stock_alert_tracking_v2()`            | 🔴 P0    |
| 2   | `trigger_validate_stock_alerts_on_purchase_order` | 021       | `validate_stock_alerts_on_purchase_order()` | 🔴 P0    |
| 3   | `trigger_purchase_order_stock`                    | 018       | `handle_purchase_order_stock()`             | 🔴 P0    |
| 4   | `trigger_sales_order_stock`                       | 019       | `handle_sales_order_stock()`                | 🔴 P0    |
| 5   | `trigger_cleanup_sales_order_movements`           | 015       | `cleanup_sales_order_movements()`           | 🟠 P1    |
| 6   | `trigger_cleanup_purchase_order_movements`        | 015       | `cleanup_purchase_order_movements()`        | 🟠 P1    |

### Produits de Test

**Produit 1 : Fauteuil Milo Jaune**

- Stock actuel : `0`
- Min stock : `5`
- État initial : 2 alertes attendues
  - `low_stock` (stock_real=0 < min_stock=5)
  - `out_of_stock` (si commande client créée)

**Produit 2 : Fauteuil Milo Vert**

- Stock actuel : `0`
- Min stock : `10`
- État initial : 1 alerte attendue
  - `low_stock` (stock_real=0 < min_stock=10)

### Paramètres Configurés

- **Client** : Premier client disponible (auto-sélection database)
- **Fournisseur** : OPJET (unique fournisseur avec produits actifs)
- **Canal vente** : back-office
- **Utilisateur** : user_id owner (auto-sélection)

---

## 🎯 SCÉNARIOS DE TESTS

### **SCÉNARIO 1 : Workflow Complet Client → Fournisseur → Réception**

**Objectif** : Tester le cycle complet 🔴 Alerte → 🟢 Validation → ✅ Suppression

**Produit** : Fauteuil Milo Jaune

#### **Étape 1.1 : État Initial (Trigger #1)**

**Requête État Produit** :

```sql
SELECT
  id,
  name,
  sku,
  stock_real,
  stock_forecasted_in,
  stock_forecasted_out,
  min_stock,
  (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_previsionnel
FROM products
WHERE name ILIKE '%milo%jaune%';
```

**Attendu** :

- stock_real = 0
- stock_forecasted_in = 0
- stock_forecasted_out = 0
- min_stock = 5
- Prévisionnel = 0

**Requête Alertes Initiales** :

```sql
SELECT
  alert_type,
  alert_priority,
  shortage_quantity,
  validated,
  validated_at
FROM stock_alert_tracking
WHERE product_id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- 1 alerte : `low_stock`
- shortage_quantity = 5
- validated = false

#### **Étape 1.2 : Créer Commande Client (Trigger #4)**

**Action SQL** :

```sql
-- Créer SO pour 20 unités
INSERT INTO sales_orders (
  order_number,
  customer_id,
  status,
  sales_channel_id,
  created_by,
  created_at
) VALUES (
  'SO-TEST-001',
  '[CUSTOMER_ID]',
  'draft',
  '[CHANNEL_ID]',
  '[USER_ID]',
  NOW()
) RETURNING id;

-- Ajouter item
INSERT INTO sales_order_items (
  sales_order_id,
  product_id,
  quantity,
  unit_price,
  created_at
) VALUES (
  '[SO_ID]',
  '[MILO_JAUNE_ID]',
  20,
  100.00,
  NOW()
);

-- Confirmer commande (déclenche trigger #4)
UPDATE sales_orders
SET status = 'confirmed'
WHERE id = '[SO_ID]';
```

**Vérifications 1.2** :

1. **Mouvement stock créé** :

```sql
SELECT
  movement_type,
  quantity_change,
  affects_forecast,
  forecast_type,
  reason_code,
  notes
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = '[SO_ID]';
```

**Attendu** :

- movement_type = 'OUT'
- quantity_change = 20
- affects_forecast = true
- forecast_type = 'out'
- reason_code = 'sale'

2. **Stock prévisionnel mis à jour** :

```sql
SELECT
  stock_real,
  stock_forecasted_in,
  stock_forecasted_out,
  (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_previsionnel
FROM products
WHERE id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- stock_real = 0 (INCHANGÉ)
- stock_forecasted_in = 0
- stock_forecasted_out = 20 (AJOUTÉ)
- Prévisionnel = -20 ⚠️

3. **Alertes créées (Trigger #1 automatique)** :

```sql
SELECT
  alert_type,
  alert_priority,
  shortage_quantity,
  stock_real,
  stock_forecasted_in,
  stock_forecasted_out,
  validated,
  validated_at
FROM stock_alert_tracking
WHERE product_id = '[MILO_JAUNE_ID]'
ORDER BY alert_type;
```

**Attendu** :

- 2 alertes :
  1. `low_stock` : shortage=5, priority=2, validated=false
  2. `out_of_stock` : shortage=20, priority=3, validated=false

#### **Étape 1.3 : Créer Commande Fournisseur (Trigger #3 + #2)**

**Action SQL** :

```sql
-- Créer PO pour 30 unités
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by,
  created_at
) VALUES (
  'PO-TEST-001',
  '[SUPPLIER_ID]',
  'draft',
  '[USER_ID]',
  NOW()
) RETURNING id;

-- Ajouter item
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_cost,
  created_at
) VALUES (
  '[PO_ID]',
  '[MILO_JAUNE_ID]',
  30,
  50.00,
  NOW()
);

-- Confirmer commande (déclenche trigger #3 + #2)
UPDATE purchase_orders
SET status = 'confirmed'
WHERE id = '[PO_ID]';
```

**Vérifications 1.3** :

1. **Mouvement FORECASTED_IN créé** :

```sql
SELECT
  movement_type,
  quantity_change,
  affects_forecast,
  forecast_type
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '[PO_ID]';
```

**Attendu** :

- movement_type = 'IN'
- quantity_change = 30
- affects_forecast = true
- forecast_type = 'in'

2. **Stock prévisionnel mis à jour** :

```sql
SELECT
  stock_real,
  stock_forecasted_in,
  stock_forecasted_out,
  (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_previsionnel
FROM products
WHERE id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- stock_real = 0 (INCHANGÉ)
- stock_forecasted_in = 30 (AJOUTÉ)
- stock_forecasted_out = 20
- Prévisionnel = 10 ✅

3. **Alertes VALIDÉES (Trigger #2)** 🔴 → 🟢 :

```sql
SELECT
  alert_type,
  shortage_quantity,
  validated,
  validated_at,
  validated_by,
  draft_order_id,
  quantity_in_draft
FROM stock_alert_tracking
WHERE product_id = '[MILO_JAUNE_ID]'
ORDER BY alert_type;
```

**Attendu** :

- `low_stock` : validated=true, shortage=0, draft_order_id=[PO_ID], quantity_in_draft=30
- `out_of_stock` : validated=true, shortage=0, draft_order_id=[PO_ID], quantity_in_draft=30

#### **Étape 1.4 : Réceptionner Commande (Trigger #3 → #1)**

**Action SQL** :

```sql
-- Réceptionner 30 unités
UPDATE purchase_order_items
SET quantity_received = 30
WHERE purchase_order_id = '[PO_ID]'
  AND product_id = '[MILO_JAUNE_ID]';

-- Passer status = received
UPDATE purchase_orders
SET status = 'received'
WHERE id = '[PO_ID]';
```

**Vérifications 1.4** :

1. **Mouvement IN RÉEL créé** :

```sql
SELECT
  movement_type,
  quantity_change,
  quantity_before,
  quantity_after,
  affects_forecast
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '[PO_ID]'
  AND affects_forecast = false;
```

**Attendu** :

- movement_type = 'IN'
- quantity_change = 30
- quantity_before = 0
- quantity_after = 30
- affects_forecast = false

2. **Stocks mis à jour** :

```sql
SELECT
  stock_real,
  stock_quantity,
  stock_forecasted_in,
  stock_forecasted_out,
  (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_previsionnel
FROM products
WHERE id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- stock_real = 30 (AUGMENTÉ)
- stock_quantity = 30
- stock_forecasted_in = 0 (RÉDUIT)
- stock_forecasted_out = 20
- Prévisionnel = 10 ✅

3. **Alertes SUPPRIMÉES** 🟢 → ✅ :

```sql
SELECT COUNT(*) as alertes_actives
FROM stock_alert_tracking
WHERE product_id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- alertes_actives = 0

**✅ RÉSULTAT ATTENDU SCÉNARIO 1** :

- Stock final : stock_real=30, forecasted_in=0, forecasted_out=20, prévisionnel=10
- Alertes : 0 (supprimées)
- Mouvements : 4 créés (1 forecasted_out, 1 forecasted_in, 1 réel in)

---

### **SCÉNARIO 2 : Annulation Commande Client Validée**

**Objectif** : Tester libération stock prévisionnel forecasted_out

**Produit** : Fauteuil Milo Jaune (après Scénario 1)

#### **Étape 2.1 : État Initial**

```sql
SELECT
  stock_real,
  stock_forecasted_in,
  stock_forecasted_out,
  (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_previsionnel
FROM products
WHERE id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- stock_real = 30
- stock_forecasted_out = 20
- Prévisionnel = 10

#### **Étape 2.2 : Annuler Commande Client**

**Action SQL** :

```sql
UPDATE sales_orders
SET status = 'cancelled'
WHERE id = '[SO_ID]';
```

**Vérifications 2.2** :

1. **Mouvement ADJUST créé** :

```sql
SELECT
  movement_type,
  quantity_change,
  affects_forecast,
  forecast_type
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = '[SO_ID]'
  AND movement_type = 'ADJUST';
```

**Attendu** :

- movement_type = 'ADJUST'
- quantity_change = -20
- affects_forecast = true
- forecast_type = 'out'

2. **Stock prévisionnel libéré** :

```sql
SELECT
  stock_real,
  stock_forecasted_out
FROM products
WHERE id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- stock_real = 30 (INCHANGÉ)
- stock_forecasted_out = 0 (LIBÉRÉ)

**✅ RÉSULTAT ATTENDU SCÉNARIO 2** :

- Stock final : stock_real=30 (inchangé), forecasted_out=0 (libéré)
- Mouvement : 1 ADJUST créé

---

### **SCÉNARIO 3 : Annulation Commande Fournisseur Confirmée**

**Objectif** : Tester libération forecasted_in + réactivation alertes

**Produit** : Fauteuil Milo Vert

#### **Étape 3.1 : Créer & Confirmer PO**

**Action SQL** :

```sql
-- Créer PO
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by
) VALUES (
  'PO-TEST-002',
  '[SUPPLIER_ID]',
  'draft',
  '[USER_ID]'
) RETURNING id;

-- Ajouter item
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_cost
) VALUES (
  '[PO_ID]',
  '[MILO_VERT_ID]',
  15,
  50.00
);

-- Confirmer
UPDATE purchase_orders
SET status = 'confirmed'
WHERE id = '[PO_ID]';
```

**Vérifications 3.1** :

```sql
-- Stock après confirmation
SELECT
  stock_real,
  stock_forecasted_in
FROM products
WHERE id = '[MILO_VERT_ID]';
```

**Attendu** :

- stock_real = 0
- stock_forecasted_in = 15

#### **Étape 3.2 : Annuler PO**

**Action SQL** :

```sql
UPDATE purchase_orders
SET status = 'cancelled'
WHERE id = '[PO_ID]';
```

**Vérifications 3.2** :

1. **Mouvement ADJUST créé** :

```sql
SELECT
  movement_type,
  quantity_change,
  affects_forecast
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '[PO_ID]'
  AND movement_type = 'ADJUST';
```

**Attendu** :

- movement_type = 'ADJUST'
- quantity_change = -15
- affects_forecast = true

2. **Alerte réactivée** 🟢 → 🔴 :

```sql
SELECT
  alert_type,
  validated,
  shortage_quantity
FROM stock_alert_tracking
WHERE product_id = '[MILO_VERT_ID]'
  AND alert_type = 'low_stock';
```

**Attendu** :

- validated = false (RÉACTIVÉE)
- shortage_quantity = 10

**✅ RÉSULTAT ATTENDU SCÉNARIO 3** :

- Stock final : forecasted_in=0 (libéré)
- Alerte : low_stock réactivée (validated=false)

---

### **SCÉNARIO 4 : Suppression Commande Draft**

**Objectif** : Tester cleanup automatique (Triggers #5 & #6)

#### **Étape 4.1 : Supprimer SO Draft**

**Action SQL** :

```sql
-- Créer SO draft
INSERT INTO sales_orders (
  order_number,
  customer_id,
  status,
  created_by
) VALUES (
  'SO-TEST-DRAFT',
  '[CUSTOMER_ID]',
  'draft',
  '[USER_ID]'
) RETURNING id;

-- Ajouter item
INSERT INTO sales_order_items (
  sales_order_id,
  product_id,
  quantity,
  unit_price
) VALUES (
  '[SO_ID]',
  '[PRODUCT_ID]',
  5,
  100.00
);

-- Supprimer
DELETE FROM sales_orders
WHERE id = '[SO_ID]';
```

**Vérifications 4.1** :

```sql
-- Aucun mouvement orphelin
SELECT COUNT(*) as mouvements_orphelins
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = '[SO_ID]';
```

**Attendu** :

- mouvements_orphelins = 0

#### **Étape 4.2 : Supprimer PO Draft**

**Action SQL** :

```sql
-- Créer PO draft
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by
) VALUES (
  'PO-TEST-DRAFT',
  '[SUPPLIER_ID]',
  'draft',
  '[USER_ID]'
) RETURNING id;

-- Ajouter item
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_cost
) VALUES (
  '[PO_ID]',
  '[PRODUCT_ID]',
  10,
  50.00
);

-- Supprimer
DELETE FROM purchase_orders
WHERE id = '[PO_ID]';
```

**Vérifications 4.2** :

```sql
-- Aucun mouvement orphelin
SELECT COUNT(*) as mouvements_orphelins
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '[PO_ID]';
```

**Attendu** :

- mouvements_orphelins = 0

**✅ RÉSULTAT ATTENDU SCÉNARIO 4** :

- Commandes draft supprimées sans trace
- Aucun mouvement orphelin

---

### **SCÉNARIO 5 : Réception Partielle Fournisseur**

**Objectif** : Tester quantity_received < quantity

**Produit** : Fauteuil Milo Vert

#### **Étape 5.1 : Créer PO pour 20 unités**

**Action SQL** :

```sql
-- Créer & confirmer PO
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by
) VALUES (
  'PO-TEST-003',
  '[SUPPLIER_ID]',
  'draft',
  '[USER_ID]'
) RETURNING id;

INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_cost
) VALUES (
  '[PO_ID]',
  '[MILO_VERT_ID]',
  20,
  50.00
);

UPDATE purchase_orders
SET status = 'confirmed'
WHERE id = '[PO_ID]';
```

#### **Étape 5.2 : Réceptionner 10 Unités (Partiel)**

**Action SQL** :

```sql
-- Réceptionner SEULEMENT 10 unités
UPDATE purchase_order_items
SET quantity_received = 10
WHERE purchase_order_id = '[PO_ID]';

-- Passer status = received
UPDATE purchase_orders
SET status = 'received'
WHERE id = '[PO_ID]';
```

**Vérifications 5.2** :

1. **Mouvement pour 10 unités SEULEMENT** :

```sql
SELECT
  movement_type,
  quantity_change
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = '[PO_ID]'
  AND affects_forecast = false;
```

**Attendu** :

- quantity_change = 10 (PAS 20 !)

2. **Stocks correctement mis à jour** :

```sql
SELECT
  stock_real,
  stock_forecasted_in
FROM products
WHERE id = '[MILO_VERT_ID]';
```

**Attendu** :

- stock_real = 10 (pas 20)
- stock_forecasted_in = 10 (reste 10)

**✅ RÉSULTAT ATTENDU SCÉNARIO 5** :

- Stock final : stock_real=10, forecasted_in=10
- Calcul différentiel correct (20 - 10 = 10)

---

### **SCÉNARIO 6 : Expédition Partielle Client**

**Objectif** : Tester quantity_shipped < quantity

**Produit** : Fauteuil Milo Jaune (stock_real=30)

#### **Étape 6.1 : Créer SO pour 25 unités**

**Action SQL** :

```sql
-- Créer & confirmer SO
INSERT INTO sales_orders (
  order_number,
  customer_id,
  status,
  created_by
) VALUES (
  'SO-TEST-002',
  '[CUSTOMER_ID]',
  'draft',
  '[USER_ID]'
) RETURNING id;

INSERT INTO sales_order_items (
  sales_order_id,
  product_id,
  quantity,
  unit_price
) VALUES (
  '[SO_ID]',
  '[MILO_JAUNE_ID]',
  25,
  100.00
);

UPDATE sales_orders
SET status = 'confirmed'
WHERE id = '[SO_ID]';
```

#### **Étape 6.2 : Expédier 15 Unités (Partiel)**

**Action SQL** :

```sql
-- Expédier SEULEMENT 15 unités
UPDATE sales_order_items
SET quantity_shipped = 15
WHERE sales_order_id = '[SO_ID]';

-- Passer status = shipped
UPDATE sales_orders
SET
  status = 'shipped',
  warehouse_exit_at = NOW()
WHERE id = '[SO_ID]';
```

**Vérifications 6.2** :

1. **Mouvement pour 10 unités SEULEMENT** :

```sql
SELECT
  movement_type,
  quantity_change
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = '[SO_ID]'
  AND affects_forecast = false;
```

**Attendu** :

- quantity_change = 10 (25 - 15 = 10 restants)

2. **Stocks correctement mis à jour** :

```sql
SELECT
  stock_real,
  stock_forecasted_out
FROM products
WHERE id = '[MILO_JAUNE_ID]';
```

**Attendu** :

- stock_real = 20 (30 - 10 = 20)
- stock_forecasted_out = 15 (reste 15)

**✅ RÉSULTAT ATTENDU SCÉNARIO 6** :

- Stock final : stock_real=20, forecasted_out=15
- Calcul différentiel correct (25 - 15 = 10)

---

## 🔍 CHECKLIST VÉRIFICATIONS SYSTÉMATIQUES

### Pour Chaque Test

**Avant Action** :

- [ ] Query état initial produit
- [ ] Query alertes actives
- [ ] Query mouvements existants

**Après Action** :

- [ ] Query état final produit
- [ ] Vérifier alertes créées/modifiées/supprimées
- [ ] Vérifier mouvements créés
- [ ] Vérifier cohérence stocks

### Pour Alertes Stock

- [ ] alert_type correct
- [ ] alert_priority correct
- [ ] shortage_quantity calculée
- [ ] Snapshots stocks corrects
- [ ] validated false initialement
- [ ] Après validation PO : validated true, draft_order_id renseigné

### Pour Mouvements Stock

- [ ] movement_type correct
- [ ] quantity_change correct
- [ ] quantity_before/after cohérents
- [ ] affects_forecast correct
- [ ] forecast_type correct
- [ ] reason_code correct

### Pour Stocks Produits

- [ ] stock_real cohérent
- [ ] stock_quantity = stock_real
- [ ] stock_forecasted_in cohérent
- [ ] stock_forecasted_out cohérent
- [ ] Prévisionnel = real + in - out

---

## 📊 CRITÈRES SUCCESS/FAILURE

### ✅ SUCCESS (Test PASS)

- Tous champs attendus = réels (100% match)
- Aucun mouvement orphelin
- Logs PostgreSQL conformes
- Stocks cohérents
- Alertes correctes

### ❌ FAILURE (Test FAIL)

- 1+ champ diverge
- Mouvements orphelins
- Erreurs PostgreSQL
- Stocks incohérents
- Alertes manquantes/incorrectes

---

## 🛠️ ROLLBACK PROCÉDURE

Si tests FAIL :

1. Identifier triggers défaillants
2. Corriger migrations SQL
3. Re-exécuter tests

Si tests PASS :

1. Documenter résultats
2. Commit rapport
3. Classer plan

---

## 📚 RÉFÉRENCES

**Migrations Testées** :

- 20251120_017_remove_obsolete_triggers.sql
- 20251120_018_fix_purchase_order_stock_trigger.sql
- 20251120_019_fix_sales_order_stock_trigger.sql
- 20251120_020_new_stock_alert_tracking_v2.sql
- 20251120_021_validate_alerts_on_purchase_order.sql

**Triggers Actifs** :

1. sync_stock_alert_tracking_v2() - Alertes stock
2. validate_stock_alerts_on_purchase_order() - Validation alertes
3. handle_purchase_order_stock() - Stock fournisseurs
4. handle_sales_order_stock() - Stock clients
5. cleanup_sales_order_movements() - Cleanup SO
6. cleanup_purchase_order_movements() - Cleanup PO

---

**Plan créé le** : 2025-11-20
**Durée estimée** : 75-90 minutes
**Statut** : ✅ PRÊT À EXÉCUTER
