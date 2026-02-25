-- Migration: Renseigner dimensions des 2 produits Pokawa stockés
-- Poubelle: 100cm x 40cm x 100cm (H) = 0.4 m³
-- Meuble TABESTO: 60cm x 40cm x 180cm (H) = 0.432 m³
-- Total: 0.832 m³ → tranche 0-1 m³ → 25 EUR/m³ → ~20.80 EUR/mois

UPDATE products
SET dimensions = jsonb_build_object(
  'length_cm', 100, 'width_cm', 40, 'height_cm', 100,
  'pattern', 'LxPxH', 'source', 'manual_input'
), updated_at = now()
WHERE id = '4779f34a-ee9c-4429-b74a-bb4861fa6eba';

UPDATE products
SET dimensions = jsonb_build_object(
  'length_cm', 60, 'width_cm', 40, 'height_cm', 180,
  'pattern', 'LxPxH', 'source', 'manual_input'
), updated_at = now()
WHERE id = '37f00f14-ce2d-48bf-ba4a-832d37978a74';
