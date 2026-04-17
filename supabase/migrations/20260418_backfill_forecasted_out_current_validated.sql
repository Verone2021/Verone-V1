-- Migration: Backfill stock_forecasted_out for current validated SOs
-- Date: 2026-04-18
-- Task: BO-STOCK-002 Phase 3
--
-- CONTEXTE
-- ========
-- Les 2 SOs actuellement en status 'validated' (SO-2026-00124, SO-2026-00131)
-- ont ete creees directement en validated (import legacy) et n'ont donc jamais
-- declenche `trigger_so_update_forecasted_out` (conditionne sur UPDATE
-- draft->validated). Resultat : stock_forecasted_out des produits concernes
-- est a 0 alors qu'il devrait refleter les quantites reservees.
--
-- La Phase 2 (trigger_so_insert_validated_forecast) couvre les futures SOs
-- directement validated. Cette Phase 3 corrige l'existant.
--
-- On n'utilise PAS le trigger Phase 2 ici (il ne se declenche que sur INSERT).
-- On fait un UPDATE direct idempotent.

-- ============================================================================
-- BACKFILL : stock_forecasted_out = SUM(validated SOs) pour tous les produits
-- ============================================================================
-- Strategie RESYNC IDEMPOTENTE : on RECALCULE stock_forecasted_out pour tous
-- les produits a partir de la verite = SUM(quantity - quantity_shipped) sur
-- les SOs validated/partially_shipped. Idempotent : peut etre re-execute
-- sans double-compte.
--
-- Alternative consideree : UPDATE incremental ciblant SO-00124 + SO-00131
-- -> REJETEE car non idempotent (detecte lors du dry-run : SEP-0002 avait
-- deja fc=1 pour SO-00131, ajout +1 aurait double-compte si relance).

-- Recalcul integral : stock_forecasted_out = SUM(qty restante) sur SOs validated/partially_shipped
WITH computed AS (
    SELECT soi.product_id,
           SUM(GREATEST(0, soi.quantity - COALESCE(soi.quantity_shipped, 0))) AS expected_out
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE so.status IN ('validated', 'partially_shipped')
    GROUP BY soi.product_id
)
UPDATE products p
SET stock_forecasted_out = COALESCE(c.expected_out, 0),
    updated_at = NOW()
FROM computed c
WHERE p.id = c.product_id
  AND p.stock_forecasted_out != COALESCE(c.expected_out, 0);

-- Reset a 0 les produits qui n'ont AUCUNE SO active mais ont fc > 0 (orphelins)
UPDATE products p
SET stock_forecasted_out = 0, updated_at = NOW()
WHERE p.stock_forecasted_out > 0
  AND NOT EXISTS (
    SELECT 1 FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE soi.product_id = p.id
      AND so.status IN ('validated', 'partially_shipped')
      AND GREATEST(0, soi.quantity - COALESCE(soi.quantity_shipped, 0)) > 0
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verifier la coherence post-backfill
DO $$
DECLARE
    v_incoherent_count INTEGER;
BEGIN
    WITH expected AS (
        SELECT soi.product_id,
               SUM(GREATEST(0, soi.quantity - COALESCE(soi.quantity_shipped, 0))) AS expected_out
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE so.status IN ('validated', 'partially_shipped')
        GROUP BY soi.product_id
    )
    SELECT COUNT(*) INTO v_incoherent_count
    FROM products p
    LEFT JOIN expected e ON e.product_id = p.id
    WHERE p.stock_forecasted_out != COALESCE(e.expected_out, 0);

    IF v_incoherent_count > 0 THEN
        RAISE WARNING '[BO-STOCK-002 Phase 3] % produits encore incoherents (a creuser)', v_incoherent_count;
    ELSE
        RAISE NOTICE '[BO-STOCK-002 Phase 3] Tous les produits coherents stock_forecasted_out = SUM(validated SOs)';
    END IF;
END $$;
