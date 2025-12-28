-- ============================================================================
-- Migration: Recalcul des commissions pour commandes Pokawa
-- Date: 2025-12-23
-- Description: Mettre à jour les retrocession_amount/rate pour les commandes
--              contenant des produits Pokawa (maintenant affiliés)
-- Formule: Commission Vérone = prix × 15%
-- ============================================================================

BEGIN;

-- Rapport des commandes impactées
DO $$
DECLARE
  v_orders_count INTEGER;
  v_items_count INTEGER;
BEGIN
  -- Compter les commandes avec produits Pokawa
  SELECT COUNT(DISTINCT so.id), COUNT(soi.id)
  INTO v_orders_count, v_items_count
  FROM sales_orders so
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  JOIN products p ON p.id = soi.product_id
  WHERE p.name ILIKE '%pokawa%';

  RAISE NOTICE '=== COMMANDES POKAWA ===';
  RAISE NOTICE 'Commandes impactées: %', v_orders_count;
  RAISE NOTICE 'Lignes de commande: %', v_items_count;
END $$;

-- 1. Mettre à jour les lignes de commande avec le taux de commission
UPDATE sales_order_items soi
SET
  retrocession_rate = p.affiliate_commission_rate / 100,  -- 0.15 pour 15%
  retrocession_amount = soi.unit_price_ht * soi.quantity * (p.affiliate_commission_rate / 100)
FROM products p
WHERE soi.product_id = p.id
  AND p.name ILIKE '%pokawa%'
  AND p.affiliate_commission_rate IS NOT NULL;

-- Rapport après mise à jour des lignes
DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_updated
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE p.name ILIKE '%pokawa%' AND soi.retrocession_rate IS NOT NULL;

  RAISE NOTICE 'Lignes mises à jour avec retrocession: %', v_updated;
END $$;

-- 2. Créer ou mettre à jour les entrées linkme_commissions
-- Pour chaque commande contenant des produits Pokawa
INSERT INTO linkme_commissions (
  affiliate_id,
  order_id,
  order_number,
  order_amount_ht,
  affiliate_commission,
  affiliate_commission_ttc,
  linkme_commission,
  margin_rate_applied,
  linkme_rate_applied,
  tax_rate,
  status,
  created_at
)
SELECT
  p.created_by_affiliate as affiliate_id,
  so.id as order_id,
  so.order_number,
  COALESCE(SUM(soi.total_ht), 0) as order_amount_ht,
  -- Commission affilié = inverse: l'affilié reçoit (prix - commission Vérone)
  -- Ici on stocke ce que Vérone prend (15%)
  COALESCE(SUM(soi.retrocession_amount), 0) as affiliate_commission,
  COALESCE(SUM(soi.retrocession_amount * 1.2), 0) as affiliate_commission_ttc,
  -- Commission plateforme LinkMe (3% standard)
  COALESCE(SUM(soi.total_ht * 0.03), 0) as linkme_commission,
  0.15 as margin_rate_applied,  -- 15% Vérone
  0.03 as linkme_rate_applied,  -- 3% LinkMe
  0.20 as tax_rate,
  CASE
    WHEN so.payment_status = 'paid' THEN 'validated'
    ELSE 'pending'
  END as status,
  NOW() as created_at
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
JOIN products p ON p.id = soi.product_id
WHERE p.name ILIKE '%pokawa%'
  AND p.created_by_affiliate IS NOT NULL
GROUP BY p.created_by_affiliate, so.id, so.order_number, so.payment_status
ON CONFLICT (order_id) DO UPDATE
SET
  affiliate_commission = EXCLUDED.affiliate_commission,
  affiliate_commission_ttc = EXCLUDED.affiliate_commission_ttc,
  linkme_commission = EXCLUDED.linkme_commission,
  margin_rate_applied = EXCLUDED.margin_rate_applied,
  updated_at = NOW();

-- Rapport final
DO $$
DECLARE
  v_commissions_count INTEGER;
  v_total_commission NUMERIC;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(affiliate_commission), 0)
  INTO v_commissions_count, v_total_commission
  FROM linkme_commissions lc
  JOIN sales_orders so ON so.id = lc.order_id
  JOIN sales_order_items soi ON soi.sales_order_id = so.id
  JOIN products p ON p.id = soi.product_id
  WHERE p.name ILIKE '%pokawa%';

  RAISE NOTICE '=== RÉSULTAT COMMISSIONS ===';
  RAISE NOTICE 'Entrées linkme_commissions: %', v_commissions_count;
  RAISE NOTICE 'Total commissions Vérone: %€', v_total_commission;
END $$;

COMMIT;
