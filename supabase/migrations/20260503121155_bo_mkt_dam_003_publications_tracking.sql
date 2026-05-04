-- BO-MKT-DAM-003 : tracker les publications d'une photo + tagger l'origine.
-- Permet de répondre :
--   - "Cette photo, je l'ai déjà postée où ?"
--   - "Quelles photos ne sont jamais utilisées ?" (pour faire le ménage)
--   - "Quelles photos viennent de Nano Banana ? avec quel prompt ?"

-- 1. Origine de la photo (manual upload, fournisseur, IA générée, stock)
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual_upload'
    CHECK (source IN ('manual_upload', 'supplier_provided', 'ai_generated', 'stock_photo'));

-- 2. Prompt Nano Banana / autre IA, conservé pour réutilisation
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS ai_prompt_used TEXT;

COMMENT ON COLUMN public.media_assets.source IS
  'Origine: manual_upload | supplier_provided | ai_generated | stock_photo';
COMMENT ON COLUMN public.media_assets.ai_prompt_used IS
  'Prompt utilisé pour générer l''image (Nano Banana / autre IA). NULL si source != ai_generated.';

-- 3. Table de tracking des publications par canal
CREATE TABLE IF NOT EXISTS public.media_asset_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN (
    'site_verone',
    'site_bohemia',
    'site_solar',
    'site_flos',
    'meta',
    'pinterest',
    'tiktok',
    'linkedin',
    'newsletter',
    'ads',
    'blog',
    'other'
  )),
  external_url TEXT,
  notes TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unpublished_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.media_asset_publications IS
  'Trace chaque publication d''une photo (asset_id) sur un canal. Une photo peut avoir N lignes (publiée plusieurs fois). unpublished_at non-null = retirée.';

-- 4. Index pour les requêtes courantes (badge "publié N×" sur la carte DAM,
--    filtre "non utilisées")
CREATE INDEX IF NOT EXISTS idx_media_asset_publications_asset
  ON public.media_asset_publications(asset_id);

CREATE INDEX IF NOT EXISTS idx_media_asset_publications_active
  ON public.media_asset_publications(asset_id, channel)
  WHERE unpublished_at IS NULL;

-- 5. RLS : staff back-office a accès complet (pattern standard)
ALTER TABLE public.media_asset_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_media_asset_publications"
  ON public.media_asset_publications
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- 6. Trigger updated_at (réutilise la fonction standard du projet)
CREATE TRIGGER trg_media_asset_publications_updated_at
  BEFORE UPDATE ON public.media_asset_publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
