-- ============================================================================
-- Migration: Create unite_photos table for advanced photo management
-- Description: Table pour gérer les photos des unités avec ordre, couverture, etc.
-- Author: Romeo
-- Date: 2025-08-25
-- ============================================================================

-- 1. Create unite_photos table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.unite_photos (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign keys
    unite_id UUID NOT NULL REFERENCES public.unites(id) ON DELETE CASCADE,
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    
    -- Photo information
    storage_path TEXT NOT NULL,
    titre TEXT,
    description TEXT,
    
    -- Photo metadata
    size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    
    -- Organisation and display
    ordre INTEGER DEFAULT 0,
    est_couverture BOOLEAN DEFAULT false,
    
    -- Timestamps and tracking
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT unite_photos_size_check CHECK (size_bytes > 0),
    CONSTRAINT unite_photos_mime_check CHECK (mime_type IN ('image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif')),
    CONSTRAINT unite_photos_ordre_check CHECK (ordre >= 0)
);

-- 2. Create indexes for performance
-- ============================================================================
CREATE INDEX idx_unite_photos_unite_id ON public.unite_photos(unite_id);
CREATE INDEX idx_unite_photos_organisation_id ON public.unite_photos(organisation_id);
CREATE INDEX idx_unite_photos_ordre ON public.unite_photos(unite_id, ordre);
CREATE INDEX idx_unite_photos_couverture ON public.unite_photos(unite_id, est_couverture) WHERE est_couverture = true;
CREATE INDEX idx_unite_photos_created_at ON public.unite_photos(created_at DESC);

-- 3. Create function to ensure only one cover photo per unit
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ensure_single_cover_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- Si on définit une photo comme couverture
    IF NEW.est_couverture = true THEN
        -- Retirer le statut couverture des autres photos de la même unité
        UPDATE public.unite_photos
        SET est_couverture = false,
            updated_at = NOW()
        WHERE unite_id = NEW.unite_id
          AND id != NEW.id
          AND est_couverture = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger for cover photo management
-- ============================================================================
CREATE TRIGGER ensure_single_cover_photo_trigger
    BEFORE INSERT OR UPDATE OF est_couverture ON public.unite_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_cover_photo();

-- 5. Create function to auto-update updated_at
-- ============================================================================
CREATE TRIGGER update_unite_photos_updated_at
    BEFORE UPDATE ON public.unite_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create function to reorder photos after deletion
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reorder_unite_photos_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Réorganiser les photos restantes pour combler les trous dans l'ordre
    WITH numbered_photos AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY ordre, created_at) - 1 AS new_ordre
        FROM public.unite_photos
        WHERE unite_id = OLD.unite_id
    )
    UPDATE public.unite_photos p
    SET ordre = np.new_ordre
    FROM numbered_photos np
    WHERE p.id = np.id
      AND p.ordre != np.new_ordre;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for photo reordering
-- ============================================================================
CREATE TRIGGER reorder_photos_after_delete_trigger
    AFTER DELETE ON public.unite_photos
    FOR EACH ROW
    EXECUTE FUNCTION public.reorder_unite_photos_after_delete();

-- 8. Create view for unite photos with metadata
-- ============================================================================
CREATE OR REPLACE VIEW public.unite_photos_detail_v AS
SELECT 
    up.*,
    u.numero AS unite_numero,
    u.nom AS unite_nom,
    o.nom AS organisation_nom,
    -- Formatted size
    CASE 
        WHEN up.size_bytes < 1024 THEN up.size_bytes || ' B'
        WHEN up.size_bytes < 1048576 THEN ROUND((up.size_bytes::numeric / 1024), 2) || ' KB'
        WHEN up.size_bytes < 1073741824 THEN ROUND((up.size_bytes::numeric / 1048576), 2) || ' MB'
        ELSE ROUND((up.size_bytes::numeric / 1073741824), 2) || ' GB'
    END AS size_formatted,
    -- Photo URL (to be constructed in application)
    'proprietes/' || u.propriete_id || '/unites/' || up.unite_id || '/photos/' || up.storage_path AS storage_url
FROM public.unite_photos up
JOIN public.unites u ON u.id = up.unite_id
JOIN public.organisations o ON o.id = up.organisation_id
ORDER BY up.ordre, up.created_at;

-- 9. Create function to get photo stats for a unit
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_unite_photos_stats(p_unite_id UUID)
RETURNS TABLE (
    total_photos INTEGER,
    total_size_bytes BIGINT,
    total_size_formatted TEXT,
    has_cover_photo BOOLEAN,
    cover_photo_id UUID,
    last_upload_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER AS total_photos,
        COALESCE(SUM(size_bytes), 0)::BIGINT AS total_size_bytes,
        CASE 
            WHEN COALESCE(SUM(size_bytes), 0) < 1024 THEN COALESCE(SUM(size_bytes), 0) || ' B'
            WHEN COALESCE(SUM(size_bytes), 0) < 1048576 THEN ROUND((COALESCE(SUM(size_bytes), 0)::numeric / 1024), 2) || ' KB'
            WHEN COALESCE(SUM(size_bytes), 0) < 1073741824 THEN ROUND((COALESCE(SUM(size_bytes), 0)::numeric / 1048576), 2) || ' MB'
            ELSE ROUND((COALESCE(SUM(size_bytes), 0)::numeric / 1073741824), 2) || ' GB'
        END AS total_size_formatted,
        BOOL_OR(est_couverture) AS has_cover_photo,
        MAX(CASE WHEN est_couverture THEN id END) AS cover_photo_id,
        MAX(created_at) AS last_upload_date
    FROM public.unite_photos
    WHERE unite_id = p_unite_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. Grant permissions
-- ============================================================================
-- Service role has full access
GRANT ALL ON public.unite_photos TO service_role;
GRANT ALL ON public.unite_photos_detail_v TO service_role;

-- Authenticated users can manage photos (controlled by application logic)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unite_photos TO authenticated;
GRANT SELECT ON public.unite_photos_detail_v TO authenticated;

-- 11. Add comment on table
-- ============================================================================
COMMENT ON TABLE public.unite_photos IS 'Table pour stocker les photos des unités avec gestion ordre et couverture';
COMMENT ON COLUMN public.unite_photos.ordre IS 'Ordre d''affichage des photos (0 = première photo)';
COMMENT ON COLUMN public.unite_photos.est_couverture IS 'Indique si c''est la photo de couverture de l''unité';
COMMENT ON COLUMN public.unite_photos.storage_path IS 'Chemin relatif dans Supabase Storage';

-- ============================================================================
-- End of migration
-- ============================================================================