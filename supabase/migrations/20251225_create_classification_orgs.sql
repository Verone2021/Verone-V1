-- ============================================================================
-- Migration: Create Classification Organisations + Matching Rules
-- Description: Crée les organisations et règles pour classifier les transactions bancaires
-- Date: 2025-12-25
-- ============================================================================

-- Prevent duplicate runs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM matching_rules WHERE match_value ILIKE '%AFFECT BUILDING%') THEN
    RAISE NOTICE 'Migration already applied, skipping...';
    RETURN;
  END IF;
END $$;

-- ============================================================================
-- 1. CREATE ORGANISATIONS (Fournisseurs/Prestataires)
-- ============================================================================

-- Note: Using DO block to get organisation IDs for rules creation
DO $$
DECLARE
  org_affect_building UUID;
  org_dgfip UUID;
  org_maisons_nomade UUID;
  org_alibaba UUID;
  org_madeiragueda UUID;
  org_opjet UUID;
  org_chronotruck UUID;
  org_urssaf UUID;
  org_pennylane UUID;
  org_packlink UUID;
  org_anthropic UUID;
  org_cao_county UUID;
  org_americo UUID;
  org_eduarda UUID;
  org_zentrada UUID;
  org_air_france UUID;
  org_maghrib UUID;
  org_bon_marche UUID;
  org_axa UUID;
  org_houdeline UUID;
BEGIN

  -- 1. AFFECT BUILDING CONSULTING (Consulting - 35 585€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('AFFECT BUILDING CONSULTING', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_affect_building;
  IF org_affect_building IS NULL THEN
    SELECT id INTO org_affect_building FROM organisations WHERE legal_name = 'AFFECT BUILDING CONSULTING';
  END IF;

  -- 2. DGFIP (Impôts & Taxes - 31 279€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('DGFIP - Direction Générale des Finances Publiques', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_dgfip;
  IF org_dgfip IS NULL THEN
    SELECT id INTO org_dgfip FROM organisations WHERE legal_name ILIKE '%DGFIP%';
  END IF;

  -- 3. Maisons Nomade (Fournisseur marchandises - 28 990€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Maisons Nomade', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_maisons_nomade;
  IF org_maisons_nomade IS NULL THEN
    SELECT id INTO org_maisons_nomade FROM organisations WHERE legal_name ILIKE '%Maisons Nomade%';
  END IF;

  -- 4. Alibaba.com (Fournisseur marchandises - 25 557€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Alibaba.com', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_alibaba;
  IF org_alibaba IS NULL THEN
    SELECT id INTO org_alibaba FROM organisations WHERE legal_name ILIKE '%Alibaba%';
  END IF;

  -- 5. Madeiragueda (Fournisseur marchandises - 20 535€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Madeiragueda', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_madeiragueda;
  IF org_madeiragueda IS NULL THEN
    SELECT id INTO org_madeiragueda FROM organisations WHERE legal_name ILIKE '%Madeiragueda%';
  END IF;

  -- 6. OPJET (Fournisseur marchandises - 16 371€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('OPJET', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_opjet;
  IF org_opjet IS NULL THEN
    SELECT id INTO org_opjet FROM organisations WHERE legal_name ILIKE '%OPJET%';
  END IF;

  -- 7. CHRONOTRUCK (Transport/Logistique - 3 582€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('CHRONOTRUCK', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_chronotruck;
  IF org_chronotruck IS NULL THEN
    SELECT id INTO org_chronotruck FROM organisations WHERE legal_name ILIKE '%CHRONOTRUCK%';
  END IF;

  -- 8. URSSAF (Charges sociales - 2 041€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('URSSAF Ile-de-France', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_urssaf;
  IF org_urssaf IS NULL THEN
    SELECT id INTO org_urssaf FROM organisations WHERE legal_name ILIKE '%URSSAF%';
  END IF;

  -- 9. Pennylane (Logiciel comptable - 974€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Pennylane', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_pennylane;
  IF org_pennylane IS NULL THEN
    SELECT id INTO org_pennylane FROM organisations WHERE legal_name ILIKE '%Pennylane%';
  END IF;

  -- 10. Packlink (Logistique - 894€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Packlink - Auctane SL', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_packlink;
  IF org_packlink IS NULL THEN
    SELECT id INTO org_packlink FROM organisations WHERE legal_name ILIKE '%Packlink%';
  END IF;

  -- 11. Anthropic (Claude AI - 873€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Anthropic - Claude AI', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_anthropic;
  IF org_anthropic IS NULL THEN
    SELECT id INTO org_anthropic FROM organisations WHERE legal_name ILIKE '%Anthropic%' OR legal_name ILIKE '%Claude%';
  END IF;

  -- 12. Cao County Huiy (Fournisseur marchandises - 6 933€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Cao County Huiy', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_cao_county;
  IF org_cao_county IS NULL THEN
    SELECT id INTO org_cao_county FROM organisations WHERE legal_name ILIKE '%Cao County%';
  END IF;

  -- 13. Américo Martins Tavares (Fournisseur marchandises - 6 488€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Américo Martins Tavares', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_americo;
  IF org_americo IS NULL THEN
    SELECT id INTO org_americo FROM organisations WHERE legal_name ILIKE '%Américo%';
  END IF;

  -- 14. Eduarda Silva (Fournisseur marchandises - 6 423€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Eduarda Silva', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_eduarda;
  IF org_eduarda IS NULL THEN
    SELECT id INTO org_eduarda FROM organisations WHERE legal_name ILIKE '%Eduarda%';
  END IF;

  -- 15. Zentrada Europe (Fournisseur marchandises - 3 054€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Zentrada Europe', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_zentrada;
  IF org_zentrada IS NULL THEN
    SELECT id INTO org_zentrada FROM organisations WHERE legal_name ILIKE '%Zentrada%';
  END IF;

  -- 16. Air France (Déplacements - 1 570€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Air France', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_air_france;
  IF org_air_france IS NULL THEN
    SELECT id INTO org_air_france FROM organisations WHERE legal_name ILIKE '%Air France%';
  END IF;

  -- 17. Maghrib Digital (Marketing Digital - 1 417€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Maghrib Digital', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_maghrib;
  IF org_maghrib IS NULL THEN
    SELECT id INTO org_maghrib FROM organisations WHERE legal_name ILIKE '%Maghrib%';
  END IF;

  -- 18. Le Bon Marché (Achats divers - 1 385€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Le Bon Marché', 'supplier', false, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_bon_marche;
  IF org_bon_marche IS NULL THEN
    SELECT id INTO org_bon_marche FROM organisations WHERE legal_name ILIKE '%Bon Marché%';
  END IF;

  -- 19. AXA (Assurance - 1 145€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('AXA Assurances', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_axa;
  IF org_axa IS NULL THEN
    SELECT id INTO org_axa FROM organisations WHERE legal_name ILIKE '%AXA%';
  END IF;

  -- 20. Houdeline Consulting (Consulting - 1 050€)
  INSERT INTO organisations (legal_name, type, is_service_provider, is_active)
  VALUES ('Houdeline Consulting', 'supplier', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO org_houdeline;
  IF org_houdeline IS NULL THEN
    SELECT id INTO org_houdeline FROM organisations WHERE legal_name ILIKE '%Houdeline%';
  END IF;

  -- ============================================================================
  -- 2. CREATE MATCHING RULES (link labels to organisations)
  -- ============================================================================

  -- Rule 1: AFFECT BUILDING CONSULTING
  IF org_affect_building IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AFFECT BUILDING', org_affect_building, 'Consulting', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 2: DGFIP
  IF org_dgfip IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'DGFIP', org_dgfip, 'Impôts & Taxes', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 3: Maisons Nomade
  IF org_maisons_nomade IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'MAISONS NOMADE', org_maisons_nomade, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 4: Alibaba
  IF org_alibaba IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'Alibaba', org_alibaba, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 5: Madeiragueda
  IF org_madeiragueda IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'Madeiragueda', org_madeiragueda, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 6: OPJET
  IF org_opjet IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'OPJET', org_opjet, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 7: CHRONOTRUCK
  IF org_chronotruck IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'CHRONOTRUCK', org_chronotruck, 'Transport/Logistique', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 8: URSSAF
  IF org_urssaf IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'URSSAF', org_urssaf, 'Charges sociales', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 9: PENNYLANE
  IF org_pennylane IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'PENNYLANE', org_pennylane, 'Logiciel comptable', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 10: PACKLINK
  IF org_packlink IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'PACKLINK', org_packlink, 'Logistique', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 11: CLAUDE.AI
  IF org_anthropic IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'CLAUDE.AI', org_anthropic, 'Logiciel/IA', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 12: CAO COUNTY
  IF org_cao_county IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'CAO COUNTY', org_cao_county, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 13: AMÉRICO MARTINS
  IF org_americo IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AMÉRICO MARTINS', org_americo, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;

    -- Alternative pattern without accent
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AMERICO MARTINS', org_americo, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 14: Eduarda Silva
  IF org_eduarda IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'Eduarda Silva', org_eduarda, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 15: zentrada
  IF org_zentrada IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'zentrada', org_zentrada, 'Achats marchandises', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 16: AIR FRANCE
  IF org_air_france IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AIR FRANCE', org_air_france, 'Déplacements', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 17: MAGHRIBDIGITAL
  IF org_maghrib IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'MAGHRIBDIGITAL', org_maghrib, 'Marketing Digital', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 18: LE BON MARCHE
  IF org_bon_marche IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'LE BON MARCHE', org_bon_marche, 'Achats divers', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 19: AXA
  IF org_axa IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'AXA', org_axa, 'Assurance', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  -- Rule 20: Houdeline
  IF org_houdeline IS NOT NULL THEN
    INSERT INTO matching_rules (match_type, match_value, organisation_id, default_category, default_role_type, priority, enabled)
    VALUES ('label_contains', 'Houdeline', org_houdeline, 'Consulting', 'supplier', 100, true)
    ON CONFLICT (match_type, match_value) DO NOTHING;
  END IF;

  RAISE NOTICE 'Successfully created % organisations and matching rules', 20;

END $$;

-- ============================================================================
-- Summary report
-- ============================================================================
DO $$
DECLARE
  org_count INTEGER;
  rule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organisations WHERE is_active = true;
  SELECT COUNT(*) INTO rule_count FROM matching_rules WHERE enabled = true;

  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE 'Total active organisations: %', org_count;
  RAISE NOTICE 'Total enabled matching rules: %', rule_count;
  RAISE NOTICE '===========================================';
END $$;
