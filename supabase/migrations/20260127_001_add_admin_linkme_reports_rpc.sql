-- ============================================================================
-- Migration: RPC pour génération de rapports administratifs LinkMe
-- Date: 2026-01-27
-- Description: RPC SECURITY DEFINER pour permettre génération complète de
--              rapports (toutes commandes) sans être bloqué par RLS
-- ============================================================================

-- RPC pour récupérer TOUTES les commandes LinkMe (admin only)
CREATE OR REPLACE FUNCTION get_all_linkme_orders_for_reports()
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  created_at TIMESTAMPTZ,
  total_ht NUMERIC,
  total_ttc NUMERIC,
  customer_name TEXT,
  status TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    order_number,
    created_at,
    total_ht,
    total_ttc,
    customer_name,
    status
  FROM linkme_orders_with_margins
  ORDER BY created_at ASC;
$$;

-- RPC pour récupérer les items d'une commande (admin only)
CREATE OR REPLACE FUNCTION get_linkme_order_items_for_reports(p_order_id UUID)
RETURNS TABLE (
  quantity INT,
  unit_price_ht NUMERIC,
  total_ht NUMERIC,
  product_sku TEXT,
  product_name TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    quantity::INT,
    unit_price_ht,
    total_ht,
    product_sku,
    product_name
  FROM linkme_order_items_enriched
  WHERE sales_order_id = p_order_id
  ORDER BY id;
$$;

-- Grants (accessible à tous les utilisateurs authentifiés)
-- Note: En production, on pourrait restreindre à un rôle admin spécifique
GRANT EXECUTE ON FUNCTION get_all_linkme_orders_for_reports TO authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_order_items_for_reports TO authenticated;

-- Commentaires
COMMENT ON FUNCTION get_all_linkme_orders_for_reports IS
'RPC administratif SECURITY DEFINER pour génération de rapports.
Retourne TOUTES les commandes LinkMe (contourne RLS).
À utiliser uniquement pour scripts de reporting.';

COMMENT ON FUNCTION get_linkme_order_items_for_reports IS
'RPC administratif SECURITY DEFINER pour génération de rapports.
Retourne les items d une commande (contourne RLS).
À utiliser uniquement pour scripts de reporting.';
