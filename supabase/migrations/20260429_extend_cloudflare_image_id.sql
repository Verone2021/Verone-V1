-- Migration: Extend cloudflare_image_id to remaining image tables
-- Phase: INFRA-IMG-003
-- Date: 2026-04-29
--
-- Initial migration (20260421) added cloudflare_image_id to:
--   product_images, categories, collections, organisations, families
--
-- This migration extends to image tables not covered initially:
--   consultation_images, collection_images, sourcing_photos

ALTER TABLE consultation_images ADD COLUMN IF NOT EXISTS cloudflare_image_id text;
ALTER TABLE collection_images   ADD COLUMN IF NOT EXISTS cloudflare_image_id text;
ALTER TABLE sourcing_photos     ADD COLUMN IF NOT EXISTS cloudflare_image_id text;

CREATE INDEX IF NOT EXISTS idx_consultation_images_cf_id
  ON consultation_images(cloudflare_image_id) WHERE cloudflare_image_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collection_images_cf_id
  ON collection_images(cloudflare_image_id) WHERE cloudflare_image_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sourcing_photos_cf_id
  ON sourcing_photos(cloudflare_image_id) WHERE cloudflare_image_id IS NOT NULL;
