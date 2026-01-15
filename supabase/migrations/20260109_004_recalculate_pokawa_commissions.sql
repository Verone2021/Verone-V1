-- =====================================================
-- Migration: Recalculate Pokawa historical commissions
-- Date: 2026-01-09
-- Description: Recalcule les commissions pour les 19 commandes Pokawa
--              qui avaient affiliate_commission = 0€
--
-- CONTEXTE:
-- - Pokawa affiliate_id: cdcb3238-0abd-4c43-b1fa-11bb633df163
-- - Modèle INVERSE: Vérone déduit 15% du prix de vente
-- - 19 commandes avec commission incorrecte = 0€
-- - Montant total manquant estimé: ~9 768€
--
-- SOURCE DE VERITE: linkme_order_items_enriched.affiliate_margin
-- =====================================================

-- 1. AUDIT AVANT CORRECTION
DO $$
DECLARE
  pokawa_id UUID := 'cdcb3238-0abd-4c43-b1fa-11bb633df163';
  zero_commission_count INTEGER;
  total_zero_commission NUMERIC;
BEGIN
  -- Compter les commissions à 0€ pour Pokawa
  SELECT
    COUNT(*),
    COALESCE(SUM(so.total_ht), 0)
  INTO zero_commission_count, total_zero_commission
  FROM linkme_commissions lc
  JOIN sales_orders so ON so.id = lc.order_id
  WHERE lc.affiliate_id = pokawa_id
    AND lc.affiliate_commission = 0
    AND so.status NOT IN ('cancelled', 'draft');

  RAISE NOTICE '=== AUDIT AVANT CORRECTION (Pokawa) ===';
  RAISE NOTICE 'Commandes avec commission = 0€: %', zero_commission_count;
  RAISE NOTICE 'Total HT de ces commandes: % €', total_zero_commission;
END $$;

-- 2. LISTE DES COMMANDES A CORRIGER
DO $$
DECLARE
  rec RECORD;
  pokawa_id UUID := 'cdcb3238-0abd-4c43-b1fa-11bb633df163';
BEGIN
  RAISE NOTICE '=== COMMANDES POKAWA AVEC COMMISSION = 0€ ===';
  FOR rec IN
    SELECT
      so.order_number,
      so.created_at::DATE AS order_date,
      so.total_ht,
      lc.affiliate_commission AS current_commission
    FROM linkme_commissions lc
    JOIN sales_orders so ON so.id = lc.order_id
    WHERE lc.affiliate_id = pokawa_id
      AND lc.affiliate_commission = 0
      AND so.status NOT IN ('cancelled', 'draft')
    ORDER BY so.created_at
  LOOP
    RAISE NOTICE 'Order: %, Date: %, Total HT: % €, Commission: % €',
      rec.order_number, rec.order_date, rec.total_ht, rec.current_commission;
  END LOOP;
END $$;

-- 3. CALCUL DES NOUVELLES COMMISSIONS
-- Utilise linkme_order_items_enriched.affiliate_margin comme source de vérité
-- Note: affiliate_margin = base_price_ht × margin_rate × quantity
-- Pour produits affiliés, margin_rate devrait être 0, donc on utilise affiliate_commission_rate du produit

WITH pokawa_orders AS (
  -- Identifier les commandes Pokawa avec commission = 0
  SELECT
    lc.id AS commission_id,
    lc.order_id,
    so.order_number
  FROM linkme_commissions lc
  JOIN sales_orders so ON so.id = lc.order_id
  WHERE lc.affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'
    AND lc.affiliate_commission = 0
    AND so.status NOT IN ('cancelled', 'draft')
),
calculated_commissions AS (
  -- Calculer la commission basée sur les items
  -- Pour produits affiliés: commission = total_ht × affiliate_commission_rate
  SELECT
    po.commission_id,
    po.order_id,
    po.order_number,
    -- Somme des commissions calculées depuis les items
    COALESCE(SUM(
      CASE
        -- Si le produit est un produit affilié (created_by_affiliate IS NOT NULL)
        WHEN p.created_by_affiliate IS NOT NULL THEN
          soi.total_ht * COALESCE(p.affiliate_commission_rate, 15) / 100
        -- Sinon utiliser le retrocession_amount existant ou affiliate_margin
        ELSE
          COALESCE(loie.affiliate_margin, soi.retrocession_amount, 0)
      END
    ), 0) AS new_affiliate_commission_ht
  FROM pokawa_orders po
  JOIN sales_order_items soi ON soi.sales_order_id = po.order_id
  JOIN products p ON p.id = soi.product_id
  LEFT JOIN linkme_order_items_enriched loie ON loie.id = soi.id
  GROUP BY po.commission_id, po.order_id, po.order_number
)
-- Afficher les calculs avant de mettre à jour
SELECT
  cc.order_number,
  cc.new_affiliate_commission_ht AS commission_ht,
  ROUND(cc.new_affiliate_commission_ht * 1.20, 2) AS commission_ttc
FROM calculated_commissions cc
ORDER BY cc.order_number;

-- 4. MISE A JOUR DES COMMISSIONS
-- Recalcule et met à jour les commissions Pokawa
WITH pokawa_orders AS (
  SELECT
    lc.id AS commission_id,
    lc.order_id
  FROM linkme_commissions lc
  JOIN sales_orders so ON so.id = lc.order_id
  WHERE lc.affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'
    AND lc.affiliate_commission = 0
    AND so.status NOT IN ('cancelled', 'draft')
),
calculated_commissions AS (
  SELECT
    po.commission_id,
    po.order_id,
    COALESCE(SUM(
      CASE
        WHEN p.created_by_affiliate IS NOT NULL THEN
          soi.total_ht * COALESCE(p.affiliate_commission_rate, 15) / 100
        ELSE
          COALESCE(loie.affiliate_margin, soi.retrocession_amount, 0)
      END
    ), 0) AS new_commission_ht
  FROM pokawa_orders po
  JOIN sales_order_items soi ON soi.sales_order_id = po.order_id
  JOIN products p ON p.id = soi.product_id
  LEFT JOIN linkme_order_items_enriched loie ON loie.id = soi.id
  GROUP BY po.commission_id, po.order_id
)
UPDATE linkme_commissions lc
SET
  affiliate_commission = cc.new_commission_ht,
  affiliate_commission_ttc = ROUND(cc.new_commission_ht * 1.20, 2),
  -- Aussi mettre à jour linkme_commission si vide (commission Vérone/LinkMe)
  linkme_commission = CASE
    WHEN lc.linkme_commission IS NULL OR lc.linkme_commission = 0
    THEN cc.new_commission_ht
    ELSE lc.linkme_commission
  END,
  updated_at = NOW()
FROM calculated_commissions cc
WHERE lc.id = cc.commission_id;

-- 5. AUDIT APRES CORRECTION
DO $$
DECLARE
  pokawa_id UUID := 'cdcb3238-0abd-4c43-b1fa-11bb633df163';
  remaining_zero INTEGER;
  total_commissions NUMERIC;
  commission_count INTEGER;
BEGIN
  -- Compter les commissions restantes à 0€
  SELECT COUNT(*) INTO remaining_zero
  FROM linkme_commissions lc
  JOIN sales_orders so ON so.id = lc.order_id
  WHERE lc.affiliate_id = pokawa_id
    AND lc.affiliate_commission = 0
    AND so.status NOT IN ('cancelled', 'draft');

  -- Total des commissions Pokawa
  SELECT COUNT(*), COALESCE(SUM(lc.affiliate_commission), 0)
  INTO commission_count, total_commissions
  FROM linkme_commissions lc
  WHERE lc.affiliate_id = pokawa_id;

  RAISE NOTICE '=== AUDIT APRES CORRECTION (Pokawa) ===';
  RAISE NOTICE 'Commissions restantes à 0€: % (attendu: 0 ou moins)', remaining_zero;
  RAISE NOTICE 'Total commissions Pokawa: % (% commandes)', total_commissions, commission_count;
END $$;

-- =====================================================
-- VERIFICATION MANUELLE RECOMMANDEE
--
-- Après exécution de cette migration, vérifier:
--
-- 1. Aucune commission Pokawa à 0€:
--    SELECT COUNT(*) FROM linkme_commissions lc
--    JOIN sales_orders so ON so.id = lc.order_id
--    WHERE lc.affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'
--      AND lc.affiliate_commission = 0
--      AND so.status NOT IN ('cancelled', 'draft');
--    -- Attendu: 0
--
-- 2. Montant total des commissions Pokawa:
--    SELECT SUM(affiliate_commission) FROM linkme_commissions
--    WHERE affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163';
--    -- Attendu: > 9000€
--
-- 3. Vérifier quelques commandes manuellement:
--    SELECT so.order_number, lc.affiliate_commission
--    FROM linkme_commissions lc
--    JOIN sales_orders so ON so.id = lc.order_id
--    WHERE lc.affiliate_id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'
--    ORDER BY so.created_at DESC LIMIT 5;
-- =====================================================
