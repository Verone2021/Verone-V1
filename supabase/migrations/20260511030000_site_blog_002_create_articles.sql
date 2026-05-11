-- ============================================================
-- [SITE-BLOG-002] Table articles — blog éditorial /journal
-- ============================================================
-- Architecture senior pour blog éditorial e-commerce premium :
--   - SEO complet (meta, OG, Twitter Card, JSON-LD prêt, canonical, robots)
--   - Maillage interne et externe (internal_links, external_backlinks)
--   - Métriques de lecture (reading_time, word_count) calculées via trigger
--   - Analytics légères (view_count, share_count)
--   - Curation manuelle articles liés + produits liés
--   - Full-text search PostgreSQL natif
--   - Multilangue futur (locale, translation_group_id)
--
-- Sécurité :
--   - Staff back-office : FOR ALL via is_backoffice_user()
--   - Anon (site public) : SELECT uniquement si status='published'
--     AND published_at <= now() AND archived_at IS NULL
-- ============================================================

BEGIN;

CREATE TABLE articles (
  -- Identification
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  title text NOT NULL,
  subtitle text,
  excerpt text NOT NULL,

  -- Contenu
  body_markdown text NOT NULL,

  -- Image hero
  cover_image_url text,
  cover_image_alt text NOT NULL,

  -- Catégorisation
  category text NOT NULL,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_featured boolean NOT NULL DEFAULT false,

  -- Auteur (signature éditoriale)
  author_name text NOT NULL DEFAULT 'Vérone',
  author_role text DEFAULT 'Rédaction',
  author_avatar_url text,

  -- Métriques de lecture (calculées par trigger)
  reading_time_minutes integer NOT NULL DEFAULT 5,
  word_count integer,

  -- Publication
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- SEO basiques
  meta_title text,
  meta_description text,
  canonical_url text,

  -- Open Graph / partage social
  og_image_url text,
  og_image_alt text,
  og_title text,
  og_description text,
  twitter_card text NOT NULL DEFAULT 'summary_large_image'
    CHECK (twitter_card IN ('summary', 'summary_large_image')),

  -- Robots / indexation
  robots_index boolean NOT NULL DEFAULT true,
  robots_follow boolean NOT NULL DEFAULT true,
  schema_type text NOT NULL DEFAULT 'BlogPosting'
    CHECK (schema_type IN ('Article', 'BlogPosting', 'NewsArticle')),

  -- Maillage interne et externe (SEO authority)
  internal_links jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(internal_links) = 'array'),
  external_backlinks jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(external_backlinks) = 'array'),

  -- Curation manuelle
  related_article_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  featured_product_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],

  -- Analytics
  view_count integer NOT NULL DEFAULT 0,
  share_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,

  -- Multilangue (réservé futur)
  locale text NOT NULL DEFAULT 'fr-FR',
  translation_group_id uuid,

  -- Full-text search
  search_vector tsvector
);

COMMENT ON TABLE articles IS
  'Articles éditoriaux du blog /journal. Architecture senior avec SEO complet, '
  'maillage interne/externe, analytics et multilangue futur.';

COMMENT ON COLUMN articles.slug IS
  'URL canonique : /journal/{slug}. Snake-case-alphanum-only. Immuable après '
  'publication pour ne pas casser les backlinks entrants.';

COMMENT ON COLUMN articles.cover_image_alt IS
  'Description textuelle de l''image hero. Lue par Google + lecteurs d''écran. '
  'Obligatoire pour SEO et accessibilité RGAA.';

COMMENT ON COLUMN articles.canonical_url IS
  'Si l''article est republié sur Medium/etc, déclare l''original ici pour '
  'éviter la pénalité Google duplicate content.';

COMMENT ON COLUMN articles.schema_type IS
  'Type schema.org pour le JSON-LD injecté dans <head>. BlogPosting = '
  'standard éditorial. Permet d''apparaître en rich result Google.';

COMMENT ON COLUMN articles.internal_links IS
  'Liste des slugs internes cités dans le body. Format : [{"slug": "...", '
  '"anchor": "...", "context": "..."}]. Utile pour audit maillage SEO.';

COMMENT ON COLUMN articles.external_backlinks IS
  'Liens sortants vers sources externes. Format : [{"url": "...", "rel": '
  '"nofollow|dofollow", "anchor": "..."}].';

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_articles_published
  ON articles (status, published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_articles_category
  ON articles (category, published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_articles_featured
  ON articles (is_featured, published_at DESC)
  WHERE status = 'published' AND is_featured = true;

CREATE INDEX idx_articles_tags
  ON articles USING gin (tags);

CREATE INDEX idx_articles_search
  ON articles USING gin (search_vector);

CREATE INDEX idx_articles_featured_products
  ON articles USING gin (featured_product_ids);

CREATE INDEX idx_articles_translation_group
  ON articles (translation_group_id)
  WHERE translation_group_id IS NOT NULL;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_articles" ON articles
  FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE POLICY "anon_read_published_articles" ON articles
  FOR SELECT TO anon
  USING (
    status = 'published'
    AND published_at <= now()
    AND archived_at IS NULL
  );

CREATE POLICY "authenticated_read_published_articles" ON articles
  FOR SELECT TO authenticated
  USING (
    (status = 'published' AND published_at <= now() AND archived_at IS NULL)
    OR is_backoffice_user()
  );

-- ============================================================
-- Triggers
-- ============================================================

-- 1. updated_at standard
CREATE OR REPLACE FUNCTION set_articles_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_articles_updated_at();

-- 2. Compute reading_time_minutes + word_count depuis body_markdown
CREATE OR REPLACE FUNCTION articles_compute_metrics() RETURNS trigger AS $$
BEGIN
  IF NEW.body_markdown IS NOT NULL THEN
    -- Compte les mots (split sur espaces)
    NEW.word_count = array_length(regexp_split_to_array(NEW.body_markdown, '\s+'), 1);
    -- Temps de lecture estimé : 200 mots/min (norme éditoriale française)
    NEW.reading_time_minutes = GREATEST(1, CEILING(NEW.word_count::numeric / 200));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_compute_metrics_trigger
  BEFORE INSERT OR UPDATE OF body_markdown ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_compute_metrics();

-- 3. Full-text search vector (title + excerpt + body)
CREATE OR REPLACE FUNCTION articles_update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = to_tsvector(
    'french',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.subtitle, '') || ' ' ||
    COALESCE(NEW.excerpt, '') || ' ' ||
    COALESCE(NEW.body_markdown, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_update_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, subtitle, excerpt, body_markdown ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_update_search_vector();

-- 4. Auto-set published_at à la première publication
CREATE OR REPLACE FUNCTION articles_set_published_at() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'published'
     AND (OLD IS NULL OR OLD.status <> 'published')
     AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_set_published_at_trigger
  BEFORE INSERT OR UPDATE OF status ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_set_published_at();

-- ============================================================
-- RPC : incrément atomique du compteur de vues
-- ============================================================
CREATE OR REPLACE FUNCTION increment_article_view(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE articles
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE slug = p_slug
    AND status = 'published'
    AND archived_at IS NULL;
END;
$$;

COMMENT ON FUNCTION increment_article_view IS
  'Incrément atomique du compteur de vues d''un article publié. '
  'Appelée côté client après rendu de la page article.';

GRANT EXECUTE ON FUNCTION increment_article_view(text) TO anon, authenticated;

COMMIT;
