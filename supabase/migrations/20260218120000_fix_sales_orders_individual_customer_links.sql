-- Migration: Fix sales_orders customer_id to support polymorphic references
-- Problem: customer_id has FK to organisations only, but customer_type='individual'
-- orders need to reference individual_customers table
-- Solution: Drop the restrictive FK and link 7 individual orders to their customers

-- Step 1: Drop the FK constraint that only allows organisations references
ALTER TABLE sales_orders DROP CONSTRAINT IF EXISTS sales_orders_customer_id_fkey;

-- Step 2: Link individual orders to their correct individual_customers
-- Mapping verified from original invoice PDFs in docs/Vente-2025/

-- F-25-006 → Cecile Terrana
UPDATE sales_orders
SET customer_id = '60101d48-5cb0-43c4-98e4-5df2a805b5b8'
WHERE id = 'f4c4a9aa-4071-4b3d-967b-413d68fcb1cc' AND customer_type = 'individual';

-- F-25-010 → Samuel Cerqueus
UPDATE sales_orders
SET customer_id = '8fcc0f8a-0815-4242-9c32-088bd935ec3d'
WHERE id = '59bdfb15-592c-4b45-98ec-97c2dbfe068c' AND customer_type = 'individual';

-- F-25-011 → Philippe Chretien
UPDATE sales_orders
SET customer_id = 'a4747094-d2e1-4b48-b2f4-7771f88028de'
WHERE id = 'bdba28b4-3cf6-465c-b4f7-5192eff54843' AND customer_type = 'individual';

-- F-25-013 → Karine Lefeuvre
UPDATE sales_orders
SET customer_id = '02a0bfc0-69fc-48cb-9439-87e17c20542f'
WHERE id = 'e6f0c859-a44b-4654-80fe-429718ef4737' AND customer_type = 'individual';

-- F-25-018 → Tristan Prudont
UPDATE sales_orders
SET customer_id = 'c5f6b909-0669-4774-b865-fc6a76b6edf4'
WHERE id = '25d4de04-a17e-4f2d-9906-0e688173e5a6' AND customer_type = 'individual';

-- F-25-021 → Marius Doicov
UPDATE sales_orders
SET customer_id = '6abc20eb-e7d4-4a18-87db-b6970457c5d7'
WHERE id = 'b1b1e29c-a1a3-4279-bd9e-79f05f8d2849' AND customer_type = 'individual';

-- F-25-023 → Sylvie Leduc
UPDATE sales_orders
SET customer_id = 'a5ffd15b-63ae-4937-a58c-e0ec6aeae36f'
WHERE id = 'da5b8c01-b4c9-43ec-ad20-99f5ff11025c' AND customer_type = 'individual';
