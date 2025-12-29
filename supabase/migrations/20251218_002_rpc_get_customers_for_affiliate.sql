-- ============================================
-- Migration: RPC pour récupérer les clients d'un affilié
-- Date: 2025-12-18
-- Description: Retourne tous les clients créés par un affilié
--              (organisations + particuliers via source_affiliate_id)
--              Inclut les franchisés (organisations rattachées à l'enseigne)
-- ============================================

-- 1. RPC pour récupérer les clients d'un affilié
CREATE OR REPLACE FUNCTION get_customers_for_affiliate(p_affiliate_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  customer_type TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  is_franchisee BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  -- Organisations créées via cet affilié (source_affiliate_id)
  -- + Organisations rattachées à l'enseigne de l'affilié (franchisés)
  SELECT
    o.id,
    COALESCE(o.trade_name, o.legal_name) AS name,
    'organization'::TEXT AS customer_type,
    o.email,
    o.phone,
    o.city,
    o.address_line1 AS address,
    o.postal_code,
    -- Franchisé = organisation rattachée à l'enseigne de l'affilié
    (o.enseigne_id IS NOT NULL AND o.enseigne_id = la.enseigne_id) AS is_franchisee,
    o.created_at
  FROM organisations o
  LEFT JOIN linkme_affiliates la ON la.id = p_affiliate_id
  WHERE
    -- Client créé par cet affilié
    o.source_affiliate_id = p_affiliate_id
    OR
    -- OU franchisé de l'enseigne (si l'affilié est une enseigne)
    (la.enseigne_id IS NOT NULL AND o.enseigne_id = la.enseigne_id)

  UNION ALL

  -- Particuliers créés via cet affilié
  SELECT
    ic.id,
    CONCAT(ic.first_name, ' ', ic.last_name) AS name,
    'individual'::TEXT AS customer_type,
    ic.email,
    ic.phone,
    ic.city,
    ic.address_line1 AS address,
    ic.postal_code,
    false AS is_franchisee,
    ic.created_at
  FROM individual_customers ic
  WHERE ic.source_affiliate_id = p_affiliate_id

  ORDER BY created_at DESC;
$$;

-- 2. RPC pour créer un client organisation via un affilié
CREATE OR REPLACE FUNCTION create_customer_organisation_for_affiliate(
  p_affiliate_id UUID,
  p_legal_name TEXT,
  p_trade_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_new_id UUID;
BEGIN
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
    is_active
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
    true
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 3. RPC pour créer un client particulier via un affilié
CREATE OR REPLACE FUNCTION create_customer_individual_for_affiliate(
  p_affiliate_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  v_new_id UUID;
BEGIN
  INSERT INTO individual_customers (
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    postal_code,
    city,
    source_affiliate_id,
    source_type
  ) VALUES (
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_address,
    p_postal_code,
    p_city,
    p_affiliate_id,
    'linkme'
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- 4. Commentaires
COMMENT ON FUNCTION get_customers_for_affiliate IS
'Retourne tous les clients d un affilié:
- Organisations créées par l affilié (source_affiliate_id)
- Franchisés de l enseigne (si l affilié est enseigne_admin)
- Particuliers créés par l affilié
Le champ is_franchisee indique si le client est un franchisé.';

COMMENT ON FUNCTION create_customer_organisation_for_affiliate IS
'Crée une organisation cliente pour un affilié avec source_affiliate_id et source_type=linkme.';

COMMENT ON FUNCTION create_customer_individual_for_affiliate IS
'Crée un particulier client pour un affilié avec source_affiliate_id et source_type=linkme.';

-- 5. Grants
GRANT EXECUTE ON FUNCTION get_customers_for_affiliate TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_organisation_for_affiliate TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_individual_for_affiliate TO authenticated;
