-- =====================================================================
-- [BO-PRODUCTS-PROFIT-002] Prix de revient figé à la vente + marge LinkMe de tout l'historique
-- =====================================================================
-- Décisions de Roméo (15/09/2026) :
--   - figer le prix de revient au moment de chaque vente (validation de la commande) ;
--   - récupérer tout l'historique : pour une vente passée, prix de revient = moyenne pondérée des
--     achats REÇUS avant la date de la vente ; à défaut, prix de revient actuel ; la source est gardée ;
--   - marge nette Vérone LinkMe = prix LinkMe figé (base_price_ht_locked) − prix de revient ;
--     la commission de l'affilié est exclue de la marge (affichée à part).
--
--   1. sales_order_item_costs : instantané 1:1 du coût d'une ligne vendue. Table séparée plutôt que
--      colonnes sur sales_order_items : toute UPDATE de sales_order_items déclenche
--      recalculate_sales_order_totals + update_sales_order_affiliate_totals → UPDATE de la commande,
--      updated_by effacé en migration et une ligne audit_logs par commande. Un INSERT ici ne déclenche rien.
--   2. snapshot_sales_order_item_costs() + trg_snapshot_item_costs_on_validation : NOUVEAU déclencheur,
--      AFTER UPDATE OF status ON sales_orders. À la validation → instantané au coût actuel du produit ;
--      au retour en brouillon → instantanés supprimés (miroir du verrou de prix LinkMe).
--   3. Reprise de l'historique (commandes validées → clôturées) : achats reçus avant la vente,
--      sinon cost_net_avg, sinon cost_price (sans frais), sinon manquant.
--   4. get_linkme_verone_margin(p_from, p_to) : totaux LinkMe (encaissé Vérone, coût, marge, %, coefficient,
--      commissions affiliés exclues, CA client, couverture) + produits. Réservé au back-office.
--
-- Aucun déclencheur existant modifié (stock, prix LinkMe, commissions). Aucune ligne de
-- sales_order_items / sales_orders réécrite. RLS back-office, aucun droit anon (R-GRANT).
--
-- Application : via execute_sql après essai annulé, jamais `supabase db push` ; inscription au
-- carnet ; types régénérés dans la même PR.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. Instantané du coût ------------------------------------------------------------
CREATE TABLE public.sales_order_item_costs (
  sales_order_item_id uuid PRIMARY KEY
    REFERENCES public.sales_order_items(id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  cost_unit_ht numeric(12,4) NULL
    CONSTRAINT sales_order_item_costs_cost_unit_ht_check CHECK (cost_unit_ht IS NULL OR cost_unit_ht > 0),
  cost_source text NOT NULL
    CONSTRAINT sales_order_item_costs_cost_source_check CHECK (
      cost_source IN ('validation', 'purchase_history', 'current_cost_net_avg', 'current_cost_price', 'missing')
    ),
  includes_fees boolean NOT NULL DEFAULT false,
  locked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_order_item_costs_missing_consistency CHECK (
    (cost_source = 'missing') = (cost_unit_ht IS NULL)
  )
);

CREATE INDEX sales_order_item_costs_product_id_idx
  ON public.sales_order_item_costs (product_id);

ALTER TABLE public.sales_order_item_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_manage_sales_order_item_costs ON public.sales_order_item_costs
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

REVOKE ALL ON public.sales_order_item_costs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.sales_order_item_costs TO authenticated;
GRANT ALL ON public.sales_order_item_costs TO service_role;

-- 2. Figer à la validation --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.snapshot_sales_order_item_costs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.status = 'validated' AND OLD.status IS DISTINCT FROM 'validated' THEN
    INSERT INTO public.sales_order_item_costs
      (sales_order_item_id, product_id, cost_unit_ht, cost_source, includes_fees)
    SELECT
      soi.id,
      soi.product_id,
      CASE
        WHEN p.cost_net_avg > 0 THEN p.cost_net_avg
        WHEN p.cost_price > 0 THEN p.cost_price
      END,
      CASE
        WHEN p.cost_net_avg > 0 OR p.cost_price > 0 THEN 'validation'
        ELSE 'missing'
      END,
      COALESCE(p.cost_net_avg > 0, false)
    FROM public.sales_order_items soi
    LEFT JOIN public.products p ON p.id = soi.product_id
    WHERE soi.sales_order_id = NEW.id
    ON CONFLICT (sales_order_item_id) DO NOTHING;
  ELSIF OLD.status = 'validated' AND NEW.status = 'draft' THEN
    DELETE FROM public.sales_order_item_costs c
    USING public.sales_order_items soi
    WHERE c.sales_order_item_id = soi.id
      AND soi.sales_order_id = NEW.id;
  END IF;
  RETURN NULL;
END;
$fn$;

COMMENT ON FUNCTION public.snapshot_sales_order_item_costs() IS
  'BO-PRODUCTS-PROFIT-002 : fige le prix de revient des lignes à la validation de la commande (coût actuel du produit), supprime les instantanés au retour en brouillon. Indépendant des déclencheurs stock / prix / commissions.';

REVOKE EXECUTE ON FUNCTION public.snapshot_sales_order_item_costs() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_snapshot_item_costs_on_validation
  AFTER UPDATE OF status ON public.sales_orders
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.snapshot_sales_order_item_costs();

-- 3. Reprise de l'historique -------------------------------------------------------
WITH sale_lines AS (
  SELECT
    soi.id AS item_id,
    soi.product_id,
    COALESCE(so.order_date, so.created_at::date) AS sale_date
  FROM public.sales_order_items soi
  JOIN public.sales_orders so ON so.id = soi.sales_order_id
  WHERE so.status IN ('validated', 'partially_shipped', 'shipped', 'delivered', 'closed')
),
history AS (
  SELECT
    sl.item_id,
    ROUND(SUM(poi.unit_cost_net * poi.quantity) / NULLIF(SUM(poi.quantity), 0), 4) AS avg_cost
  FROM sale_lines sl
  JOIN public.purchase_order_items poi ON poi.product_id = sl.product_id
  JOIN public.purchase_orders po ON po.id = poi.purchase_order_id
  WHERE po.status = 'received'
    AND po.received_at IS NOT NULL
    AND po.received_at::date <= sl.sale_date
    AND poi.unit_cost_net > 0
    AND poi.quantity > 0
  GROUP BY sl.item_id
)
INSERT INTO public.sales_order_item_costs
  (sales_order_item_id, product_id, cost_unit_ht, cost_source, includes_fees, locked_at)
SELECT
  sl.item_id,
  sl.product_id,
  CASE
    WHEN h.avg_cost > 0 THEN h.avg_cost
    WHEN p.cost_net_avg > 0 THEN p.cost_net_avg
    WHEN p.cost_price > 0 THEN p.cost_price
  END,
  CASE
    WHEN h.avg_cost > 0 THEN 'purchase_history'
    WHEN p.cost_net_avg > 0 THEN 'current_cost_net_avg'
    WHEN p.cost_price > 0 THEN 'current_cost_price'
    ELSE 'missing'
  END,
  COALESCE(h.avg_cost > 0, false) OR COALESCE(p.cost_net_avg > 0, false),
  now()
FROM sale_lines sl
LEFT JOIN history h ON h.item_id = sl.item_id
LEFT JOIN public.products p ON p.id = sl.product_id
ON CONFLICT (sales_order_item_id) DO NOTHING;

-- 4. Marge LinkMe de tout l'historique ---------------------------------------------
CREATE OR REPLACE FUNCTION public.get_linkme_verone_margin(
  p_from date DEFAULT NULL,
  p_to date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT is_backoffice_user() THEN
    RAISE EXCEPTION 'Accès réservé au back-office' USING ERRCODE = '42501';
  END IF;

  WITH lines AS (
    SELECT
      so.id AS order_id,
      soi.product_id,
      soi.quantity,
      COALESCE(soi.base_price_ht_locked, soi.unit_price_ht) AS verone_unit,
      COALESCE(soi.total_ht, soi.unit_price_ht * soi.quantity) AS client_revenue,
      COALESCE(
        soi.retrocession_amount,
        GREATEST(
          0,
          COALESCE(soi.selling_price_ht_locked, soi.unit_price_ht)
            - COALESCE(soi.base_price_ht_locked, soi.unit_price_ht)
        ) * soi.quantity
      ) AS affiliate_commission,
      p.created_by_affiliate IS NOT NULL AS is_affiliate_product,
      COALESCE(p.affiliate_commission_rate, 0) AS affiliate_rate,
      COALESCE(
        c.cost_unit_ht,
        CASE WHEN c.sales_order_item_id IS NULL THEN
          CASE WHEN p.cost_net_avg > 0 THEN p.cost_net_avg WHEN p.cost_price > 0 THEN p.cost_price END
        END
      ) AS cost_unit,
      COALESCE(
        c.cost_source,
        CASE
          WHEN p.cost_net_avg > 0 THEN 'current_cost_net_avg'
          WHEN p.cost_price > 0 THEN 'current_cost_price'
          ELSE 'missing'
        END
      ) AS cost_source,
      COALESCE(c.includes_fees, COALESCE(p.cost_net_avg > 0, false)) AS includes_fees,
      soi.unit_price_ht
    FROM public.sales_order_items soi
    JOIN public.sales_orders so ON so.id = soi.sales_order_id
    JOIN public.sales_channels sc ON sc.id = so.channel_id AND sc.code = 'linkme'
    LEFT JOIN public.products p ON p.id = soi.product_id
    LEFT JOIN public.sales_order_item_costs c ON c.sales_order_item_id = soi.id
    WHERE so.status IN ('validated', 'partially_shipped', 'shipped', 'delivered', 'closed')
      AND (p_from IS NULL OR COALESCE(so.order_date, so.created_at::date) >= p_from)
      AND (p_to IS NULL OR COALESCE(so.order_date, so.created_at::date) <= p_to)
  ),
  computed AS (
    SELECT
      l.*,
      l.verone_unit * l.quantity AS verone_revenue,
      (NOT l.is_affiliate_product AND l.cost_unit IS NOT NULL) AS covered,
      CASE WHEN l.is_affiliate_product
        THEN l.unit_price_ht * l.quantity * l.affiliate_rate / 100
        ELSE 0 END AS verone_commission
    FROM lines l
  ),
  totals AS (
    SELECT jsonb_build_object(
      'lines', count(*),
      'orders', count(DISTINCT order_id),
      'quantity', COALESCE(sum(quantity), 0),
      'verone_revenue', ROUND(COALESCE(sum(verone_revenue) FILTER (WHERE NOT is_affiliate_product), 0), 2),
      'client_revenue', ROUND(COALESCE(sum(client_revenue), 0), 2),
      'affiliate_commission_total', ROUND(COALESCE(sum(affiliate_commission) FILTER (WHERE NOT is_affiliate_product), 0), 2),
      'covered_lines', count(*) FILTER (WHERE covered),
      'covered_revenue', ROUND(COALESCE(sum(verone_revenue) FILTER (WHERE covered), 0), 2),
      'cost_total', ROUND(COALESCE(sum(cost_unit * quantity) FILTER (WHERE covered), 0), 2),
      'margin_total', ROUND(COALESCE(sum(verone_revenue - cost_unit * quantity) FILTER (WHERE covered), 0), 2),
      'margin_percent', ROUND(
        (sum(verone_revenue - cost_unit * quantity) FILTER (WHERE covered))
          / NULLIF(sum(verone_revenue) FILTER (WHERE covered), 0) * 100, 1),
      'coefficient', ROUND(
        (sum(verone_revenue) FILTER (WHERE covered))
          / NULLIF(sum(cost_unit * quantity) FILTER (WHERE covered), 0), 2),
      'missing_cost_lines', count(*) FILTER (WHERE NOT is_affiliate_product AND cost_unit IS NULL),
      'without_fees_lines', count(*) FILTER (WHERE covered AND NOT includes_fees),
      'affiliate_product_lines', count(*) FILTER (WHERE is_affiliate_product),
      'verone_commission_total', ROUND(COALESCE(sum(verone_commission), 0), 2),
      'cost_sources', (
        SELECT COALESCE(jsonb_object_agg(cost_source, n), '{}'::jsonb)
        FROM (SELECT cost_source, count(*) AS n FROM computed WHERE NOT is_affiliate_product GROUP BY cost_source) s
      )
    ) AS t
    FROM computed
  ),
  products_agg AS (
    SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.margin_total DESC NULLS LAST), '[]'::jsonb) AS j
    FROM (
      SELECT
        cp.product_id,
        pr.name,
        pr.sku,
        sum(cp.quantity) AS quantity,
        ROUND(sum(cp.verone_revenue), 2) AS verone_revenue,
        ROUND(sum(cp.verone_revenue - cp.cost_unit * cp.quantity) FILTER (WHERE cp.covered), 2) AS margin_total,
        ROUND(
          (sum(cp.verone_revenue - cp.cost_unit * cp.quantity) FILTER (WHERE cp.covered))
            / NULLIF(sum(cp.verone_revenue) FILTER (WHERE cp.covered), 0) * 100, 1) AS margin_percent,
        ROUND(
          (sum(cp.verone_revenue) FILTER (WHERE cp.covered))
            / NULLIF(sum(cp.cost_unit * cp.quantity) FILTER (WHERE cp.covered), 0), 2) AS coefficient,
        bool_and(cp.includes_fees) FILTER (WHERE cp.covered) AS all_costs_include_fees
      FROM computed cp
      LEFT JOIN public.products pr ON pr.id = cp.product_id
      WHERE NOT cp.is_affiliate_product
      GROUP BY cp.product_id, pr.name, pr.sku
    ) x
  )
  SELECT jsonb_build_object('totals', totals.t, 'products', products_agg.j)
  INTO v_result
  FROM totals, products_agg;

  RETURN v_result;
END;
$fn$;

COMMENT ON FUNCTION public.get_linkme_verone_margin(date, date) IS
  'BO-PRODUCTS-PROFIT-002 : marge nette Vérone sur les ventes LinkMe (prix LinkMe figé − prix de revient figé, commission affilié exclue), totaux + produits, période facultative (date de commande). Réservé au back-office.';

REVOKE EXECUTE ON FUNCTION public.get_linkme_verone_margin(date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_linkme_verone_margin(date, date) TO authenticated, service_role;

-- 5. Documentation -------------------------------------------------------------------
COMMENT ON TABLE public.sales_order_item_costs IS
  'Prix de revient d''une ligne vendue figé à la vente (BO-PRODUCTS-PROFIT-002). Rempli à la validation (source validation) ; historique repris le 15/09/2026 (purchase_history = moyenne des achats reçus avant la vente, sinon coût actuel). Table 1:1 pour ne pas déclencher les recalculs de commande.';
COMMENT ON COLUMN public.sales_order_item_costs.cost_source IS
  'validation = coût du produit au moment de la validation · purchase_history = achats reçus avant la vente · current_cost_net_avg / current_cost_price = coût actuel au 15/09/2026 faute d''achat antérieur · missing = aucun coût connu.';
COMMENT ON COLUMN public.sales_order_item_costs.includes_fees IS
  'true si le coût inclut les frais d''approche (unit_cost_net / cost_net_avg) ; false si prix d''achat seul (cost_price).';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (les instantanés sont perdus ; les ventes et commandes ne sont pas touchées) :
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- DROP FUNCTION public.get_linkme_verone_margin(date, date);
-- DROP TRIGGER trg_snapshot_item_costs_on_validation ON public.sales_orders;
-- DROP FUNCTION public.snapshot_sales_order_item_costs();
-- DROP TABLE public.sales_order_item_costs;
-- COMMIT;
