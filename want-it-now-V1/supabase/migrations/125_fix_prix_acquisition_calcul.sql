-- Migration 125: Corriger le calcul du prix d'acquisition dans la vue
-- Le problème : la vue utilise la colonne pourcentage au lieu de la calculation dynamique

-- ================================================================
-- 1. SUPPRIMER ET RECRÉER LA VUE AVEC CALCUL CORRECT
-- ================================================================

-- Supprimer la vue existante
DROP VIEW IF EXISTS propriete_proprietaires_detail_v;

-- Recréer la vue avec le calcul correct du prix d'acquisition
CREATE VIEW propriete_proprietaires_detail_v AS
SELECT 
  pp.id,
  pp.proprietaire_id,
  pp.propriete_id,
  pp.pourcentage,
  
  -- Prix d'acquisition calculé dynamiquement basé sur le total investissement
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
  
  -- Données propriétaire en JSONB (structure existante)
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
-- 2. METTRE À JOUR AUSSI LA VUE QUOTITES_WITH_CALCULATED_PRIX
-- ================================================================

-- Supprimer et recréer pour cohérence
DROP VIEW IF EXISTS quotites_with_calculated_prix;

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
  
  -- Total investissement de la propriété (pour référence)
  (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) as total_investissement_propriete,
  
  -- Informations propriétaire (join pour éviter requêtes supplémentaires)
  pr.nom as proprietaire_nom,
  pr.prenom as proprietaire_prenom,
  pr.type as proprietaire_type,
  pr.email as proprietaire_email,
  
  -- Informations propriété (join pour éviter requêtes supplémentaires)
  p.nom as propriete_nom,
  p.organisation_id
  
FROM propriete_proprietaires pp
JOIN proprietaires pr ON pp.proprietaire_id = pr.id
JOIN proprietes p ON pp.propriete_id = p.id;

-- ================================================================
-- 3. COMMENTAIRES DOCUMENTATION
-- ================================================================

COMMENT ON VIEW propriete_proprietaires_detail_v IS 
'Vue détaillée des quotités avec prix d''acquisition calculé dynamiquement. 
CORRIGÉE: Le champ prix_acquisition_calcule est maintenant correctement calculé selon la formule: 
(prix_achat + frais_notaire + frais_annexes) × pourcentage';

COMMENT ON VIEW quotites_with_calculated_prix IS 
'Vue dynamique qui calcule automatiquement le prix d''acquisition des quotités basé sur le total investissement de la propriété multiplié par le pourcentage. 
MISE À JOUR: Cohérence avec propriete_proprietaires_detail_v pour le calcul prix_acquisition_calcule';

-- ================================================================
-- 4. VÉRIFICATION MIGRATION
-- ================================================================

-- Vérifier que le calcul fonctionne correctement
DO $$
BEGIN
  -- Test sur la propriété Baramares n°1 (140,000€ total, 100% Roméo)
  IF EXISTS (
    SELECT 1 FROM propriete_proprietaires_detail_v 
    WHERE propriete_id = '70ec83e4-0f06-4aa5-96db-c6cf7e356b58'
    AND prix_acquisition_calcule = 140000.00
  ) THEN
    RAISE NOTICE 'Migration 125 réussie: calcul prix_acquisition_calcule fonctionne correctement';
  ELSE
    RAISE WARNING 'Migration 125: calcul prix_acquisition_calcule peut nécessiter des données de test';
  END IF;
END;
$$;