-- Add dedicated individual_customer_id column to sales_orders
-- Fixes polymorphic customer linking: customer_id → organisations, individual_customer_id → individual_customers
-- This enables proper B2C scaling via site-internet

-- 1. Add the column with FK
ALTER TABLE sales_orders
  ADD COLUMN individual_customer_id UUID REFERENCES individual_customers(id) ON DELETE SET NULL;

-- 2. Add index for query performance
CREATE INDEX idx_sales_orders_individual_customer_id ON sales_orders(individual_customer_id);

-- 3. CHECK: individual_customer_id only allowed when customer_type = 'individual'
ALTER TABLE sales_orders
  ADD CONSTRAINT chk_individual_customer_id_type
  CHECK (customer_type = 'individual' OR individual_customer_id IS NULL);

-- 4. Link the 7 legacy individual orders (Bubble import fix)
-- Mapping verified by timestamps (created_at within 3-9 sec of each other)
UPDATE sales_orders SET individual_customer_id = '60101d48-5cb0-43c4-98e4-5df2a805b5b8' WHERE order_number = 'F-25-006';
UPDATE sales_orders SET individual_customer_id = '8fcc0f8a-0815-4242-9c32-088bd935ec3d' WHERE order_number = 'F-25-010';
UPDATE sales_orders SET individual_customer_id = 'a4747094-d2e1-4b48-b2f4-7771f88028de' WHERE order_number = 'F-25-011';
UPDATE sales_orders SET individual_customer_id = '02a0bfc0-69fc-48cb-9439-87e17c20542f' WHERE order_number = 'F-25-013';
UPDATE sales_orders SET individual_customer_id = 'c5f6b909-0669-4774-b865-fc6a76b6edf4' WHERE order_number = 'F-25-018';
UPDATE sales_orders SET individual_customer_id = '6abc20eb-e7d4-4a18-87db-b6970457c5d7' WHERE order_number = 'F-25-021';
UPDATE sales_orders SET individual_customer_id = 'a5ffd15b-63ae-4937-a58c-e0ec6aeae36f' WHERE order_number = 'F-25-023';
