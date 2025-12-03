-- ============================================================================
-- Migration: RPC get_enseigne_details
-- Date: 2025-12-02
-- Description: Retourne toutes les informations agrégées pour la page détail enseigne
-- ============================================================================

-- Fonction RPC pour détails enseigne
CREATE OR REPLACE FUNCTION get_enseigne_details(enseigne_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_enseigne RECORD;
  v_parent_org RECORD;
  v_stats RECORD;
BEGIN
  -- Vérifier que l'enseigne existe
  SELECT * INTO v_enseigne
  FROM enseignes
  WHERE id = enseigne_uuid;

  IF v_enseigne IS NULL THEN
    RAISE EXCEPTION 'Enseigne non trouvée: %', enseigne_uuid;
  END IF;

  -- Récupérer l'organisation mère (is_enseigne_parent = true)
  SELECT
    o.id,
    o.legal_name,
    o.trade_name,
    o.siret,
    o.siren,
    o.vat_number,
    o.email,
    o.phone,
    o.billing_city,
    o.billing_postal_code,
    o.logo_url
  INTO v_parent_org
  FROM organisations o
  WHERE o.enseigne_id = enseigne_uuid
    AND o.is_enseigne_parent = true
  LIMIT 1;

  -- Calculer les statistiques agrégées
  SELECT
    -- Organisations membres
    (SELECT COUNT(*) FROM organisations WHERE enseigne_id = enseigne_uuid AND is_active = true) as organisations_count,
    -- Contacts
    (SELECT COUNT(*) FROM contacts WHERE enseigne_id = enseigne_uuid AND is_active = true) as contacts_count,
    -- Produits sourcés
    (SELECT COUNT(*) FROM products WHERE enseigne_id = enseigne_uuid AND archived_at IS NULL) as products_count,
    -- Affiliés LinkMe
    (SELECT COUNT(*) FROM linkme_affiliates WHERE enseigne_id = enseigne_uuid AND is_active = true) as affiliates_count,
    -- Sélections
    (SELECT COUNT(*)
     FROM linkme_selections s
     JOIN linkme_affiliates a ON s.affiliate_id = a.id
     WHERE a.enseigne_id = enseigne_uuid) as selections_count,
    -- Utilisateurs avec rôle
    (SELECT COUNT(*) FROM user_app_roles WHERE enseigne_id = enseigne_uuid AND is_active = true) as users_count,
    -- Villes uniques (depuis organisations)
    (SELECT COUNT(DISTINCT billing_city)
     FROM organisations
     WHERE enseigne_id = enseigne_uuid
       AND billing_city IS NOT NULL
       AND is_active = true) as cities_count
  INTO v_stats;

  -- Construire le résultat JSON
  v_result := json_build_object(
    'enseigne', json_build_object(
      'id', v_enseigne.id,
      'name', v_enseigne.name,
      'description', v_enseigne.description,
      'logo_url', v_enseigne.logo_url,
      'is_active', v_enseigne.is_active,
      'created_at', v_enseigne.created_at,
      'updated_at', v_enseigne.updated_at
    ),
    'parent_organisation', CASE
      WHEN v_parent_org.id IS NOT NULL THEN json_build_object(
        'id', v_parent_org.id,
        'legal_name', v_parent_org.legal_name,
        'trade_name', v_parent_org.trade_name,
        'siret', v_parent_org.siret,
        'siren', v_parent_org.siren,
        'vat_number', v_parent_org.vat_number,
        'email', v_parent_org.email,
        'phone', v_parent_org.phone,
        'city', v_parent_org.billing_city,
        'postal_code', v_parent_org.billing_postal_code,
        'logo_url', v_parent_org.logo_url
      )
      ELSE NULL
    END,
    'stats', json_build_object(
      'organisations_count', v_stats.organisations_count,
      'contacts_count', v_stats.contacts_count,
      'products_count', v_stats.products_count,
      'affiliates_count', v_stats.affiliates_count,
      'selections_count', v_stats.selections_count,
      'users_count', v_stats.users_count,
      'cities_count', v_stats.cities_count
    )
  );

  RETURN v_result;
END;
$$;

-- Commentaire fonction
COMMENT ON FUNCTION get_enseigne_details(UUID) IS
'Retourne les détails complets d''une enseigne pour la page détail LinkMe.
Inclut: infos enseigne, organisation mère, statistiques agrégées (orgs, contacts, produits, affiliés, sélections, users, villes).
Ajouté: 2025-12-02';

-- Accorder les droits d'exécution
GRANT EXECUTE ON FUNCTION get_enseigne_details(UUID) TO authenticated;
