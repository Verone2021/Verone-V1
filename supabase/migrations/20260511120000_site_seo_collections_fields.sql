-- Migration: SITE-SEO-001 — Ajout champs SEO sur collections
-- Auteur: dev-agent (2026-05-11)
-- Raison: editorial_text pour texte SEO visible page collection, image_alt pour accessibilité

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS editorial_text text,
  ADD COLUMN IF NOT EXISTS image_alt text;

COMMENT ON COLUMN collections.editorial_text IS 'Texte éditorial 100-200 mots visible sur la page collection — optimisé SEO';
COMMENT ON COLUMN collections.image_alt IS 'Texte alternatif image collection pour accessibilité et SEO';
