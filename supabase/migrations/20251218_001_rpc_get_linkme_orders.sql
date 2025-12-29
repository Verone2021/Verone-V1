-- ============================================
-- Migration: RPC canonique pour commandes LinkMe
-- Date: 2025-12-18
-- Description: Une seule source de vérité pour CMS et Front LinkMe
--              Évite la dérive entre les 2 UIs
-- ============================================

-- 1. RPC pour récupérer les commandes LinkMe
-- p_affiliate_id = NULL → CMS (toutes les commandes)
-- p_affiliate_id = UUID → Front LinkMe (commandes de l'affilié)

CREATE OR REPLACE FUNCTION get_linkme_orders(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status TEXT,
  payment_status TEXT,
  total_ht NUMERIC,
  total_ttc NUMERIC,
  total_affiliate_margin NUMERIC,
  customer_name TEXT,
  customer_type TEXT,
  customer_id UUID,
  customer_address TEXT,
  customer_postal_code TEXT,
  customer_city TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  affiliate_id UUID,
  affiliate_name TEXT,
  affiliate_type TEXT,
  selection_id UUID,
  selection_name TEXT,
  items_count INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    lom.id,
    lom.order_number,
    lom.status,
    lom.payment_status,
    lom.total_ht,
    lom.total_ttc,
    lom.total_affiliate_margin,
    lom.customer_name,
    lom.customer_type,
    lom.customer_id,
    lom.customer_address,
    lom.customer_postal_code,
    lom.customer_city,
    lom.customer_email,
    lom.customer_phone,
    la.id AS affiliate_id,
    lom.affiliate_name,
    lom.affiliate_type,
    lom.selection_id,
    lom.selection_name,
    lom.items_count::INT,
    lom.created_at,
    lom.updated_at
  FROM linkme_orders_with_margins lom
  LEFT JOIN linkme_selections ls ON ls.id = lom.selection_id
  LEFT JOIN linkme_affiliates la ON la.id = ls.affiliate_id
  WHERE
    -- Si p_affiliate_id est NULL, retourner toutes les commandes (mode CMS)
    (p_affiliate_id IS NULL)
    OR
    -- Sinon, filtrer par les sélections de l'affilié
    (la.id = p_affiliate_id)
  ORDER BY lom.created_at DESC;
$$;

-- 2. RPC pour récupérer les items d'une commande
CREATE OR REPLACE FUNCTION get_linkme_order_items(p_order_id UUID)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  product_image_url TEXT,
  quantity INT,
  unit_price_ht NUMERIC,
  total_ht NUMERIC,
  base_price_ht NUMERIC,
  margin_rate NUMERIC,
  commission_rate NUMERIC,
  selling_price_ht NUMERIC,
  affiliate_margin NUMERIC
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT
    loi.id,
    loi.product_id,
    loi.product_name,
    loi.product_sku,
    loi.product_image_url,
    loi.quantity::INT,
    loi.unit_price_ht,
    loi.total_ht,
    loi.base_price_ht,
    loi.margin_rate,
    loi.commission_rate,
    loi.selling_price_ht,
    loi.affiliate_margin
  FROM linkme_order_items_enriched loi
  WHERE loi.sales_order_id = p_order_id
  ORDER BY loi.id;
$$;

-- 3. Commentaires
COMMENT ON FUNCTION get_linkme_orders IS
'RPC canonique pour récupérer les commandes LinkMe.
- p_affiliate_id = NULL : retourne toutes les commandes (mode CMS)
- p_affiliate_id = UUID : retourne uniquement les commandes de cet affilié (mode Front LinkMe)
IMPORTANT: Les 2 UIs (CMS et Front) doivent utiliser cette RPC pour éviter la dérive.';

COMMENT ON FUNCTION get_linkme_order_items IS
'RPC pour récupérer les items d une commande LinkMe avec toutes les données enrichies.';

-- 4. Grants
GRANT EXECUTE ON FUNCTION get_linkme_orders TO authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_order_items TO authenticated;
