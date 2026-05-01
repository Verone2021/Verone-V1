-- [SI-AI-001] Marketing fields for AI batch generation
-- Adds commercial_name (nom Vérone public), description_short/long marketing,
-- tags marketing array, ai_generated_metadata jsonb traceability.
-- Existing columns reused (not modified): slug, meta_title, meta_description,
-- description, technical_description, selling_points, name (= supplier name).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS commercial_name varchar,
  ADD COLUMN IF NOT EXISTS description_short text,
  ADD COLUMN IF NOT EXISTS description_long text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_generated_metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN products.commercial_name IS 'Nom commercial Vérone public (distinct de products.name = nom fournisseur)';
COMMENT ON COLUMN products.description_short IS 'Description marketing courte (40-60 mots)';
COMMENT ON COLUMN products.description_long IS 'Description marketing longue (200-400 mots, ton Architectural Digest)';
COMMENT ON COLUMN products.tags IS 'Tags marketing 5-10 mots-clés (style, ambiance, usage, pièce)';
COMMENT ON COLUMN products.ai_generated_metadata IS 'Trace IA: {model, prompt_version, generated_at, validated_at, validated_by, batch_id}';

CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN (tags);
