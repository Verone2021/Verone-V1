-- Migration 124: Transformer prix_acquisition de statique vers dynamique
-- Objectif: Prix d'acquisition = Total Investissement × Pourcentage (calculé automatiquement)

-- ================================================================
-- 1. SUPPRIMER COLONNE STATIQUE prix_acquisition
-- ================================================================

-- Supprimer la colonne prix_acquisition de property_ownership (sera calculée dynamiquement)
ALTER TABLE property_ownership 
DROP COLUMN IF EXISTS prix_acquisition;

-- ================================================================
-- 2. CRÉER VUE DYNAMIQUE POUR CALCULS AUTOMATIQUES
-- ================================================================

-- Vue qui calcule automatiquement le prix d'acquisition basé sur total investissement
CREATE OR REPLACE VIEW quotites_with_calculated_prix AS
SELECT 
  po.*,
  -- Calcul dynamique: Total investissement × Pourcentage
  CASE 
    WHEN p.prix_achat IS NOT NULL OR p.frais_notaire IS NOT NULL OR p.frais_annexes IS NOT NULL THEN
      (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) * 
      (po.quotite_numerateur::decimal / po.quotite_denominateur::decimal)
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
  
FROM property_ownership po
JOIN proprietaires pr ON po.proprietaire_id = pr.id
JOIN proprietes p ON po.propriete_id = p.id
WHERE po.is_active = true 
  AND po.date_fin IS NULL;

-- ================================================================
-- 3. METTRE À JOUR VUE PROPRIETE_PROPRIETAIRES_DETAIL_V
-- ================================================================

-- Mettre à jour la vue existante pour utiliser le calcul dynamique
CREATE OR REPLACE VIEW propriete_proprietaires_detail_v AS
SELECT 
  po.id,
  po.proprietaire_id,
  po.propriete_id,
  po.quotite_numerateur,
  po.quotite_denominateur,
  (po.quotite_numerateur::decimal / po.quotite_denominateur::decimal * 100) as pourcentage,
  
  -- Prix d'acquisition calculé dynamiquement
  CASE 
    WHEN p.prix_achat IS NOT NULL OR p.frais_notaire IS NOT NULL OR p.frais_annexes IS NOT NULL THEN
      (COALESCE(p.prix_achat, 0) + COALESCE(p.frais_notaire, 0) + COALESCE(p.frais_annexes, 0)) * 
      (po.quotite_numerateur::decimal / po.quotite_denominateur::decimal)
    ELSE 
      NULL
  END as prix_acquisition_calcule,
  
  po.date_acquisition,
  po.frais_acquisition,
  po.notes,
  po.created_at,
  po.updated_at,
  
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
  
FROM property_ownership po
JOIN proprietaires pr ON po.proprietaire_id = pr.id
JOIN proprietes p ON po.propriete_id = p.id
WHERE po.is_active = true 
  AND po.date_fin IS NULL;

-- ================================================================
-- 4. FONCTION UTILITAIRE POUR CALCUL PRIX ACQUISITION
-- ================================================================

-- Fonction simplifiée qui retourne directement le calcul (plus de stockage)
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
-- 5. TRIGGER POUR RECALCUL AUTOMATIQUE (Optionnel)
-- ================================================================

-- Fonction trigger pour notifier les changements (utile pour UI temps réel)
CREATE OR REPLACE FUNCTION notify_quotites_prix_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier que les prix d'acquisition ont changé pour cette propriété
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
CREATE OR REPLACE TRIGGER trigger_notify_prix_propriete_change
  AFTER UPDATE OF prix_achat, frais_notaire, frais_annexes ON proprietes
  FOR EACH ROW 
  WHEN (
    OLD.prix_achat IS DISTINCT FROM NEW.prix_achat OR
    OLD.frais_notaire IS DISTINCT FROM NEW.frais_notaire OR  
    OLD.frais_annexes IS DISTINCT FROM NEW.frais_annexes
  )
  EXECUTE FUNCTION notify_quotites_prix_change();

-- ================================================================
-- 6. INDEX POUR PERFORMANCE
-- ================================================================

-- Index pour vue quotites_with_calculated_prix
CREATE INDEX IF NOT EXISTS idx_property_ownership_active_view 
ON property_ownership(propriete_id, is_active, date_fin) 
WHERE is_active = true AND date_fin IS NULL;

-- ================================================================
-- 7. PERMISSIONS RLS (Row Level Security)
-- ================================================================

-- Appliquer même RLS que property_ownership pour la vue
CREATE POLICY "quotites_calculated_prix_organisation_access" ON quotites_with_calculated_prix
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM proprietes p
      JOIN user_organisation_assignments uoa ON p.organisation_id = uoa.organisation_id
      WHERE p.id = quotites_with_calculated_prix.propriete_id
        AND uoa.user_id = auth.uid()
    )
  );

-- Activer RLS sur la vue (si supporté par Supabase)
-- ALTER VIEW quotites_with_calculated_prix ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- COMMENTAIRES DOCUMENTATION
-- ================================================================

COMMENT ON VIEW quotites_with_calculated_prix IS 
'Vue dynamique qui calcule automatiquement le prix d''acquisition des quotités basé sur le total investissement de la propriété multiplié par le pourcentage de quotité. Remplace le champ statique prix_acquisition.';

COMMENT ON FUNCTION get_quotite_prix_acquisition(UUID, DECIMAL) IS 
'Fonction utilitaire qui calcule le prix d''acquisition d''une quotité basé sur le total investissement de la propriété et le pourcentage. Retourne NULL si pas de données financières.';

COMMENT ON TRIGGER trigger_notify_prix_propriete_change ON proprietes IS 
'Trigger qui notifie les changements de données financières propriétés pour mise à jour temps réel des calculs de quotités dans l''UI.';