-- ============================================
-- Migration: Mise à jour RPC get_linkme_orders
-- Date: 2025-12-19
-- Description: Ajoute pending_admin_validation et created_by_affiliate_id
--              pour la validation admin des commandes affiliés
-- ============================================

-- 1. Mettre à jour la RPC pour inclure les nouveaux champs
DROP FUNCTION IF EXISTS get_linkme_orders(UUID);

CREATE OR REPLACE FUNCTION get_linkme_orders(p_affiliate_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status TEXT,
  payment_status TEXT,
  total_ht NUMERIC,
  total_ttc NUMERIC,
  shipping_cost_ht NUMERIC,
  handling_cost_ht NUMERIC,
  insurance_cost_ht NUMERIC,
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
  -- Nouveaux champs pour validation admin
  pending_admin_validation BOOLEAN,
  created_by_affiliate_id UUID,
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
    COALESCE(so.shipping_cost_ht, 0) AS shipping_cost_ht,
    COALESCE(so.handling_cost_ht, 0) AS handling_cost_ht,
    COALESCE(so.insurance_cost_ht, 0) AS insurance_cost_ht,
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
    -- Nouveaux champs
    COALESCE(so.pending_admin_validation, false) AS pending_admin_validation,
    so.created_by_affiliate_id,
    lom.created_at,
    lom.updated_at
  FROM linkme_orders_with_margins lom
  LEFT JOIN sales_orders so ON so.id = lom.id
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

-- 2. Commentaire
COMMENT ON FUNCTION get_linkme_orders IS
'RPC canonique pour récupérer les commandes LinkMe.
- p_affiliate_id = NULL : retourne toutes les commandes (mode CMS)
- p_affiliate_id = UUID : retourne uniquement les commandes de cet affilié (mode Front LinkMe)
Inclut pending_admin_validation et created_by_affiliate_id pour la validation admin.';

-- 3. Grant
GRANT EXECUTE ON FUNCTION get_linkme_orders TO authenticated;

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================
-- DROP FUNCTION IF EXISTS get_linkme_orders(UUID);
