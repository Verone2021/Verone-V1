-- Migration: Fix stock alerts using obsolete stock_quantity column
-- Problem 1: get_smart_stock_status() uses stock_quantity (always 0) instead of stock_real
-- Problem 2: stock_quantity is desynchronized from stock_real for 171 products
-- Result: 127 false "out_of_stock" alerts

-- ============================================================
-- CORRECTION 1: Update get_smart_stock_status() to use stock_real
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_smart_stock_status(p_product_id uuid)
 RETURNS TABLE(product_id uuid, stock_quantity integer, min_stock integer, has_been_ordered boolean, alert_status text, alert_priority integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_stock INTEGER;
  v_min INTEGER;
  v_ordered BOOLEAN;
BEGIN
  -- Utiliser stock_real (mis a jour par trigger) au lieu de stock_quantity (obsolete)
  SELECT
    COALESCE(p.stock_real, 0),
    COALESCE(p.min_stock, 0)
  INTO v_stock, v_min
  FROM products p
  WHERE p.id = p_product_id;

  -- Check si commande
  v_ordered := has_been_ordered(p_product_id);

  -- Determiner statut selon regles metier
  RETURN QUERY
  SELECT
    p_product_id,
    v_stock,
    v_min,
    v_ordered,
    CASE
      -- Jamais commande -> Pret a commander (pas d'alerte)
      WHEN NOT v_ordered THEN 'ready_to_order'
      -- Commande + rupture totale -> Alerte critique
      WHEN v_ordered AND v_stock <= 0 THEN 'out_of_stock'
      -- Commande + stock < seuil -> Alerte faible stock
      WHEN v_ordered AND v_min > 0 AND v_stock < v_min THEN 'low_stock'
      -- Commande + stock OK -> Normal
      ELSE 'in_stock'
    END AS alert_status,
    CASE
      WHEN NOT v_ordered THEN 0  -- Pas d'alerte
      WHEN v_ordered AND v_stock <= 0 THEN 3  -- Critique
      WHEN v_ordered AND v_min > 0 AND v_stock < v_min THEN 2  -- Faible
      ELSE 1  -- Normal
    END AS alert_priority;
END;
$function$;

-- ============================================================
-- CORRECTION 2: Synchronize stock_quantity = stock_real
-- ============================================================
-- This ensures any code still reading stock_quantity gets correct values
UPDATE products
SET stock_quantity = COALESCE(stock_real, 0),
    updated_at = NOW()
WHERE stock_quantity != COALESCE(stock_real, 0);
