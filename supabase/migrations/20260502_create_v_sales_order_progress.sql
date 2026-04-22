-- Migration : vue v_sales_order_progress
-- Date : 2026-05-02 (séquentielle après 20260501)
-- Contexte : bug progression 100% hardcodée dans expeditions-order-row.tsx
-- Ticket : BO-SHIP-PROG-001
--
-- Source de vérité unifiée pour la progression d'expédition d'une commande client.
-- Agrège les 2 sources DB existantes :
--   - sales_order_items : quantités commandées + quantités confirmées stock
--     (mise à jour par les triggers `update_stock_on_shipment` ou
--     `confirm_packlink_shipment_stock` après paiement)
--   - sales_order_shipments : lots physiques créés (incl. lots Packlink
--     en a_payer qui ne sont pas encore confirmés en stock)
--
-- Design métier rappel :
--   - Shipment manual (delivery_method != 'packlink', packlink_status = NULL)
--     → trigger update_stock_on_shipment décrémente immédiatement
--   - Shipment Packlink a_payer → early return trigger, rien n'est décrémenté
--   - Webhook `shipment.carrier.success` passe packlink_status a_payer → paye
--     → trigger confirm_packlink_shipment_stock décrémente
--
-- Statuts actifs (lot pris en charge, acheminé ou livré) :
--   NULL (shipment manuel), 'a_payer', 'paye', 'in_transit', 'delivered'
-- Statuts exclus (lot annulé ou en incident) :
--   'cancelled', 'incident'

DROP VIEW IF EXISTS public.v_sales_order_progress CASCADE;

CREATE VIEW public.v_sales_order_progress
WITH (security_invoker = on)
AS
WITH item_totals AS (
  SELECT
    soi.sales_order_id,
    COALESCE(SUM(soi.quantity), 0)::int AS total_ordered,
    COALESCE(SUM(soi.quantity_shipped), 0)::int AS total_confirmed_shipped
  FROM public.sales_order_items soi
  GROUP BY soi.sales_order_id
),
shipment_totals AS (
  SELECT
    sos.sales_order_id,
    COALESCE(SUM(sos.quantity_shipped), 0)::int AS total_in_flight,
    bool_or(sos.packlink_status = 'a_payer') AS has_pending_payment,
    bool_or(sos.packlink_status = 'incident') AS has_incident
  FROM public.sales_order_shipments sos
  WHERE
    -- Lots actifs : Packlink pris en charge OU shipment manuel
    sos.packlink_status IN ('a_payer', 'paye', 'in_transit', 'delivered')
    OR (sos.packlink_status IS NULL AND sos.delivery_method != 'packlink')
    OR (sos.packlink_status IS NULL AND sos.delivery_method IS NULL)
  GROUP BY sos.sales_order_id
)
SELECT
  it.sales_order_id,
  it.total_ordered,
  it.total_confirmed_shipped,
  COALESCE(st.total_in_flight, 0) AS total_in_flight,
  -- Le max prend la plus grande valeur entre confirmed (trigger passé) et in_flight
  -- (lot créé). En pratique, in_flight >= confirmed toujours, car confirmed est un
  -- sous-ensemble. Mais on sécurise en cas de désynchro transitoire.
  GREATEST(it.total_confirmed_shipped, COALESCE(st.total_in_flight, 0)) AS total_reserved,
  GREATEST(
    it.total_ordered - GREATEST(it.total_confirmed_shipped, COALESCE(st.total_in_flight, 0)),
    0
  ) AS total_remaining,
  CASE
    WHEN it.total_ordered > 0 THEN
      LEAST(
        100,
        ROUND(
          (GREATEST(it.total_confirmed_shipped, COALESCE(st.total_in_flight, 0))::numeric
            / it.total_ordered::numeric) * 100
        )::int
      )
    ELSE 0
  END AS progress_percent,
  COALESCE(st.has_pending_payment, false) AS has_pending_payment,
  COALESCE(st.has_incident, false) AS has_incident
FROM item_totals it
LEFT JOIN shipment_totals st ON st.sales_order_id = it.sales_order_id;

COMMENT ON VIEW public.v_sales_order_progress IS
  'Progression expédition unifiée (BO-SHIP-PROG-001). Agrège sales_order_items '
  '(commandé/confirmé stock) et sales_order_shipments (lots en cours). '
  'security_invoker=on pour hériter des RLS des tables sous-jacentes.';

COMMENT ON COLUMN public.v_sales_order_progress.total_ordered IS 'SUM quantity sur sales_order_items';
COMMENT ON COLUMN public.v_sales_order_progress.total_confirmed_shipped IS 'SUM quantity_shipped sur sales_order_items (trigger passé)';
COMMENT ON COLUMN public.v_sales_order_progress.total_in_flight IS 'SUM quantity_shipped sur sales_order_shipments actifs';
COMMENT ON COLUMN public.v_sales_order_progress.total_reserved IS 'MAX(confirmed, in_flight) — vraie quantité prise en charge';
COMMENT ON COLUMN public.v_sales_order_progress.total_remaining IS 'total_ordered - total_reserved (min 0)';
COMMENT ON COLUMN public.v_sales_order_progress.progress_percent IS 'Ratio 0-100';
COMMENT ON COLUMN public.v_sales_order_progress.has_pending_payment IS 'Au moins 1 shipment packlink_status=a_payer';
COMMENT ON COLUMN public.v_sales_order_progress.has_incident IS 'Au moins 1 shipment packlink_status=incident';

GRANT SELECT ON public.v_sales_order_progress TO authenticated;
