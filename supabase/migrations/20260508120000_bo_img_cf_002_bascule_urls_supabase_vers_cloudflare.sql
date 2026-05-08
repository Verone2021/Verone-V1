-- [BO-IMG-CF-002] Bascule complète des URLs Supabase Storage vers Cloudflare Images
--
-- Contexte :
-- L'audit du 2026-05-08 confirme que les 629 images uniques sont DÉJÀ sur Cloudflare
-- Images (compteur dashboard 629/100k = match parfait avec product_images 460 +
-- organisations 169). Mais les colonnes public_url / logo_url pointent encore
-- vers supabase.co/storage qui répondent 400 depuis la migration Cloudflare.
--
-- Cette migration :
--   1. Sauvegarde les URLs Supabase d'origine dans des colonnes legacy_*
--      (rollback en 1 requête possible pendant 30 jours).
--   2. Bascule les public_url / logo_url vers
--      https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/{cloudflare_image_id}/public
--   3. Tag chaque ligne migrée avec un timestamp pour idempotence.
--
-- Hash Cloudflare Image Delivery : a-LEt3vfWH1BG-ME-lftDA
-- (récupéré via API Cloudflare /accounts/{id}/images/v1, le 2026-05-08 11:48 UTC)
--
-- Tables couvertes : product_images (460), media_assets (460 doublon technique),
-- organisations (169 logos).
--
-- Rollback : voir bloc commenté en fin de fichier.

BEGIN;

-- 0. CORRECTIF TRIGGER product_images_generate_url
-- L'ancienne fonction écrasait public_url avec une URL Supabase Storage à chaque
-- UPDATE, ce qui bloquait toute bascule vers Cloudflare. Nouvelle logique :
-- si cloudflare_image_id présent → URL Cloudflare ; sinon URL Supabase (compat).
CREATE OR REPLACE FUNCTION public.generate_product_image_url()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cloudflare_image_id IS NOT NULL THEN
    NEW.public_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/' || NEW.cloudflare_image_id || '/public';
  ELSE
    NEW.public_url = 'https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/' || NEW.storage_path;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 1. product_images : ajouter colonnes backup
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS legacy_supabase_url text,
  ADD COLUMN IF NOT EXISTS migrated_to_cloudflare_at timestamptz;

-- 2. media_assets : ajouter colonnes backup
ALTER TABLE media_assets
  ADD COLUMN IF NOT EXISTS legacy_supabase_url text,
  ADD COLUMN IF NOT EXISTS migrated_to_cloudflare_at timestamptz;

-- 3. organisations : ajouter colonnes backup
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS legacy_logo_url text,
  ADD COLUMN IF NOT EXISTS logo_migrated_to_cloudflare_at timestamptz;

-- 4. Snapshot des URLs Supabase actuelles (idempotent — ne touche pas si déjà sauvegardé)
UPDATE product_images
SET legacy_supabase_url = public_url
WHERE public_url LIKE '%supabase.co%'
  AND legacy_supabase_url IS NULL;

UPDATE media_assets
SET legacy_supabase_url = public_url
WHERE public_url LIKE '%supabase.co%'
  AND legacy_supabase_url IS NULL;

UPDATE organisations
SET legacy_logo_url = logo_url
WHERE logo_url LIKE '%supabase.co%'
  AND legacy_logo_url IS NULL;

-- 5. Bascule des URLs vers Cloudflare Images (idempotent — ignore les rows déjà migrées)
UPDATE product_images
SET public_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/' || cloudflare_image_id || '/public',
    migrated_to_cloudflare_at = NOW(),
    updated_at = NOW()
WHERE public_url LIKE '%supabase.co%'
  AND cloudflare_image_id IS NOT NULL
  AND migrated_to_cloudflare_at IS NULL;

UPDATE media_assets
SET public_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/' || cloudflare_image_id || '/public',
    migrated_to_cloudflare_at = NOW()
WHERE public_url LIKE '%supabase.co%'
  AND cloudflare_image_id IS NOT NULL
  AND migrated_to_cloudflare_at IS NULL;

UPDATE organisations
SET logo_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/' || cloudflare_image_id || '/public',
    logo_migrated_to_cloudflare_at = NOW(),
    updated_at = NOW()
WHERE logo_url LIKE '%supabase.co%'
  AND cloudflare_image_id IS NOT NULL
  AND logo_migrated_to_cloudflare_at IS NULL;

-- 5b. Tables additionnelles découvertes pendant les tests Playwright :
-- enseignes (2 logos), client_consultations (1 image), linkme_selections
-- (1 image). Schéma backup + bascule.
ALTER TABLE enseignes
  ADD COLUMN IF NOT EXISTS legacy_logo_url text,
  ADD COLUMN IF NOT EXISTS logo_migrated_to_cloudflare_at timestamptz;
ALTER TABLE client_consultations
  ADD COLUMN IF NOT EXISTS legacy_image_url text,
  ADD COLUMN IF NOT EXISTS image_migrated_to_cloudflare_at timestamptz;
ALTER TABLE linkme_selections
  ADD COLUMN IF NOT EXISTS legacy_image_url text,
  ADD COLUMN IF NOT EXISTS image_migrated_to_cloudflare_at timestamptz;

UPDATE enseignes SET legacy_logo_url = logo_url WHERE logo_url LIKE '%supabase.co%' AND legacy_logo_url IS NULL;
UPDATE client_consultations SET legacy_image_url = image_url WHERE image_url LIKE '%supabase.co%' AND legacy_image_url IS NULL;
UPDATE linkme_selections SET legacy_image_url = image_url WHERE image_url LIKE '%supabase.co%' AND legacy_image_url IS NULL;

-- Bascule enseigne Pokawa (image ré-uploadée Cloudflare le 2026-05-08 12:14 UTC)
UPDATE enseignes
SET logo_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/verone/enseignes/pokawa/de1bcbd7-0086-4632-aedb-ece0a5b3d358/public',
    logo_migrated_to_cloudflare_at = COALESCE(logo_migrated_to_cloudflare_at, NOW()),
    updated_at = NOW()
WHERE id = 'de1bcbd7-0086-4632-aedb-ece0a5b3d358'
  AND logo_url LIKE '%supabase.co%';

-- Bascule enseigne Black & White Burger
UPDATE enseignes
SET logo_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/verone/enseignes/black-white-burger/e93689ea-4471-4e43-a9f1-f16cf406a1f1/public',
    logo_migrated_to_cloudflare_at = COALESCE(logo_migrated_to_cloudflare_at, NOW()),
    updated_at = NOW()
WHERE id = 'e93689ea-4471-4e43-a9f1-f16cf406a1f1'
  AND logo_url LIKE '%supabase.co%';

-- Images source Supabase Storage déjà mortes (404) → set NULL pour purger
-- les références cassées plutôt que de garder des URLs invalides en BDD.
UPDATE client_consultations
SET image_url = NULL,
    image_migrated_to_cloudflare_at = COALESCE(image_migrated_to_cloudflare_at, NOW())
WHERE id = 'c9b18dc9-c0d2-4b35-bcd0-956e08a6a93c'
  AND image_url LIKE '%supabase.co%';

UPDATE linkme_selections
SET image_url = NULL,
    image_migrated_to_cloudflare_at = COALESCE(image_migrated_to_cloudflare_at, NOW())
WHERE id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'
  AND image_url LIKE '%supabase.co%';

-- 6. Cas particulier : 1 logo organisation (Pokawa Montélimar 2) sans
-- cloudflare_image_id avant la migration. Image téléchargée depuis Supabase
-- et ré-uploadée vers Cloudflare le 2026-05-08 12:02 UTC avec custom ID
-- "verone/organisations/pokawa-montelimar-2/{org_id}". UPDATE séparé.
UPDATE organisations
SET cloudflare_image_id = 'verone/organisations/pokawa-montelimar-2/8ef19987-0fde-4c98-aa78-c9c8e83a4ea0',
    legacy_logo_url = COALESCE(legacy_logo_url, logo_url),
    logo_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/verone/organisations/pokawa-montelimar-2/8ef19987-0fde-4c98-aa78-c9c8e83a4ea0/public',
    logo_migrated_to_cloudflare_at = COALESCE(logo_migrated_to_cloudflare_at, NOW()),
    updated_at = NOW()
WHERE id = '8ef19987-0fde-4c98-aa78-c9c8e83a4ea0'
  AND cloudflare_image_id IS NULL;

COMMIT;

-- =============================================================================
-- ROLLBACK D'URGENCE (à exécuter manuellement si problème en production)
-- =============================================================================
-- BEGIN;
-- UPDATE product_images
-- SET public_url = legacy_supabase_url,
--     migrated_to_cloudflare_at = NULL
-- WHERE legacy_supabase_url IS NOT NULL
--   AND public_url LIKE '%imagedelivery.net%';
--
-- UPDATE media_assets
-- SET public_url = legacy_supabase_url,
--     migrated_to_cloudflare_at = NULL
-- WHERE legacy_supabase_url IS NOT NULL
--   AND public_url LIKE '%imagedelivery.net%';
--
-- UPDATE organisations
-- SET logo_url = legacy_logo_url,
--     logo_migrated_to_cloudflare_at = NULL
-- WHERE legacy_logo_url IS NOT NULL
--   AND logo_url LIKE '%imagedelivery.net%';
-- COMMIT;
