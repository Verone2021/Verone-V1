-- Migration: Add critical e-commerce fields to site_orders
-- Fixes: billing address, promo code tracking, TVA/tax, invoice number, order number

-- 1. Human-readable order number (e.g., VER-202603-00001)
CREATE SEQUENCE IF NOT EXISTS site_order_number_seq;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_site_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'VER-' || to_char(NOW(), 'YYYYMM') || '-' || LPAD(nextval('site_order_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_site_order_number ON site_orders;
CREATE TRIGGER trg_generate_site_order_number
  BEFORE INSERT ON site_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_site_order_number();

-- 2. Billing address (separate from shipping)
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- 3. Discount/promo code tracking
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- 4. TVA / Tax fields
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 20.00;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS total_ht NUMERIC(10,2);
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0;

-- Auto-compute HT and tax from TTC total when total changes
CREATE OR REPLACE FUNCTION compute_site_order_tax()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tax_rate IS NOT NULL AND NEW.tax_rate > 0 AND NEW.total > 0 THEN
    NEW.total_ht := ROUND(NEW.total / (1 + NEW.tax_rate / 100), 2);
    NEW.tax_amount := NEW.total - NEW.total_ht;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_site_order_tax ON site_orders;
CREATE TRIGGER trg_compute_site_order_tax
  BEFORE INSERT OR UPDATE OF total, tax_rate ON site_orders
  FOR EACH ROW
  EXECUTE FUNCTION compute_site_order_tax();

-- 5. Invoice number (auto-generated when status becomes 'paid')
CREATE SEQUENCE IF NOT EXISTS site_invoice_number_seq;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS invoice_date TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION generate_site_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'paid') AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'FAC-' || to_char(NOW(), 'YYYYMM') || '-' || LPAD(nextval('site_invoice_number_seq')::text, 5, '0');
    NEW.invoice_date := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_site_invoice_number ON site_orders;
CREATE TRIGGER trg_generate_site_invoice_number
  BEFORE INSERT OR UPDATE OF status ON site_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_site_invoice_number();

-- 6. Extra useful fields
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE site_orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Backfill existing orders: compute HT/tax for existing paid orders
UPDATE site_orders
SET total_ht = ROUND(total / 1.20, 2),
    tax_amount = total - ROUND(total / 1.20, 2),
    tax_rate = 20.00
WHERE total > 0 AND total_ht IS NULL;
