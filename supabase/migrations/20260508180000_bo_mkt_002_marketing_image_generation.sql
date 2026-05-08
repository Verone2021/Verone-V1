-- [BO-MKT-002] Marketing AI image generation — extend media_assets metadata
--
-- Contexte: nouvelle feature "Studio Marketing IA" qui genere des images via
-- Gemini API a partir d'images sources de la bibliotheque. On etend
-- media_assets pour tracer la generation (modele utilise, prompt, sources,
-- mise en scene, canal cible).
--
-- Pourquoi pas un nouveau type d'image: media_assets a deja
--   - source = 'ai_generated' (deja supporte)
--   - ai_prompt_used (text, deja la)
--   - source_product_image_id, product_id, brand_ids[]
-- Il manquait juste les metadonnees specifiques a la generation IA.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS partout. Pas de rollback agressif.

ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS generation_model text,
  ADD COLUMN IF NOT EXISTS generation_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS source_image_ids text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS mise_en_scene text,
  ADD COLUMN IF NOT EXISTS target_channel text;

-- CHECK constraint sur target_channel (whitelist explicite)
-- DROP IF EXISTS pour idempotence sur retries
ALTER TABLE media_assets
  DROP CONSTRAINT IF EXISTS media_assets_target_channel_check;

ALTER TABLE media_assets
  ADD CONSTRAINT media_assets_target_channel_check
  CHECK (
    target_channel IS NULL
    OR target_channel IN (
      'instagram',
      'facebook',
      'pinterest',
      'whatsapp',
      'merchant',
      'website',
      'email',
      'other'
    )
  );

-- Index partiel pour filtrer rapidement les images generees IA dans la
-- bibliotheque marketing (la grande majorite des media_assets est manuelle)
CREATE INDEX IF NOT EXISTS idx_media_assets_ai_generated_brand
  ON media_assets (created_at DESC)
  WHERE source = 'ai_generated';

-- Commentaires colonnes pour documentation auto
COMMENT ON COLUMN media_assets.generation_model IS
  'Modele Gemini utilise pour la generation (ex: gemini-2.5-flash-image, gemini-3-pro-image-preview).';
COMMENT ON COLUMN media_assets.generation_at IS
  'Timestamp de la generation IA (distinct de created_at qui est l''insertion DB).';
COMMENT ON COLUMN media_assets.source_image_ids IS
  'Cloudflare image IDs des images sources utilisees comme reference pour la generation. Tableau de 1 a 5 IDs.';
COMMENT ON COLUMN media_assets.mise_en_scene IS
  'Preset de mise en scene utilise (ex: V2, B1, S3, F4, L1). Reference les presets dans @verone/marketing.';
COMMENT ON COLUMN media_assets.target_channel IS
  'Canal cible pour lequel l''image a ete generee. Whitelist enforcee par CHECK constraint.';
