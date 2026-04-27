-- ADR-021 D1 : Unification du modèle ambassadeur sur individual_customers
-- Refacto : drop site_ambassadors, ajouter colonnes ambassador_* sur individual_customers
-- Pré-condition : 0 records dans site_ambassadors / ambassador_codes / ambassador_attributions

BEGIN;

-- ============================================================================
-- 0. Drop des policies existantes (dependent des colonnes ambassador_id)
-- ============================================================================

DROP POLICY IF EXISTS staff_full_access_ambassador_attributions ON ambassador_attributions;
DROP POLICY IF EXISTS ambassador_read_own_attributions ON ambassador_attributions;
DROP POLICY IF EXISTS staff_full_access_ambassador_codes ON ambassador_codes;
DROP POLICY IF EXISTS ambassador_read_own_codes ON ambassador_codes;

-- ============================================================================
-- 1. Ajout des colonnes ambassador_* sur individual_customers
-- ============================================================================

ALTER TABLE individual_customers
  ADD COLUMN IF NOT EXISTS is_ambassador BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ambassador_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ambassador_commission_rate NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS ambassador_discount_rate NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS ambassador_iban TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_bic TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_siret TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_siret_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ambassador_total_sales_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_total_primes_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_total_primes_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_annual_earnings_ytd NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ambassador_cgu_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ambassador_cgu_version TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_notes TEXT,
  ADD COLUMN IF NOT EXISTS ambassador_notify_on_gain BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ambassador_payout_threshold NUMERIC(8,2) NOT NULL DEFAULT 20.00;

COMMENT ON COLUMN individual_customers.is_ambassador IS 'ADR-021 D1: flag ambassadeur (le client peut etre aussi ambassadeur)';
COMMENT ON COLUMN individual_customers.ambassador_payout_threshold IS 'ADR-021 D12: seuil minimum pour demander le paiement des primes (defaut 20 EUR)';
COMMENT ON COLUMN individual_customers.ambassador_notify_on_gain IS 'ADR-021 D6: opt-in email a chaque nouvelle prime attribuee';

CREATE INDEX IF NOT EXISTS idx_individual_customers_is_ambassador
  ON individual_customers(is_ambassador)
  WHERE is_ambassador = true;

-- ============================================================================
-- 2. Adapter ambassador_codes : ambassador_id (FK site_ambassadors) -> customer_id
-- ============================================================================

ALTER TABLE ambassador_codes DROP CONSTRAINT IF EXISTS ambassador_codes_ambassador_id_fkey;
ALTER TABLE ambassador_codes
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES individual_customers(id) ON DELETE CASCADE;
ALTER TABLE ambassador_codes DROP COLUMN IF EXISTS ambassador_id;
ALTER TABLE ambassador_codes ALTER COLUMN customer_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ambassador_codes_customer_id ON ambassador_codes(customer_id);

-- ============================================================================
-- 3. Adapter ambassador_attributions : ambassador_id -> customer_id
-- ============================================================================

ALTER TABLE ambassador_attributions DROP CONSTRAINT IF EXISTS ambassador_attributions_ambassador_id_fkey;
ALTER TABLE ambassador_attributions
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES individual_customers(id) ON DELETE CASCADE;
ALTER TABLE ambassador_attributions DROP COLUMN IF EXISTS ambassador_id;
ALTER TABLE ambassador_attributions ALTER COLUMN customer_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ambassador_attributions_customer_id ON ambassador_attributions(customer_id);

-- ============================================================================
-- 4. Drop site_ambassadors et fonctions associees
-- ============================================================================

DROP TRIGGER IF EXISTS trg_update_ambassador_counters ON ambassador_attributions;
DROP TRIGGER IF EXISTS trg_increment_ambassador_code_usage ON ambassador_attributions;

DROP FUNCTION IF EXISTS update_ambassador_counters_on_attribution() CASCADE;
DROP FUNCTION IF EXISTS increment_ambassador_code_usage() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at_site_ambassadors() CASCADE;

DROP TABLE IF EXISTS site_ambassadors CASCADE;

-- ============================================================================
-- 5. Recreation des fonctions et triggers ciblant individual_customers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_customer_ambassador_counters()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    UPDATE individual_customers
    SET ambassador_total_sales_generated = ambassador_total_sales_generated + NEW.order_total_ht,
        ambassador_total_primes_earned   = ambassador_total_primes_earned + NEW.prime_amount,
        ambassador_current_balance       = ambassador_current_balance + NEW.prime_amount,
        ambassador_annual_earnings_ytd   = ambassador_annual_earnings_ytd + NEW.prime_amount,
        ambassador_siret_required        = (ambassador_annual_earnings_ytd + NEW.prime_amount) >= 305,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'cancelled') THEN
    UPDATE individual_customers
    SET ambassador_total_sales_generated = GREATEST(0, ambassador_total_sales_generated - OLD.order_total_ht),
        ambassador_total_primes_earned   = GREATEST(0, ambassador_total_primes_earned - OLD.prime_amount),
        ambassador_current_balance       = GREATEST(0, ambassador_current_balance - OLD.prime_amount),
        ambassador_annual_earnings_ytd   = GREATEST(0, ambassador_annual_earnings_ytd - OLD.prime_amount),
        updated_at = NOW()
    WHERE id = OLD.customer_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'validated' AND NEW.status = 'paid') THEN
    UPDATE individual_customers
    SET ambassador_total_primes_paid = ambassador_total_primes_paid + OLD.prime_amount,
        ambassador_current_balance   = GREATEST(0, ambassador_current_balance - OLD.prime_amount),
        updated_at = NOW()
    WHERE id = OLD.customer_id;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_update_customer_ambassador_counters
  AFTER INSERT OR UPDATE ON ambassador_attributions
  FOR EACH ROW EXECUTE FUNCTION update_customer_ambassador_counters();

CREATE OR REPLACE FUNCTION increment_ambassador_code_usage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $func$
BEGIN
  IF NEW.code_id IS NOT NULL THEN
    UPDATE ambassador_codes SET usage_count = usage_count + 1 WHERE id = NEW.code_id;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER trg_increment_ambassador_code_usage
  AFTER INSERT ON ambassador_attributions
  FOR EACH ROW EXECUTE FUNCTION increment_ambassador_code_usage();

-- ============================================================================
-- 6. RLS policies adaptees pour pointer sur individual_customers
-- ============================================================================

ALTER TABLE ambassador_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_full_access_ambassador_attributions ON ambassador_attributions
  FOR ALL TO authenticated
  USING (is_backoffice_user()) WITH CHECK (is_backoffice_user());

CREATE POLICY ambassador_read_own_attributions ON ambassador_attributions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM individual_customers ic
    WHERE ic.id = ambassador_attributions.customer_id
      AND ic.auth_user_id = (SELECT auth.uid())
      AND ic.is_ambassador = true
  ));

CREATE POLICY staff_full_access_ambassador_codes ON ambassador_codes
  FOR ALL TO authenticated
  USING (is_backoffice_user()) WITH CHECK (is_backoffice_user());

CREATE POLICY ambassador_read_own_codes ON ambassador_codes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM individual_customers ic
    WHERE ic.id = ambassador_codes.customer_id
      AND ic.auth_user_id = (SELECT auth.uid())
      AND ic.is_ambassador = true
  ));

COMMIT;
