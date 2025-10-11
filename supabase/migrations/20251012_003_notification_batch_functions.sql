-- =====================================================================
-- MIGRATION: Notification Batch Functions - Phase 3
-- Date: 2025-10-12
-- Description: Fonctions batch pour checks périodiques (CRON-ready)
-- =====================================================================
--
-- OBJECTIF: Notifications automatiques pour événements récurrents
--
-- PHASE 3: Batch Functions (non real-time, CRON-ready)
-- 1. check_incomplete_catalog_products() - Catalogue incomplet
-- 2. check_overdue_invoices() - Factures impayées
-- 3. check_late_shipments() - Retard expédition
--
-- USAGE: Appeler ces fonctions quotidiennement via CRON ou pg_cron
--
-- RÈGLES BUSINESS:
-- - Catalogue: Produits completion_status='draft' (excluant sourcing)
-- - Factures: due_date <= 7 jours ET status != 'paid'
-- - Expédition: confirmed + paid + shipped_at IS NULL + expected_delivery_date < TODAY
--
-- =====================================================================

-- =====================================================================
-- FONCTION 1: Check Incomplete Catalog Products
-- =====================================================================
-- Description: Détecte les produits non complets (completion_status='draft')
-- Sévérité: important (impact qualité catalogue)
-- Fréquence: Quotidien recommandé
-- =====================================================================

CREATE OR REPLACE FUNCTION check_incomplete_catalog_products()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incomplete_count INT;
  v_notification_count INT := 0;
BEGIN
  -- Compter les produits incomplets (draft) excluant sourcing/discontinued
  SELECT COUNT(*)
  INTO v_incomplete_count
  FROM products
  WHERE completion_status = 'draft'
    AND (status::TEXT IS NULL OR status::TEXT NOT IN ('sourcing', 'discontinued'));

  -- Si produits incomplets trouvés, créer notification pour owners
  IF v_incomplete_count > 0 THEN
    SELECT create_notification_for_owners(
      'catalog',
      'important',
      '📦 Catalogue Incomplet',
      v_incomplete_count || ' produits ne sont pas à 100% de complétion. Complétez-les pour améliorer les flux.',
      '/catalogue',
      'Compléter'
    ) INTO v_notification_count;

    RAISE NOTICE 'Incomplete catalog: % produits incomplets, % notifications créées', v_incomplete_count, v_notification_count;
  END IF;

  RETURN v_notification_count;
END;
$$;

COMMENT ON FUNCTION check_incomplete_catalog_products IS
  'Batch function: Détecte produits incomplets (draft) excluant sourcing. ' ||
  'Crée notification type=catalog severity=important si count > 0. ' ||
  'Usage: CRON quotidien recommandé.';

-- =====================================================================
-- FONCTION 2: Check Overdue Invoices
-- =====================================================================
-- Description: Détecte factures impayées avec échéance ≤ 7 jours
-- Sévérité: important (impact cash flow)
-- Fréquence: Quotidien recommandé
-- =====================================================================

CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_overdue_count INT;
  v_overdue_amount NUMERIC;
  v_notification_count INT := 0;
BEGIN
  -- Compter factures impayées avec due_date proche/dépassée (≤ 7 jours)
  SELECT
    COUNT(*),
    COALESCE(SUM(total_ttc - COALESCE(amount_paid, 0)), 0)
  INTO v_overdue_count, v_overdue_amount
  FROM financial_documents
  WHERE document_type::TEXT IN ('invoice', 'facture')
    AND status::TEXT != 'paid'
    AND due_date IS NOT NULL
    AND due_date <= (CURRENT_DATE + INTERVAL '7 days');

  -- Si factures impayées trouvées, créer notification pour owners
  IF v_overdue_count > 0 THEN
    SELECT create_notification_for_owners(
      'operations',
      'important',
      '💰 Factures Impayées',
      v_overdue_count || ' factures impayées (' || ROUND(v_overdue_amount, 2)::TEXT || '€ total) nécessitent un suivi urgent.',
      '/finance/invoices',
      'Gérer Factures'
    ) INTO v_notification_count;

    RAISE NOTICE 'Overdue invoices: % factures, %€, % notifications créées', v_overdue_count, v_overdue_amount, v_notification_count;
  END IF;

  RETURN v_notification_count;
END;
$$;

COMMENT ON FUNCTION check_overdue_invoices IS
  'Batch function: Détecte factures impayées avec échéance ≤ 7 jours. ' ||
  'Crée notification type=operations severity=important si count > 0. ' ||
  'Usage: CRON quotidien recommandé.';

-- =====================================================================
-- FONCTION 3: Check Late Shipments
-- =====================================================================
-- Description: Détecte commandes payées non expédiées après expected_delivery_date
-- Sévérité: urgent (impact client)
-- Fréquence: Quotidien ou bi-quotidien recommandé
-- =====================================================================

CREATE OR REPLACE FUNCTION check_late_shipments()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_late_count INT;
  v_late_amount NUMERIC;
  v_notification_count INT := 0;
BEGIN
  -- Compter commandes confirmées + payées + non expédiées après date attendue
  SELECT
    COUNT(*),
    COALESCE(SUM(total_ttc), 0)
  INTO v_late_count, v_late_amount
  FROM sales_orders
  WHERE status::TEXT = 'confirmed'
    AND payment_status = 'paid'
    AND shipped_at IS NULL
    AND expected_delivery_date IS NOT NULL
    AND expected_delivery_date < CURRENT_DATE;

  -- Si retards d'expédition trouvés, créer notification URGENT pour owners
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
$$;

COMMENT ON FUNCTION check_late_shipments IS
  'Batch function: Détecte commandes payées non expédiées après expected_delivery_date. ' ||
  'Crée notification type=operations severity=urgent si count > 0. ' ||
  'Usage: CRON quotidien ou bi-quotidien recommandé (urgent).';

-- =====================================================================
-- VALIDATION & TESTS
-- =====================================================================
-- Pour tester manuellement les fonctions:
--
-- SELECT check_incomplete_catalog_products();
-- SELECT check_overdue_invoices();
-- SELECT check_late_shipments();
--
-- Exemple configuration pg_cron (à installer séparément):
--
-- SELECT cron.schedule('check_incomplete_catalog', '0 8 * * *', 'SELECT check_incomplete_catalog_products()');
-- SELECT cron.schedule('check_overdue_invoices', '0 9 * * *', 'SELECT check_overdue_invoices()');
-- SELECT cron.schedule('check_late_shipments', '0 10,16 * * *', 'SELECT check_late_shipments()');
--
-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
