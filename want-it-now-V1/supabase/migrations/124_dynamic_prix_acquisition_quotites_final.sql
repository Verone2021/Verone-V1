-- Migration 124: Transformer prix_acquisition de statique vers dynamique (Version Finale)
-- Objectif: Prix d'acquisition = Total Investissement × Pourcentage (calculé automatiquement)

-- ================================================================
-- 1. SUPPRIMER VUE EXISTANTE QUI DÉPEND DE prix_acquisition
-- ================================================================

-- Supprimer la vue existante temporairement
DROP VIEW IF EXISTS propriete_proprietaires_detail_v;

-- ================================================================
-- 2. SUPPRIMER COLONNE STATIQUE prix_acquisition
-- ================================================================

-- Supprimer la colonne prix_acquisition de propriete_proprietaires
ALTER TABLE propriete_proprietaires 
DROP COLUMN IF EXISTS prix_acquisition;

-- ================================================================
-- 3. CRÉER VUE DYNAMIQUE POUR CALCULS AUTOMATIQUES
-- ================================================================

-- Vue qui calcule automatiquement le prix d'acquisition basé sur total investissement
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
-- 4. RECRÉER VUE PROPRIETE_PROPRIETAIRES_DETAIL_V AVEC CALCUL DYNAMIQUE
-- ================================================================

-- Recréer la vue avec le calcul dynamique
CREATE VIEW propriete_proprietaires_detail_v AS
SELECT 
  pp.id,
  pp.proprietaire_id,
  pp.propriete_id,
  pp.pourcentage,
  
  -- Prix d'acquisition calculé dynamiquement (NOUVELLE LOGIQUE)
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
-- 5. FONCTION UTILITAIRE POUR CALCUL PRIX ACQUISITION
-- ================================================================

-- Fonction qui retourne le calcul dynamique
CREATE OR REPLACE FUNCTION get_quotite_prix_acquisition(
  p_propriete_id UUID,
  p_pourcentage DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  total_investissement DECIMAL;
BEGIN
  -- Récupérer le total investissement de la propriété
  SELECT (COALESCE(prix_achat, 0) + COALESCE(frais_notaire, 0) + COALESCE(frais_annexes, 0))
  INTO total_investissement
  FROM proprietes 
  WHERE id = p_propriete_id;
  
  -- Retourner le calcul ou NULL si pas de données
  IF total_investissement > 0 THEN
    RETURN total_investissement * (p_pourcentage / 100.0);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 6. TRIGGER POUR NOTIFICATION TEMPS RÉEL
-- ================================================================

-- Fonction trigger pour notifier les changements
CREATE OR REPLACE FUNCTION notify_quotites_prix_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier que les prix d'acquisition ont changé
  PERFORM pg_notify(
    'quotites_prix_changed', 
    json_build_object(
      'propriete_id', COALESCE(NEW.id, OLD.id),
      'action', TG_OP,
      'timestamp', extract(epoch from now())
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger sur modifications données financières propriétés
CREATE TRIGGER trigger_notify_prix_propriete_change
  AFTER UPDATE OF prix_achat, frais_notaire, frais_annexes ON proprietes
  FOR EACH ROW 
  WHEN (
    OLD.prix_achat IS DISTINCT FROM NEW.prix_achat OR
    OLD.frais_notaire IS DISTINCT FROM NEW.frais_notaire OR  
    OLD.frais_annexes IS DISTINCT FROM NEW.frais_annexes
  )
  EXECUTE FUNCTION notify_quotites_prix_change();

-- Trigger sur modifications quotités (pourcentage)
CREATE TRIGGER trigger_notify_quotites_change
  AFTER UPDATE OF pourcentage ON propriete_proprietaires
  FOR EACH ROW 
  WHEN (OLD.pourcentage IS DISTINCT FROM NEW.pourcentage)
  EXECUTE FUNCTION notify_quotites_prix_change();

-- ================================================================
-- 7. COMMENTAIRES DOCUMENTATION
-- ================================================================

COMMENT ON VIEW quotites_with_calculated_prix IS 
'Vue dynamique qui calcule automatiquement le prix d''acquisition des quotités basé sur le total investissement de la propriété multiplié par le pourcentage. Remplace le champ statique prix_acquisition.';

COMMENT ON VIEW propriete_proprietaires_detail_v IS 
'Vue détaillée des quotités avec prix d''acquisition calculé dynamiquement. Le champ prix_acquisition_calcule est automatiquement mis à jour selon la formule: (prix_achat + frais_notaire + frais_annexes) × pourcentage.';

COMMENT ON FUNCTION get_quotite_prix_acquisition(UUID, DECIMAL) IS 
'Fonction utilitaire qui calcule le prix d''acquisition d''une quotité basé sur le total investissement de la propriété et le pourcentage. Retourne NULL si pas de données financières.';

-- ================================================================
-- 8. VÉRIFICATION MIGRATION
-- ================================================================

-- Vérifier que la migration s'est bien passée
DO $$
BEGIN
  -- Vérifier que la colonne prix_acquisition n'existe plus
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'propriete_proprietaires' 
    AND column_name = 'prix_acquisition'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: colonne prix_acquisition encore présente';
  END IF;
  
  -- Vérifier que la vue existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'quotites_with_calculated_prix'
  ) THEN
    RAISE EXCEPTION 'Migration échouée: vue quotites_with_calculated_prix non créée';
  END IF;
  
  RAISE NOTICE 'Migration 124 réussie: prix_acquisition maintenant dynamique';
END;
$$;