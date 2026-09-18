-- =====================================================================
-- EMPREINTE STOCK — Verone 2026-09-15
-- Fichier réutilisable : à enrober dans BEGIN / ROLLBACK pour tester
-- qu'une migration ne perturbe pas les circuits stock.
--
-- Usage :
--   BEGIN;
--     <migration complète ici>
--     \ir docs/scratchpad/stock-fingerprint-2026-09-15.sql
--     DO $$ BEGIN
--       RAISE EXCEPTION 'ROLLBACK_INTENTIONNEL:%', (
--         SELECT row_to_json(r) FROM (<fingerprint SELECT>) r
--       );
--     END $$;
--   ROLLBACK;
--
-- Le résultat de l'exception doit correspondre au snapshot baseline
-- enregistré en section 5 de snapshot-2026-09-15-bloc-S.sql.
-- =====================================================================

-- =====================================================================
-- F1 — Inventaire des mouvements de stock (counts par type et direction)
-- =====================================================================
SELECT
  movement_type,
  direction,
  COUNT(*)           AS nb_rows,
  SUM(quantity)      AS total_qty
FROM public.stock_movements
GROUP BY movement_type, direction
ORDER BY movement_type, direction;

-- =====================================================================
-- F2 — Stock réel agrégé par produit (top 20 par quantité absolue)
-- =====================================================================
SELECT
  product_id,
  SUM(quantity) FILTER (WHERE direction = 'in')  AS total_in,
  SUM(quantity) FILTER (WHERE direction = 'out') AS total_out,
  SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END) AS net_qty
FROM public.stock_movements
WHERE movement_type != 'forecast'
GROUP BY product_id
ORDER BY ABS(SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END)) DESC
LIMIT 20;

-- =====================================================================
-- F3 — État des alertes stock actives
-- =====================================================================
SELECT
  status,
  COUNT(*)   AS nb_alertes,
  MIN(created_at::date) AS premiere_alerte,
  MAX(updated_at::date) AS derniere_maj
FROM public.stock_alert_tracking
GROUP BY status
ORDER BY status;

-- =====================================================================
-- F4 — Mouvements par type (ENUM: IN / OUT / ADJUST)
-- NOTE: il n'y a pas de type 'forecast' dans l'ENUM movement_type.
-- Le stock prévisionnel est géré dans stock_alert_tracking et les
-- colonnes stock_forecasted_out / stock_forecasted_in des produits.
-- =====================================================================
SELECT
  product_id,
  SUM(quantity) FILTER (WHERE movement_type = 'IN')     AS qty_in,
  SUM(quantity) FILTER (WHERE movement_type = 'OUT')    AS qty_out,
  SUM(quantity) FILTER (WHERE movement_type = 'ADJUST') AS qty_adjust
FROM public.stock_movements
GROUP BY product_id
ORDER BY qty_in DESC NULLS LAST
LIMIT 20;

-- =====================================================================
-- F5 — Vues d'alertes stock (counts)
-- =====================================================================
SELECT COUNT(*) AS nb_stock_alerts_view
FROM public.stock_alerts_view;

SELECT COUNT(*) AS nb_stock_alerts_unified_view
FROM public.stock_alerts_unified_view;

-- =====================================================================
-- F6 — Scénario S1 : validation d'une SO existante (dry-run)
-- Vérifie que les triggers de stock prévisionnel sont fonctionnels.
-- Utiliser une SO en draft existante — ne rien modifier si aucun draft.
-- =====================================================================
SELECT
  id,
  order_number,
  status,
  total_ttc
FROM public.sales_orders
WHERE status = 'draft'
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================================
-- F7 — Scénario S2 : réception PO (dry-run)
-- Vérifie la présence d'une PO validée prête à recevoir.
-- =====================================================================
SELECT
  id,
  po_number,
  status
FROM public.purchase_orders
WHERE status = 'validated'
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================================
-- F8 — Scénario S3 : PO en draft (test de garde)
-- PO-2026-00039 — id: be957bee-6cdb-4ef2-9407-047d3cc0d093
-- Si disparu, remplacer par la dernière PO draft.
-- =====================================================================
SELECT
  id,
  po_number,
  status
FROM public.purchase_orders
WHERE id = 'be957bee-6cdb-4ef2-9407-047d3cc0d093'
   OR (status = 'draft' AND id != 'be957bee-6cdb-4ef2-9407-047d3cc0d093')
ORDER BY (id = 'be957bee-6cdb-4ef2-9407-047d3cc0d093') DESC, created_at DESC
LIMIT 3;

-- =====================================================================
-- EMPREINTE CONSOLIDÉE (JSON) — à comparer au baseline enregistré ci-dessous
-- Utilisé dans les essais à transaction annulée.
--
-- BASELINE enregistré le 15/09/2026 ~16:05 UTC :
-- {
--   "stock_movements_total": 404,
--   "stock_movements_in": 196,
--   "stock_movements_out": 152,
--   "stock_movements_adjust": 56,
--   "stock_alerts_view_count": 11,
--   "stock_unified_view_count": 2,
--   "so_validated_count": 8,
--   "po_validated_count": 0
-- }
--
-- RÈGLE DE VERROUILLAGE : chaque essai à transaction annulée doit commencer par
--   SET LOCAL lock_timeout = '2s';
--   SET LOCAL statement_timeout = '20s';
-- pour éviter de bloquer les lectures utilisateur en production.
-- =====================================================================
DO $$
DECLARE
  v_fingerprint json;
BEGIN
  SELECT json_build_object(
    'stock_movements_total',    (SELECT COUNT(*) FROM public.stock_movements),
    'stock_movements_in',       (SELECT COUNT(*) FROM public.stock_movements WHERE movement_type = 'IN'),
    'stock_movements_out',      (SELECT COUNT(*) FROM public.stock_movements WHERE movement_type = 'OUT'),
    'stock_movements_adjust',   (SELECT COUNT(*) FROM public.stock_movements WHERE movement_type = 'ADJUST'),
    'stock_alerts_view_count',  (SELECT COUNT(*) FROM public.stock_alerts_view),
    'stock_unified_view_count', (SELECT COUNT(*) FROM public.stock_alerts_unified_view),
    'so_validated_count',       (SELECT COUNT(*) FROM public.sales_orders WHERE status = 'validated'),
    'po_validated_count',       (SELECT COUNT(*) FROM public.purchase_orders WHERE status = 'validated')
  ) INTO v_fingerprint;
  RAISE EXCEPTION 'FINGERPRINT:%', v_fingerprint;
END $$;
