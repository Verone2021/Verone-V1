-- ============================================================================
-- Migration: Update Pokawa selection prices + LinkMe catalogue prices
-- Date: 2026-03-11
-- Description:
--   1. Make sync trigger conditional (propagate_to_selections flag)
--   2. Update channel_pricing (catalogue LinkMe) for 39 products
--   3. Update linkme_selection_items (selection Pokawa) for 11 products
--   4. No promotions on any item
-- ============================================================================

-- ============================================================================
-- STEP 1: Make trigger conditional
-- ============================================================================

-- 1a. Add flag column to channel_pricing
ALTER TABLE channel_pricing
ADD COLUMN IF NOT EXISTS propagate_to_selections BOOLEAN DEFAULT false;

-- 1b. Replace trigger function with conditional logic
CREATE OR REPLACE FUNCTION sync_channel_pricing_to_selections()
RETURNS TRIGGER AS $$
BEGIN
  -- Only propagate when explicitly requested
  IF NEW.propagate_to_selections = true AND NEW.public_price_ht IS NOT NULL THEN
    UPDATE linkme_selection_items
    SET base_price_ht = NEW.public_price_ht,
        updated_at = NOW()
    WHERE product_id = NEW.product_id;

    -- Reset flag after propagation
    NEW.propagate_to_selections := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1c. Recreate trigger as BEFORE UPDATE (needed to modify NEW)
DROP TRIGGER IF EXISTS trg_sync_channel_pricing_to_selections ON channel_pricing;

CREATE TRIGGER trg_sync_channel_pricing_to_selections
  BEFORE UPDATE OF public_price_ht, propagate_to_selections ON channel_pricing
  FOR EACH ROW
  EXECUTE FUNCTION sync_channel_pricing_to_selections();

COMMENT ON FUNCTION sync_channel_pricing_to_selections() IS
'Trigger: Conditionally syncs public_price_ht from channel_pricing to base_price_ht
in linkme_selection_items. Only fires when propagate_to_selections = true.';

-- ============================================================================
-- STEP 2: Update channel_pricing (LinkMe catalogue) for 39 products
-- ============================================================================
-- Formula: max_margin_rate = ((public * 0.95 - custom) / custom) * 100
-- suggested_margin_rate = max_margin_rate / 3
-- commission_rate = 0.00, buffer = 5%

UPDATE channel_pricing SET
  custom_price_ht = v.custom_price,
  public_price_ht = v.public_price,
  min_margin_rate = 0.00,
  max_margin_rate = ROUND(((v.public_price * 0.95 - v.custom_price) / v.custom_price) * 100, 2),
  suggested_margin_rate = ROUND(((v.public_price * 0.95 - v.custom_price) / v.custom_price) * 100 / 3, 2),
  updated_at = NOW()
FROM (VALUES
  ('a3186d52-02e2-4492-b658-30a3609eb436'::uuid, 121.66, 182.49),  -- Banc artisanal bois - 100 cm
  ('27ab1208-61b0-493f-8970-b75e7726eca9'::uuid, 111.60, 167.40),  -- Banc artisanal bois - 120 cm
  ('06ee7806-50ff-43cb-aaf6-96075113aee2'::uuid, 264.14, 396.21),  -- Ciel de bar
  ('1c6d9d7a-b2ba-4ac5-8c1d-1599014d417c'::uuid, 51.99, 77.99),   -- Coussin beige
  ('48ccd5af-1c09-42ea-8328-2ab9660b45f7'::uuid, 55.50, 83.25),   -- Coussin Blanc
  ('84c42874-41c8-42b1-ab63-c17df136a780'::uuid, 47.70, 71.55),   -- Coussin Bleu
  ('40710cab-0da6-49f9-9038-8f5ed017d1c6'::uuid, 21.40, 32.10),   -- Coussin Evasion Bleu
  ('a7fee6f9-2a11-4dbd-9167-c192c3f85c10'::uuid, 25.99, 38.99),   -- Coussin Reveur
  ('9fe6988a-1966-4c10-97e1-86bd1fbc033d'::uuid, 20.90, 31.35),   -- Coussin Rose Serenite
  ('c81b12b8-e638-4b45-9482-24d96752d136'::uuid, 267.22, 400.83), -- Lots 4 miroirs
  ('255b1f37-36fe-49da-a889-87e0db32b647'::uuid, 108.16, 162.24), -- Miroir XL
  ('2117fbee-da9a-4b4e-a010-fc9dab930762'::uuid, 10.50, 15.75),   -- Organiseur bambou GM
  ('d501cfdc-5003-43d1-bedc-908f1a395c68'::uuid, 6.25, 9.38),     -- Organiseur bambou PM
  ('852c9da8-5149-42a1-9182-5a39f7ceddd5'::uuid, 29.13, 43.70),   -- Panier L
  ('d8b26a58-2d2e-440a-b7ca-7ed10ba2ae5f'::uuid, 19.13, 28.70),   -- Panier M
  ('9fe066e5-686c-4aa1-9e52-4b71abebcc01'::uuid, 15.28, 22.92),   -- Panier S
  ('e8d982ab-4b66-45c7-bc16-27943f785aec'::uuid, 18.50, 27.75),   -- Plateau bois 20x30
  ('fbe3daca-94d7-4cdb-908b-e8c4b8e26666'::uuid, 13.50, 20.25),   -- Plateau bois 30x40
  ('20ce5eb2-a393-43e4-b053-e9c716c3375c'::uuid, 36.00, 54.00),   -- Rond paille L
  ('46603979-dd67-4fab-b64c-5db6c53e5e55'::uuid, 32.40, 48.60),   -- Rond paille M
  ('9eb44f73-457a-467d-a671-9df87806e0b7'::uuid, 24.00, 36.00),   -- Rond paille S
  ('6a1289df-f0e0-4a33-9a1e-f877df17a6a2'::uuid, 399.50, 599.25), -- Separateur Terrasse
  ('5705c048-b53a-41b2-965f-5f308432d7f4'::uuid, 15.48, 23.22),   -- Soliflore GM
  ('36b8aafe-1d36-4005-a9fb-ae7c1a98f8d6'::uuid, 7.83, 11.75),    -- Soliflore PM
  ('6053ef28-d345-46f4-a9d4-42759cbcc027'::uuid, 55.32, 82.98),   -- Suspension frange 3
  ('09a42e59-05c2-40cf-ba5b-d3c92a6fea7f'::uuid, 69.60, 104.40),  -- Suspension frange 4
  ('899a4d34-164e-4692-bd66-3b7a00b419b2'::uuid, 98.18, 147.27),  -- Suspension frange 5
  ('ec12e634-dac1-41b5-b03e-6e1906965d02'::uuid, 56.64, 84.96),   -- Suspension paille
  ('d2e8b1d8-18b8-4438-ad00-d7c78f840a15'::uuid, 113.24, 169.86), -- Suspension raphia 3
  ('e7c8c7bb-cfbe-45ec-8617-5d8ca892d9b7'::uuid, 125.98, 188.97), -- Suspension raphia 5
  ('eb973cb0-ca32-4efc-99c9-82bd379b87e2'::uuid, 125.98, 188.97), -- Suspension raphia 6
  ('6e2f9ec6-e191-401d-8ab9-cb26604a8175'::uuid, 66.24, 99.36),   -- Suspensions frange 2
  ('14960d7e-3f93-4d1a-a0da-7af355407639'::uuid, 55.32, 82.98),   -- Suspensions franges 1
  ('5c002082-6aaf-4456-b688-05df4777e33b'::uuid, 6.84, 10.26),    -- Vase Anse terracotta
  ('8c3525d9-103b-4459-9923-630e7acc902a'::uuid, 18.18, 27.27),   -- Vase boule terracotta
  ('133258b2-68eb-47b0-bf82-d8c9e925b985'::uuid, 11.33, 17.00),   -- Vase Double blanc
  ('6edeae4a-c11b-45f6-939b-98eaa976491a'::uuid, 20.35, 30.53),   -- Vase Titi bleu
  ('f8e06adc-f8b6-4dad-84b1-9490bbbd0b15'::uuid, 13.50, 20.25),   -- Vase Tamegroute
  ('f3943bc8-18ab-4ea1-b979-8f7f7a0f0bd3'::uuid, 12.69, 19.04)    -- Vase terracota Pluriel
) AS v(product_id, custom_price, public_price)
WHERE channel_pricing.product_id = v.product_id;

-- ============================================================================
-- STEP 3: Update linkme_selection_items (Pokawa selection) - 11 products only
-- ============================================================================
-- selling_price_ht is GENERATED ALWAYS AS STORED, auto-calculated from base_price_ht and margin_rate
-- Only updating products where base_price_ht differs from target

UPDATE linkme_selection_items SET
  base_price_ht = v.base_price,
  margin_rate = v.margin,
  updated_at = NOW()
FROM (VALUES
  ('48ccd5af-1c09-42ea-8328-2ab9660b45f7'::uuid, 55.50, 15.00),   -- Coussin Blanc (55.00 -> 55.50)
  ('c81b12b8-e638-4b45-9482-24d96752d136'::uuid, 267.22, 15.00),  -- Lots 4 miroirs (320.10 -> 267.22)
  ('255b1f37-36fe-49da-a889-87e0db32b647'::uuid, 108.16, 15.00),  -- Miroir XL (130.75 -> 108.16)
  ('20ce5eb2-a393-43e4-b053-e9c716c3375c'::uuid, 36.00, 15.00),   -- Rond paille L (44.85 -> 36.00)
  ('46603979-dd67-4fab-b64c-5db6c53e5e55'::uuid, 32.40, 15.00),   -- Rond paille M (40.56 -> 32.40)
  ('9eb44f73-457a-467d-a671-9df87806e0b7'::uuid, 24.00, 15.00),   -- Rond paille S (30.56 -> 24.00)
  ('ec12e634-dac1-41b5-b03e-6e1906965d02'::uuid, 56.64, 15.00),   -- Suspension paille (83.89 -> 56.64)
  ('d2e8b1d8-18b8-4438-ad00-d7c78f840a15'::uuid, 113.24, 15.00),  -- Suspension raphia 3 (148.70 -> 113.24)
  ('e7c8c7bb-cfbe-45ec-8617-5d8ca892d9b7'::uuid, 125.98, 15.00),  -- Suspension raphia 5 (163.86 -> 125.98)
  ('eb973cb0-ca32-4efc-99c9-82bd379b87e2'::uuid, 125.98, 15.00),  -- Suspension raphia 6 (163.86 -> 125.98)
  ('6e2f9ec6-e191-401d-8ab9-cb26604a8175'::uuid, 66.24, 15.00)    -- Suspensions frange 2 (112.46 -> 66.24)
) AS v(product_id, base_price, margin)
WHERE linkme_selection_items.product_id = v.product_id
  AND linkme_selection_items.selection_id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
