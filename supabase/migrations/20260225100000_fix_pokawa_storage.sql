-- Fix Pokawa products: mark as stored by Verone (not by affiliate)
-- These 2 products were created by affiliate but are physically stored at Verone/LinkMe warehouse
-- Context: Pokawa affiliate created products but Verone handles storage

UPDATE products
SET store_at_verone = true,
    updated_at = now()
WHERE id IN (
  '37f00f14-ce2d-48bf-ba4a-832d37978a74',  -- Meuble TABESTO à POKAWA
  '4779f34a-ee9c-4429-b74a-bb4861fa6eba'   -- Poubelle à POKAWA
)
AND created_by_affiliate IS NOT NULL
AND store_at_verone = false;
