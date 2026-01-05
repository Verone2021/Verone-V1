-- ============================================================================
-- Migration: Add Pokawa selection products to LinkMe channel_pricing
-- ============================================================================
-- Adds products from the Pokawa affiliate selection to the LinkMe catalog
-- via channel_pricing (the correct multi-channel table)
--
-- Context:
-- - channel_pricing is the source of truth for LinkMe catalog (since 2025-12-02)
-- - linkme_catalog_products is OBSOLETE
-- - Pokawa selection has 31 products that should appear in the catalog
-- ============================================================================

-- LinkMe Channel ID: 93c68db1-5a30-4168-89ec-6383152be405
-- Pokawa Selection ID: b97bbc0e-1a5e-4bce-b628-b3461bfadbd7

INSERT INTO channel_pricing (
    product_id,
    channel_id,
    is_active,
    is_public_showcase,
    created_at
)
SELECT
    lsi.product_id,
    '93c68db1-5a30-4168-89ec-6383152be405'::uuid,  -- LinkMe channel ID
    true,   -- is_active
    true,   -- is_public_showcase
    NOW()
FROM linkme_selection_items lsi
WHERE lsi.selection_id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'  -- Pokawa selection
  AND lsi.product_id NOT IN (
      SELECT product_id
      FROM channel_pricing
      WHERE channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  )
ON CONFLICT (product_id, channel_id) DO NOTHING;

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================
