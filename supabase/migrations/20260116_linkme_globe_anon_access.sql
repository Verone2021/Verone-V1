-- =============================================
-- Migration: LinkMe Globe Anonymous Access
-- Date: 2026-01-16
-- Description: Autorise l'accès anonyme aux
--              produits visibles sur le globe LinkMe
-- =============================================

-- CONTEXTE:
-- La vue linkme_globe_items retourne 0 résultats même si elle a
-- GRANT SELECT TO anon, car le JOIN sur products est bloqué par RLS.
-- product_images est déjà accessible en lecture anonyme, mais pas products.

-- RLS Policy: Lecture anonyme des produits du globe LinkMe
-- Permet aux visiteurs non connectés de voir les produits sur la page de login
CREATE POLICY "Allow anon read products on LinkMe globe"
ON products
FOR SELECT
TO anon
USING (show_on_linkme_globe = true);

-- Documentation
COMMENT ON POLICY "Allow anon read products on LinkMe globe" ON products IS
  'Autorise l''accès anonyme en lecture aux produits affichés sur le globe 3D de LinkMe (page de login publique)';
