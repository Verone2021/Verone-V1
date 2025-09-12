-- Migration 124b: Créer les vues et fonctions pour prix_acquisition dynamique

-- ================================================================
-- 1. VUE QUOTITÉS AVEC CALCUL DYNAMIQUE
-- ================================================================

CREATE VIEW quotites_with_calculated_prix AS
SELECT 
  pp.*,
  -- Calcul dynamique: Total investissement × Pourcentage
  CASE 
    WHEN p.prix_achat IS NOT NULL OR p.frais_notaire IS NOT NULL OR p.frais_annexes IS NOT NULL THEN
      (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) * 
      (pp.pourcentage / 100.0)
    ELSE 
      NULL
  END as prix_acquisition_calcule,
  
  -- Total investissement de la propriété
  (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) as total_investissement_propriete,
  
  -- Informations propriétaire
  pr.nom as proprietaire_nom,
  pr.prenom as proprietaire_prenom,
  pr.type as proprietaire_type,
  pr.email as proprietaire_email,
  
  -- Informations propriété
  p.nom as propriete_nom,
  p.organisation_id
  
FROM propriete_proprietaires pp
JOIN proprietaires pr ON pp.proprietaire_id = pr.id
JOIN proprietes p ON pp.propriete_id = p.id;

-- ================================================================
-- 2. VUE PROPRIETE_PROPRIETAIRES_DETAIL_V AVEC CALCUL DYNAMIQUE
-- ================================================================

CREATE VIEW propriete_proprietaires_detail_v AS
SELECT 
  pp.id,
  pp.proprietaire_id,
  pp.propriete_id,
  pp.pourcentage,
  
  -- Prix d'acquisition calculé dynamiquement
  CASE 
    WHEN p.prix_achat IS NOT NULL OR p.frais_notaire IS NOT NULL OR p.frais_annexes IS NOT NULL THEN
      (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) * 
      (pp.pourcentage / 100.0)
    ELSE 
      NULL
  END as prix_acquisition_calcule,
  
  pp.date_acquisition,
  pp.frais_acquisition,
  pp.notes,
  pp.ordre,
  pp.created_at,
  pp.updated_at,
  pp.is_gerant,
  
  -- Données propriétaire
  jsonb_build_object(
    'id', pr.id,
    'nom', pr.nom,
    'prenom', pr.prenom,
    'type', pr.type,
    'email', pr.email,
    'telephone', pr.telephone,
    'forme_juridique', pr.forme_juridique
  ) as proprietaire
  
FROM propriete_proprietaires pp
JOIN proprietaires pr ON pp.proprietaire_id = pr.id
JOIN proprietes p ON pp.propriete_id = p.id;

-- ================================================================
-- 3. FONCTION UTILITAIRE
-- ================================================================

CREATE OR REPLACE FUNCTION get_quotite_prix_acquisition(
  p_propriete_id UUID,
  p_pourcentage DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  total_investissement DECIMAL;
BEGIN
  SELECT (COALESCE(prix_achat, 0) + COALESCE(frais_notaire, 0) + COALESCE(frais_annexes, 0))
  INTO total_investissement
  FROM proprietes 
  WHERE id = p_propriete_id;
  
  IF total_investissement > 0 THEN
    RETURN total_investissement * (p_pourcentage / 100.0);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 4. COMMENTAIRES
-- ================================================================

COMMENT ON VIEW quotites_with_calculated_prix IS 
'Vue dynamique qui calcule automatiquement le prix d''acquisition des quotités basé sur le total investissement de la propriété multiplié par le pourcentage.';

COMMENT ON VIEW propriete_proprietaires_detail_v IS 
'Vue détaillée des quotités avec prix d''acquisition calculé dynamiquement. Le champ prix_acquisition_calcule est automatiquement mis à jour.';

COMMENT ON FUNCTION get_quotite_prix_acquisition(UUID, DECIMAL) IS 
'Fonction qui calcule le prix d''acquisition d''une quotité basé sur le total investissement et le pourcentage.';