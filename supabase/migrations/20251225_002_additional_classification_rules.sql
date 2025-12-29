-- ============================================================================
-- Migration: Additional Classification Rules
-- Description: Règles supplémentaires pour les transactions non classées
-- Date: 2025-12-25
-- ============================================================================

DO $$
DECLARE
  org_pokawa UUID;
  org_dos_santos UUID;
  org_dsa UUID;
  org_gocardless UUID;
  org_cep_treso UUID;
  org_fiverr UUID;
  org_hostinger UUID;
  org_ag2r UUID;
  org_bba UUID;
  org_leticia UUID;
  org_inpi UUID;
  org_sedomicilier UUID;
  org_shopify UUID;
  org_airbnb UUID;
BEGIN

  -- ============================================================================
  -- 1. POKAWA - Client B2B (partenaire retail)
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('POKAWA', 'customer', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_pokawa;
  IF org_pokawa IS NULL THEN
    SELECT id INTO org_pokawa FROM organisations WHERE legal_name ILIKE '%POKAWA%' LIMIT 1;
  END IF;

  IF org_pokawa IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'POKAWA', org_pokawa, 'Ventes B2B', 'customer', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 2. Dos Santos - Remboursements de frais (internal)
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Dos Santos (Remboursements)', 'internal', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_dos_santos;
  IF org_dos_santos IS NULL THEN
    SELECT id INTO org_dos_santos FROM organisations WHERE legal_name ILIKE '%Dos Santos (Rembours%' LIMIT 1;
  END IF;

  IF org_dos_santos IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'Dos Santos', org_dos_santos, 'Remboursements frais', 'internal', 90, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 3. DSA - Partenaire mixte (client + fournisseur)
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('DSA SAS', 'partner', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_dsa;
  IF org_dsa IS NULL THEN
    SELECT id INTO org_dsa FROM organisations WHERE legal_name ILIKE '%DSA%' LIMIT 1;
  END IF;

  IF org_dsa IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_exact', 'DSA', org_dsa, 'Partenaire commercial', 'partner', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;

    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'DSA SAS', org_dsa, 'Partenaire commercial', 'partner', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 4. GoCardless - Prestataire paiement (organisation peut exister)
  -- ============================================================================
  SELECT id INTO org_gocardless FROM organisations WHERE legal_name ILIKE '%GoCardless%' LIMIT 1;

  IF org_gocardless IS NULL THEN
    INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
    VALUES ('GoCardless Ltd', 'supplier', true, true)
    RETURNING id INTO org_gocardless;
  END IF;

  IF org_gocardless IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'GOCARDLESS', org_gocardless, 'Frais bancaires', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 5. CEP TRESO SANTE PREV - Mutuelle/Prévoyance
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('CEP TRESO SANTE PREV', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_cep_treso;
  IF org_cep_treso IS NULL THEN
    SELECT id INTO org_cep_treso FROM organisations WHERE legal_name ILIKE '%CEP TRESO%' LIMIT 1;
  END IF;

  IF org_cep_treso IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'CEP TRESO', org_cep_treso, 'Mutuelle/Prévoyance', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 6. Americo Tavares Martins - Variante nom fournisseur
  -- ============================================================================
  -- Réutiliser l'organisation Américo Martins Tavares existante
  DECLARE
    org_americo UUID;
  BEGIN
    SELECT id INTO org_americo FROM organisations WHERE legal_name ILIKE '%Américo Martins%' LIMIT 1;
    IF org_americo IS NOT NULL THEN
      INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
      VALUES ('label_contains', 'Americo Tavares', org_americo, 'Achats marchandises', 'supplier', 100, true)
      ON CONFLICT (match_type, match_value) DO NOTHING;
    END IF;
  END;

  -- ============================================================================
  -- 7. FiverrEU - Prestataire freelance
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Fiverr EU', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_fiverr;
  IF org_fiverr IS NULL THEN
    SELECT id INTO org_fiverr FROM organisations WHERE legal_name ILIKE '%Fiverr%' LIMIT 1;
  END IF;

  IF org_fiverr IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'FiverrEU', org_fiverr, 'Freelance/Services', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 8. Hostinger - Hébergement web
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Hostinger', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_hostinger;
  IF org_hostinger IS NULL THEN
    SELECT id INTO org_hostinger FROM organisations WHERE legal_name ILIKE '%Hostinger%' LIMIT 1;
  END IF;

  IF org_hostinger IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'hostinger', org_hostinger, 'Hébergement web', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 9. GIE AG2R REUNICA - Retraite complémentaire
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('AG2R La Mondiale', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_ag2r;
  IF org_ag2r IS NULL THEN
    SELECT id INTO org_ag2r FROM organisations WHERE legal_name ILIKE '%AG2R%' LIMIT 1;
  END IF;

  IF org_ag2r IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AG2R', org_ag2r, 'Retraite/Prévoyance', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 10. BBA emballages - Fournisseur
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('BBA Emballages', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_bba;
  IF org_bba IS NULL THEN
    SELECT id INTO org_bba FROM organisations WHERE legal_name ILIKE '%BBA%' LIMIT 1;
  END IF;

  IF org_bba IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'BBA emballages', org_bba, 'Fournitures/Emballages', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 11. INPI - Administration (propriété industrielle)
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('INPI', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_inpi;
  IF org_inpi IS NULL THEN
    SELECT id INTO org_inpi FROM organisations WHERE legal_name ILIKE '%INPI%' LIMIT 1;
  END IF;

  IF org_inpi IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'PROPRIETE IND', org_inpi, 'Taxes/Administration', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 12. SEDOMICILIER - Domiciliation
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('SeDomicilier', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_sedomicilier;
  IF org_sedomicilier IS NULL THEN
    SELECT id INTO org_sedomicilier FROM organisations WHERE legal_name ILIKE '%SEDOMICILIER%' LIMIT 1;
  END IF;

  IF org_sedomicilier IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'SEDOMICILIER', org_sedomicilier, 'Domiciliation', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;

    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'DOMICILIATION', org_sedomicilier, 'Domiciliation', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 13. Shopify - E-commerce platform
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Shopify', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_shopify;
  IF org_shopify IS NULL THEN
    SELECT id INTO org_shopify FROM organisations WHERE legal_name ILIKE '%Shopify%' LIMIT 1;
  END IF;

  IF org_shopify IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'SHOPIFY', org_shopify, 'E-commerce/SaaS', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- ============================================================================
  -- 14. Airbnb - Hébergement/Déplacements
  -- ============================================================================
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Airbnb', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_airbnb;
  IF org_airbnb IS NULL THEN
    SELECT id INTO org_airbnb FROM organisations WHERE legal_name ILIKE '%Airbnb%' LIMIT 1;
  END IF;

  IF org_airbnb IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AIRBNB', org_airbnb, 'Déplacements/Hébergement', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  RAISE NOTICE 'Migration additionnelle terminée avec succès';

END $$;

-- ============================================================================
-- Summary
-- ============================================================================
DO $$
DECLARE
  org_count INTEGER;
  rule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organisations WHERE is_active = true;
  SELECT COUNT(*) INTO rule_count FROM matching_rules WHERE enabled = true;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Total organisations actives: %', org_count;
  RAISE NOTICE 'Total règles de matching: %', rule_count;
  RAISE NOTICE '===========================================';
END $$;
