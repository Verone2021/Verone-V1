-- Fix: Séparateur de terrasse Pokawa doit avoir 0% commission (pas 15%)
-- La migration 20251223_302 avait hardcodé 15% pour tous les produits Pokawa
UPDATE products
SET affiliate_commission_rate = 0
WHERE name ILIKE '%s_parateur de terrasse%'
  AND affiliate_commission_rate = 15
  AND created_by_affiliate IS NOT NULL;
