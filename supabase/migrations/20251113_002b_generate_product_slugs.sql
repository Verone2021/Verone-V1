-- =====================================================
-- Migration: Génération Slugs Produits
-- =====================================================
-- Date: 2025-11-13
-- Description: Génération automatique slugs pour produits existants
-- Author: Claude Code + Romeo Dos Santos

-- =====================================================
-- PARTIE 1: Fonction slugify()
-- =====================================================

CREATE OR REPLACE FUNCTION slugify(text_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Trim et lowercase
  result := LOWER(TRIM(text_input));

  -- Remplacer accents (français + européens courants)
  result := TRANSLATE(result,
    'àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ',
    'aaaaaaeceeeeiiiinooooooouuuuyy'
  );

  -- Remplacer caractères spéciaux et espaces par tirets
  result := REGEXP_REPLACE(result, '[^a-z0-9]+', '-', 'g');

  -- Supprimer tirets début/fin
  result := TRIM(BOTH '-' FROM result);

  -- Limiter longueur max 200 caractères
  result := SUBSTRING(result FROM 1 FOR 200);

  RETURN result;
END;
$$;

COMMENT ON FUNCTION slugify IS 'Convertit texte en slug URL-friendly (lowercase, no accents, hyphens)';

-- =====================================================
-- PARTIE 2: Génération Slugs Produits
-- =====================================================

-- Générer slugs pour produits sans slug
-- Format: {slug-from-name}-{8-char-uuid}
UPDATE products
SET
  slug = slugify(name) || '-' || SUBSTRING(id::TEXT FROM 1 FOR 8),
  updated_at = NOW()
WHERE slug IS NULL;

-- =====================================================
-- PARTIE 3: Contrainte Unicité Slug (après génération)
-- =====================================================

-- Ajouter contrainte unique maintenant que tous produits ont slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique
  ON products(slug)
  WHERE slug IS NOT NULL;

-- =====================================================
-- PARTIE 4: Trigger Auto-Génération Slug (futurs produits)
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_generate_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si slug NULL ou vide, générer automatiquement
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    NEW.slug := slugify(NEW.name) || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
  END IF;

  RETURN NEW;
END;
$$;

-- Créer trigger sur INSERT (nouveaux produits)
DROP TRIGGER IF EXISTS trg_generate_product_slug_on_insert ON products;
CREATE TRIGGER trg_generate_product_slug_on_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_product_slug();

COMMENT ON FUNCTION trigger_generate_product_slug IS 'Génère slug automatiquement si NULL lors INSERT produit';

-- =====================================================
-- PARTIE 5: Fonction Helper - Régénérer Slug Produit
-- =====================================================

-- Fonction pour régénérer slug manuellement (si besoin)
CREATE OR REPLACE FUNCTION regenerate_product_slug(product_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_name TEXT;
  new_slug TEXT;
BEGIN
  -- Fetch product name
  SELECT name INTO product_name
  FROM products
  WHERE id = product_id_param;

  IF product_name IS NULL THEN
    RAISE EXCEPTION 'Produit % non trouvé', product_id_param;
  END IF;

  -- Générer nouveau slug
  new_slug := slugify(product_name) || '-' || SUBSTRING(product_id_param::TEXT FROM 1 FOR 8);

  -- UPDATE slug
  UPDATE products
  SET
    slug = new_slug,
    updated_at = NOW()
  WHERE id = product_id_param;

  RETURN new_slug;
END;
$$;

COMMENT ON FUNCTION regenerate_product_slug IS 'Régénère slug pour un produit spécifique (usage admin)';

-- =====================================================
-- PARTIE 6: Vérifications finales
-- =====================================================

DO $$
DECLARE
  v_products_total INTEGER;
  v_products_with_slug INTEGER;
  v_products_without_slug INTEGER;
  v_sample_slugs TEXT[];
BEGIN
  -- Compter produits
  SELECT COUNT(*) INTO v_products_total FROM products;
  SELECT COUNT(*) INTO v_products_with_slug FROM products WHERE slug IS NOT NULL;
  SELECT COUNT(*) INTO v_products_without_slug FROM products WHERE slug IS NULL;

  -- Échantillon 5 slugs générés
  SELECT ARRAY_AGG(slug ORDER BY created_at DESC) INTO v_sample_slugs
  FROM (
    SELECT slug FROM products WHERE slug IS NOT NULL LIMIT 5
  ) sample;

  -- Rapport migration
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration 002 terminée: Génération Slugs';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSUMÉ:';
  RAISE NOTICE '  - Produits total: %', v_products_total;
  RAISE NOTICE '  - Produits avec slug: % (%.2f%%)',
    v_products_with_slug,
    CASE WHEN v_products_total > 0 THEN (v_products_with_slug::FLOAT / v_products_total * 100) ELSE 0 END;
  RAISE NOTICE '  - Produits sans slug: %', v_products_without_slug;
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FONCTIONS CRÉÉES:';
  RAISE NOTICE '  - slugify(text): Convertit texte en slug URL-friendly';
  RAISE NOTICE '  - trigger_generate_product_slug(): Auto-génération slug INSERT';
  RAISE NOTICE '  - regenerate_product_slug(uuid): Régénérer slug manuellement';
  RAISE NOTICE '';
  RAISE NOTICE '📝 ÉCHANTILLON SLUGS GÉNÉRÉS:';
  FOR i IN 1..ARRAY_LENGTH(v_sample_slugs, 1) LOOP
    RAISE NOTICE '  %: %', i, v_sample_slugs[i];
  END LOOP;
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONTRAINTES:';
  RAISE NOTICE '  - Index unique sur slug créé (idx_products_slug_unique)';
  RAISE NOTICE '  - Trigger auto-génération activé (futurs produits)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Migration 003: Fonction RPC get_site_internet_products()';
  RAISE NOTICE '  2. Appliquer migrations: supabase db push';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
