-- Migration: Restaurer supplier_id dans sync_stock_alert_tracking()
-- Date: 2025-11-11
-- Bug: Migration 20251110_003 a supprimé supplier_id → NOT NULL constraint violation lors validation commandes
-- Fix: Restaurer supplier_id + conserver fix shortage_quantity de migration 003
-- Référence: Migration 20251105_111 (version fonctionnelle) + Migration 20251110_003 (fix shortage)

-- =====================================================
-- FONCTION: sync_stock_alert_tracking()
-- =====================================================
-- Trigger AFTER INSERT OR UPDATE sur products
-- Gère automatiquement les alertes stock dans stock_alert_tracking
--
-- Logique:
-- 1. Récupère supplier_id et product_status du produit
-- 2. Ignore si pas de fournisseur ou produit non actif
-- 3. Calcule stock disponible prévisionnel: stock_real + forecasted_in - forecasted_out
-- 4. Détermine type d'alerte selon seuils
-- 5. INSERT/UPDATE dans stock_alert_tracking avec supplier_id
-- =====================================================

CREATE OR REPLACE FUNCTION sync_stock_alert_tracking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supplier_id uuid;                    -- ✅ RESTAURÉ: Fournisseur du produit
  v_product_status text;                 -- ✅ RESTAURÉ: Statut produit (active/inactive/archived)
  v_alert_type TEXT;                     -- Type alerte (low_stock, out_of_stock, no_stock_but_ordered)
  v_alert_priority INTEGER;              -- Priorité (1=Info, 2=Warning, 3=Critical)
  v_shortage INTEGER;                    -- Quantité manquante calculée
  v_stock_disponible INTEGER;            -- ✅ RESTAURÉ: Stock prévisionnel disponible
BEGIN
  -- =====================================================
  -- ÉTAPE 1: Récupérer supplier_id + product_status
  -- =====================================================
  -- ✅ RESTAURÉ depuis Migration 20251105_111
  SELECT supplier_id, product_status
  INTO v_supplier_id, v_product_status
  FROM products
  WHERE id = NEW.id;

  -- =====================================================
  -- ÉTAPE 2: Filtrage si pas de fournisseur
  -- =====================================================
  -- ✅ RESTAURÉ depuis Migration 20251105_111
  -- Si produit sans fournisseur → ignorer (pas d'alerte)
  IF v_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- =====================================================
  -- ÉTAPE 3: Filtrage par product_status
  -- =====================================================
  -- ✅ RESTAURÉ depuis Migration 20251105_111
  -- Alertes UNIQUEMENT pour produits actifs
  -- Si produit inactif/archivé → supprimer alerte existante
  IF v_product_status IS DISTINCT FROM 'active' THEN
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- =====================================================
  -- ÉTAPE 4: Calcul stock disponible prévisionnel
  -- =====================================================
  -- ✅ RESTAURÉ depuis Migration 20251105_111
  -- Formule: stock_real + stock_forecasted_in - stock_forecasted_out
  v_stock_disponible := NEW.stock_real +
                        COALESCE(NEW.stock_forecasted_in, 0) -
                        COALESCE(NEW.stock_forecasted_out, 0);

  -- =====================================================
  -- ÉTAPE 5: Logique alertes selon stock disponible
  -- =====================================================
  -- ✅ Combinaison Migration 20251105_111 + Fix 003

  IF v_stock_disponible <= 0 AND NEW.stock_forecasted_out > 0 THEN
    -- CAS 1: Stock disponible épuisé mais commandes clients en cours
    -- Priorité CRITIQUE → Commandes clients risquent d'être en rupture
    v_alert_type := 'no_stock_but_ordered';
    v_alert_priority := 3;
    -- ✅ FIX 003: shortage = forecasted_out + min_stock
    -- Quantité à commander pour honorer commandes + reconstituer stock mini
    v_shortage := NEW.stock_forecasted_out + COALESCE(NEW.min_stock, 0);

  ELSIF v_stock_disponible <= 0 THEN
    -- CAS 2: Rupture de stock prévisionnel complète
    -- Stock réel épuisé et aucune entrée prévue
    v_alert_type := 'out_of_stock';
    v_alert_priority := 3;
    v_shortage := COALESCE(NEW.min_stock, 0);

  ELSIF v_stock_disponible < COALESCE(NEW.min_stock, 0) AND NEW.min_stock > 0 THEN
    -- CAS 3: Stock disponible sous minimum
    -- Stock existe mais insuffisant pour atteindre seuil minimum
    v_alert_type := 'low_stock';
    v_alert_priority := 2;
    v_shortage := COALESCE(NEW.min_stock, 0) - v_stock_disponible;

  ELSE
    -- CAS 4: Stock OK (au-dessus du minimum)
    -- Supprimer alerte si elle existe
    DELETE FROM stock_alert_tracking WHERE product_id = NEW.id;
    RETURN NEW;
  END IF;

  -- =====================================================
  -- ÉTAPE 6: INSERT/UPDATE dans stock_alert_tracking
  -- =====================================================
  -- ✅ RESTAURÉ supplier_id dans INSERT et ON CONFLICT
  INSERT INTO stock_alert_tracking (
    product_id,
    supplier_id,                          -- ✅ RESTAURÉ: Colonne obligatoire NOT NULL
    alert_type,
    alert_priority,
    stock_real,
    stock_forecasted_out,
    min_stock,
    shortage_quantity
  )
  VALUES (
    NEW.id,
    v_supplier_id,                        -- ✅ RESTAURÉ: Valeur fournie
    v_alert_type,
    v_alert_priority,
    COALESCE(NEW.stock_real, 0),
    COALESCE(NEW.stock_forecasted_out, 0),
    COALESCE(NEW.min_stock, 0),
    v_shortage
  )
  ON CONFLICT (product_id) DO UPDATE SET
    alert_type = EXCLUDED.alert_type,
    alert_priority = EXCLUDED.alert_priority,
    stock_real = EXCLUDED.stock_real,
    stock_forecasted_out = EXCLUDED.stock_forecasted_out,
    min_stock = EXCLUDED.min_stock,
    shortage_quantity = EXCLUDED.shortage_quantity,
    supplier_id = EXCLUDED.supplier_id,  -- ✅ RESTAURÉ: Update supplier_id aussi
    updated_at = now();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_stock_alert_tracking() IS
'Trigger AFTER INSERT OR UPDATE sur products.
Fix 2025-11-11: Restauration supplier_id manquant depuis migration 003.
Combinaison Migration 111 (stock prévisionnel) + Migration 003 (fix shortage_quantity).
Formule stock disponible: stock_real + stock_forecasted_in - stock_forecasted_out.
Alertes uniquement pour produits actifs avec fournisseur assigné.';
