--
-- Migration: Corriger 2 dernières fonctions PostgreSQL utilisant 'confirmed' → 'validated'
-- Date: 2025-11-21
-- Raison: Finalisation migration enums purchase_order_status + sales_order_status
--

-- ============================================================================
-- FUNCTION 1: check_late_shipments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_late_shipments()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_late_count INT;
  v_late_amount NUMERIC;
  v_notification_count INT := 0;
BEGIN
  -- Compter commandes confirmées + payées + non expédiées après date prévue
  SELECT
    COUNT(*),
    COALESCE(SUM(total_ttc), 0)
  INTO v_late_count, v_late_amount
  FROM sales_orders
  WHERE status::TEXT = 'validated'  -- ✅ FIX: 'confirmed' → 'validated'
    AND payment_status = 'paid'
    AND shipped_at IS NULL
    AND expected_delivery_date IS NOT NULL
    AND expected_delivery_date < CURRENT_DATE;

  -- Si retards existent, créer notification
  IF v_late_count > 0 THEN
    SELECT create_notification_for_owners(
      'operations',
      'urgent',
      '🚚 Retard Expédition',
      v_late_count || ' commandes payées en retard d''expédition (' || ROUND(v_late_amount, 2)::TEXT || '€ total).',
      '/commandes/expeditions',
      'Gérer Expéditions'
    ) INTO v_notification_count;

    RAISE NOTICE 'Late shipments: % commandes, %€, % notifications créées', v_late_count, v_late_amount, v_notification_count;
  END IF;

  RETURN v_notification_count;
END;
$function$;

-- ============================================================================
-- FUNCTION 2: mark_warehouse_exit (surcharge 1 - p_order_id uuid)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mark_warehouse_exit(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtenir l'ID de l'utilisateur courant
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Vérifier que la commande existe et est dans un statut approprié
  IF NOT EXISTS (
    SELECT 1 FROM sales_orders
    WHERE id = p_order_id
    AND status IN ('validated', 'partially_shipped')  -- ✅ FIX: 'confirmed' → 'validated'
  ) THEN
    RAISE EXCEPTION 'Commande non trouvée ou statut invalide';
  END IF;

  -- Mettre à jour la commande
  UPDATE sales_orders
  SET
    warehouse_exit_at = NOW(),
    warehouse_exit_by = v_user_id,
    ready_for_shipment = true,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Créer des mouvements de stock OUT pour chaque item
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity_change,
    quantity_before,
    quantity_after,
    reference_type,
    reference_id,
    performed_by,
    performed_at,
    notes,
    reason_code
  )
  SELECT
    soi.product_id,
    'OUT'::movement_type,
    -soi.quantity,
    p.stock_real,
    p.stock_real - soi.quantity,
    'sales_order',
    p_order_id,
    v_user_id,
    NOW(),
    'Sortie entrepôt pour expédition',
    'sale'::stock_reason_code
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.sales_order_id = p_order_id;

  -- Mettre à jour le stock réel des produits
  UPDATE products p
  SET
    stock_real = stock_real - soi.quantity,
    updated_at = NOW()
  FROM sales_order_items soi
  WHERE p.id = soi.product_id
  AND soi.sales_order_id = p_order_id;
END;
$function$;

-- ============================================================================
-- Commentaires
-- ============================================================================

COMMENT ON FUNCTION public.check_late_shipments IS
'Cron: Vérifier expéditions en retard et créer notifications (validées + payées + non expédiées)';

COMMENT ON FUNCTION public.mark_warehouse_exit(p_order_id uuid) IS
'Marquer sortie entrepôt + créer mouvements stock pour commande validée ou partiellement expédiée';
