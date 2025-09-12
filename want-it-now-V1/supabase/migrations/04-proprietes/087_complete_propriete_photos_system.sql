-- Migration: Système complet de gestion des photos pour propriétés (style Airbnb)
-- Date: 2025-01-08
-- Description: Gestion avancée des photos avec catégorisation, nommage et Storage Supabase

-- =============================================
-- 1. CORRIGER LA FONCTION DE VALIDATION DES QUOTITÉS
-- =============================================
DROP FUNCTION IF EXISTS validate_propriete_quotites_total() CASCADE;

CREATE OR REPLACE FUNCTION validate_propriete_quotites_total()
RETURNS TRIGGER AS $$
DECLARE
  total_pourcentage DECIMAL(5,2);
  prop_id UUID;
BEGIN
  -- Déterminer l'ID de la propriété selon l'opération
  IF TG_OP = 'DELETE' THEN
    prop_id := OLD.propriete_id;
  ELSE
    prop_id := NEW.propriete_id;
  END IF;
  
  -- Calculer le total des pourcentages pour cette propriété
  SELECT COALESCE(SUM(pourcentage), 0) 
  INTO total_pourcentage
  FROM public.propriete_proprietaires
  WHERE propriete_id = prop_id;
  
  -- Permettre un total <= 100
  IF total_pourcentage > 100 THEN
    RAISE EXCEPTION 'Le total des quotités ne peut pas dépasser 100%% (actuellement : %)', total_pourcentage;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recréer les triggers
CREATE TRIGGER validate_quotites_insert_update
  AFTER INSERT OR UPDATE ON public.propriete_proprietaires
  FOR EACH ROW
  EXECUTE FUNCTION validate_propriete_quotites_total();

CREATE TRIGGER validate_quotites_delete
  AFTER DELETE ON public.propriete_proprietaires
  FOR EACH ROW
  EXECUTE FUNCTION validate_propriete_quotites_total();

-- =============================================
-- 2. AMÉLIORER LA TABLE PHOTOS (Best Practices Airbnb)
-- =============================================
DROP TABLE IF EXISTS public.propriete_photos CASCADE;

CREATE TABLE public.propriete_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propriete_id UUID NOT NULL REFERENCES public.proprietes(id) ON DELETE CASCADE,
  unite_id UUID REFERENCES public.unites(id) ON DELETE CASCADE,
  
  -- Identification et catégorisation (style Airbnb)
  titre VARCHAR(255) NOT NULL, -- Ex: "Salon avec vue mer"
  description TEXT,
  categorie VARCHAR(50), -- 'exterieur', 'salon', 'chambre', 'cuisine', 'sdb', 'balcon', 'jardin', 'piscine', 'vue', 'autre'
  piece_nom VARCHAR(100), -- Ex: "Chambre principale", "Cuisine équipée"
  
  -- Storage Supabase
  bucket_id VARCHAR(255) DEFAULT 'proprietes-photos',
  storage_path TEXT NOT NULL, -- Format: "org_id/propriete_id/uuid_filename.jpg"
  
  -- URLs générées
  url_original TEXT, -- URL de l'image originale
  url_thumbnail TEXT, -- URL de la miniature (150x150)
  url_medium TEXT, -- URL moyenne (800x600)
  url_large TEXT, -- URL large (1920x1080)
  
  -- Métadonnées techniques
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  width_original INTEGER,
  height_original INTEGER,
  
  -- Propriétés d'affichage
  is_cover BOOLEAN DEFAULT false, -- Photo principale
  is_public BOOLEAN DEFAULT true, -- Visible dans les annonces
  display_order INTEGER DEFAULT 0, -- Ordre d'affichage
  
  -- Tags et recherche
  tags TEXT[], -- ['vue-mer', 'lumineux', 'moderne', etc.]
  alt_text TEXT, -- Texte alternatif pour accessibilité
  
  -- Validation et modération
  is_approved BOOLEAN DEFAULT true, -- Pour modération si nécessaire
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Métadonnées EXIF (optionnel)
  exif_data JSONB, -- Données EXIF complètes
  taken_at TIMESTAMPTZ, -- Date de prise de vue
  camera_model VARCHAR(100),
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  
  -- Timestamps et audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index optimisés pour les requêtes fréquentes
CREATE INDEX idx_photos_propriete_order ON public.propriete_photos(propriete_id, display_order);
CREATE INDEX idx_photos_unite_order ON public.propriete_photos(unite_id, display_order) WHERE unite_id IS NOT NULL;
CREATE INDEX idx_photos_categorie ON public.propriete_photos(propriete_id, categorie);
CREATE INDEX idx_photos_cover ON public.propriete_photos(propriete_id, is_cover) WHERE is_cover = true;
CREATE INDEX idx_photos_public ON public.propriete_photos(propriete_id, is_public) WHERE is_public = true;
CREATE INDEX idx_photos_tags ON public.propriete_photos USING GIN (tags);

-- =============================================
-- 3. CRÉER TABLE POUR LES CATÉGORIES DE PHOTOS
-- =============================================
CREATE TABLE IF NOT EXISTS public.photo_categories (
  code VARCHAR(50) PRIMARY KEY,
  libelle VARCHAR(100) NOT NULL,
  icone VARCHAR(50), -- Nom de l'icône Lucide
  ordre INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Insérer les catégories par défaut (style Airbnb)
INSERT INTO public.photo_categories (code, libelle, icone, ordre) VALUES
  ('facade', 'Façade & Extérieur', 'Home', 1),
  ('salon', 'Salon / Séjour', 'Sofa', 2),
  ('cuisine', 'Cuisine', 'ChefHat', 3),
  ('chambre', 'Chambres', 'Bed', 4),
  ('sdb', 'Salle de bain', 'Bath', 5),
  ('bureau', 'Bureau / Espace travail', 'Briefcase', 6),
  ('balcon', 'Balcon / Terrasse', 'Trees', 7),
  ('jardin', 'Jardin', 'Flower', 8),
  ('piscine', 'Piscine', 'Waves', 9),
  ('parking', 'Parking / Garage', 'Car', 10),
  ('vue', 'Vue', 'Mountain', 11),
  ('equipements', 'Équipements', 'Package', 12),
  ('proximite', 'Environs / Quartier', 'MapPin', 13),
  ('autre', 'Autre', 'Image', 99)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 4. VUE ENRICHIE POUR LES PHOTOS
-- =============================================
CREATE OR REPLACE VIEW public.propriete_photos_detail_v AS
SELECT 
  pp.*,
  p.nom as propriete_nom,
  p.reference as propriete_ref,
  u.nom as unite_nom,
  u.numero as unite_numero,
  pc.libelle as categorie_libelle,
  pc.icone as categorie_icone,
  
  -- Compteurs
  COUNT(*) OVER (PARTITION BY pp.propriete_id) as total_photos_propriete,
  COUNT(*) OVER (PARTITION BY pp.propriete_id, pp.categorie) as total_photos_categorie,
  ROW_NUMBER() OVER (PARTITION BY pp.propriete_id ORDER BY pp.display_order, pp.created_at) as photo_number,
  
  -- Indicateurs
  CASE 
    WHEN pp.is_cover THEN 'Photo principale'
    WHEN pp.display_order <= 5 THEN 'Photo prioritaire'
    ELSE 'Photo standard'
  END as importance,
  
  -- Taille formatée
  CASE
    WHEN pp.size_bytes < 1024 THEN pp.size_bytes || ' B'
    WHEN pp.size_bytes < 1048576 THEN ROUND((pp.size_bytes::NUMERIC / 1024), 1) || ' KB'
    WHEN pp.size_bytes < 1073741824 THEN ROUND((pp.size_bytes::NUMERIC / 1048576), 1) || ' MB'
    ELSE ROUND((pp.size_bytes::NUMERIC / 1073741824), 2) || ' GB'
  END as size_formatted

FROM public.propriete_photos pp
LEFT JOIN public.proprietes p ON pp.propriete_id = p.id
LEFT JOIN public.unites u ON pp.unite_id = u.id
LEFT JOIN public.photo_categories pc ON pp.categorie = pc.code;

-- =============================================
-- 5. FONCTION : Générer le path de stockage
-- =============================================
CREATE OR REPLACE FUNCTION generate_photo_storage_path(
  p_propriete_id UUID,
  p_filename TEXT
) RETURNS TEXT AS $$
DECLARE
  v_org_id UUID;
  v_year TEXT;
  v_month TEXT;
  v_clean_filename TEXT;
BEGIN
  -- Récupérer l'organisation_id
  SELECT organisation_id INTO v_org_id
  FROM public.proprietes
  WHERE id = p_propriete_id;
  
  -- Obtenir année et mois actuels
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_month := TO_CHAR(NOW(), 'MM');
  
  -- Nettoyer le nom de fichier
  v_clean_filename := LOWER(REGEXP_REPLACE(p_filename, '[^a-zA-Z0-9._-]', '_', 'g'));
  
  -- Générer le path : org_id/year/month/propriete_id/uuid_filename
  RETURN FORMAT('%s/%s/%s/%s/%s_%s',
    v_org_id,
    v_year,
    v_month,
    p_propriete_id,
    gen_random_uuid(),
    v_clean_filename
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. FONCTION : Réorganiser l'ordre des photos
-- =============================================
CREATE OR REPLACE FUNCTION reorder_propriete_photos(
  p_propriete_id UUID,
  p_photo_ids UUID[]
) RETURNS BOOLEAN AS $$
DECLARE
  i INTEGER;
BEGIN
  -- Mettre à jour l'ordre de chaque photo
  FOR i IN 1..array_length(p_photo_ids, 1) LOOP
    UPDATE public.propriete_photos
    SET display_order = i
    WHERE id = p_photo_ids[i]
    AND propriete_id = p_propriete_id;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. FONCTION : Définir la photo de couverture
-- =============================================
CREATE OR REPLACE FUNCTION set_cover_photo(
  p_photo_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_propriete_id UUID;
  v_unite_id UUID;
BEGIN
  -- Récupérer les IDs
  SELECT propriete_id, unite_id 
  INTO v_propriete_id, v_unite_id
  FROM public.propriete_photos
  WHERE id = p_photo_id;
  
  -- Retirer le statut couverture des autres photos
  IF v_unite_id IS NOT NULL THEN
    -- Pour une unité
    UPDATE public.propriete_photos
    SET is_cover = false
    WHERE unite_id = v_unite_id
    AND is_cover = true;
  ELSE
    -- Pour une propriété
    UPDATE public.propriete_photos
    SET is_cover = false
    WHERE propriete_id = v_propriete_id
    AND unite_id IS NULL
    AND is_cover = true;
  END IF;
  
  -- Définir cette photo comme couverture
  UPDATE public.propriete_photos
  SET is_cover = true, display_order = 0
  WHERE id = p_photo_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. RECRÉER LES VUES PROPRIETES AVEC PHOTOS
-- =============================================
CREATE OR REPLACE VIEW public.proprietes_list_v AS 
SELECT 
  p.*,
  o.nom as organisation_nom,
  pr.nom as proprietaire_nom,
  pr.prenom as proprietaire_prenom,
  
  -- Photo de couverture
  pp.url_medium as cover_photo_url,
  pp.titre as cover_photo_titre,
  
  -- Compteurs
  COALESCE(u.unites_count, 0) as unites_count,
  COALESCE(ph.photos_count, 0) as photos_count,
  COALESCE(q.quotites_total, 0) as quotites_total
  
FROM public.proprietes p 
LEFT JOIN public.organisations o ON o.id = p.organisation_id 
LEFT JOIN public.proprietaires pr ON pr.id = p.proprietaire_id
LEFT JOIN LATERAL (
  SELECT url_medium, titre
  FROM public.propriete_photos
  WHERE propriete_id = p.id
  AND is_cover = true
  AND is_public = true
  LIMIT 1
) pp ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int as unites_count 
  FROM public.unites 
  WHERE propriete_id = p.id
) u ON p.a_unites = true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int as photos_count
  FROM public.propriete_photos
  WHERE propriete_id = p.id
  AND is_public = true
) ph ON true
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(pourcentage), 0)::int as quotites_total
  FROM public.propriete_proprietaires
  WHERE propriete_id = p.id
) q ON true;

-- =============================================
-- 9. PERMISSIONS ET COMMENTAIRES
-- =============================================
-- Permissions sur les nouvelles tables
GRANT SELECT ON public.photo_categories TO authenticated;
GRANT SELECT ON public.propriete_photos_detail_v TO authenticated;

-- Commentaires descriptifs
COMMENT ON TABLE public.propriete_photos IS 'Système complet de gestion des photos style Airbnb avec catégorisation et Storage Supabase';
COMMENT ON COLUMN public.propriete_photos.titre IS 'Titre descriptif de la photo (ex: Salon lumineux avec vue mer)';
COMMENT ON COLUMN public.propriete_photos.categorie IS 'Catégorie de la pièce/zone photographiée';
COMMENT ON COLUMN public.propriete_photos.piece_nom IS 'Nom spécifique de la pièce (ex: Chambre principale)';
COMMENT ON COLUMN public.propriete_photos.tags IS 'Tags pour recherche et filtrage (ex: vue-mer, moderne, lumineux)';
COMMENT ON FUNCTION generate_photo_storage_path IS 'Génère un chemin de stockage organisé pour Supabase Storage';
COMMENT ON FUNCTION set_cover_photo IS 'Définit une photo comme photo de couverture principale';
COMMENT ON FUNCTION reorder_propriete_photos IS 'Réorganise l''ordre d''affichage des photos';