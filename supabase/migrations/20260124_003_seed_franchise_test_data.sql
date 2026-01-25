-- Migration: Seed données test franchises Pokawa pour tests E2E
-- Description: Crée 2 organisations franchise de test (approved) pour valider le scénario 3
-- IMPORTANT: enseigne_id DOIT être défini pour que l'affilié LinkMe puisse voir les organisations

DO $$
DECLARE
  v_pokawa_enseigne_id UUID := 'de1bcbd7-0086-4632-aedb-ece0a5b3d358';
BEGIN
  -- Supprimer d'abord les organisations de test si elles existent déjà
  DELETE FROM organisations WHERE siret IN ('85123456700023', '85234567800034');

  -- 1. Créer première franchise test Paris
  INSERT INTO organisations (
    legal_name,
    ownership_type,
    legal_form,
    siret,
    address_line1,
    city,
    postal_code,
    country,
    approval_status,
    source_type,
    trade_name,
    has_different_trade_name,
    is_enseigne_parent,
    enseigne_id
  ) VALUES (
    'FRANCHISE POKAWA PARIS 1 SARL',
    'franchise',
    'SARL',
    '85123456700023',
    '10 Boulevard Haussmann',
    'Paris',
    '75001',
    'FR',
    'approved',
    'linkme',
    'Pokawa Paris 1 (Franchise)',
    true,
    false,
    v_pokawa_enseigne_id
  );

  -- 2. Créer deuxième franchise test Lyon
  INSERT INTO organisations (
    legal_name,
    ownership_type,
    legal_form,
    siret,
    address_line1,
    city,
    postal_code,
    country,
    approval_status,
    source_type,
    trade_name,
    has_different_trade_name,
    is_enseigne_parent,
    enseigne_id
  ) VALUES (
    'FRANCHISE POKAWA LYON 1 SAS',
    'franchise',
    'SAS',
    '85234567800034',
    '5 Place Bellecour',
    'Lyon',
    '69001',
    'FR',
    'approved',
    'linkme',
    'Pokawa Lyon 1 (Franchise)',
    true,
    false,
    v_pokawa_enseigne_id
  );

END $$;

-- Vérification
SELECT
  id,
  legal_name,
  ownership_type,
  trade_name,
  city,
  approval_status
FROM organisations
WHERE siret IN ('85123456700023', '85234567800034')
ORDER BY created_at DESC;
