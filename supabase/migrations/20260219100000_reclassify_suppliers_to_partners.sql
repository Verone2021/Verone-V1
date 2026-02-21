-- =====================================================================
-- Migration: Reclassify service providers from supplier to partner
-- Date: 2026-02-19
-- Description:
--   1. Fill trade_name = legal_name for 34 orgs missing trade_name
--   2. Reclassify 24 service providers (AXA, Google, etc.) as 'partner'
--      while keeping 11 real product suppliers as 'supplier'
-- =====================================================================

-- Step 1: Copy legal_name -> trade_name where missing
UPDATE organisations
SET trade_name = legal_name, updated_at = now()
WHERE type = 'supplier' AND trade_name IS NULL;

-- Step 2: Reclassify service providers to 'partner'
-- Keep these 11 as 'supplier' (real product suppliers):
--   AFFECT BUILDING CONSULTING, AMERICO MARTINS TAVARES,
--   CAO COUNTY HUIY ARTS, DSA Menuiserie, Lecomptoir,
--   Linhai Newlanston, Madeiragueda, MAISONS NOMADE,
--   Opjet, Yunnan Yeqiu, zentrada Europe
UPDATE organisations
SET type = 'partner', updated_at = now()
WHERE type = 'supplier'
  AND id NOT IN (
    'f095114e-254b-4230-9a4e-ff266e97e415',
    'bd4d5191-4799-4e82-9820-dc95da3d5925',
    '741fa95a-be4f-4591-bf4d-239edb0ceb05',
    'd69b2362-d6ae-4705-9dd8-713df006bc38',
    'f576275a-26bd-4be2-a8d3-ae4b77b59f60',
    '988ba9d8-1007-45b3-a311-0c88e75c5915',
    'e3fbda9e-175c-4710-bf50-55a31aa84616',
    'b5579148-ae67-4390-87ed-b68c1de43e90',
    '9078f112-6944-4732-b926-f64dcef66034',
    'a85ca0c5-9c9a-4f36-b14b-05792140a2d9',
    '16ccbe2e-85e4-41ad-8d46-70520afc0fa1'
  );
