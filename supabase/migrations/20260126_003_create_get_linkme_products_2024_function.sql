-- Migration: Créer fonction RPC pour extraire produits vendus LinkMe 2024
-- Date: 2026-01-26
-- Objectif: Générer rapport des produits vendus pour vérification cohérence comptable

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS get_linkme_products_2024();

-- Créer la fonction qui retourne les produits vendus LinkMe en 2024
CREATE OR REPLACE FUNCTION get_linkme_products_2024()
RETURNS TABLE (
  product_id uuid,
  product_name text,
  product_sku text,
  total_quantity numeric,
  total_ht numeric,
  total_tva numeric,
  total_ttc numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    COALESCE(SUM(soi.quantity), 0)::numeric AS total_quantity,
    COALESCE(SUM(soi.total_ht), 0)::numeric AS total_ht,
    COALESCE(SUM(soi.total_ht * soi.tax_rate), 0)::numeric AS total_tva,
    COALESCE(SUM(soi.total_ht * (1 + soi.tax_rate)), 0)::numeric AS total_ttc
  FROM sales_order_items soi
  INNER JOIN sales_orders so ON soi.sales_order_id = so.id
  INNER JOIN products p ON soi.product_id = p.id
  INNER JOIN sales_channels sc ON so.channel_id = sc.id
  WHERE
    -- Filtrer uniquement les commandes LinkMe
    sc.name = 'LinkMe'
    -- Filtrer année 2024
    AND so.created_at >= '2024-01-01'::timestamp
    AND so.created_at < '2025-01-01'::timestamp
    -- Exclure brouillons et annulées
    AND so.status NOT IN ('draft', 'cancelled')
  GROUP BY p.id, p.name, p.sku
  ORDER BY total_quantity DESC;
END;
$$;

-- Autoriser l'accès public (authenticated users)
GRANT EXECUTE ON FUNCTION get_linkme_products_2024() TO authenticated;
GRANT EXECUTE ON FUNCTION get_linkme_products_2024() TO anon;

-- Commentaire pour documentation
COMMENT ON FUNCTION get_linkme_products_2024() IS
'Retourne la liste des produits vendus via LinkMe en 2024 avec quantités et totaux agrégés.
Utilisé pour générer le rapport de cohérence comptable RAPPORT_PRODUITS_VENDUS_2024.md';
