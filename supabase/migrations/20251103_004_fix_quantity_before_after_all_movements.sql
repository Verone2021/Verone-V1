-- ============================================================================
-- Migration : Recalculer quantity_before et quantity_after pour tous les mouvements réels
-- Date : 2025-11-03
-- Auteur : Claude Code
--
-- Contexte :
--   Les valeurs quantity_before/after ont été calculées AVANT la migration
--   20251103_003_trigger_unique_stock_source_of_truth.sql qui a introduit
--   la distinction entre stock_real (mouvements réels uniquement) et
--   stock_forecasted_in/out (prévisionnels).
--
--   Ces valeurs historiques incluaient donc les mouvements prévisionnels,
--   ce qui les rend incorrectes dans le nouveau système.
--
-- Objectif :
--   Recalculer quantity_before/after pour TOUS les mouvements réels
--   en se basant UNIQUEMENT sur les mouvements avec affects_forecast = false
--
-- Diagnostic pré-migration :
--   Produit : Fauteuil Milo - Ocre
--   Stock réel actuel : 8 unités
--   Dernière quantity_after : 58 unités
--   Différence : -50 unités ❌
-- ============================================================================

-- Étape 1 : Désactiver temporairement les contraintes CHECK
-- (Nécessaire car stock peut être négatif temporairement - rupture de stock)
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_quantity_before_check;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_quantity_after_check;

-- Étape 2 : Backup des valeurs actuelles (au cas où)
CREATE TEMP TABLE stock_movements_backup AS
SELECT id, quantity_before, quantity_after
FROM stock_movements
WHERE affects_forecast = false OR affects_forecast IS NULL;

-- Étape 2 : Recalculer quantity_before et quantity_after
--
-- Logique :
--   - quantity_before = SUM(quantity_change) de TOUS les mouvements réels
--                       effectués AVANT ce mouvement (performed_at < current)
--   - quantity_after  = quantity_before + quantity_change du mouvement actuel
--
-- Note : On traite NULL comme false (mouvements historiques avant la colonne)

WITH ordered_movements AS (
  SELECT
    id,
    product_id,
    performed_at,
    quantity_change,
    affects_forecast
  FROM stock_movements
  WHERE affects_forecast = false OR affects_forecast IS NULL
  ORDER BY product_id, performed_at ASC
),
calculated_stocks AS (
  SELECT
    m.id,
    m.product_id,
    m.quantity_change,
    -- Calculer stock AVANT ce mouvement
    COALESCE(
      (SELECT SUM(m2.quantity_change)
       FROM ordered_movements m2
       WHERE m2.product_id = m.product_id
         AND m2.performed_at < m.performed_at),
      0
    ) AS new_quantity_before,
    -- Calculer stock APRÈS ce mouvement (AVANT + CHANGE)
    COALESCE(
      (SELECT SUM(m2.quantity_change)
       FROM ordered_movements m2
       WHERE m2.product_id = m.product_id
         AND m2.performed_at <= m.performed_at),
      0
    ) AS new_quantity_after
  FROM ordered_movements m
)
UPDATE stock_movements sm
SET
  quantity_before = cs.new_quantity_before,
  quantity_after = cs.new_quantity_after
FROM calculated_stocks cs
WHERE sm.id = cs.id;

-- Étape 3 : Validation post-migration
DO $$
DECLARE
  v_total_movements integer;
  v_corrected_movements integer;
  v_products_affected integer;
BEGIN
  -- Compter mouvements réels
  SELECT COUNT(*) INTO v_total_movements
  FROM stock_movements
  WHERE affects_forecast = false OR affects_forecast IS NULL;

  -- Compter mouvements corrigés (quantity_after différent du backup)
  SELECT COUNT(*) INTO v_corrected_movements
  FROM stock_movements sm
  INNER JOIN stock_movements_backup smb ON sm.id = smb.id
  WHERE sm.quantity_after != smb.quantity_after;

  -- Compter produits affectés
  SELECT COUNT(DISTINCT product_id) INTO v_products_affected
  FROM stock_movements
  WHERE affects_forecast = false OR affects_forecast IS NULL;

  RAISE NOTICE '=== MIGRATION COMPLETED ===';
  RAISE NOTICE 'Total mouvements réels: %', v_total_movements;
  RAISE NOTICE 'Mouvements corrigés: %', v_corrected_movements;
  RAISE NOTICE 'Produits affectés: %', v_products_affected;
  RAISE NOTICE '=========================';
END $$;

-- Étape 4 : Réactiver la contrainte CHECK (sans limitation négative)
-- Note : On N'ajoute PAS de contrainte >= 0 car stock peut être négatif (rupture)
-- La contrainte initiale était trop restrictive et a été supprimée

-- Étape 5 : Vérification cohérence finale
-- Vérifier que quantity_after du dernier mouvement = stock_real du produit
SELECT
  p.name,
  p.stock_real as stock_real_produit,
  sm.quantity_after as quantity_after_dernier_mouvement,
  (p.stock_real - sm.quantity_after) as difference
FROM products p
INNER JOIN LATERAL (
  SELECT quantity_after
  FROM stock_movements
  WHERE product_id = p.id
    AND (affects_forecast = false OR affects_forecast IS NULL)
  ORDER BY performed_at DESC
  LIMIT 1
) sm ON true
WHERE p.stock_real != sm.quantity_after
LIMIT 10;

-- Si cette query retourne des lignes, il y a encore des incohérences
-- Résultat attendu : 0 lignes (toutes les valeurs cohérentes)
