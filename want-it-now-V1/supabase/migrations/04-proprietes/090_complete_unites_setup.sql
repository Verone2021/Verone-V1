-- Migration: Compléter la configuration des unités
-- Date: 2025-01-08
-- Description: Ajouter les colonnes manquantes et créer les vues pour les unités

-- =============================================
-- 1. AJOUTER LES COLONNES MANQUANTES
-- =============================================
ALTER TABLE public.unites 
ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'disponible',
ADD COLUMN IF NOT EXISTS capacite_max INTEGER,
ADD COLUMN IF NOT EXISTS nb_lits INTEGER,
ADD COLUMN IF NOT EXISTS nb_sdb INTEGER,
ADD COLUMN IF NOT EXISTS surface_m2 NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS loyer NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS charges NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS depot_garantie NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS regles JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Mapper les colonnes existantes vers les nouvelles si nécessaire
UPDATE public.unites SET
  surface_m2 = surface_habitable,
  nb_sdb = nombre_salles_bain,
  loyer = loyer_mensuel,
  charges = charges_mensuelles,
  statut = CASE 
    WHEN est_louee = true THEN 'louee'
    WHEN disponible = true THEN 'disponible'
    ELSE 'indisponible'
  END
WHERE surface_m2 IS NULL;

-- =============================================
-- 2. CRÉER LES VUES
-- =============================================
CREATE OR REPLACE VIEW public.unites_detail_v AS
SELECT 
  u.*,
  p.nom as propriete_nom,
  p.adresse as propriete_adresse,
  p.ville as propriete_ville,
  p.code_postal as propriete_code_postal,
  p.pays as propriete_pays,
  o.nom as organisation_nom,
  
  -- Photos count
  COALESCE(ph.photos_count, 0) as photos_count,
  ph.cover_photo_url,
  
  -- Calculs
  CASE 
    WHEN u.statut = 'disponible' THEN '🟢 Disponible'
    WHEN u.statut = 'louee' THEN '🔴 Louée'
    WHEN u.statut = 'renovation' THEN '🟠 En rénovation'
    WHEN u.statut = 'indisponible' THEN '⚫ Indisponible'
    ELSE COALESCE(u.statut, 'Non défini')
  END as statut_libelle,
  
  -- Rentabilité potentielle
  CASE 
    WHEN COALESCE(u.loyer, u.loyer_mensuel, 0) > 0 THEN COALESCE(u.loyer, u.loyer_mensuel, 0) * 12
    ELSE 0
  END as revenus_annuels_potentiels

FROM public.unites u
LEFT JOIN public.proprietes p ON u.propriete_id = p.id
LEFT JOIN public.organisations o ON u.organisation_id = o.id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*)::int as photos_count,
    MAX(CASE WHEN pp.is_cover THEN pp.url_medium END) as cover_photo_url
  FROM public.propriete_photos pp
  WHERE pp.unite_id = u.id
) ph ON true;

CREATE OR REPLACE VIEW public.propriete_unites_stats_v AS
SELECT 
  p.id as propriete_id,
  p.nom as propriete_nom,
  COUNT(u.id) as total_unites,
  COUNT(u.id) FILTER (WHERE u.statut = 'disponible' OR u.disponible = true) as unites_disponibles,
  COUNT(u.id) FILTER (WHERE u.statut = 'louee' OR u.est_louee = true) as unites_louees,
  COUNT(u.id) FILTER (WHERE u.statut = 'renovation') as unites_renovation,
  COUNT(u.id) FILTER (WHERE u.statut = 'indisponible' OR u.disponible = false) as unites_indisponibles,
  
  -- Surface totale
  COALESCE(SUM(COALESCE(u.surface_m2, u.surface_habitable)), 0) as surface_totale_m2,
  COALESCE(AVG(COALESCE(u.surface_m2, u.surface_habitable)), 0) as surface_moyenne_m2,
  
  -- Capacités
  COALESCE(SUM(u.capacite_max), 0) as capacite_totale,
  COALESCE(SUM(u.nb_lits), 0) as nb_lits_total,
  
  -- Revenus
  COALESCE(SUM(COALESCE(u.loyer, u.loyer_mensuel)), 0) as loyer_mensuel_total,
  COALESCE(AVG(COALESCE(u.loyer, u.loyer_mensuel)), 0) as loyer_mensuel_moyen,
  COALESCE(SUM(COALESCE(u.loyer, u.loyer_mensuel)) FILTER (WHERE u.statut = 'louee' OR u.est_louee = true), 0) as revenus_mensuels_actuels,
  COALESCE(SUM(COALESCE(u.loyer, u.loyer_mensuel)) * 12, 0) as revenus_annuels_potentiels,
  
  -- Taux d'occupation
  CASE 
    WHEN COUNT(u.id) > 0 THEN 
      (COUNT(u.id) FILTER (WHERE u.statut = 'louee' OR u.est_louee = true)::NUMERIC / COUNT(u.id) * 100)::NUMERIC(5,2)
    ELSE 0
  END as taux_occupation_pct

FROM public.proprietes p
LEFT JOIN public.unites u ON p.id = u.propriete_id AND COALESCE(u.is_active, true) = true
GROUP BY p.id, p.nom;

-- =============================================
-- 3. FONCTION HELPER : Statistiques rapides
-- =============================================
CREATE OR REPLACE FUNCTION get_unites_stats_for_propriete(p_propriete_id UUID)
RETURNS TABLE (
  total INTEGER,
  disponibles INTEGER,
  louees INTEGER,
  taux_occupation NUMERIC(5,2),
  revenus_mensuels NUMERIC(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE statut = 'disponible' OR disponible = true)::INTEGER as disponibles,
    COUNT(*) FILTER (WHERE statut = 'louee' OR est_louee = true)::INTEGER as louees,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE statut = 'louee' OR est_louee = true)::NUMERIC / COUNT(*) * 100)::NUMERIC(5,2)
      ELSE 0
    END as taux_occupation,
    COALESCE(SUM(COALESCE(loyer, loyer_mensuel)) FILTER (WHERE statut = 'louee' OR est_louee = true), 0)::NUMERIC(10,2) as revenus_mensuels
  FROM public.unites
  WHERE propriete_id = p_propriete_id
  AND COALESCE(is_active, true) = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. PERMISSIONS
-- =============================================
GRANT SELECT ON public.unites_detail_v TO authenticated;
GRANT SELECT ON public.propriete_unites_stats_v TO authenticated;
GRANT EXECUTE ON FUNCTION get_unites_stats_for_propriete TO authenticated;

-- =============================================
-- 5. COMMENTAIRES
-- =============================================
COMMENT ON VIEW public.unites_detail_v IS 'Vue enrichie des unités avec informations de la propriété et photos';
COMMENT ON VIEW public.propriete_unites_stats_v IS 'Statistiques agrégées des unités par propriété';
COMMENT ON FUNCTION get_unites_stats_for_propriete IS 'Fonction helper pour obtenir rapidement les stats des unités d''une propriété';