# 📊 RAPPORT SESSION : Tests E2E Stocks & Corrections Triggers
**Date** : 2025-10-13
**Durée** : ~4h
**Objectif** : Valider workflows Purchase Orders + Sales Orders après résolution bug triplication

---

## 🎯 RÉSUMÉ EXÉCUTIF

### ✅ Succès
- **7 migrations** créées et appliquées avec succès (005-011)
- **3/3 tests Purchase Orders** validés (workflow complet, annulation, attente)
- **6 bugs critiques** découverts et corrigés
- **Architecture PO** confirmée correcte et fonctionnelle

### ⚠️ Blocages Découverts
- **Bug 12 critique** : Triple comptabilisation `stock_forecasted_out` (Sales Orders)
- **Architecture SO** : Duplication triggers + logique métier payment manquante
- **Tests SO** : 0/4 validés, nécessite refonte complète architecture

### 📈 Impact Business
- Purchase Orders : ✅ Prêt production
- Sales Orders : ❌ Blocage critique, corrections Phase 2-5 nécessaires
- Alertes Stock : ⏭️ Implémentation à venir

---

## 🐛 BUGS DÉCOUVERTS ET RÉSOLUS

### Bug 8 : recalculate_forecasted_stock - Filtre Quantity Change
**Symptôme** : `stock_forecasted_in` reste 20 au lieu de 0 après PO Received
**Cause** : Filtre `AND quantity_change > 0` exclut mouvements OUT forecast avec -20
**Solution** : Migration 008 - Supprimer filtre, inclure valeurs négatives
**Impact** : ✅ Annulation prévisionnels fonctionnelle, SUM correct (20 + (-20) = 0)

**Code Corrigé (Migration 008) :**
```sql
-- AVANT
SELECT COALESCE(SUM(quantity_change), 0) INTO v_forecast_in
WHERE affects_forecast = true
  AND forecast_type = 'in'
  AND quantity_change > 0;  -- ❌ Exclut -20

-- APRÈS
SELECT COALESCE(SUM(quantity_change), 0) INTO v_forecast_in
WHERE affects_forecast = true
  AND forecast_type = 'in';
  -- ✅ Inclut toutes valeurs
```

---

### Bug 9 : create_sales_order_forecast_movements - Colonne Inexistante
**Symptôme** : Erreur `record "v_order" has no field "validated_by"` lors SO Confirmed
**Cause** : Fonction cherche `validated_by` qui n'existe pas sur `sales_orders`
**Solution** : Migration 009 - Remplacer par `confirmed_by` (colonne réelle)
**Impact** : ✅ Transition SO Draft → Confirmed débloquée

**Code Corrigé (Migration 009) :**
```sql
-- AVANT
v_user_id := COALESCE(p_performed_by, v_order.validated_by, v_order.created_by);
                                       ^^^^^^^^^^^^^^^^^^^^^ ❌ N'existe pas

-- APRÈS
v_user_id := COALESCE(p_performed_by, v_order.confirmed_by, v_order.created_by);
                                       ^^^^^^^^^^^^^^^^^^^^^ ✅ Colonne réelle
```

---

### Bug 10 : create_sales_order_forecast_movements - Quantity Positif
**Symptôme** : Contrainte `valid_quantity_logic` violation lors INSERT mouvement OUT
**Cause** : `quantity_change = v_item.quantity` (positif 5) au lieu de négatif (-5)
**Solution** : Migration 010 - Utiliser `-v_item.quantity` pour mouvements OUT
**Impact** : ✅ Contrainte respectée, mouvements forecast OUT corrects

**Code Corrigé (Migration 010) :**
```sql
-- AVANT
INSERT INTO stock_movements (
    movement_type = 'OUT',
    quantity_change = v_item.quantity,  -- ❌ Positif (5)
)

-- APRÈS
INSERT INTO stock_movements (
    movement_type = 'OUT',
    quantity_change = -v_item.quantity,  -- ✅ Négatif (-5)
)
```

---

### Bug 11 : handle_sales_order_stock - Quantity + Doublons
**Symptôme** : Contrainte violation + risque doublons avec autre trigger
**Cause 1** : `quantity_change = v_item.quantity` (positif) au lieu de négatif
**Cause 2** : Pas de EXISTS check → 2 triggers créent 2x mouvements
**Solution** : Migration 011 - Quantity négatif + EXISTS check
**Impact** : ✅ Contrainte OK + Protection doublons ajoutée

**Code Corrigé (Migration 011) :**
```sql
-- FIX 1: EXISTS check
IF NOT EXISTS (
    SELECT 1 FROM stock_movements
    WHERE reference_type IN ('sales_order', 'sales_order_forecast')
    AND reference_id = NEW.id
    AND product_id = v_item.product_id
    AND affects_forecast = true
) THEN
    -- FIX 2: Quantity négatif
    INSERT INTO stock_movements (
        quantity_change = -v_item.quantity,  -- ✅ Négatif
    )
END IF;
```

---

### Bug 12 : Triple Comptabilisation stock_forecasted_out (CRITIQUE - NON RÉSOLU)
**Symptôme** : `stock_forecasted_out = 10` au lieu de 5 après SO Confirmed
**Cause Racine** : Triple comptabilisation par 3 sources différentes :
1. `create_sales_order_forecast_movements()` : UPDATE `products.stock_forecasted_out += 5`
2. `handle_sales_order_stock()` : UPDATE `products.stock_forecasted_out += 5`
3. Trigger `recalculate_forecasted_trigger` : UPDATE depuis SUM(quantity_change)

**Architecture Problématique** :
- 2 triggers concurrents sur `sales_orders` :
  * `sales_orders_stock_automation` → `create_sales_order_forecast_movements()`
  * `trigger_sales_order_stock` → `handle_sales_order_stock()`
- Même problème triplication que purchase_orders avant migration 003 !

**Impact Business** : ❌ Stock prévisionnel INCORRECT → Blocage tests SO → Blocage production

**Solution Planifiée** :
- **Migration 013** : DROP trigger `sales_orders_stock_automation` (garder 1 seul)
- **Migration 014** : Supprimer UPDATE direct `products` dans fonctions
- Laisser UNIQUEMENT trigger `recalculate_forecasted_trigger` calculer

**Statut** : ⏭️ À implémenter Phase 3

---

## 📊 MIGRATIONS APPLIQUÉES

| # | Nom | Date | Statut | Impact |
|---|-----|------|--------|--------|
| 005 | fix_valid_quantity_logic_constraint | 2025-10-13 | ✅ Appliquée | Autorise quantity_change < 0 pour forecast OUT |
| 006 | fix_handle_purchase_order_forecast_quantity_after | 2025-10-13 | ✅ Appliquée | Race condition quantity_before/after résolue |
| 007 | fix_maintain_stock_coherence_preserve_quantity_after | 2025-10-13 | ✅ Appliquée | Préserve quantity_after fourni par triggers |
| 008 | fix_recalculate_forecasted_stock_negative_values | 2025-10-13 | ✅ Appliquée | Inclut valeurs négatives dans SUM forecast |
| 009 | fix_sales_order_forecast_confirmed_by | 2025-10-13 | ✅ Appliquée | validated_by → confirmed_by (colonne correcte) |
| 010 | fix_sales_order_forecast_quantity_negative | 2025-10-13 | ✅ Appliquée | quantity_change négatif pour OUT forecast |
| 011 | fix_handle_sales_order_stock_quantity_negative_exists | 2025-10-13 | ✅ Appliquée | Quantity négatif + EXISTS check doublons |
| 012-016 | Refonte architecture Sales Orders | - | ⏭️ Planifiée | Logique métier payment + nettoyage triggers |

---

## ✅ TESTS VALIDÉS : Purchase Orders (3/3 PASS)

### PO-TEST-001 : Workflow Complet (Draft → Confirmed → Received)
**Scénario** : Fauteuil Milo Beige, 20 unités

**Résultats** :
- ✅ Draft → Confirmed : `stock_forecasted_in` = 0 → 20
- ✅ Confirmed → Received : `stock_real` = 0 → 20, `stock_forecasted_in` = 20 → 0
- ✅ 3 mouvements créés : IN forecast (+20), OUT forecast (-20), IN réel (+20)
- ✅ Validation mathématique : SUM forecast = 0, SUM réel = 20

**Workflow Validé** :
1. Confirmation → Prévisionnel +20
2. Réception → Annulation prévisionnel -20 + Stock réel +20
3. Résultat final : stock_real = 20, stock_forecasted_in = 0 ✅

---

### PO-TEST-002 : Workflow Annulation (Draft → Confirmed → Cancelled)
**Scénario** : Fauteuil Milo Blanc, 15 unités

**Résultats** :
- ✅ Draft → Confirmed : `stock_forecasted_in` = 0 → 15
- ✅ Confirmed → Cancelled : `stock_forecasted_in` = 15 → 0
- ✅ 2 mouvements créés : IN forecast (+15), OUT forecast (-15)
- ✅ Validation mathématique : SUM forecast = 0

**Workflow Validé** :
1. Confirmation → Prévisionnel +15
2. Annulation → Annulation prévisionnel -15
3. Résultat final : stock_forecasted_in = 0 ✅

---

### PO-TEST-003 : Commande En Attente (Draft → Confirmed)
**Scénario** : Fauteuil Milo Bleu, 10 unités

**Résultats** :
- ✅ Draft → Confirmed : `stock_forecasted_in` = 0 → 10
- ✅ Status reste `confirmed`, prévisionnel stable
- ✅ 1 mouvement créé : IN forecast (+10)
- ✅ `stock_real` inchangé (0) ✅

**Workflow Validé** :
1. Confirmation → Prévisionnel +10
2. Commande reste en attente
3. Résultat final : stock_forecasted_in = 10, stock_real = 0 ✅

---

## ❌ TESTS BLOQUÉS : Sales Orders (0/4)

### SO-TEST-001 : Tentative Draft → Confirmed
**Scénario** : Fauteuil Milo Beige, 5 unités, payment_status='pending'

**Résultats** :
- ❌ `stock_forecasted_out` = 10 au lieu de 5 (double comptabilisation)
- ❌ 1 mouvement créé mais UPDATE direct products × 2
- ❌ Bug 12 découvert : Triple comptabilisation architecture

**Blocage** : Architecture Sales Orders incorrecte, nécessite refonte complète

**Causes Identifiées** :
1. Duplication triggers (2 triggers créent 2× mouvements)
2. UPDATE direct `products` dans fonctions (au lieu de trigger recalculate)
3. Logique métier payment_required manquante (prépaiement vs encours)

**Solution** : Migrations 012-016 (Phases 2-5 du plan)

---

## 📝 DONNÉES TEST CRÉÉES

### Scripts SQL
- `TASKS/testing/cleanup_test_data.sql` : Nettoyage complet (DELETE ALL)
- `TASKS/testing/create_test_data.sql` : Création 3 PO + 3 SO

### Purchase Orders Créés
| PO Number | Product | Quantity | Workflow | Status Final |
|-----------|---------|----------|----------|--------------|
| PO-TEST-001 | Milo Beige | 20 | Draft → Confirmed → Received | received ✅ |
| PO-TEST-002 | Milo Blanc | 15 | Draft → Confirmed → Cancelled | cancelled ✅ |
| PO-TEST-003 | Milo Bleu | 10 | Draft → Confirmed (attente) | confirmed ✅ |

### Sales Orders Créés
| SO Number | Product | Quantity | Payment | Status | Tests |
|-----------|---------|----------|---------|--------|-------|
| SO-TEST-001 | Milo Beige | 5 | pending | draft → confirmed | ❌ Bloqué Bug 12 |
| SO-TEST-002 | Milo Blanc | 8 | pending | draft | ⏭️ Non testé |
| SO-TEST-003 | Milo Bleu | 3 | pending | draft | ⏭️ Non testé |

---

## 🏗️ ARCHITECTURE VALIDÉE : Purchase Orders

### Triggers Actifs
**1 seul trigger** : `purchase_order_forecast_trigger`
- Fonction : `handle_purchase_order_forecast()`
- Timing : AFTER UPDATE ON purchase_orders
- Workflow : Draft → Confirmed → Received/Cancelled

### Fonction handle_purchase_order_forecast()
**Cas 1 : PO Confirmed (status = 'confirmed')**
```sql
-- Créer mouvement prévisionnel IN
INSERT INTO stock_movements (
    movement_type = 'IN',
    quantity_change = v_item.quantity,
    affects_forecast = TRUE,
    forecast_type = 'in'
)
-- Trigger recalculate_forecasted_trigger met à jour products.stock_forecasted_in
```

**Cas 2 : PO Received (status = 'received')**
```sql
-- 1. Annuler prévisionnel
INSERT INTO stock_movements (
    movement_type = 'OUT',
    quantity_change = -v_item.quantity,  -- ✅ Négatif
    affects_forecast = TRUE,
    forecast_type = 'in'
)

-- 2. Ajouter stock réel
INSERT INTO stock_movements (
    movement_type = 'IN',
    quantity_change = v_item.quantity,
    quantity_before = v_stock_before,  -- ✅ Variable unique
    quantity_after = v_stock_before + v_item.quantity,  -- ✅ Cohérent
    affects_forecast = FALSE
)
-- Trigger maintain_stock_coherence met à jour products.stock_real
```

**Cas 3 : PO Cancelled (status = 'cancelled')**
```sql
-- Annuler prévisionnel
INSERT INTO stock_movements (
    movement_type = 'OUT',
    quantity_change = -v_item.quantity,  -- ✅ Négatif
    affects_forecast = TRUE,
    forecast_type = 'in'
)
```

### Séparation Réel vs Prévisionnel
**Trigger stock_movements AFTER INSERT :**
- `affects_forecast = FALSE` → `maintain_stock_coherence()` → UPDATE `stock_real`
- `affects_forecast = TRUE` → `recalculate_forecasted_stock()` → UPDATE `stock_forecasted_in/out`

**Architecture Propre** : 1 trigger PO + 2 triggers stock_movements = Séparation claire ✅

---

## ❌ ARCHITECTURE PROBLÉMATIQUE : Sales Orders

### Triggers Actifs (DUPLICATION)
**2 triggers concurrents** :
1. `sales_orders_stock_automation` → `create_sales_order_forecast_movements()`
2. `trigger_sales_order_stock` → `handle_sales_order_stock()`

**Problème** : Les 2 créent des mouvements forecast pour MÊME événement (SO Confirmed)

### Fonction create_sales_order_forecast_movements()
```sql
-- Appelée par sales_orders_stock_automation
FOR v_item IN sales_order_items LOOP
    -- Pas de EXISTS check ❌
    INSERT INTO stock_movements (
        quantity_change = -v_item.quantity,  -- ✅ Corrigé migration 010
        affects_forecast = TRUE
    );

    -- ❌ UPDATE DIRECT products (cause triple comptabilisation)
    UPDATE products
    SET stock_forecasted_out = stock_forecasted_out + v_item.quantity;
END LOOP;
```

### Fonction handle_sales_order_stock()
```sql
-- Appelée par trigger_sales_order_stock
IF NEW.status = 'confirmed' AND (payment_status = 'pending' OR 'partial') THEN
    FOR v_item IN sales_order_items LOOP
        -- ✅ EXISTS check ajouté migration 011
        IF NOT EXISTS (...) THEN
            INSERT INTO stock_movements (
                quantity_change = -v_item.quantity,  -- ✅ Corrigé migration 011
                affects_forecast = TRUE
            );

            -- ❌ UPDATE DIRECT products (cause triple comptabilisation)
            UPDATE products
            SET stock_forecasted_out = stock_forecasted_out + v_item.quantity;
        END IF;
    END LOOP;
END IF;
```

### Triple Comptabilisation Découverte
**Résultat pour SO 5 unités** :
1. `create_sales_order_forecast_movements()` : INSERT mouvement -5 + UPDATE products +5
2. `handle_sales_order_stock()` : INSERT mouvement -5 (bloqué EXISTS) + UPDATE products +5
3. Trigger `recalculate_forecasted_trigger` : UPDATE products = SUM(-5 + 0) = 5 (mais déjà +10 via UPDATE directs)
4. **Total** : stock_forecasted_out = 10 au lieu de 5 ❌

---

## 🎯 LOGIQUE MÉTIER VÉRONE (Clarifiée Session)

### Purchase Orders (Fournisseurs) - SIMPLE
**Workflow Unique** :
1. Draft → Confirmed : Prévisionnel +quantity
2. Confirmed → Received : Réel +quantity, Prévisionnel -quantity
3. Confirmed → Cancelled : Prévisionnel -quantity

**Règle** : Pas de payment, pas de distinction client, simple et efficace ✅

---

### Sales Orders (Clients B2B) - DEUX WORKFLOWS

**Workflow A - Client PRÉPAIEMENT (payment_required=TRUE) :**
1. Draft → Confirmed : `stock_forecasted_out` +quantity (réservation)
2. Attend `payment_status='paid'`
3. Paid → Warehouse Exit : `stock_real` -quantity + `stock_forecasted_out` -quantity
4. Si stock insuffisant → Alerte + Suggérer PO fournisseur

**Workflow B - Client ENCOURS (payment_required=FALSE) :**
1. Draft → Confirmed : Validation AUTOMATIQUE
2. Confirmed = `ready_for_shipment=TRUE`
3. Warehouse Exit IMMÉDIAT : `stock_real` -quantity (SANS prévisionnel)
4. Si stock insuffisant → Alerte + Suggérer PO fournisseur

**Règle Métier** : Distinction prépaiement vs encours CRITIQUE pour workflow correct

---

### Alertes Stock (À Implémenter)
**Trigger après chaque mouvement** :
```sql
stock_disponible = stock_real + stock_forecasted_in - stock_forecasted_out

IF quantity_commandée > stock_disponible THEN
    -- Notification alerte stock
    -- Suggestion PO fournisseur
END IF;
```

**Impact** : Anticipation ruptures stock, optimisation commandes fournisseurs

---

## 📋 PROCHAINES ÉTAPES (Phases 2-5)

### Phase 2 : Investigation Database (10 min)
- **Migration 012** : Script documentation schéma (readonly)
  * Query colonnes `sales_orders` (payment_required? payment_terms?)
  * Query colonnes `organisations` (payment_terms? payment_conditions?)
  * Documenter triggers actifs sur sales_orders
  * Vérifier enum `sales_order_status` valeurs actuelles

### Phase 3 : Nettoyage Architecture (20 min)
- **Migration 013** : DROP trigger `sales_orders_stock_automation`
  * Garder UNIQUEMENT `trigger_sales_order_stock` (plus complet)
  * Même approche que purchase_orders migration 003

- **Migration 014** : Supprimer UPDATE direct `products`
  * `create_sales_order_forecast_movements()` : Supprimer ligne UPDATE
  * `handle_sales_order_stock()` : Supprimer toutes lignes UPDATE
  * Laisser UNIQUEMENT trigger `recalculate_forecasted_trigger` calculer

- **Test** : Vérifier `stock_forecasted_out` = 1× quantity (pas 2× ou 3×)

### Phase 4 : Logique Métier Payment (30 min)
- **Migration 015** : Ajouter/vérifier colonne `payment_required`
  * Si manquante : `ALTER TABLE sales_orders ADD COLUMN payment_required BOOLEAN DEFAULT TRUE`
  * Calculer depuis `organisations.payment_terms` si existe

- **Migration 016** : Réécrire `handle_sales_order_stock()` avec logique correcte
  * Workflow A (payment_required=TRUE) : Forecast → Paid → Livraison
  * Workflow B (payment_required=FALSE) : Validation auto → Livraison directe

### Phase 5 : Tests E2E Complets (30 min)
- **Cleanup** : Supprimer données test actuelles (SO avec stocks incorrects)
- **Tests Prépaiement (2 tests)** :
  * SO-PREPAY-001 : Draft → Confirmed (forecast) → Paid → Shipped (réel)
  * SO-PREPAY-002 : Draft → Confirmed (forecast) → Cancelled
- **Tests Encours (2 tests)** :
  * SO-ENCOURS-001 : Draft → Confirmed (réel direct) → Shipped
  * SO-ENCOURS-002 : Draft → Confirmed (réel) → Cancelled (restauration)
- **Validation** : Stocks + mouvements + 0 doublons
- **Rapport final** : Tests E2E 4/4 PASS

---

## 📊 MÉTRIQUES SESSION

### Bugs Résolus
- **6 bugs critiques** corrigés (migrations 005-011)
- **7 migrations** créées et appliquées avec succès
- **1 bug critique** découvert et documenté (Bug 12, à résoudre Phases 2-5)

### Tests Validés
- **Purchase Orders** : 3/3 tests PASS (100%)
- **Sales Orders** : 0/4 tests (blocage Bug 12)

### Migrations Appliquées
- **Migrations 005-011** : 7/7 appliquées (100%)
- **Migrations 012-016** : 0/5 appliquées (planifiées Phases 2-5)

### Temps Investi
- **Session actuelle** : ~4h (investigation + corrections + tests PO)
- **Estimation Phases 2-5** : ~1h30 (nettoyage + logique métier + tests SO)
- **Total projet** : ~5h30

### Documentation Créée
- **Rapport session** : 1 fichier complet (ce document)
- **Scripts test** : 2 scripts SQL (cleanup + create)
- **Migrations** : 7 fichiers migration détaillés

---

## 🏆 CONCLUSION

### Succès
- ✅ Architecture Purchase Orders validée et fonctionnelle
- ✅ 3/3 workflows PO testés et approuvés
- ✅ 6 bugs critiques résolus méthodiquement
- ✅ Compréhension logique métier Vérone clarifiée

### Leçons Apprises
1. **Duplication triggers = Bug systématique** (PO migration 003, SO à venir migration 013)
2. **UPDATE direct products = Triple comptabilisation** (laisser triggers calculer)
3. **Race conditions quantity_before/after** (utiliser variable unique)
4. **Logique métier payment critique** (prépaiement vs encours workflows différents)

### Blocages Résolus
- ❌ Triplication stocks PO → ✅ Résolu migration 003 (session précédente)
- ❌ Contrainte valid_quantity_logic → ✅ Résolu migration 005
- ❌ Race condition quantity_after → ✅ Résolu migration 006
- ❌ Overwrite quantity_after → ✅ Résolu migration 007
- ❌ Filtre quantity_change forecast → ✅ Résolu migration 008

### Prochaine Session
- **Priorité P0** : Résoudre Bug 12 (triple comptabilisation SO)
- **Objectif** : 4/4 tests Sales Orders validés
- **Livrable** : Architecture SO correcte + Logique métier payment implémentée

---

**🎯 STATUT FINAL SESSION** : Purchase Orders ✅ Production Ready | Sales Orders ⏭️ Corrections Nécessaires

**📅 Prochaine étape** : Phase 2 - Investigation Database (Migration 012)
