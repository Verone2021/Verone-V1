-- ============================================
-- Migration: 081_create_proprietes_views_functions.sql
-- Description: Création des vues et fonctions pour le système de propriétés
-- Date: 2024-01-20
-- ============================================

-- ==========================
-- 1. FONCTIONS UTILITAIRES
-- ==========================

-- Fonction pour vérifier si une propriété peut être supprimée
CREATE OR REPLACE FUNCTION public.can_delete_propriete(propriete_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Une propriété ne peut pas être supprimée si elle a des contrats actifs
  -- ou si elle est louée
  RETURN NOT EXISTS (
    SELECT 1 FROM proprietes 
    WHERE id = propriete_id 
    AND (statut = 'louee' OR statut = 'vendue')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le total des quotités d'une propriété
CREATE OR REPLACE FUNCTION public.get_propriete_quotites_total(propriete_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(pourcentage) 
     FROM propriete_proprietaires 
     WHERE propriete_proprietaires.propriete_id = $1),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'une propriété
CREATE OR REPLACE FUNCTION public.get_propriete_stats(propriete_id UUID)
RETURNS TABLE (
  total_unites INTEGER,
  unites_louees INTEGER,
  unites_disponibles INTEGER,
  taux_occupation DECIMAL,
  revenu_mensuel_total DECIMAL,
  total_photos INTEGER,
  total_proprietaires INTEGER,
  quotites_total DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT u.id), 0)::INTEGER as total_unites,
    COALESCE(COUNT(DISTINCT u.id) FILTER (WHERE u.est_louee = true), 0)::INTEGER as unites_louees,
    COALESCE(COUNT(DISTINCT u.id) FILTER (WHERE u.disponible = true AND u.est_louee = false), 0)::INTEGER as unites_disponibles,
    CASE 
      WHEN COUNT(DISTINCT u.id) > 0 
      THEN (COUNT(DISTINCT u.id) FILTER (WHERE u.est_louee = true)::DECIMAL / COUNT(DISTINCT u.id) * 100)
      ELSE 0
    END as taux_occupation,
    COALESCE(SUM(u.loyer_mensuel) FILTER (WHERE u.est_louee = true), 0)::DECIMAL as revenu_mensuel_total,
    COALESCE(COUNT(DISTINCT ph.id), 0)::INTEGER as total_photos,
    COALESCE(COUNT(DISTINCT pp.proprietaire_id), 0)::INTEGER as total_proprietaires,
    COALESCE(SUM(DISTINCT pp.pourcentage), 0)::DECIMAL as quotites_total
  FROM proprietes p
  LEFT JOIN unites u ON u.propriete_id = p.id
  LEFT JOIN propriete_photos ph ON ph.propriete_id = p.id
  LEFT JOIN propriete_proprietaires pp ON pp.propriete_id = p.id
  WHERE p.id = propriete_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================
-- 2. VUES
-- ==========================

-- Vue principale pour liste des propriétés
CREATE OR REPLACE VIEW public.proprietes_list_v AS
SELECT 
  p.*,
  o.nom as organisation_nom,
  o.pays as organisation_pays,
  
  -- Statistiques
  COALESCE(u.unites_count, 0) as unites_count,
  COALESCE(u.unites_louees, 0) as unites_louees,
  COALESCE(ph.photos_count, 0) as photos_count,
  ph.cover_photo_url,
  COALESCE(pp.proprietaires_count, 0) as proprietaires_count,
  COALESCE(pp.quotites_total, 0) as quotites_total,
  
  -- Revenus
  CASE 
    WHEN p.a_unites THEN COALESCE(u.revenu_total, 0)
    ELSE p.loyer_mensuel
  END as revenu_mensuel_total
  
FROM public.proprietes p
LEFT JOIN public.organisations o ON o.id = p.organisation_id

-- Agrégation des unités
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::INTEGER as unites_count,
    COUNT(*) FILTER (WHERE est_louee = true)::INTEGER as unites_louees,
    SUM(loyer_mensuel) FILTER (WHERE est_louee = true) as revenu_total
  FROM public.unites
  WHERE propriete_id = p.id
) u ON true

-- Photo de couverture
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::INTEGER as photos_count,
    MAX(CASE WHEN est_couverture THEN storage_path END) as cover_photo_url
  FROM public.propriete_photos
  WHERE propriete_id = p.id
) ph ON true

-- Propriétaires et quotités
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT proprietaire_id)::INTEGER as proprietaires_count,
    SUM(pourcentage) as quotites_total
  FROM public.propriete_proprietaires
  WHERE propriete_id = p.id
) pp ON true;

-- Vue des propriétés avec détails des quotités
CREATE OR REPLACE VIEW public.propriete_proprietaires_detail_v AS
SELECT 
  pp.*,
  p.nom as propriete_nom,
  p.reference as propriete_reference,
  p.type as propriete_type,
  pr.nom as proprietaire_nom,
  pr.prenom as proprietaire_prenom,
  pr.type as proprietaire_type,
  pr.email as proprietaire_email,
  pr.telephone as proprietaire_telephone,
  CASE 
    WHEN pr.type = 'physique' THEN CONCAT(pr.prenom, ' ', pr.nom)
    ELSE pr.nom
  END as proprietaire_nom_complet
FROM public.propriete_proprietaires pp
JOIN public.proprietes p ON p.id = pp.propriete_id
JOIN public.proprietaires pr ON pr.id = pp.proprietaire_id;

-- Vue des unités avec détails
CREATE OR REPLACE VIEW public.unites_detail_v AS
SELECT 
  u.*,
  p.nom as propriete_nom,
  p.reference as propriete_reference,
  p.organisation_id,
  o.nom as organisation_nom,
  
  -- Photos
  COALESCE(ph.photos_count, 0) as photos_count,
  ph.cover_photo_url
  
FROM public.unites u
JOIN public.proprietes p ON p.id = u.propriete_id
LEFT JOIN public.organisations o ON o.id = p.organisation_id

-- Photos de l'unité
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::INTEGER as photos_count,
    MAX(CASE WHEN est_couverture THEN storage_path END) as cover_photo_url
  FROM public.unite_photos
  WHERE unite_id = u.id
) ph ON true;

-- Vue statistiques pour dashboard
CREATE OR REPLACE VIEW public.proprietes_stats_v AS
SELECT 
  organisation_id,
  COUNT(*) as total_proprietes,
  COUNT(*) FILTER (WHERE statut = 'brouillon') as proprietes_brouillon,
  COUNT(*) FILTER (WHERE statut = 'sourcing') as proprietes_sourcing,
  COUNT(*) FILTER (WHERE statut = 'evaluation') as proprietes_evaluation,
  COUNT(*) FILTER (WHERE statut = 'negociation') as proprietes_negociation,
  COUNT(*) FILTER (WHERE statut = 'achetee') as proprietes_achetees,
  COUNT(*) FILTER (WHERE statut = 'disponible') as proprietes_disponibles,
  COUNT(*) FILTER (WHERE statut = 'louee') as proprietes_louees,
  COUNT(*) FILTER (WHERE statut = 'vendue') as proprietes_vendues,
  
  SUM(prix_acquisition) as total_investissement,
  SUM(valeur_actuelle) as valeur_portefeuille,
  SUM(loyer_mensuel) FILTER (WHERE statut = 'louee') as revenus_mensuels,
  
  AVG(CASE 
    WHEN prix_acquisition > 0 AND loyer_mensuel > 0 
    THEN (loyer_mensuel * 12 / prix_acquisition * 100) 
    ELSE NULL 
  END) as rendement_moyen
  
FROM public.proprietes
WHERE is_active = true
GROUP BY organisation_id;

-- ==========================
-- 3. PERMISSIONS
-- ==========================

-- Permissions sur les fonctions
GRANT EXECUTE ON FUNCTION public.can_delete_propriete TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_propriete_quotites_total TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_propriete_stats TO authenticated;

-- Permissions sur les vues
GRANT SELECT ON public.proprietes_list_v TO authenticated;
GRANT SELECT ON public.propriete_proprietaires_detail_v TO authenticated;
GRANT SELECT ON public.unites_detail_v TO authenticated;
GRANT SELECT ON public.proprietes_stats_v TO authenticated;

-- Permissions pour service_role
GRANT ALL ON public.proprietes_list_v TO service_role;
GRANT ALL ON public.propriete_proprietaires_detail_v TO service_role;
GRANT ALL ON public.unites_detail_v TO service_role;
GRANT ALL ON public.proprietes_stats_v TO service_role;

-- ==========================
-- 4. COMMENTAIRES
-- ==========================

COMMENT ON VIEW public.proprietes_list_v IS 'Vue enrichie des propriétés avec statistiques';
COMMENT ON VIEW public.propriete_proprietaires_detail_v IS 'Vue détaillée des quotités avec informations propriétaires';
COMMENT ON VIEW public.unites_detail_v IS 'Vue détaillée des unités avec informations propriété';
COMMENT ON VIEW public.proprietes_stats_v IS 'Vue statistiques pour dashboard par organisation';