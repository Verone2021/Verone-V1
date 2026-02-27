# 🔍 AUDIT COMPLET - TRIGGERS DE GESTION DES ALERTES STOCK

**Date** : 2025-11-12
**Auditeur** : Claude Code (MCP Sequential Thinking)
**Scope** : Triggers entre products ↔ stock_movements ↔ stock_alert_tracking ↔ purchase_orders ↔ sales_orders
**Méthode** : Analyse systématique des migrations + Sequential Thinking (25 pensées)

---

## 📋 RÉSUMÉ EXÉCUTIF

### ✅ Points Positifs Identifiés

1. **Architecture Unifiée Moderne** : Le système utilise un trigger unifié `maintain_stock_from_movements()` (depuis 2025-11-03) qui remplace les anciens triggers conflictuels - **Excellente décision architecturale**

2. **Algorithme Différentiel Idempotent** : Les réceptions partielles de commandes fournisseurs utilisent un algorithme différentiel qui évite les doublons - **Robuste et testé**

3. **Gestion Complète des Annulations** : Les annulations de PO et SO sont bien gérées avec libération des mouvements forecasted - **Logique correcte**

4. **Tracking des Drafts** : 3 triggers dédiés au tracking des produits dans les commandes draft pour l'interface utilisateur - **Fonctionnel**

5. **Validation Automatique des Alertes** : Le concept de validation automatique des alertes lors de la confirmation de PO existe - **Bonne idée métier**

### ❌ Bugs Critiques Identifiés

**7 bugs identifiés** répartis en 3 niveaux de priorité :

- **2 bugs P0** (CRITIQUE - Bloquants fonctionnalité)
- **2 bugs P1** (HAUTE - Incohérences logique)
- **3 bugs P2** (MOYENNE - Performance/Concurrence)

### 🎯 Impact Utilisateur Actuel

**🔴 HAUTE SÉVÉRITÉ** :

- Les alertes de stock sont créées avec le **mauvais critère** (stock réel au lieu de stock prévisionnel)
- Les commandes clients expédiées laissent des **réservations fantômes** dans forecasted_out
- Les utilisateurs voient des **alertes incorrectes** (faux positifs et faux négatifs)

**🟡 MOYENNE SÉVÉRITÉ** :

- Annulation de PO partiellement reçues calcule mal la quantité à libérer (utilise ABS() incorrectement)
- Validation automatique des alertes ne fonctionne pas (race condition entre triggers)

### 📊 Estimation Corrections

- **Durée totale** : 6-9 heures de travail
- **Phase 1 (P0 - URGENT)** : 2-3 heures
- **Phase 2 (P1 - IMPORTANTE)** : 1-2 heures
- **Phase 3 (P2 - OPTIMISATION)** : 2-3 heures
- **Phase 4 (DOCUMENTATION)** : 1 heure

---

## 🔴 BUGS PRIORITÉ P0 - CRITIQUES (2 bugs)

### BUG #1 : Calcul Incorrect du Stock Prévisionnel dans sync_stock_alert_tracking()

**Fichier** : `supabase/migrations/20251104_102_stock_alerts_tracking_triggers.sql`

**Problème Identifié** :

Le trigger compare `stock_real < min_stock` au lieu de calculer le stock prévisionnel :

```sql
-- ❌ CODE ACTUEL (INCORRECT)
IF NEW.stock_real < COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
  v_alert_type := 'low_stock';
END IF;
```

**Exigence Business** :

> "Une alerte est déclenchée lorsque le stock prévisionnel (stock_real - stock_forecasted_out + stock_forecasted_in) descend en dessous ou égal au seuil min_stock."

**Code Correct Attendu** :

```sql
-- ✅ CODE CORRIGÉ
v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

IF v_forecasted_stock <= COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
  v_alert_type := 'low_stock';
  v_shortage := COALESCE(NEW.min_stock, 0) - v_forecasted_stock;
END IF;
```

**Exemple Concret du Bug** :

| Scénario | stock_real | forecasted_out | forecasted_in | min_stock | Stock Prévisionnel Réel | Comportement Actuel       | Comportement Attendu      |
| -------- | ---------- | -------------- | ------------- | --------- | ----------------------- | ------------------------- | ------------------------- |
| Cas 1    | 20         | 15             | 0             | 15        | 20 - 15 + 0 = **5**     | ❌ Pas d'alerte (20 > 15) | ✅ Alerte (5 < 15)        |
| Cas 2    | 10         | 5              | 20            | 15        | 10 - 5 + 20 = **25**    | ✅ Pas d'alerte (10 < 15) | ✅ Pas d'alerte (25 > 15) |
| Cas 3    | 5          | 0              | 0             | 10        | 5 - 0 + 0 = **5**       | ✅ Alerte (5 < 10)        | ✅ Alerte (5 < 10)        |

**Impact** :

- 🔥 **Faux négatifs** : Produits en rupture prévue mais sans alerte (Cas 1)
- 🔥 **Faux positifs** : Alertes créées alors que stock suffisant prévu (Cas 2)
- 💰 **Impact business** : Commandes fournisseurs urgentes créées inutilement OU produits en rupture non détectés

**Priorité** : 🔴 **P0 - CRITIQUE**

**Correction** : Migration `20251113_001_fix_stock_alert_forecasted_calculation.sql` (détaillée en Phase 1)

---

### BUG #2 : Forecasted_out Non Libéré lors de l'Expédition Sales Order

**Fichier** : `supabase/migrations/20251014_028_fix_quantity_after_negative_bug.sql`

**Problème Identifié** :

Lors de l'expédition d'une commande client (warehouse_exit_at filled), le trigger crée uniquement un mouvement OUT réel mais **ne libère PAS le forecasted_out**.

**Séquence Actuelle (INCORRECTE)** :

```
1. SO draft → confirmed :
   → Mouvement : -10, affects_forecast=true, forecast_type='out' (RÉSERVATION)
   → forecasted_out = +10

2. SO confirmed → shipped (warehouse_exit_at filled) :
   → Mouvement : -10, affects_forecast=false (SORTIE RÉELLE)
   → stock_real = -10
   → forecasted_out = +10 (PAS LIBÉRÉ ❌)

3. Résultat :
   → Stock prévisionnel = stock_real - forecasted_out + forecasted_in
   → Stock prévisionnel = X - 10 - 10 = X - 20 (DOUBLE COMPTABILISATION ❌)
```

**Séquence Attendue (CORRECTE)** :

```
1. SO draft → confirmed :
   → Mouvement : -10, affects_forecast=true, forecast_type='out'
   → forecasted_out = +10

2. SO confirmed → shipped (warehouse_exit_at filled) :
   → Mouvement 1 : +10, affects_forecast=true, forecast_type='out' (LIBÉRATION ✅)
   → Mouvement 2 : -10, affects_forecast=false (SORTIE RÉELLE)
   → forecasted_out = 0 (libéré)
   → stock_real = -10

3. Résultat :
   → Stock prévisionnel = stock_real - 0 + forecasted_in = X - 10 (CORRECT ✅)
```

**Code Actuel (INCOMPLET)** :

```sql
-- Case 4: Expédition
IF NEW.warehouse_exit_at IS NOT NULL AND OLD.warehouse_exit_at IS NULL THEN
  FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
    -- ❌ Crée seulement mouvement réel, oublie de libérer forecasted
    INSERT INTO stock_movements (
      product_id, quantity_change, movement_type,
      affects_forecast, forecast_type,
      reference_type, reference_id
    ) VALUES (
      v_item.product_id, -v_item.quantity, 'OUT',
      false, NULL,  -- Mouvement réel
      'sales_order', NEW.id
    );
  END LOOP;
END IF;
```

**Impact** :

- 🔥 **Double comptabilisation** du stock sorti (réservation + sortie réelle)
- 🔥 **Stock prévisionnel incorrect** → Alertes incorrectes (faux positifs)
- 💰 **Impact business** : Commandes fournisseurs urgentes créées inutilement car système pense stock plus bas qu'il ne l'est

**Priorité** : 🔴 **P0 - CRITIQUE**

**Correction** : Migration `20251113_002_fix_sales_order_release_forecasted_on_shipment.sql` (détaillée en Phase 1)

---

## 🟠 BUGS PRIORITÉ P1 - HAUTE (2 bugs)

### BUG #3 : Incohérence Création vs Validation Alertes

**Fichiers** :

- `supabase/migrations/20251104_102_stock_alerts_tracking_triggers.sql` (création)
- `supabase/migrations/20251111_002_stock_forecasted_alert_validation.sql` (validation)

**Problème Identifié** :

Le trigger `sync_stock_alert_tracking()` crée les alertes avec un critère, mais `validate_stock_alerts_on_purchase_order_validation()` valide avec un autre critère :

```sql
-- ❌ CRÉATION (Bug #1) : Utilise stock_real
IF NEW.stock_real < COALESCE(NEW.min_stock, 0) THEN
  -- Créer alerte
END IF;

-- ✅ VALIDATION : Utilise stock prévisionnel (CORRECT)
v_forecasted_stock := v_product.stock_real - v_product.stock_forecasted_out + v_product.stock_forecasted_in;

IF v_forecasted_stock >= COALESCE(v_product.min_stock, 0) THEN
  -- Valider alerte
END IF;
```

**Impact** :

- Les alertes qui ne sont jamais créées (Bug #1) ne peuvent jamais être validées
- Les alertes créées à tort peuvent être validées correctement

**Priorité** : 🟠 **P1 - HAUTE**

**Correction** : Ce bug sera **résolu automatiquement** par la correction du Bug #1. Aucune migration supplémentaire nécessaire.

---

### BUG #4 : Calcul Incorrect lors de l'Annulation PO Partiellement Reçue

**Fichier** : `supabase/migrations/20251030_004_fix_second_reception_trigger.sql`

**Problème Identifié** :

Le trigger utilise `SUM(ABS(quantity_change))` pour calculer la quantité forecasted à annuler, ce qui additionne au lieu de calculer le net :

```sql
-- ❌ CODE ACTUEL (INCORRECT)
SELECT COALESCE(SUM(ABS(quantity_change)), 0)
INTO v_forecasted_qty
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = NEW.id
  AND affects_forecast = true
  AND forecast_type = 'in';

-- Crée mouvement d'annulation
INSERT INTO stock_movements (..., -v_forecasted_qty, 'OUT', true, 'in', ...);
```

**Exemple Concret du Bug** :

```
Scénario : PO de 100 unités, réception partielle de 30 unités, puis annulation

Mouvements existants :
- Mouvement 1 (confirmation) : +100 forecasted_in
- Mouvement 2 (réception partielle) : -30 forecasted_in (libération), +30 real

Calcul actuel (INCORRECT) :
- SUM(ABS(quantity_change)) = ABS(+100) + ABS(-30) = 100 + 30 = 130 ❌
- Mouvement d'annulation : -130 forecasted_in
- Solde final : 100 - 30 - 130 = -60 (NÉGATIF INCORRECT ❌)

Calcul attendu (CORRECT) :
- SUM(quantity_change) WHERE quantity_change > 0 = 100
- Déjà libéré : 30
- À annuler : 100 - 30 = 70 ✅
- Mouvement d'annulation : -70 forecasted_in
- Solde final : 100 - 30 - 70 = 0 (CORRECT ✅)
```

**Impact** :

- 🟡 **Surestimation** de la quantité à annuler
- 🟡 **Stock forecasted_in négatif** (impossible logiquement)
- 💰 **Impact business** : Stock prévisionnel incorrect après annulation PO partiellement reçue

**Priorité** : 🟠 **P1 - HAUTE**

**Correction** : Migration `20251113_003_fix_purchase_order_cancellation_calculation.sql` (détaillée en Phase 2)

---

## 🟡 BUGS PRIORITÉ P2 - PERFORMANCE/CONCURRENCE (3 bugs)

### BUG #5 : Race Condition Validation Alertes

**Fichiers** :

- `supabase/migrations/20251030_004_fix_second_reception_trigger.sql` (handle_purchase_order_forecast)
- `supabase/migrations/20251111_002_stock_forecasted_alert_validation.sql` (validate_stock_alerts)

**Problème Identifié** :

Les deux triggers s'exécutent sur le **même événement** (purchase_orders AFTER UPDATE), créant une race condition :

```
Séquence problématique :

T1 : UPDATE purchase_orders SET status='confirmed'

T2 : Trigger 1 (handle_purchase_order_forecast) :
     → INSERT INTO stock_movements (+20 forecasted_in)

T3 : Trigger 2 (validate_stock_alerts) :
     → SELECT stock_forecasted_in FROM products
     → LIT 0 (PAS ENCORE MIS À JOUR ❌)

T4 : Trigger 3 (maintain_stock_from_movements) :
     → UPDATE products SET stock_forecasted_in = 20

T5 : Trigger 4 (sync_stock_alert_tracking) :
     → Recalcule alertes
```

**Impact** :

- 🟡 Les alertes ne sont **jamais validées automatiquement**
- 🟡 L'utilisateur doit valider manuellement (workaround fonctionnel)
- 💼 **Impact UX** : Alertes restent rouges alors qu'elles devraient passer vertes

**Priorité** : 🟡 **P2 - MOYENNE**

**Correction** : Migration `20251113_004_fix_alert_validation_race_condition.sql` (détaillée en Phase 3)

**Solution** :

- Option A : Déplacer validation dans trigger AFTER products UPDATE (après maintain_stock_from_movements)
- Option B : Lire directement depuis stock_movements au lieu de products
- Option C : Utiliser DEFERRED trigger (plus complexe)

---

### BUG #6 : Lost Updates dans maintain_stock_from_movements()

**Fichier** : `supabase/migrations/20251103_003_trigger_unique_stock_source_of_truth.sql`

**Problème Identifié** :

Le trigger fait SELECT SUM puis UPDATE sans LOCK, créant un risque de lost updates :

```sql
-- ❌ CODE ACTUEL (SANS LOCK)
CREATE OR REPLACE FUNCTION maintain_stock_from_movements()
RETURNS TRIGGER AS $$
BEGIN
  -- SELECT sans LOCK
  SELECT COALESCE(SUM(quantity_change), 0)
  INTO v_calculated_stock_real
  FROM stock_movements
  WHERE product_id = v_product_id AND affects_forecast = false;

  -- UPDATE peut écraser autre transaction
  UPDATE products SET stock_real = v_calculated_stock_real WHERE id = v_product_id;

  RETURN NEW;
END;
$$;
```

**Scénario de Lost Update** :

```
Produit initial : stock_real = 100

Transaction A :                    Transaction B :
INSERT movement +10                INSERT movement +20
→ SELECT SUM = 110                 → SELECT SUM = 110 (lit avant UPDATE de A)
→ UPDATE stock_real = 110          → UPDATE stock_real = 120 (écrase A)

Résultat final : stock_real = 120 ❌
Résultat attendu : stock_real = 130 ✅

→ Mouvement de A perdu !
```

**Impact** :

- 🟡 **Mouvements perdus** si transactions concurrentes
- 🟡 **Probabilité faible** en pratique (dépend de la charge)
- 💼 **Impact business** : Stock incorrect si plusieurs réceptions/expéditions simultanées

**Priorité** : 🟡 **P2 - MOYENNE**

**Correction** : Migration `20251113_005_add_locking_maintain_stock_from_movements.sql` (détaillée en Phase 3)

**Solution** :

```sql
-- ✅ CODE CORRIGÉ (AVEC LOCK)
UPDATE products
SET
  stock_real = (
    SELECT COALESCE(SUM(quantity_change), 0)
    FROM stock_movements
    WHERE product_id = v_product_id AND affects_forecast = false
  ),
  stock_forecasted_in = ...,
  stock_forecasted_out = ...
WHERE id = v_product_id;

-- OU utiliser SELECT ... FOR UPDATE
```

---

### BUG #7 : sync_stock_alert_tracking() se Déclenche sur Tous UPDATE products

**Fichier** : `supabase/migrations/20251104_102_stock_alerts_tracking_triggers.sql`

**Problème Identifié** :

Le trigger n'a pas de clause WHEN pour filtrer les champs pertinents :

```sql
-- ❌ TRIGGER ACTUEL (PAS DE FILTRAGE)
CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();
```

**Impact** :

- 🟢 **Performance dégradée** : Trigger exécuté même si on modifie products.name ou products.description
- 🟢 **Pas de bug fonctionnel** : Le trigger filtre correctement en interne, mais après exécution inutile
- 💼 **Impact business** : Ralentissement léger des UPDATE products non liés au stock

**Priorité** : 🟡 **P2 - BASSE**

**Correction** : Migration `20251113_006_optimize_sync_stock_alert_tracking_trigger.sql` (détaillée en Phase 3)

**Solution** :

```sql
-- ✅ TRIGGER OPTIMISÉ (AVEC FILTRAGE)
CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  WHEN (
    NEW.stock_real IS DISTINCT FROM OLD.stock_real OR
    NEW.stock_forecasted_in IS DISTINCT FROM OLD.stock_forecasted_in OR
    NEW.stock_forecasted_out IS DISTINCT FROM OLD.stock_forecasted_out OR
    NEW.min_stock IS DISTINCT FROM OLD.min_stock OR
    NEW.product_status IS DISTINCT FROM OLD.product_status OR
    TG_OP = 'INSERT'
  )
  EXECUTE FUNCTION sync_stock_alert_tracking();
```

---

## 📚 DOCUMENTATION OBSOLÈTE

### DOC #1 : triggers.md Mentionne Triggers Supprimés

**Fichier** : `docs/database/triggers.md`

**Problème** :

La documentation mentionne "10 triggers" pour stock movements et référence des triggers supprimés le 2025-11-03 :

- `maintain_stock_coherence` (supprimé)
- `trigger_maintain_stock_totals` (supprimé)
- Potentiellement d'autres anciens triggers

**Impact** :

- 📖 **Confusion développeurs** : La documentation ne correspond plus au code
- 📖 **Erreurs potentielles** : Un développeur pourrait chercher un trigger qui n'existe plus

**Correction** : Phase 4 - Mettre à jour documentation avec trigger unifié actuel

---

## 📋 PLAN D'ACTION DÉTAILLÉ

### 🔴 PHASE 1 : CORRECTIONS CRITIQUES (P0) - URGENT

**Durée estimée** : 2-3 heures

---

#### ÉTAPE 1.1 : Correction sync_stock_alert_tracking() - Calcul Stock Prévisionnel

**Objectif** : Corriger le calcul du seuil d'alerte pour utiliser le stock prévisionnel

**Fichier à créer** : `supabase/migrations/20251113_001_fix_stock_alert_forecasted_calculation.sql`

**Changements détaillés** :

```sql
-- Migration: Fix sync_stock_alert_tracking to use forecasted stock
-- Bug: Trigger uses stock_real < min_stock instead of forecasted stock
-- Impact: False positives and false negatives in alerts
-- Priority: P0 - CRITICAL

DROP FUNCTION IF EXISTS sync_stock_alert_tracking() CASCADE;

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER AS $$
DECLARE
  v_supplier_id uuid;
  v_product_status text;
  v_alert_type TEXT;
  v_alert_priority INTEGER;
  v_shortage INTEGER;
  v_forecasted_stock INTEGER; -- ✅ NOUVEAU
BEGIN
  -- Récupérer supplier_id et product_status
  SELECT supplier_id, product_status
  INTO v_supplier_id, v_product_status
  FROM products
  WHERE id = NEW.id;

  -- Filtre UNIQUEMENT produits actifs
  IF v_product_status IS DISTINCT FROM 'active' THEN
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- ✅ CALCUL DU STOCK PRÉVISIONNEL (CORRECTION PRINCIPALE)
  v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

  -- ✅ CALCUL TYPE ET PRIORITÉ AVEC STOCK PRÉVISIONNEL
  IF v_forecasted_stock <= 0 AND NEW.stock_forecasted_out > 0 THEN
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3;
    v_shortage := NEW.stock_forecasted_out;
  ELSIF v_forecasted_stock <= 0 THEN
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3;
    v_shortage := COALESCE(NEW.min_stock, 0);
  ELSIF v_forecasted_stock <= COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    v_alert_type := 'low_stock';
    v_alert_priority := 2;
    v_shortage := COALESCE(NEW.min_stock, 0) - v_forecasted_stock;
  ELSE
    -- Stock suffisant, supprimer alerte
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- Insert or update alert
  INSERT INTO stock_alert_tracking (
    product_id,
    supplier_id,
    alert_type,
    priority,
    shortage,
    detected_at,
    validated,
    validated_at
  ) VALUES (
    NEW.id,
    v_supplier_id,
    v_alert_type,
    v_alert_priority,
    v_shortage,
    NOW(),
    false,
    NULL
  )
  ON CONFLICT (product_id) DO UPDATE SET
    supplier_id = EXCLUDED.supplier_id,
    alert_type = EXCLUDED.alert_type,
    priority = EXCLUDED.priority,
    shortage = EXCLUDED.shortage,
    detected_at = EXCLUDED.detected_at,
    validated = false,
    validated_at = NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer trigger
CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_stock_alert_tracking();

-- ✅ DATA FIX : Recalculer toutes les alertes existantes avec nouvelle logique
UPDATE products SET stock_real = stock_real WHERE product_status = 'active';

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Calcule et maintient les alertes de stock basées sur le stock prévisionnel (stock_real - forecasted_out + forecasted_in).
CORRECTION 2025-11-13 : Utilise stock prévisionnel au lieu de stock_real.';
```

**Test SQL de Validation** :

```sql
-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 1.1 : Validation Calcul Stock Prévisionnel
-- ═══════════════════════════════════════════════════

BEGIN;

-- SETUP : Créer produit test avec stock prévisionnel bas
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  'test-p1', 'TEST-001', 'Produit Test 1', 15,
  20, 15, 0,  -- Stock prévisionnel = 20 - 15 + 0 = 5 < 15 → ALERTE
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- TEST 1 : Vérifier alerte créée
SELECT
  'TEST 1 : Alerte créée' AS test,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte non créée'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p1';

-- TEST 2 : Vérifier type alerte = low_stock
SELECT
  'TEST 2 : Type alerte' AS test,
  CASE
    WHEN alert_type = 'low_stock' THEN '✅ PASS'
    ELSE '❌ FAIL - Type = ' || alert_type
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p1';

-- TEST 3 : Vérifier shortage = 10 (15 - 5)
SELECT
  'TEST 3 : Shortage' AS test,
  CASE
    WHEN shortage = 10 THEN '✅ PASS'
    ELSE '❌ FAIL - Shortage = ' || shortage::text
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p1';

-- TEST 4 : Vérifier priorité = 2 (warning)
SELECT
  'TEST 4 : Priorité' AS test,
  CASE
    WHEN priority = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Priority = ' || priority::text
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p1';

-- TEST 5 : Modifier forecasted_in pour augmenter stock prévisionnel
UPDATE products SET stock_forecasted_in = 20 WHERE id = 'test-p1';
-- Stock prévisionnel = 20 - 15 + 20 = 25 > 15 → PAS D'ALERTE

SELECT
  'TEST 5 : Alerte supprimée' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte encore présente'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p1';

-- TEST 6 : Cas stock_real = 0 mais forecasted_in élevé (pas d'alerte)
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status
) VALUES (
  'test-p2', 'TEST-002', 'Produit Test 2', 10,
  0, 0, 30,  -- Stock prévisionnel = 0 - 0 + 30 = 30 > 10 → PAS D'ALERTE
  'active'
);

SELECT
  'TEST 6 : Pas alerte si forecasted_in élevé' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte créée à tort'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p2';

-- CLEANUP
ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSULTAT ATTENDU : 6 tests ✅ PASS
-- ═══════════════════════════════════════════════════
```

**Commande d'application** :

```bash
# Appliquer la migration
supabase db push

# Vérifier fonction créée
psql $DATABASE_URL -c "\df sync_stock_alert_tracking"

# Vérifier trigger créé
psql $DATABASE_URL -c "\d products" | grep trigger_sync_stock_alert_tracking

# Exécuter tests de validation
psql $DATABASE_URL -f tests/validate_etape_1_1.sql
```

**Rollback en cas de problème** :

```sql
-- Restaurer version précédente
DROP FUNCTION IF EXISTS sync_stock_alert_tracking() CASCADE;

-- Copier-coller fonction depuis migration 20251104_102
-- (Garder backup de cette migration)
```

**Impact** :

- ✅ Fonction modifiée : `sync_stock_alert_tracking()`
- ✅ Tables affectées : `stock_alert_tracking` (données recalculées via UPDATE products)
- ⚠️ **ATTENTION** : Le data fix `UPDATE products SET stock_real = stock_real` va recalculer TOUTES les alertes (peut prendre du temps si >10k produits)

**Critères de succès** :

- [ ] Migration appliquée sans erreur
- [ ] 6 tests SQL passent (✅ PASS)
- [ ] Alertes existantes recalculées (vérifier quelques produits manuellement)
- [ ] Interface utilisateur affiche alertes correctes

---

#### ÉTAPE 1.2 : Correction handle_sales_order_stock() - Libération Forecasted à l'Expédition

**Objectif** : Libérer le forecasted_out lors de l'expédition (warehouse_exit_at filled)

**Fichier à créer** : `supabase/migrations/20251113_002_fix_sales_order_release_forecasted_on_shipment.sql`

**Changements détaillés** :

```sql
-- Migration: Fix handle_sales_order_stock to release forecasted_out on shipment
-- Bug: When warehouse_exit_at is filled, only creates real OUT movement
--      but doesn't release the forecasted_out reservation
-- Impact: Double counting of stock (forecasted + real)
-- Priority: P0 - CRITICAL

DROP FUNCTION IF EXISTS handle_sales_order_stock() CASCADE;

CREATE OR REPLACE FUNCTION handle_sales_order_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_forecasted_qty INTEGER; -- ✅ NOUVEAU pour calcul libération
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- Case 1: Confirmation (draft → confirmed)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'confirmed' AND OLD.status = 'draft' THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        -v_item.quantity,  -- Négatif = réservation sortie
        'OUT',
        true,              -- Affecte forecasted
        'out',
        'sales_order',
        NEW.id,
        'Réservation stock pour SO #' || NEW.order_number
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 2: Annulation validation (confirmed → draft)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'draft' AND OLD.status = 'confirmed' THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        v_item.quantity,   -- Positif = libération réservation
        'IN',
        true,
        'out',
        'sales_order',
        NEW.id,
        'Libération réservation SO #' || NEW.order_number || ' (retour draft)'
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 3: Annulation commande
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        v_item.quantity,
        'IN',
        true,
        'out',
        'sales_order',
        NEW.id,
        'Libération réservation SO #' || NEW.order_number || ' (annulation)'
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 4: Expédition (CORRECTION PRINCIPALE)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.warehouse_exit_at IS NOT NULL AND OLD.warehouse_exit_at IS NULL THEN
    FOR v_item IN SELECT * FROM sales_order_items WHERE sales_order_id = NEW.id LOOP

      -- ✅ NOUVEAU : Calculer quantité forecasted_out à libérer
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      INTO v_forecasted_qty
      FROM stock_movements
      WHERE reference_type = 'sales_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = true
        AND forecast_type = 'out';

      -- ✅ NOUVEAU : Libérer forecasted_out AVANT créer mouvement réel
      IF v_forecasted_qty > 0 THEN
        INSERT INTO stock_movements (
          product_id,
          quantity_change,
          movement_type,
          affects_forecast,
          forecast_type,
          reference_type,
          reference_id,
          notes
        ) VALUES (
          v_item.product_id,
          v_forecasted_qty,  -- Positif = libération
          'IN',
          true,
          'out',
          'sales_order',
          NEW.id,
          'Libération réservation SO #' || NEW.order_number || ' (expédition)'
        );
      END IF;

      -- Créer mouvement réel (code existant)
      INSERT INTO stock_movements (
        product_id,
        quantity_change,
        movement_type,
        affects_forecast,
        forecast_type,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_item.product_id,
        -v_item.quantity,  -- Négatif = sortie réelle
        'OUT',
        false,             -- N'affecte PAS forecasted
        NULL,
        'sales_order',
        NEW.id,
        'Sortie stock réelle SO #' || NEW.order_number
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer trigger
CREATE TRIGGER trigger_handle_sales_order_stock
  AFTER UPDATE ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_sales_order_stock();

COMMENT ON FUNCTION handle_sales_order_stock() IS
'Gère les mouvements de stock pour les commandes clients (sales_orders).
CORRECTION 2025-11-13 : Libère forecasted_out lors de l''expédition pour éviter double comptabilisation.';
```

**Test SQL de Validation** :

```sql
-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 1.2 : Validation Libération Forecasted à l'Expédition
-- ═══════════════════════════════════════════════════

BEGIN;

-- SETUP : Créer produit test
INSERT INTO products (id, sku, name, stock_real, product_status)
VALUES ('test-p3', 'TEST-003', 'Produit Test 3', 100, 'active');

-- SETUP : Créer SO draft
INSERT INTO sales_orders (id, status, order_number)
VALUES ('test-so1', 'draft', 'SO-TEST-001');

INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity)
VALUES ('test-soi1', 'test-so1', 'test-p3', 10);

-- TEST 1 : Confirmer SO → vérifier forecasted_out créé
UPDATE sales_orders SET status = 'confirmed' WHERE id = 'test-so1';

SELECT
  'TEST 1 : Forecasted créé' AS test,
  CASE
    WHEN COUNT(*) = 1 AND
         SUM(quantity_change) = -10 AND
         bool_and(affects_forecast = true) AND
         bool_and(forecast_type = 'out')
    THEN '✅ PASS'
    ELSE '❌ FAIL - Forecasted incorrect'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order' AND reference_id = 'test-so1';

-- TEST 2 : Vérifier stock prévisionnel après confirmation
SELECT
  'TEST 2 : Stock prévisionnel après confirmation' AS test,
  CASE
    WHEN stock_real = 100 AND stock_forecasted_out = 10
    THEN '✅ PASS'
    ELSE '❌ FAIL - Stock = ' || stock_real::text || ', Forecasted_out = ' || stock_forecasted_out::text
  END AS resultat
FROM products WHERE id = 'test-p3';

-- TEST 3 : Expédier SO → vérifier 2 mouvements créés (libération + réel)
UPDATE sales_orders SET warehouse_exit_at = NOW() WHERE id = 'test-so1';

SELECT
  'TEST 3 : Nombre de mouvements après expédition' AS test,
  CASE
    WHEN COUNT(*) = 3 THEN '✅ PASS'  -- 1 confirmation + 1 libération + 1 réel
    ELSE '❌ FAIL - Nombre mouvements = ' || COUNT(*)::text
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order' AND reference_id = 'test-so1';

-- TEST 4 : Vérifier libération forecasted (mouvement IN avec forecast_type='out')
SELECT
  'TEST 4 : Libération forecasted' AS test,
  CASE
    WHEN COUNT(*) = 1 AND
         SUM(quantity_change) = 10 AND  -- Positif = libération
         bool_and(affects_forecast = true) AND
         bool_and(forecast_type = 'out')
    THEN '✅ PASS'
    ELSE '❌ FAIL - Libération incorrecte'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = 'test-so1'
  AND affects_forecast = true
  AND quantity_change > 0;  -- Libération

-- TEST 5 : Vérifier mouvement réel créé
SELECT
  'TEST 5 : Mouvement réel' AS test,
  CASE
    WHEN COUNT(*) = 1 AND
         SUM(quantity_change) = -10 AND
         bool_and(affects_forecast = false)
    THEN '✅ PASS'
    ELSE '❌ FAIL - Mouvement réel incorrect'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = 'test-so1'
  AND affects_forecast = false;

-- TEST 6 : Vérifier solde forecasted_out = 0 (libéré)
SELECT
  'TEST 6 : Solde forecasted_out = 0' AS test,
  CASE
    WHEN SUM(quantity_change) = 0  -- -10 (confirmation) + 10 (libération) = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL - Solde = ' || SUM(quantity_change)::text
  END AS resultat
FROM stock_movements
WHERE reference_type = 'sales_order'
  AND reference_id = 'test-so1'
  AND affects_forecast = true
  AND forecast_type = 'out';

-- TEST 7 : Vérifier stock final produit
SELECT
  'TEST 7 : Stock final produit' AS test,
  CASE
    WHEN stock_real = 90 AND            -- 100 - 10 (expédition)
         stock_forecasted_out = 0       -- Libéré
    THEN '✅ PASS'
    ELSE '❌ FAIL - Stock_real = ' || stock_real::text || ', Forecasted_out = ' || stock_forecasted_out::text
  END AS resultat
FROM products WHERE id = 'test-p3';

-- CLEANUP
ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSULTAT ATTENDU : 7 tests ✅ PASS
-- ═══════════════════════════════════════════════════
```

**Commande d'application** :

```bash
# Appliquer la migration
supabase db push

# Vérifier fonction créée
psql $DATABASE_URL -c "\df handle_sales_order_stock"

# Exécuter tests de validation
psql $DATABASE_URL -f tests/validate_etape_1_2.sql
```

**Rollback en cas de problème** :

```sql
DROP FUNCTION IF EXISTS handle_sales_order_stock() CASCADE;
-- Restaurer depuis migration 20251014_028
```

**Impact** :

- ✅ Fonction modifiée : `handle_sales_order_stock()`
- ✅ Tables affectées : `stock_movements`
- ⚠️ **DATA CORRUPTION EXISTANTE** : Les commandes expédiées AVANT cette correction ont forecasted_out non libéré → Nécessite data fix (voir Étape 1.3)

**Critères de succès** :

- [ ] Migration appliquée sans erreur
- [ ] 7 tests SQL passent (✅ PASS)
- [ ] Nouvelle commande expédiée libère correctement forecasted_out
- [ ] Stock prévisionnel correct après expédition

---

#### ÉTAPE 1.3 : Data Fix - Libérer Forecasted_out des SO Expédiées Avant Correction

**Objectif** : Corriger les données historiques (SO expédiées avant la correction du Bug #2)

**Fichier à créer** : `supabase/migrations/20251113_003_data_fix_release_forecasted_shipped_orders.sql`

**Changements détaillés** :

```sql
-- Migration: Data fix - Release forecasted_out for already shipped sales orders
-- Context: Bug #2 correction (20251113_002) only fixes new shipments
--          Old shipments still have unreleased forecasted_out
-- Impact: Historical data with double counting
-- Priority: P0 - CRITICAL

DO $$
DECLARE
  v_so RECORD;
  v_item RECORD;
  v_forecasted_qty INTEGER;
  v_fixed_count INTEGER := 0;
BEGIN
  -- Identifier toutes les SO expédiées (warehouse_exit_at filled)
  -- qui ont encore du forecasted_out non libéré
  FOR v_so IN
    SELECT DISTINCT so.id, so.order_number, so.warehouse_exit_at
    FROM sales_orders so
    WHERE so.warehouse_exit_at IS NOT NULL
      AND EXISTS (
        -- Vérifier qu'il y a du forecasted_out non libéré
        SELECT 1
        FROM stock_movements sm
        WHERE sm.reference_type = 'sales_order'
          AND sm.reference_id = so.id
          AND sm.affects_forecast = true
          AND sm.forecast_type = 'out'
        HAVING SUM(sm.quantity_change) < 0  -- Net négatif = pas complètement libéré
      )
  LOOP
    RAISE NOTICE 'Correction SO % (expédié le %)', v_so.order_number, v_so.warehouse_exit_at;

    -- Pour chaque item de la SO
    FOR v_item IN
      SELECT * FROM sales_order_items WHERE sales_order_id = v_so.id
    LOOP
      -- Calculer quantité forecasted_out à libérer pour cet item
      SELECT ABS(SUM(quantity_change))
      INTO v_forecasted_qty
      FROM stock_movements
      WHERE reference_type = 'sales_order'
        AND reference_id = v_so.id
        AND product_id = v_item.product_id
        AND affects_forecast = true
        AND forecast_type = 'out';

      IF v_forecasted_qty > 0 THEN
        -- Créer mouvement de libération
        INSERT INTO stock_movements (
          product_id,
          quantity_change,
          movement_type,
          affects_forecast,
          forecast_type,
          reference_type,
          reference_id,
          notes,
          created_at  -- Backdate au moment de l'expédition
        ) VALUES (
          v_item.product_id,
          v_forecasted_qty,  -- Positif = libération
          'IN',
          true,
          'out',
          'sales_order',
          v_so.id,
          '[DATA FIX 2025-11-13] Libération forecasted_out SO #' || v_so.order_number,
          v_so.warehouse_exit_at  -- Date expédition originale
        );

        RAISE NOTICE '  → Produit % : libéré % unités', v_item.product_id, v_forecasted_qty;
        v_fixed_count := v_fixed_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Data fix terminé : % items corrigés', v_fixed_count;
END $$;

-- Vérification : Afficher statistiques avant/après
SELECT
  'Après data fix : SO avec forecasted non libéré' AS verification,
  COUNT(*) AS count
FROM sales_orders so
WHERE so.warehouse_exit_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM stock_movements sm
    WHERE sm.reference_type = 'sales_order'
      AND sm.reference_id = so.id
      AND sm.affects_forecast = true
      AND sm.forecast_type = 'out'
    HAVING SUM(sm.quantity_change) < 0
  );
-- Résultat attendu : count = 0

COMMENT ON MIGRATION IS
'Data fix pour libérer forecasted_out des commandes expédiées avant correction Bug #2.';
```

**Test de Validation** :

```sql
-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 1.3 : Validation Data Fix
-- ═══════════════════════════════════════════════════

-- TEST 1 : Vérifier aucune SO expédiée avec forecasted non libéré
SELECT
  'TEST 1 : Aucune SO avec forecasted non libéré' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' SO encore à corriger'
  END AS resultat
FROM sales_orders so
WHERE so.warehouse_exit_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM stock_movements sm
    WHERE sm.reference_type = 'sales_order'
      AND sm.reference_id = so.id
      AND sm.affects_forecast = true
      AND sm.forecast_type = 'out'
    HAVING SUM(sm.quantity_change) < 0
  );

-- TEST 2 : Vérifier cohérence stock_forecasted_out dans products
SELECT
  'TEST 2 : Cohérence stock_forecasted_out' AS test,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - ' || COUNT(*)::text || ' produits avec incohérence'
  END AS resultat
FROM products p
WHERE p.stock_forecasted_out != (
  SELECT COALESCE(SUM(ABS(quantity_change)), 0)
  FROM stock_movements
  WHERE product_id = p.id
    AND affects_forecast = true
    AND forecast_type = 'out'
);
```

**Commande d'application** :

```bash
# Appliquer la migration
supabase db push

# Exécuter tests de validation
psql $DATABASE_URL -f tests/validate_etape_1_3.sql
```

**Impact** :

- ✅ Tables affectées : `stock_movements` (ajout mouvements de libération)
- ✅ Tables recalculées : `products.stock_forecasted_out` (via trigger maintain_stock_from_movements)
- ⚠️ **DURÉE** : Peut prendre du temps si beaucoup de SO expédiées (proportionnel au nombre de SO)

**Critères de succès** :

- [ ] Migration appliquée sans erreur
- [ ] 2 tests SQL passent (✅ PASS)
- [ ] Log NOTICE affiche nombre de SO corrigées
- [ ] Stock prévisionnel correct pour tous produits

---

### 🟠 PHASE 2 : CORRECTIONS HAUTE PRIORITÉ (P1)

**Durée estimée** : 1-2 heures

---

#### ÉTAPE 2.1 : Correction handle_purchase_order_forecast() - Calcul Annulation

**Objectif** : Corriger le calcul de la quantité forecasted à annuler lors de l'annulation d'une PO partiellement reçue

**Fichier à créer** : `supabase/migrations/20251113_004_fix_purchase_order_cancellation_calculation.sql`

**Changements détaillés** :

```sql
-- Migration: Fix handle_purchase_order_forecast cancellation calculation
-- Bug: Uses SUM(ABS(quantity_change)) which adds instead of calculating net
-- Impact: Wrong quantity released when cancelling partially received PO
-- Priority: P1 - HIGH

DROP FUNCTION IF EXISTS handle_purchase_order_forecast() CASCADE;

CREATE OR REPLACE FUNCTION handle_purchase_order_forecast()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_forecasted_qty INTEGER;
  v_already_received INTEGER;
  v_qty_diff INTEGER;
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- Case 1: Confirmation (draft/sent → confirmed)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'confirmed' AND (OLD.status = 'draft' OR OLD.status = 'sent') THEN
    FOR v_item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id LOOP
      INSERT INTO stock_movements (
        product_id, quantity_change, movement_type,
        affects_forecast, forecast_type,
        reference_type, reference_id, notes
      ) VALUES (
        v_item.product_id, v_item.quantity, 'IN',
        true, 'in',
        'purchase_order', NEW.id,
        'Prévision entrée PO #' || NEW.order_number
      );
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 2: Réception (partially_received / received)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status IN ('partially_received', 'received') THEN
    FOR v_item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id LOOP

      -- Calculer quantité déjà reçue (mouvements réels)
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      INTO v_already_received
      FROM stock_movements
      WHERE reference_type = 'purchase_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = false  -- Mouvements réels
        AND movement_type = 'IN';

      -- Différence = quantité reçue maintenant
      v_qty_diff := v_item.quantity_received - v_already_received;

      IF v_qty_diff > 0 THEN
        -- 1. Libérer prévisionnel
        INSERT INTO stock_movements (
          product_id, quantity_change, movement_type,
          affects_forecast, forecast_type,
          reference_type, reference_id, notes
        ) VALUES (
          v_item.product_id, -v_qty_diff, 'OUT',
          true, 'in',
          'purchase_order', NEW.id,
          'Libération prévision PO #' || NEW.order_number || ' (réception ' || v_qty_diff::text || ' unités)'
        );

        -- 2. Ajouter stock réel
        INSERT INTO stock_movements (
          product_id, quantity_change, movement_type,
          affects_forecast, forecast_type,
          reference_type, reference_id, notes
        ) VALUES (
          v_item.product_id, v_qty_diff, 'IN',
          false, NULL,
          'purchase_order', NEW.id,
          'Entrée stock réelle PO #' || NEW.order_number
        );
      END IF;
    END LOOP;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Case 3: Annulation (CORRECTION PRINCIPALE)
  -- ═══════════════════════════════════════════════════════════
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    FOR v_item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id LOOP

      -- ✅ CORRECTION : Calculer le NET forecasted_in à annuler
      -- Méthode 1 : SUM simple (prend en compte libérations partielles)
      SELECT COALESCE(SUM(quantity_change), 0)
      INTO v_forecasted_qty
      FROM stock_movements
      WHERE reference_type = 'purchase_order'
        AND reference_id = NEW.id
        AND product_id = v_item.product_id
        AND affects_forecast = true
        AND forecast_type = 'in';

      -- OU Méthode 2 : Filtrer seulement mouvements positifs (plus explicite)
      -- SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      -- INTO v_forecasted_qty
      -- FROM stock_movements
      -- WHERE reference_type = 'purchase_order'
      --   AND reference_id = NEW.id
      --   AND product_id = v_item.product_id
      --   AND affects_forecast = true
      --   AND forecast_type = 'in'
      --   AND quantity_change > 0;  -- Seulement créations, pas libérations

      IF v_forecasted_qty > 0 THEN
        -- Annuler le forecasted_in restant
        INSERT INTO stock_movements (
          product_id, quantity_change, movement_type,
          affects_forecast, forecast_type,
          reference_type, reference_id, notes
        ) VALUES (
          v_item.product_id, -v_forecasted_qty, 'OUT',
          true, 'in',
          'purchase_order', NEW.id,
          'Annulation prévision PO #' || NEW.order_number || ' (' || v_forecasted_qty::text || ' unités)'
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer trigger
CREATE TRIGGER trigger_handle_purchase_order_forecast
  AFTER UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_order_forecast();

COMMENT ON FUNCTION handle_purchase_order_forecast() IS
'Gère les mouvements de stock prévisionnels et réels pour les commandes fournisseurs.
CORRECTION 2025-11-13 : Calcul correct du forecasted_in à annuler (SUM au lieu de SUM(ABS)).';
```

**Test SQL de Validation** :

```sql
-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 2.1 : Validation Calcul Annulation
-- ═══════════════════════════════════════════════════

BEGIN;

-- SETUP
INSERT INTO products (id, sku, name, stock_real, product_status)
VALUES ('test-p4', 'TEST-004', 'Produit Test 4', 50, 'active');

INSERT INTO purchase_orders (id, status, order_number)
VALUES ('test-po1', 'draft', 'PO-TEST-001');

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, quantity_received)
VALUES ('test-poi1', 'test-po1', 'test-p4', 100, 0);

-- ACTION 1 : Confirmer PO
UPDATE purchase_orders SET status = 'confirmed' WHERE id = 'test-po1';

-- TEST 1 : Vérifier forecasted_in créé
SELECT
  'TEST 1 : Forecasted créé' AS test,
  CASE
    WHEN SUM(quantity_change) = 100 THEN '✅ PASS'
    ELSE '❌ FAIL - Forecasted = ' || SUM(quantity_change)::text
  END AS resultat
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = 'test-po1'
  AND affects_forecast = true;

-- ACTION 2 : Réception partielle 30 unités
UPDATE purchase_order_items SET quantity_received = 30 WHERE id = 'test-poi1';
UPDATE purchase_orders SET status = 'partially_received' WHERE id = 'test-po1';

-- TEST 2 : Vérifier libération partielle + ajout réel
SELECT
  'TEST 2 : Réception partielle' AS test,
  CASE
    WHEN SUM(CASE WHEN affects_forecast THEN quantity_change ELSE 0 END) = 70 AND  -- 100 - 30
         SUM(CASE WHEN NOT affects_forecast THEN quantity_change ELSE 0 END) = 30
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS resultat
FROM stock_movements
WHERE reference_type = 'purchase_order' AND reference_id = 'test-po1';

-- ACTION 3 : Annuler PO
UPDATE purchase_orders SET status = 'cancelled' WHERE id = 'test-po1';

-- TEST 3 : Vérifier quantité annulée = 70 (pas 130)
SELECT
  'TEST 3 : Quantité annulée correcte' AS test,
  CASE
    WHEN quantity_change = -70 THEN '✅ PASS'  -- Annule 100 - 30 = 70
    ELSE '❌ FAIL - Quantité = ' || quantity_change::text
  END AS resultat
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = 'test-po1'
  AND notes LIKE 'Annulation%';

-- TEST 4 : Vérifier solde forecasted_in = 0
SELECT
  'TEST 4 : Solde forecasted_in = 0' AS test,
  CASE
    WHEN SUM(quantity_change) = 0  -- 100 - 30 - 70 = 0
    THEN '✅ PASS'
    ELSE '❌ FAIL - Solde = ' || SUM(quantity_change)::text
  END AS resultat
FROM stock_movements
WHERE reference_type = 'purchase_order'
  AND reference_id = 'test-po1'
  AND affects_forecast = true;

-- TEST 5 : Vérifier stock final produit
SELECT
  'TEST 5 : Stock final produit' AS test,
  CASE
    WHEN stock_real = 80 AND           -- 50 + 30 (reçu)
         stock_forecasted_in = 0       -- Annulé
    THEN '✅ PASS'
    ELSE '❌ FAIL - Stock_real = ' || stock_real::text || ', Forecasted_in = ' || stock_forecasted_in::text
  END AS resultat
FROM products WHERE id = 'test-p4';

ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSULTAT ATTENDU : 5 tests ✅ PASS
-- ═══════════════════════════════════════════════════
```

**Commande d'application** :

```bash
supabase db push
psql $DATABASE_URL -f tests/validate_etape_2_1.sql
```

**Impact** :

- ✅ Fonction modifiée : `handle_purchase_order_forecast()`
- ✅ Correction appliquée : Future annulations de PO partiellement reçues
- ⚠️ **Pas de data fix nécessaire** : Peu probable que beaucoup de PO aient été annulées après réception partielle

**Critères de succès** :

- [ ] 5 tests SQL passent
- [ ] Nouvelle annulation calcule correctement la quantité

---

#### ÉTAPE 2.2 : Vérification Bug #3 Résolu Automatiquement

**Objectif** : Vérifier que le Bug #3 (incohérence création vs validation alertes) est résolu par la correction du Bug #1

**Pas de migration nécessaire** - Seulement validation

**Test de Validation** :

```sql
-- ═══════════════════════════════════════════════════
-- TEST ÉTAPE 2.2 : Validation Bug #3 Résolu
-- ═══════════════════════════════════════════════════

BEGIN;

-- SETUP : Créer produit avec stock prévisionnel bas
INSERT INTO products (
  id, sku, name, min_stock,
  stock_real, stock_forecasted_out, stock_forecasted_in,
  product_status, supplier_id
) VALUES (
  'test-p5', 'TEST-005', 'Produit Test 5', 20,
  10, 5, 0,  -- Stock prévisionnel = 10 - 5 + 0 = 5 < 20 → ALERTE
  'active', (SELECT id FROM organisations WHERE type='supplier' LIMIT 1)
);

-- TEST 1 : Vérifier alerte créée (Bug #1 résolu)
SELECT
  'TEST 1 : Alerte créée avec stock prévisionnel' AS test,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte non créée'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p5';

-- SETUP : Créer PO pour résoudre alerte
INSERT INTO purchase_orders (id, status, order_number)
VALUES ('test-po2', 'draft', 'PO-TEST-002');

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity)
VALUES ('test-poi2', 'test-po2', 'test-p5', 30);

-- ACTION : Confirmer PO
UPDATE purchase_orders SET status = 'confirmed' WHERE id = 'test-po2';

-- TEST 2 : Vérifier stock prévisionnel suffisant après PO
SELECT
  'TEST 2 : Stock prévisionnel après PO' AS test,
  CASE
    WHEN stock_real - stock_forecasted_out + stock_forecasted_in >= min_stock
    THEN '✅ PASS - Stock prévu = ' || (stock_real - stock_forecasted_out + stock_forecasted_in)::text
    ELSE '❌ FAIL'
  END AS resultat
FROM products WHERE id = 'test-p5';

-- TEST 3 : Vérifier alerte validée automatiquement
SELECT
  'TEST 3 : Alerte validée automatiquement' AS test,
  CASE
    WHEN validated = true AND validated_at IS NOT NULL
    THEN '✅ PASS'
    ELSE '❌ FAIL - Alerte non validée (Bug #5 race condition)'
  END AS resultat
FROM stock_alert_tracking
WHERE product_id = 'test-p5';

ROLLBACK;

-- ═══════════════════════════════════════════════════
-- RÉSULTAT ATTENDU :
-- - Test 1 ✅ PASS (Bug #1 résolu)
-- - Test 2 ✅ PASS
-- - Test 3 ❌ FAIL ou ✅ PASS (dépend si Bug #5 corrigé)
-- ═══════════════════════════════════════════════════
```

**Commande de validation** :

```bash
psql $DATABASE_URL -f tests/validate_etape_2_2.sql
```

**Critères de succès** :

- [ ] Test 1 et 2 passent (Bug #1 résolu)
- [ ] Test 3 peut échouer si Bug #5 non encore corrigé (normal)

---

### 🟡 PHASE 3 : CORRECTIONS PERFORMANCE (P2)

**Durée estimée** : 2-3 heures

---

#### ÉTAPE 3.1 : Correction Race Condition Validation Alertes

**Objectif** : Déplacer la validation des alertes dans un trigger AFTER products UPDATE

**Fichier à créer** : `supabase/migrations/20251113_005_fix_alert_validation_race_condition.sql`

**Changements** :

```sql
-- Migration: Fix alert validation race condition
-- Bug: validate_stock_alerts reads stock_forecasted_in before it's updated
-- Solution: Move validation to AFTER products UPDATE trigger
-- Priority: P2 - MEDIUM

-- Supprimer ancien trigger sur purchase_orders
DROP TRIGGER IF EXISTS trigger_validate_stock_alerts_on_purchase_order_validation ON purchase_orders;
DROP FUNCTION IF EXISTS validate_stock_alerts_on_purchase_order_validation();

-- Créer nouveau trigger sur products (après maintain_stock_from_movements)
CREATE OR REPLACE FUNCTION validate_stock_alerts_after_stock_update()
RETURNS TRIGGER AS $$
DECLARE
  v_forecasted_stock INTEGER;
BEGIN
  -- Calculer stock prévisionnel
  v_forecasted_stock := NEW.stock_real - NEW.stock_forecasted_out + NEW.stock_forecasted_in;

  -- Si stock prévisionnel >= min_stock ET alerte existe ET non validée
  IF v_forecasted_stock >= COALESCE(NEW.min_stock, 0) THEN
    UPDATE stock_alert_tracking
    SET
      validated = true,
      validated_at = NOW()
    WHERE product_id = NEW.id
      AND validated = false;  -- Seulement si pas déjà validée
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer trigger APRÈS sync_stock_alert_tracking (priority inférieure)
CREATE TRIGGER trigger_validate_stock_alerts_after_stock_update
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (
    NEW.stock_real IS DISTINCT FROM OLD.stock_real OR
    NEW.stock_forecasted_in IS DISTINCT FROM OLD.stock_forecasted_in OR
    NEW.stock_forecasted_out IS DISTINCT FROM OLD.stock_forecasted_out
  )
  EXECUTE FUNCTION validate_stock_alerts_after_stock_update();

COMMENT ON FUNCTION validate_stock_alerts_after_stock_update() IS
'Valide automatiquement les alertes lorsque le stock prévisionnel redevient suffisant.
CORRECTION 2025-11-13 : Déplacé dans trigger products pour éviter race condition.';
```

**Test** :

```sql
-- Même test que Étape 2.2, Test 3 doit maintenant passer
```

---

#### ÉTAPE 3.2 : Ajout Locking maintain_stock_from_movements()

**Objectif** : Ajouter SELECT FOR UPDATE pour éviter lost updates

**Fichier** : `supabase/migrations/20251113_006_add_locking_maintain_stock_from_movements.sql`

**Changements** :

```sql
-- Migration: Add locking to maintain_stock_from_movements
-- Bug: Concurrent transactions can cause lost updates
-- Solution: Use row-level locking
-- Priority: P2 - MEDIUM

DROP FUNCTION IF EXISTS maintain_stock_from_movements() CASCADE;

CREATE OR REPLACE FUNCTION maintain_stock_from_movements()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id uuid;
BEGIN
  -- Déterminer product_id affecté
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- ✅ LOCK le produit AVANT calculs
  PERFORM id FROM products WHERE id = v_product_id FOR UPDATE;

  -- Mettre à jour les stocks en une seule requête atomique
  UPDATE products
  SET
    stock_real = (
      SELECT COALESCE(SUM(quantity_change), 0)
      FROM stock_movements
      WHERE product_id = v_product_id AND affects_forecast = false
    )::integer,
    stock_quantity = (
      SELECT COALESCE(SUM(quantity_change), 0)
      FROM stock_movements
      WHERE product_id = v_product_id AND affects_forecast = false
    )::integer,
    stock_forecasted_in = (
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      FROM stock_movements
      WHERE product_id = v_product_id AND affects_forecast = true AND forecast_type = 'in'
    )::integer,
    stock_forecasted_out = (
      SELECT COALESCE(SUM(ABS(quantity_change)), 0)
      FROM stock_movements
      WHERE product_id = v_product_id AND affects_forecast = true AND forecast_type = 'out'
    )::integer
  WHERE id = v_product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER maintain_stock_from_movements_trigger
  AFTER INSERT OR UPDATE OR DELETE ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION maintain_stock_from_movements();
```

---

#### ÉTAPE 3.3 : Optimisation sync_stock_alert_tracking()

**Objectif** : Ajouter clause WHEN pour filtrer déclenchements inutiles

**Fichier** : `supabase/migrations/20251113_007_optimize_sync_stock_alert_tracking_trigger.sql`

**Changements** :

```sql
-- Migration: Optimize sync_stock_alert_tracking trigger
-- Optimization: Add WHEN clause to filter irrelevant updates
-- Priority: P2 - LOW

DROP TRIGGER IF EXISTS trigger_sync_stock_alert_tracking ON products;

CREATE TRIGGER trigger_sync_stock_alert_tracking
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  WHEN (
    NEW.stock_real IS DISTINCT FROM OLD.stock_real OR
    NEW.stock_forecasted_in IS DISTINCT FROM OLD.stock_forecasted_in OR
    NEW.stock_forecasted_out IS DISTINCT FROM OLD.stock_forecasted_out OR
    NEW.min_stock IS DISTINCT FROM OLD.min_stock OR
    NEW.product_status IS DISTINCT FROM OLD.product_status OR
    TG_OP = 'INSERT'
  )
  EXECUTE FUNCTION sync_stock_alert_tracking();
```

---

### 📚 PHASE 4 : DOCUMENTATION

**Durée estimée** : 1 heure

---

#### ÉTAPE 4.1 : Mise à Jour docs/database/triggers.md

**Objectif** : Mettre à jour documentation avec trigger unifié actuel

**Changements à effectuer** :

1. Supprimer références aux anciens triggers (maintain_stock_coherence, trigger_maintain_stock_totals)
2. Documenter trigger unifié maintain_stock_from_movements()
3. Ajouter section "Corrections 2025-11-13" avec résumé des 7 bugs corrigés
4. Mettre à jour workflow diagram avec nouveaux triggers

---

#### ÉTAPE 4.2 : Création Documentation Tests Validation

**Fichier à créer** : `docs/database/tests-validation-stock-triggers.md`

**Contenu** :

- Tous les tests SQL de validation des étapes 1.1 à 3.3
- Procédure de validation complète end-to-end
- Scénarios de test business critiques

---

## 📊 RÉCAPITULATIF GLOBAL

### Bugs Corrigés par Phase

| Phase     | Bugs Corrigés      | Impact      | Durée    |
| --------- | ------------------ | ----------- | -------- |
| Phase 1   | Bug #1, #2         | 🔴 CRITIQUE | 2-3h     |
| Phase 2   | Bug #4, #3         | 🟠 HAUTE    | 1-2h     |
| Phase 3   | Bug #5, #6, #7     | 🟡 MOYENNE  | 2-3h     |
| Phase 4   | Documentation      | 📖 INFO     | 1h       |
| **TOTAL** | **7 bugs + 1 doc** |             | **6-9h** |

### Migrations à Créer

1. `20251113_001_fix_stock_alert_forecasted_calculation.sql` (P0)
2. `20251113_002_fix_sales_order_release_forecasted_on_shipment.sql` (P0)
3. `20251113_003_data_fix_release_forecasted_shipped_orders.sql` (P0 - Data fix)
4. `20251113_004_fix_purchase_order_cancellation_calculation.sql` (P1)
5. `20251113_005_fix_alert_validation_race_condition.sql` (P2)
6. `20251113_006_add_locking_maintain_stock_from_movements.sql` (P2)
7. `20251113_007_optimize_sync_stock_alert_tracking_trigger.sql` (P2)

### Tests de Validation

- `tests/validate_etape_1_1.sql` (6 tests)
- `tests/validate_etape_1_2.sql` (7 tests)
- `tests/validate_etape_1_3.sql` (2 tests)
- `tests/validate_etape_2_1.sql` (5 tests)
- `tests/validate_etape_2_2.sql` (3 tests)
- **TOTAL : 23 tests SQL automatisés**

### Risques et Mitigations

| Risque                    | Impact     | Probabilité | Mitigation                         |
| ------------------------- | ---------- | ----------- | ---------------------------------- |
| Data corruption existante | 🔴 HAUTE   | Certaine    | Data fix Étape 1.3                 |
| Régression fonctionnelle  | 🟠 MOYENNE | Faible      | Tests exhaustifs + Rollback plan   |
| Performance dégradée      | 🟡 BASSE   | Faible      | Locking optimisé + Clause WHEN     |
| Downtime production       | 🟢 BASSE   | Très faible | Migrations rapides (<1min chacune) |

### Critères de Succès Globaux

- [ ] **Phase 1 complète** : 0 erreurs console, alertes correctes
- [ ] **Phase 2 complète** : Annulations PO correctes
- [ ] **Phase 3 complète** : Validation automatique fonctionne
- [ ] **Phase 4 complète** : Documentation à jour
- [ ] **23 tests SQL** passent (✅ PASS)
- [ ] **0 régression** détectée en production
- [ ] **Stock prévisionnel correct** pour tous produits

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

### Pour l'Utilisateur

1. **Valider ce rapport d'audit** : Vérifier que l'analyse correspond aux attentes
2. **Prioriser les phases** : Confirmer ordre Phase 1 → 2 → 3 → 4
3. **Autoriser début Phase 1** : Donner le feu vert pour corrections critiques
4. **Planifier tests** : Prévoir temps pour validation après chaque étape

### Pour Claude (Prochaine Session)

1. ✅ **Cet audit est TERMINÉ** - Tous les triggers analysés
2. ⏸️ **STOP code** - Pas de modifications dans cette session (consigne respectée)
3. 📋 **Prêt pour Phase 1** - Migrations rédigées, tests définis
4. ✅ **Attente autorisation** - Avant exécution des corrections

---

## 📝 NOTES IMPORTANTES

### Points Forts du Système Actuel

- Architecture trigger unifié (2025-11-03) excellente
- Algorithme différentiel réceptions partielles robuste
- Gestion annulations PO/SO présente
- Concept validation automatique alertes présent

### Points à Améliorer (Au-delà des Bugs)

1. **Performance** : Ajouter indexes sur stock_movements (reference_type, reference_id, product_id)
2. **Monitoring** : Ajouter logs trigger executions (optionnel)
3. **Tests E2E** : Créer tests Playwright pour workflows complets
4. **Documentation** : Créer diagrammes de séquence pour chaque workflow

### Recommandations Générales

- **Staging First** : Tester TOUTES les migrations en staging avant production
- **Backup** : Backup database avant Phase 1
- **Monitoring** : Surveiller logs Supabase pendant 24h après chaque phase
- **Rollback Plan** : Garder migrations précédentes accessibles

---

**FIN DU RAPPORT D'AUDIT**

---

**Prochaine action** : Attendre autorisation utilisateur pour commencer Phase 1 (Corrections Critiques P0).
