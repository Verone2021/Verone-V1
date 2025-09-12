-- ============================================
-- Migration: 085_fix_proprietes_columns_mapping.sql
-- Description: Corriger l'incohérence entre les colonnes d'adresse DB vs Code
-- Date: 2025-01-22
-- Résout: Error fetching proprietes: {} causé par colonnes manquantes
-- ============================================

-- ==========================
-- 1. AJOUTER LES NOUVELLES COLONNES
-- ==========================

-- Ajouter les colonnes attendues par le code TypeScript
ALTER TABLE public.proprietes 
ADD COLUMN IF NOT EXISTS adresse VARCHAR(255),
ADD COLUMN IF NOT EXISTS adresse_complement VARCHAR(255);

-- ==========================
-- 2. MIGRER LES DONNÉES EXISTANTES
-- ==========================

-- Copier les données des anciennes colonnes vers les nouvelles
UPDATE public.proprietes 
SET 
  adresse = adresse_ligne1,
  adresse_complement = adresse_ligne2
WHERE adresse IS NULL;

-- ==========================
-- 3. SUPPRIMER LES ANCIENNES COLONNES
-- ==========================

-- Supprimer les colonnes obsolètes après migration des données
ALTER TABLE public.proprietes 
DROP COLUMN IF EXISTS adresse_ligne1,
DROP COLUMN IF EXISTS adresse_ligne2;

-- ==========================
-- 4. CORRIGER LA MIGRATION 090 (unites_detail_v)
-- ==========================

-- Recréer la vue unites_detail_v avec les bonnes colonnes
DROP VIEW IF EXISTS public.unites_detail_v CASCADE;

CREATE OR REPLACE VIEW public.unites_detail_v AS
SELECT 
  u.*,
  p.nom as propriete_nom,
  p.adresse as propriete_adresse,  -- Corrigé: utilise maintenant 'adresse' au lieu de 'adresse_ligne1'
  p.ville as propriete_ville,
  p.code_postal as propriete_code_postal,
  p.pays as propriete_pays,
  o.nom as organisation_nom,
  
  -- Photos count
  COALESCE(ph.photos_count, 0) as photos_count,
  ph.cover_photo_url,
  
  -- Revenus
  CASE 
    WHEN u.est_louee THEN u.loyer
    ELSE 0
  END as revenu_mensuel
  
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

-- ==========================
-- 5. VÉRIFIER LES AUTRES VUES
-- ==========================

-- Recréer la vue proprietes_list_v pour s'assurer qu'elle utilise les bonnes colonnes
DROP VIEW IF EXISTS public.proprietes_list_v CASCADE;

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
    SUM(loyer) FILTER (WHERE est_louee = true) as revenu_total
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

-- ==========================
-- 6. PERMISSIONS
-- ==========================

-- Donner les permissions sur les vues recréées
GRANT SELECT ON public.proprietes_list_v TO authenticated;
GRANT SELECT ON public.proprietes_list_v TO service_role;
GRANT SELECT ON public.proprietes_list_v TO anon;

GRANT SELECT ON public.unites_detail_v TO authenticated;
GRANT SELECT ON public.unites_detail_v TO service_role;

-- ==========================
-- 7. COMMENTAIRES
-- ==========================

COMMENT ON COLUMN public.proprietes.adresse IS 'Adresse principale de la propriété (ex: adresse_ligne1)';
COMMENT ON COLUMN public.proprietes.adresse_complement IS 'Complément d''adresse (ex: adresse_ligne2)';
COMMENT ON VIEW public.proprietes_list_v IS 'Vue enrichie des propriétés avec statistiques - Colonnes adresse corrigées';
COMMENT ON VIEW public.unites_detail_v IS 'Vue détaillée des unités - Colonnes adresse corrigées';

-- ==========================
-- 8. VALIDATION
-- ==========================

-- Vérifier que la vue fonctionne
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO test_count FROM public.proprietes_list_v LIMIT 1;
  RAISE NOTICE 'Migration 085 réussie: Vue proprietes_list_v accessible';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration 085 échouée: Vue proprietes_list_v inaccessible - %', SQLERRM;
END $$;