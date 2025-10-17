-- =====================================================================
-- Migration 007: RPC Functions BFA (Bonus Fin d'Année)
-- Date: 2025-10-11
-- Description: Fonctions calcul CA annuel et BFA clients
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_annual_revenue_bfa(
  p_organisation_id UUID,
  p_fiscal_year INTEGER
) RETURNS TABLE (
  organisation_id UUID,
  organisation_name TEXT,
  fiscal_year INTEGER,
  total_revenue_ht DECIMAL(12,2),
  bfa_rate DECIMAL(5,2),
  bfa_amount DECIMAL(12,2)
) AS $$
DECLARE
  v_revenue DECIMAL(12,2);
  v_bfa_rate DECIMAL(5,2);
  v_bfa_amount DECIMAL(12,2);
  v_org_name TEXT;
BEGIN
  -- 1. Récupérer nom organisation
  SELECT name INTO v_org_name
  FROM organisations
  WHERE id = p_organisation_id;

  IF v_org_name IS NULL THEN
    RAISE EXCEPTION 'Organisation % introuvable', p_organisation_id;
  END IF;

  -- 2. Calculer CA annuel facturé (factures payées uniquement)
  SELECT COALESCE(SUM(i.total_ht), 0) INTO v_revenue
  FROM invoices i
  JOIN sales_orders so ON i.sales_order_id = so.id
  WHERE so.customer_id = p_organisation_id
    AND i.status IN ('paid', 'partially_paid')
    AND EXTRACT(YEAR FROM i.invoice_date) = p_fiscal_year;

  -- 3. Déterminer taux BFA selon paliers
  IF v_revenue < 10000 THEN
    v_bfa_rate := 0;
  ELSIF v_revenue < 25000 THEN
    v_bfa_rate := 3;
  ELSIF v_revenue < 50000 THEN
    v_bfa_rate := 5;
  ELSE
    v_bfa_rate := 7;
  END IF;

  -- 4. Calculer montant BFA
  v_bfa_amount := ROUND(v_revenue * (v_bfa_rate / 100), 2);

  -- 5. Retourner résultat
  RETURN QUERY SELECT
    p_organisation_id,
    v_org_name,
    p_fiscal_year,
    v_revenue,
    v_bfa_rate,
    v_bfa_amount;

  RAISE NOTICE 'BFA calculé: Organisation=%, Revenue=%€, Taux=%, BFA=%€',
    v_org_name, v_revenue, v_bfa_rate, v_bfa_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_annual_revenue_bfa IS
  'Calcule CA annuel facturé (paid) et taux/montant BFA selon paliers';

CREATE OR REPLACE FUNCTION generate_bfa_report_all_customers(
  p_fiscal_year INTEGER
) RETURNS TABLE (
  organisation_id UUID,
  organisation_name TEXT,
  total_revenue_ht DECIMAL(12,2),
  bfa_rate DECIMAL(5,2),
  bfa_amount DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bfa.organisation_id,
    bfa.organisation_name,
    bfa.total_revenue_ht,
    bfa.bfa_rate,
    bfa.bfa_amount
  FROM organisations o,
  LATERAL calculate_annual_revenue_bfa(o.id, p_fiscal_year) bfa
  WHERE bfa.bfa_amount > 0
  ORDER BY bfa.total_revenue_ht DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_bfa_report_all_customers IS
  'Génère rapport BFA pour tous clients (CA > 0) pour année fiscale donnée';
