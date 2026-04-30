-- Migration: Add cloudflare_image_id column to image tables
-- Phase: INFRA-IMG-001 — Cloudflare Images integration
-- Author: dev-agent
-- Date: 2026-04-21
--
-- IMPORTANT: Cette migration ajoute les colonnes en parallèle de Supabase Storage.
-- Les colonnes sont nullables : backward compatible, aucune donnée migrée ici.
-- La migration des données existantes se fait via scripts/migrate-images-to-cloudflare.ts

-- product_images: table principale images produits
ALTER TABLE product_images
  ADD COLUMN cloudflare_image_id text;

-- categories: image de catégorie (colonne image_url existante)
ALTER TABLE categories
  ADD COLUMN cloudflare_image_id text;

-- collections: image de collection
ALTER TABLE collections
  ADD COLUMN cloudflare_image_id text;

-- organisations: logo organisation
ALTER TABLE organisations
  ADD COLUMN cloudflare_image_id text;

-- families: image de famille (colonne image_url existante confirmée)
ALTER TABLE families
  ADD COLUMN cloudflare_image_id text;

-- Index pour les lookups par cloudflare_image_id (soft delete, migration, cleanup)
CREATE INDEX IF NOT EXISTS idx_product_images_cf_id
  ON product_images(cloudflare_image_id)
  WHERE cloudflare_image_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_cf_id
  ON categories(cloudflare_image_id)
  WHERE cloudflare_image_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collections_cf_id
  ON collections(cloudflare_image_id)
  WHERE cloudflare_image_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organisations_cf_id
  ON organisations(cloudflare_image_id)
  WHERE cloudflare_image_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_families_cf_id
  ON families(cloudflare_image_id)
  WHERE cloudflare_image_id IS NOT NULL;
