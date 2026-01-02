-- =====================================================================
-- Migration: Auto-matching par IBAN
-- Date: 2026-01-02
-- Description: Lie automatiquement les transactions aux organisations
--              basé sur l'IBAN de la contrepartie (100% fiable)
-- =====================================================================

-- 1. Table pour stocker les IBANs liés aux organisations
CREATE TABLE IF NOT EXISTS counterparty_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  iban TEXT NOT NULL,
  bic TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Un IBAN ne peut appartenir qu'à une seule organisation
  CONSTRAINT unique_iban UNIQUE (iban)
);

-- Index pour recherche rapide par IBAN
CREATE INDEX IF NOT EXISTS idx_counterparty_bank_accounts_iban
ON counterparty_bank_accounts(iban);

-- Index pour recherche par organisation
CREATE INDEX IF NOT EXISTS idx_counterparty_bank_accounts_org
ON counterparty_bank_accounts(organisation_id);

-- RLS policies
ALTER TABLE counterparty_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bank accounts"
ON counterparty_bank_accounts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert bank accounts"
ON counterparty_bank_accounts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update bank accounts"
ON counterparty_bank_accounts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bank accounts"
ON counterparty_bank_accounts
FOR DELETE
TO authenticated
USING (true);

-- 2. Modifier la fonction auto_classify pour matcher par IBAN d'abord
CREATE OR REPLACE FUNCTION auto_classify_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
  v_org_id UUID;
BEGIN
  -- 1. PRIORITÉ MAXIMALE: Matching par IBAN (100% fiable)
  IF NEW.counterparty_iban IS NOT NULL AND NEW.counterparty_iban != '' THEN
    SELECT organisation_id INTO v_org_id
    FROM counterparty_bank_accounts
    WHERE iban = NEW.counterparty_iban
    LIMIT 1;

    IF v_org_id IS NOT NULL THEN
      NEW.counterparty_organisation_id := v_org_id;
      NEW.matching_status := 'auto_matched_iban';
      -- Continue pour appliquer une éventuelle règle avec catégorie
    END IF;
  END IF;

  -- 2. Matching par règles (label_contains, label_exact, label_regex)
  IF NEW.side = 'debit' AND (NEW.matching_status IS NULL OR NEW.matching_status = 'unmatched' OR NEW.matching_status = 'auto_matched_iban') THEN
    FOR v_rule IN
      SELECT id, match_type, match_value, default_category, organisation_id, default_vat_rate
      FROM matching_rules
      WHERE is_active = true AND enabled = true
      ORDER BY priority ASC
    LOOP
      -- Match by label_contains
      IF v_rule.match_type = 'label_contains' AND NEW.label ILIKE '%' || v_rule.match_value || '%' THEN
        NEW.category_pcg := v_rule.default_category;
        -- N'écraser l'organisation que si pas déjà définie par IBAN
        IF NEW.counterparty_organisation_id IS NULL THEN
          NEW.counterparty_organisation_id := v_rule.organisation_id;
        END IF;
        NEW.applied_rule_id := v_rule.id;
        IF NEW.matching_status != 'auto_matched_iban' THEN
          NEW.matching_status := 'auto_matched';
        END IF;
        RETURN NEW;
      END IF;

      -- Match by label_exact
      IF v_rule.match_type = 'label_exact' AND LOWER(NEW.label) = LOWER(v_rule.match_value) THEN
        NEW.category_pcg := v_rule.default_category;
        IF NEW.counterparty_organisation_id IS NULL THEN
          NEW.counterparty_organisation_id := v_rule.organisation_id;
        END IF;
        NEW.applied_rule_id := v_rule.id;
        IF NEW.matching_status != 'auto_matched_iban' THEN
          NEW.matching_status := 'auto_matched';
        END IF;
        RETURN NEW;
      END IF;

      -- Match by regex
      IF v_rule.match_type = 'label_regex' AND NEW.label ~* v_rule.match_value THEN
        NEW.category_pcg := v_rule.default_category;
        IF NEW.counterparty_organisation_id IS NULL THEN
          NEW.counterparty_organisation_id := v_rule.organisation_id;
        END IF;
        NEW.applied_rule_id := v_rule.id;
        IF NEW.matching_status != 'auto_matched_iban' THEN
          NEW.matching_status := 'auto_matched';
        END IF;
        RETURN NEW;
      END IF;
    END LOOP;

    -- Si toujours pas de match
    IF NEW.matching_status IS NULL THEN
      NEW.matching_status := 'unmatched';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction pour peupler les IBANs depuis l'historique des transactions
-- Analyse les transactions existantes pour détecter les associations IBAN -> Organisation
CREATE OR REPLACE FUNCTION populate_counterparty_ibans_from_history()
RETURNS TABLE (
  iban TEXT,
  organisation_id UUID,
  organisation_name TEXT,
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bt.counterparty_iban::TEXT,
    bt.counterparty_organisation_id,
    o.legal_name::TEXT,
    COUNT(*)::BIGINT as tx_count
  FROM bank_transactions bt
  JOIN organisations o ON o.id = bt.counterparty_organisation_id
  WHERE bt.counterparty_iban IS NOT NULL
    AND bt.counterparty_iban != ''
    AND bt.counterparty_organisation_id IS NOT NULL
    -- Exclure les IBANs déjà enregistrés
    AND NOT EXISTS (
      SELECT 1 FROM counterparty_bank_accounts cba
      WHERE cba.iban = bt.counterparty_iban
    )
  GROUP BY bt.counterparty_iban, bt.counterparty_organisation_id, o.legal_name
  -- Prendre seulement les associations avec au moins 2 transactions (fiabilité)
  HAVING COUNT(*) >= 2
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Fonction pour insérer les IBANs détectés
CREATE OR REPLACE FUNCTION auto_register_counterparty_ibans()
RETURNS TABLE (
  inserted_count INT,
  ibans TEXT[]
) AS $$
DECLARE
  v_inserted INT := 0;
  v_ibans TEXT[] := ARRAY[]::TEXT[];
  v_rec RECORD;
BEGIN
  FOR v_rec IN SELECT * FROM populate_counterparty_ibans_from_history() LOOP
    INSERT INTO counterparty_bank_accounts (organisation_id, iban, account_holder_name)
    VALUES (v_rec.organisation_id, v_rec.iban, v_rec.organisation_name)
    ON CONFLICT (iban) DO NOTHING;

    IF FOUND THEN
      v_inserted := v_inserted + 1;
      v_ibans := v_ibans || v_rec.iban;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_inserted, v_ibans;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON counterparty_bank_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION populate_counterparty_ibans_from_history() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_register_counterparty_ibans() TO authenticated;

COMMENT ON TABLE counterparty_bank_accounts IS
'IBANs des contreparties liés aux organisations. Utilisé pour matching automatique à 100%.';

COMMENT ON FUNCTION auto_classify_bank_transaction IS
'Classe automatiquement les transactions: 1) Par IBAN (prioritaire), 2) Par règles de matching.';
