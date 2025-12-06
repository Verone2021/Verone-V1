-- ============================================================================
-- Migration: Ajouter les produits sur mesure au channel_pricing LinkMe
-- Date: 2025-12-06
-- Description:
--   1. Insère les produits sur mesure existants (enseigne_id/assigned_client_id)
--      dans channel_pricing pour le canal LinkMe
--   2. Crée un trigger pour auto-ajouter les futurs produits sur mesure
-- ============================================================================

-- ID du canal LinkMe
-- (même ID que dans le code: LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405')

-- ============================================================================
-- ÉTAPE 1 : Insérer les produits sur mesure existants
-- ============================================================================

INSERT INTO channel_pricing (
  id,
  channel_id,
  product_id,
  is_active,
  is_featured,
  is_public_showcase,
  display_order,
  min_margin_rate,
  max_margin_rate,
  suggested_margin_rate,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '93c68db1-5a30-4168-89ec-6383152be405', -- LINKME_CHANNEL_ID
  p.id,
  true,   -- is_active: visible dans le catalogue
  false,  -- is_featured: pas vedette par défaut
  false,  -- is_public_showcase: pas en vitrine publique par défaut
  0,      -- display_order: ordre par défaut
  0.00,   -- min_margin_rate: 0%
  20.00,  -- max_margin_rate: 20%
  10.00,  -- suggested_margin_rate: 10%
  NOW(),
  NOW()
FROM products p
WHERE (p.enseigne_id IS NOT NULL OR p.assigned_client_id IS NOT NULL)
  AND p.archived_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM channel_pricing cp
    WHERE cp.product_id = p.id
    AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  );

-- ============================================================================
-- ÉTAPE 2 : Trigger pour auto-création future
-- ============================================================================

-- Fonction trigger : auto-ajouter produits sur mesure au canal LinkMe
CREATE OR REPLACE FUNCTION auto_add_sourcing_product_to_linkme()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le produit a enseigne_id ou assigned_client_id, l'ajouter au canal LinkMe
  IF NEW.enseigne_id IS NOT NULL OR NEW.assigned_client_id IS NOT NULL THEN
    INSERT INTO channel_pricing (
      id,
      channel_id,
      product_id,
      is_active,
      is_featured,
      is_public_showcase,
      display_order,
      min_margin_rate,
      max_margin_rate,
      suggested_margin_rate,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '93c68db1-5a30-4168-89ec-6383152be405', -- LINKME_CHANNEL_ID
      NEW.id,
      true,   -- is_active
      false,  -- is_featured
      false,  -- is_public_showcase
      0,      -- display_order
      0.00,   -- min_margin_rate
      20.00,  -- max_margin_rate
      10.00,  -- suggested_margin_rate
      NOW(),
      NOW()
    )
    ON CONFLICT (channel_id, product_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà (pour idempotence)
DROP TRIGGER IF EXISTS trigger_auto_add_sourcing_to_linkme ON products;

-- Créer le trigger
CREATE TRIGGER trigger_auto_add_sourcing_to_linkme
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION auto_add_sourcing_product_to_linkme();

-- Commentaire
COMMENT ON FUNCTION auto_add_sourcing_product_to_linkme() IS
'Auto-ajoute les produits sur mesure (enseigne_id/assigned_client_id) au canal LinkMe.
Créé: 2025-12-06 pour automatiser la publication des produits sourcés.';

COMMENT ON TRIGGER trigger_auto_add_sourcing_to_linkme ON products IS
'Trigger AFTER INSERT: ajoute automatiquement les produits sur mesure à channel_pricing pour LinkMe.';
