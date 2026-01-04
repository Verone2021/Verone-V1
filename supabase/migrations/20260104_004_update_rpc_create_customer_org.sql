-- ============================================
-- Migration: Adapter RPC creation client pour nouveau restaurant
-- Date: 2026-01-04
-- Description: Ajoute parametre is_new_restaurant pour mettre pending_validation
--              sur les organisations creees via le workflow Enseigne LinkMe
-- ============================================

-- D'abord dropper l'ancienne signature (8 params) avant de creer la nouvelle (9 params)
DROP FUNCTION IF EXISTS create_customer_organisation_for_affiliate(uuid, text, text, text, text, text, text, text);

-- Recreer la RPC avec le nouveau parametre
CREATE OR REPLACE FUNCTION create_customer_organisation_for_affiliate(
  p_affiliate_id UUID,
  p_legal_name TEXT,
  p_trade_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_is_new_restaurant BOOLEAN DEFAULT false  -- NOUVEAU PARAMETRE
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_new_id UUID;
  v_approval_status TEXT;
BEGIN
  -- Determiner le statut d'approbation
  IF p_is_new_restaurant THEN
    v_approval_status := 'pending_validation';
  ELSE
    v_approval_status := 'approved';
  END IF;

  INSERT INTO organisations (
    legal_name,
    trade_name,
    email,
    phone,
    address_line1,
    postal_code,
    city,
    source_affiliate_id,
    source_type,
    type,
    is_active,
    approval_status  -- NOUVEAU CHAMP
  ) VALUES (
    p_legal_name,
    p_trade_name,
    p_email,
    p_phone,
    p_address,
    p_postal_code,
    p_city,
    p_affiliate_id,
    'linkme',
    'customer',
    true,
    v_approval_status  -- NOUVEAU CHAMP
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Mettre a jour le commentaire
COMMENT ON FUNCTION create_customer_organisation_for_affiliate IS
'Cree une organisation cliente pour un affilie LinkMe.
- p_is_new_restaurant = false (defaut): approval_status = approved (comportement existant)
- p_is_new_restaurant = true: approval_status = pending_validation (nouveau workflow Enseigne)

Le champ source_affiliate_id et source_type=linkme sont automatiquement renseignes.';

-- Grants (deja existants mais on s assure)
GRANT EXECUTE ON FUNCTION create_customer_organisation_for_affiliate TO authenticated;
