# AUDIT COMPLET TRIGGERS DATABASE - PURCHASE_ORDERS

**Mission**: Audit complet des triggers database liés aux purchase_orders (commandes fournisseurs)
**Contexte**: Régression critique - commandes fournisseurs ne fonctionnent plus depuis triggers
**Date d'audit**: 2025-11-25
**Status**: En cours - Plan Phase 1 créé

---

## PHASE 1 : EXPLORATION & MAPPING (COMPLÉTÉE)

### Objectifs Phase 1

1. Lister TOUS les triggers existants par table
2. Identifier les fonctions trigger associées
3. Détecter les chaînes de triggers (A → B → A = boucles)
4. Documenter les migrations applicables
5. Valider cohérence du système

### Fichiers Migrations Identifiés

| Fichier                                                   | Date       | Type             | Raison                                     |
| --------------------------------------------------------- | ---------- | ---------------- | ------------------------------------------ |
| `20251120162000_rollback_incorrect_triggers.sql`          | 2025-11-20 | ROLLBACK COMPLET | Supprime TOUS triggers stock + fonctions   |
| `20251124_001_trigger_delete_reception_reverse_stock.sql` | 2025-11-24 | CREATE           | DELETE handler pour réceptions             |
| `20251124_002_trigger_delete_shipment_reverse_stock.sql`  | 2025-11-24 | CREATE           | DELETE handler pour expéditions            |
| `20251124_003_trigger_update_reception_adjust_stock.sql`  | 2025-11-24 | CREATE           | UPDATE handler pour réceptions             |
| `20251124_004_trigger_update_shipment_adjust_stock.sql`   | 2025-11-24 | CREATE           | UPDATE handler pour expéditions            |
| `20251124_005_fix_stock_movements_reference_type.sql`     | 2025-11-24 | FIX              | Nettoie mouvements orphelins               |
| `20251124_006_cleanup_invalid_stock_movements.sql`        | 2025-11-24 | CLEANUP          | Supprime mouvements invalides              |
| `20251124_007_validate_stock_architecture.sql`            | 2025-11-24 | VALIDATE         | Vérifie intégrité architecture             |
| `20251124_011_restore_insert_triggers.sql`                | 2025-11-24 | CREATE           | INSERT handlers (réceptions + expéditions) |
| `20251124_012_reset_validate_stock.sql`                   | 2025-11-24 | RESET            | Reset stock=0 + final validation           |
| `20251125_001_add_forecasted_stock_on_po_validation.sql`  | 2025-11-25 | CREATE           | PO validation trigger CRITIQUE             |

---

## RÉSUMÉ TRIGGERS & FONCTIONS IDENTIFIÉS

### Architecture Triggers par Table

#### 1️⃣ Table: `purchase_orders`

| Trigger                              | Type         | Fonction                                     | Migration    | Statut    |
| ------------------------------------ | ------------ | -------------------------------------------- | ------------ | --------- |
| `trg_po_validation_forecasted_stock` | AFTER UPDATE | `update_forecasted_stock_on_po_validation()` | 20251125_001 | **ACTIF** |

**Logique** : Quand status change de `draft` → `validated` ou `validated` → `cancelled`:

- Incrémente `stock_forecasted_in` pour chaque item PO
- Décrémente si annulation

#### 2️⃣ Table: `purchase_order_receptions`

| Trigger                           | Type          | Fonction                             | Migration    | Statut    |
| --------------------------------- | ------------- | ------------------------------------ | ------------ | --------- |
| `trigger_reception_update_stock`  | AFTER INSERT  | `update_stock_on_reception()`        | 20251124_011 | **ACTIF** |
| `trigger_before_delete_reception` | BEFORE DELETE | `handle_reception_deletion()`        | 20251124_001 | **ACTIF** |
| `trigger_before_update_reception` | BEFORE UPDATE | `handle_reception_quantity_update()` | 20251124_003 | **ACTIF** |

**Logique** :

- INSERT : Augmente stock_real, crée mouvement stock
- DELETE : Diminue stock_real, supprime mouvement
- UPDATE : Ajuste stock_real si quantité change

#### 3️⃣ Table: `sales_order_shipments`

| Trigger                          | Type          | Fonction                            | Migration    | Statut    |
| -------------------------------- | ------------- | ----------------------------------- | ------------ | --------- |
| `trigger_shipment_update_stock`  | AFTER INSERT  | `update_stock_on_shipment()`        | 20251124_011 | **ACTIF** |
| `trigger_before_delete_shipment` | BEFORE DELETE | `handle_shipment_deletion()`        | 20251124_002 | **ACTIF** |
| `trigger_before_update_shipment` | BEFORE UPDATE | `handle_shipment_quantity_update()` | 20251124_004 | **ACTIF** |

**Logique** : Inversée à réceptions (sorties stock)

#### 4️⃣ Table: `stock_alert_tracking`

| Trigger                  | Type | Fonction | Migration    | Statut         |
| ------------------------ | ---- | -------- | ------------ | -------------- |
| `trg_update_stock_alert` | ?    | ?        | 20251012_001 | **À VÉRIFIER** |

**Statut** : Trigger mentionné dans migration 20251012 mais potentiellement supprimé par rollback 20251120

---

## CHAÎNES DE TRIGGERS IDENTIFIÉES

### Chaîne 1 : PO Validation → Stock Forecasted

```
USER: UPDATE purchase_orders
    SET status = 'validated'
    ↓
TRIGGER: trg_po_validation_forecasted_stock (AFTER UPDATE)
    ↓
FUNCTION: update_forecasted_stock_on_po_validation()
    FOR EACH purchase_order_item IN po.items:
        ↓
    OPERATION: UPDATE products
        SET stock_forecasted_in += item.quantity
    ↓
    ❓ Déclenche-t-il un trigger sur products ?
    ❓ Récalcul stock_alerts_view ?
```

**Risque** : Boucle potentielle si trigger sur `products.stock_forecasted_in` UPDATE

### Chaîne 2 : Réception → Stock Real

```
USER: INSERT purchase_order_receptions
    ↓
TRIGGER: trigger_reception_update_stock (AFTER INSERT)
    ↓
FUNCTION: update_stock_on_reception()
    ↓
OPERATIONS:
    1. UPDATE products (stock_real += qty)
    2. UPDATE products (stock_forecasted_in -= qty)
    3. INSERT stock_movements
    ↓
    ❓ UPDATE products → Trigger sur products ?
    ❓ INSERT stock_movements → Trigger sur stock_movements ?
```

**Risque** : Chaîne multiple UPDATEs = multiplication des triggers possibles

### Chaîne 3 : Suppression Réception → Cascades

```
USER: DELETE purchase_order_receptions
    ↓
TRIGGER: trigger_before_delete_reception (BEFORE DELETE)
    ↓
FUNCTION: handle_reception_deletion()
    ↓
OPERATIONS:
    1. UPDATE products (stock_real -= qty_received)
    2. DELETE stock_movements (reference_type='reception')
    ↓
    ❓ UPDATE products → Déclenche trigger ?
    ❓ DELETE stock_movements → Cascade sur autre table ?
```

**Risque** : Cascade impliquée + DELETE implicites

### Chaîne 4 : Stock Alerts (POTENTIELLEMENT ORPHELINE)

```
Migration 20251012 crée: trg_update_stock_alert
Migration 20251120 : DROP TRIGGER IF EXISTS (rollback)
Migration 20251124 : Aucun CREATE TRIGGER trg_update_stock_alert
    ↓
❌ Trigger SUPPRIMÉ → Orphelin ???
```

**État** : À vérifier - trigger peut avoir été recréé ailleurs

---

## ZONES CRITIQUES À INVESTIGUER

### 1. Boucles Infinies Potentielles

- [ ] UPDATE products → déclenche-t-il trigger sur products ?
- [ ] INSERT stock_movements → déclenche-t-il trigger ?
- [ ] UPDATE purchase_order_items → déclenche-t-il trigger ?

### 2. Triggers Orphelines ou Supprimées

- [ ] `trg_update_stock_alert` : PRÉSENTE ou SUPPRIMÉE ?
- [ ] Autres triggers sur `products` table ?
- [ ] Autres triggers sur `stock_movements` table ?

### 3. Ordre d'Application Migrations

- [ ] Migration 005 (reference_type fix) : appliquée avant ou après 007 ?
- [ ] Migration 007 validation : vérifie quoi exactement ?
- [ ] Migration 012 reset : nettoyage complet ?

### 4. Cohérence Stock

- [ ] stock_real + stock_forecasted_in + stock_forecasted_out = cohérent ?
- [ ] Double-comptage quand réception = augmente stock_real ET diminue stock_forecasted_in ?
- [ ] Orphelin stock_movements après DELETE ?

### 5. Performances

- [ ] Fonction `update_forecasted_stock_on_po_validation()` :
  - Boucle FOR N items
  - N UPDATE products (n fois)
  - Impact si N = 1000 items ?
  - Y a-t-il de BATCH UPDATE possible ?

---

## FONCTIONS TRIGGERS DÉTECTÉES

### Créées & Actives

1. **update_stock_on_reception()** - INSERT réceptions
   - Migration 20251124_011
   - Augmente stock_real
   - Diminue stock_forecasted_in
   - Crée mouvement

2. **update_stock_on_shipment()** - INSERT expéditions
   - Migration 20251124_011
   - Diminue stock_real (inversé)
   - Diminue stock_forecasted_out
   - Crée mouvement

3. **handle_reception_deletion()** - DELETE réceptions
   - Migration 20251124_001
   - Inverse update_stock_on_reception()
   - Supprime mouvement

4. **handle_shipment_deletion()** - DELETE expéditions
   - Migration 20251124_002
   - Inverse update_stock_on_shipment()
   - Supprime mouvement

5. **handle_reception_quantity_update()** - UPDATE réceptions
   - Migration 20251124_003
   - Ajuste delta stock_real
   - Met à jour mouvement

6. **handle_shipment_quantity_update()** - UPDATE expéditions
   - Migration 20251124_004
   - Ajuste delta inversé stock_real
   - Met à jour mouvement

7. **update_forecasted_stock_on_po_validation()** - UPDATE PO
   - Migration 20251125_001
   - **CRITIQUE POUR PURCHASE ORDERS**
   - Boucle FOR sur items

### Potentiellement Supprimées

1. **sync_stock_alert_tracking_v2()** - Alertes (DROPPED 20251120)
2. **validate_stock_alerts_on_po()** - PO validation (DROPPED 20251120)
3. **update_stock_on_reception()** (ancienne version) - Version initiale ?
4. **update_stock_on_shipment()** (ancienne version) - Version initiale ?

---

## TIMELINE ÉVÉNEMENTS CRITIQUES

```
2025-11-20 14:34:00 - Migration 20251120162000
   ↓ Rollback TOUS triggers + fonctions

2025-11-24 00:10:00 - Migrations 001-004
   ↓ Restaure handlers DELETE & UPDATE

2025-11-24 00:50:00 - Migrations 005-007
   ↓ Nettoie mouvements orphelins + validation

2025-11-24 10:30:00 - Migration 011
   ↓ Restaure triggers INSERT CRITIQUES

2025-11-24 15:00:00 - Migrations 012
   ↓ Reset stock + final validation

2025-11-25 08:00:00 - Migration 001 DERNIÈRE
   ↓ Ajoute PO validation trigger
   ↓ Cela déclenche stock_forecasted_in pour toute PO validée
```

**Observation** : Longue séquence de rollback + restore = risque de régression

---

## PHASE 2 : DIAGNOSTIC DÉTAILLÉ (À EXÉCUTER)

### Requêtes SQL de Vérification

```sql
-- 1. Vérifier triggers actuels
SELECT t.tgname, c.relname, pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname IN ('purchase_orders', 'purchase_order_items', 'purchase_order_receptions',
                     'sales_order_shipments', 'products', 'stock_movements', 'stock_alert_tracking')
ORDER BY c.relname, t.tgname;

-- 2. Vérifier fonctions trigger
SELECT p.proname, pg_get_functiondef(p.oid)
FROM pg_proc p
WHERE p.proname LIKE '%stock%'
   OR p.proname LIKE '%reception%'
   OR p.proname LIKE '%shipment%'
   OR p.proname LIKE '%alert%'
ORDER BY p.proname;

-- 3. Vérifier FK constraints + CASCADE
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name,
    rc.update_rule, rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('purchase_order_receptions', 'sales_order_shipments', 'stock_movements')
ORDER BY tc.table_name;

-- 4. Vérifier données stock actuelles (sample)
SELECT
    id, name, sku,
    stock_real, stock_forecasted_in, stock_forecasted_out,
    (stock_real + stock_forecasted_in - stock_forecasted_out) AS total_available
FROM products
LIMIT 10;

-- 5. Vérifier mouvements orphelins
SELECT
    COUNT(*),
    reference_type,
    COUNT(DISTINCT reference_id)
FROM stock_movements
GROUP BY reference_type;
```

### Validations à Faire

- [ ] Aucune boucle infinie ne se produit lors test INSERT réception
- [ ] Stock recalculé correctement (real + forecasted)
- [ ] Mouvements créés avec bon reference_type
- [ ] PO validation déclenche stock_forecasted_in
- [ ] Suppression réception ne cause pas erreur cascade
- [ ] Performance acceptable même avec 1000 items PO

---

## PHASE 3 : RAPPORT FINAL (À GÉNÉRER)

Rapport attendu inclura :

1. Tous les triggers actifs + leurs chaînes
2. Détection de boucles ou points faibles
3. Migrations requises dans quel ordre
4. Recommandations refactoring
5. Checklist validation données
6. Plan rollback si nécessaire
