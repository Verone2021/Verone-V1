-- =============================================================================
-- Migration: Create Site Ambassador System
-- Date: 2026-04-12
-- Description:
--   Programme ambassadeurs site-internet (B2C).
--   Personnes physiques avec code promo unique + QR code.
--   Attribution automatique des ventes + calcul prime promotionnelle.
--   Qualification juridique : "prime de parrainage" (art. 92 CGI).
--   Tables: site_ambassadors, ambassador_codes, ambassador_attributions.
-- =============================================================================

-- ==========================================================
-- TABLE 1: site_ambassadors — Personnes physiques ambassadrices
-- ==========================================================

CREATE TABLE site_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identite
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,

  -- Auth (lie a un compte site-internet)
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Coordonnees bancaires (optionnel — requis palier 2 > 305 EUR/an)
  iban TEXT,
  bic TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  siret TEXT,

  -- Configuration
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  discount_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- CGU
  cgu_accepted_at TIMESTAMPTZ,
  cgu_version TEXT,

  -- Compteurs (mis a jour par triggers)
  total_sales_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_primes_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_primes_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Palier annuel
  annual_earnings_ytd NUMERIC(12,2) NOT NULL DEFAULT 0,
  siret_required BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_ambassadors_email ON site_ambassadors(email);
CREATE INDEX idx_site_ambassadors_auth_user ON site_ambassadors(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_site_ambassadors_active ON site_ambassadors(is_active) WHERE is_active = true;

COMMENT ON TABLE site_ambassadors IS 'Ambassadeurs site-internet — personnes physiques avec code promo unique. Prime de parrainage (art. 92 CGI).';


-- ==========================================================
-- TABLE 2: ambassador_codes — Codes promo lies a un ambassadeur
-- ==========================================================

CREATE TABLE ambassador_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES site_ambassadors(id) ON DELETE CASCADE,
  discount_id UUID NOT NULL REFERENCES order_discounts(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ambassador_codes_ambassador ON ambassador_codes(ambassador_id);
CREATE INDEX idx_ambassador_codes_discount ON ambassador_codes(discount_id);
CREATE INDEX idx_ambassador_codes_code ON ambassador_codes(code);

COMMENT ON TABLE ambassador_codes IS 'Codes promo uniques par ambassadeur. Chaque code pointe vers une entree order_discounts.';


-- ==========================================================
-- TABLE 3: ambassador_attributions — Vente attribuee a un ambassadeur
-- ==========================================================

CREATE TABLE ambassador_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  ambassador_id UUID NOT NULL REFERENCES site_ambassadors(id),
  code_id UUID REFERENCES ambassador_codes(id),

  -- Montants figes au moment de la commande
  order_total_ht NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  prime_amount NUMERIC(12,2) NOT NULL,

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'validated', 'cancelled', 'paid')),
  validation_date TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Methode d'attribution
  attribution_method TEXT NOT NULL DEFAULT 'coupon_code'
    CHECK (attribution_method IN ('coupon_code', 'referral_link')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Une commande = une attribution max
  CONSTRAINT ambassador_attributions_unique_order UNIQUE (order_id)
);

CREATE INDEX idx_ambassador_attributions_ambassador ON ambassador_attributions(ambassador_id);
CREATE INDEX idx_ambassador_attributions_status ON ambassador_attributions(status);
CREATE INDEX idx_ambassador_attributions_validation ON ambassador_attributions(validation_date)
  WHERE status = 'pending';

COMMENT ON TABLE ambassador_attributions IS 'Attribution vente → ambassadeur. Prime calculee au moment de la commande, validee apres 30j.';


-- ==========================================================
-- TRIGGERS: updated_at
-- ==========================================================

CREATE OR REPLACE FUNCTION set_updated_at_site_ambassadors()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at_site_ambassadors
  BEFORE UPDATE ON site_ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_site_ambassadors();


-- ==========================================================
-- TRIGGER: Mise a jour compteurs ambassadeur lors d'une attribution
-- ==========================================================

CREATE OR REPLACE FUNCTION update_ambassador_counters_on_attribution()
RETURNS TRIGGER AS $$
BEGIN
  -- Nouvelle attribution (pending)
  IF TG_OP = 'INSERT' THEN
    UPDATE site_ambassadors SET
      total_sales_generated = total_sales_generated + NEW.order_total_ht,
      total_primes_earned = total_primes_earned + NEW.prime_amount,
      current_balance = current_balance + NEW.prime_amount,
      annual_earnings_ytd = annual_earnings_ytd + NEW.prime_amount,
      siret_required = (annual_earnings_ytd + NEW.prime_amount) > 305
    WHERE id = NEW.ambassador_id;
    RETURN NEW;
  END IF;

  -- Changement de statut
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status THEN
    -- Annulation : retirer du solde
    IF NEW.status = 'cancelled' AND OLD.status IN ('pending', 'validated') THEN
      UPDATE site_ambassadors SET
        total_primes_earned = total_primes_earned - OLD.prime_amount,
        current_balance = current_balance - OLD.prime_amount,
        annual_earnings_ytd = GREATEST(0, annual_earnings_ytd - OLD.prime_amount)
      WHERE id = NEW.ambassador_id;
    END IF;

    -- Paiement : deduire du solde
    IF NEW.status = 'paid' AND OLD.status = 'validated' THEN
      UPDATE site_ambassadors SET
        total_primes_paid = total_primes_paid + OLD.prime_amount,
        current_balance = current_balance - OLD.prime_amount
      WHERE id = NEW.ambassador_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ambassador_counters
  AFTER INSERT OR UPDATE ON ambassador_attributions
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassador_counters_on_attribution();


-- ==========================================================
-- TRIGGER: Incrementer usage_count sur ambassador_codes
-- ==========================================================

CREATE OR REPLACE FUNCTION increment_ambassador_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code_id IS NOT NULL THEN
    UPDATE ambassador_codes SET
      usage_count = usage_count + 1
    WHERE id = NEW.code_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_ambassador_code_usage
  AFTER INSERT ON ambassador_attributions
  FOR EACH ROW
  EXECUTE FUNCTION increment_ambassador_code_usage();


-- ==========================================================
-- RLS: site_ambassadors
-- ==========================================================

ALTER TABLE site_ambassadors ENABLE ROW LEVEL SECURITY;

-- Staff back-office acces complet
CREATE POLICY "staff_full_access_site_ambassadors"
  ON site_ambassadors FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Ambassadeur voit son propre profil
CREATE POLICY "ambassador_read_own_profile"
  ON site_ambassadors FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

-- Ambassadeur peut mettre a jour certains champs (CGU, coordonnees bancaires)
CREATE POLICY "ambassador_update_own_profile"
  ON site_ambassadors FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));


-- ==========================================================
-- RLS: ambassador_codes
-- ==========================================================

ALTER TABLE ambassador_codes ENABLE ROW LEVEL SECURITY;

-- Staff back-office acces complet
CREATE POLICY "staff_full_access_ambassador_codes"
  ON ambassador_codes FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Ambassadeur voit ses propres codes
CREATE POLICY "ambassador_read_own_codes"
  ON ambassador_codes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_ambassadors sa
      WHERE sa.id = ambassador_codes.ambassador_id
        AND sa.auth_user_id = (SELECT auth.uid())
    )
  );


-- ==========================================================
-- RLS: ambassador_attributions
-- ==========================================================

ALTER TABLE ambassador_attributions ENABLE ROW LEVEL SECURITY;

-- Staff back-office acces complet
CREATE POLICY "staff_full_access_ambassador_attributions"
  ON ambassador_attributions FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Ambassadeur voit ses propres attributions
CREATE POLICY "ambassador_read_own_attributions"
  ON ambassador_attributions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_ambassadors sa
      WHERE sa.id = ambassador_attributions.ambassador_id
        AND sa.auth_user_id = (SELECT auth.uid())
    )
  );
