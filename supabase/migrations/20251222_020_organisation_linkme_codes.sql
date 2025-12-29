-- =====================================================
-- Migration: Organisation LinkMe Codes
-- Date: 2025-12-22
-- Description: Ajouter codes clients VERO-XXXX pour identification sans auth
-- =====================================================

-- 1. Ajouter colonne linkme_code aux organisations
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS linkme_code VARCHAR(9) UNIQUE;

-- 2. Fonction pour generer un code unique VERO-XXXX
CREATE OR REPLACE FUNCTION generate_organisation_code()
RETURNS VARCHAR(9) AS $$
DECLARE
  v_code VARCHAR(9);
  v_chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generer 4 caracteres aleatoires
    v_code := 'VERO-' ||
      substring(v_chars from floor(random() * 36 + 1)::int for 1) ||
      substring(v_chars from floor(random() * 36 + 1)::int for 1) ||
      substring(v_chars from floor(random() * 36 + 1)::int for 1) ||
      substring(v_chars from floor(random() * 36 + 1)::int for 1);

    -- Verifier unicite
    SELECT EXISTS(SELECT 1 FROM organisations WHERE linkme_code = v_code) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger pour auto-generer le code pour nouveaux clients
CREATE OR REPLACE FUNCTION trigger_generate_organisation_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generer code uniquement pour les clients (type = 'customer')
  IF NEW.type = 'customer' AND NEW.linkme_code IS NULL THEN
    NEW.linkme_code := generate_organisation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer trigger existant si present
DROP TRIGGER IF EXISTS trg_generate_organisation_code ON organisations;

-- Creer trigger
CREATE TRIGGER trg_generate_organisation_code
  BEFORE INSERT ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_organisation_code();

-- 4. Generer codes pour organisations existantes de type customer
UPDATE organisations
SET linkme_code = generate_organisation_code()
WHERE type = 'customer' AND linkme_code IS NULL;

-- 5. Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_organisations_linkme_code
  ON organisations(linkme_code)
  WHERE linkme_code IS NOT NULL;

-- 6. Ajouter colonne pending_approval aux individual_customers pour nouveaux clients
ALTER TABLE individual_customers
ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN DEFAULT FALSE;

-- 7. Fonction RPC pour lookup client par code (accessible sans auth)
CREATE OR REPLACE FUNCTION lookup_customer_by_code(p_code VARCHAR(9))
RETURNS TABLE(
  organisation_id UUID,
  legal_name TEXT,
  trade_name TEXT,
  city TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS organisation_id,
    o.legal_name::TEXT,
    o.trade_name::TEXT,
    o.city::TEXT
  FROM organisations o
  WHERE o.linkme_code = UPPER(p_code)
    AND o.type = 'customer'
    AND o.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant pour acces public (anon)
GRANT EXECUTE ON FUNCTION lookup_customer_by_code(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION lookup_customer_by_code(VARCHAR) TO authenticated;

-- 8. Commentaires
COMMENT ON COLUMN organisations.linkme_code IS 'Code client unique format VERO-XXXX pour identification sans auth sur LinkMe';
COMMENT ON FUNCTION generate_organisation_code() IS 'Genere un code unique VERO-XXXX pour les organisations';
COMMENT ON FUNCTION lookup_customer_by_code(VARCHAR) IS 'Recherche organisation par code LinkMe - accessible sans authentification';
