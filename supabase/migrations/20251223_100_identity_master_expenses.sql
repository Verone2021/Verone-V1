-- =============================================================================
-- Migration: Identity Master + Expenses Management
-- Date: 2025-12-23
-- Description: Adds counterparties (identity layer), bank accounts (IBAN unique),
--              expenses table, and matching rules for Qonto expense classification.
-- =============================================================================

-- 1. COUNTERPARTIES TABLE (Identity Master - source de vérité)
-- =============================================================================
CREATE TABLE IF NOT EXISTS counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  vat_number TEXT,           -- Numéro TVA intracommunautaire
  siren TEXT,                -- SIREN (9 chiffres)
  siret TEXT,                -- SIRET (14 chiffres)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_counterparties_name_normalized
  ON counterparties(name_normalized);
CREATE INDEX IF NOT EXISTS idx_counterparties_vat
  ON counterparties(vat_number) WHERE vat_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_counterparties_siren
  ON counterparties(siren) WHERE siren IS NOT NULL;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_counterparties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_counterparties_updated_at ON counterparties;
CREATE TRIGGER trg_counterparties_updated_at
  BEFORE UPDATE ON counterparties
  FOR EACH ROW EXECUTE FUNCTION update_counterparties_updated_at();

-- 2. COUNTERPARTY BANK ACCOUNTS (IBAN unique = anti-doublon bulletproof)
-- =============================================================================
CREATE TABLE IF NOT EXISTS counterparty_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counterparty_id UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
  iban TEXT NOT NULL,
  bic TEXT,
  label TEXT,  -- "Compte principal", "Compte secondaire"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IBAN unique = matching bulletproof (un IBAN = une seule identité)
CREATE UNIQUE INDEX IF NOT EXISTS idx_counterparty_bank_accounts_iban_unique
  ON counterparty_bank_accounts(iban);

CREATE INDEX IF NOT EXISTS idx_counterparty_bank_accounts_counterparty
  ON counterparty_bank_accounts(counterparty_id);

-- 3. LINK ORGANISATIONS TO COUNTERPARTIES (optional)
-- =============================================================================
-- Permet de relier une organisation CRM existante à une identité counterparty
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS counterparty_id UUID REFERENCES counterparties(id);

CREATE INDEX IF NOT EXISTS idx_organisations_counterparty
  ON organisations(counterparty_id) WHERE counterparty_id IS NOT NULL;

-- 4. EXPENSES TABLE (dépenses liées aux transactions bancaires)
-- =============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  counterparty_id UUID REFERENCES counterparties(id),

  -- Classification
  category TEXT,
  status TEXT NOT NULL DEFAULT 'unclassified'
    CHECK (status IN ('unclassified', 'classified', 'needs_review', 'ignored')),

  -- Lien vers organisation CRM (optionnel, pour rétro-compatibilité)
  organisation_id UUID REFERENCES organisations(id),

  -- Rôle attribué (utile quand un counterparty a plusieurs rôles)
  role_type TEXT CHECK (role_type IN ('supplier', 'customer', 'partner', 'internal', NULL)),

  -- Metadata
  notes TEXT,
  classified_at TIMESTAMPTZ,
  classified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Une seule expense par transaction
  UNIQUE(transaction_id)
);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_counterparty ON expenses(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_expenses_organisation ON expenses(organisation_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_unclassified ON expenses(status) WHERE status = 'unclassified';
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_expenses_updated_at();

-- 5. MATCHING RULES TABLE (règles automatiques de classification)
-- =============================================================================
CREATE TABLE IF NOT EXISTS matching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority INT NOT NULL DEFAULT 100,  -- Plus bas = plus prioritaire
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Type de matching
  match_type TEXT NOT NULL CHECK (match_type IN ('iban', 'name_exact', 'label_contains', 'label_regex')),
  match_value TEXT NOT NULL,

  -- Cible
  counterparty_id UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
  default_category TEXT,
  default_role_type TEXT CHECK (default_role_type IN ('supplier', 'customer', 'partner', 'internal')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Une seule règle par type+valeur
  UNIQUE(match_type, match_value)
);

CREATE INDEX IF NOT EXISTS idx_matching_rules_enabled
  ON matching_rules(enabled, priority) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_matching_rules_counterparty
  ON matching_rules(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_matching_rules_type
  ON matching_rules(match_type);

-- 6. RLS POLICIES
-- =============================================================================
ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparty_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_rules ENABLE ROW LEVEL SECURITY;

-- Helper function pour vérifier le rôle admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(raw_user_meta_data->>'role', '') = 'admin'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Counterparties: admin full access
DROP POLICY IF EXISTS "Admin full access counterparties" ON counterparties;
CREATE POLICY "Admin full access counterparties" ON counterparties
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Counterparty bank accounts: admin full access
DROP POLICY IF EXISTS "Admin full access counterparty_bank_accounts" ON counterparty_bank_accounts;
CREATE POLICY "Admin full access counterparty_bank_accounts" ON counterparty_bank_accounts
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Expenses: admin full access
DROP POLICY IF EXISTS "Admin full access expenses" ON expenses;
CREATE POLICY "Admin full access expenses" ON expenses
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Matching rules: admin full access
DROP POLICY IF EXISTS "Admin full access matching_rules" ON matching_rules;
CREATE POLICY "Admin full access matching_rules" ON matching_rules
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 7. HELPER FUNCTIONS
-- =============================================================================

-- Fonction pour normaliser un nom (pour matching)
CREATE OR REPLACE FUNCTION normalize_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(COALESCE(input_name, '')),
        '[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæ]', ' ', 'g'  -- Remplace caractères spéciaux par espaces
      ),
      '\s+', ' ', 'g'  -- Normalise les espaces multiples
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour créer les expenses depuis les transactions débit
CREATE OR REPLACE FUNCTION create_expenses_from_debits()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO expenses (transaction_id, status)
  SELECT bt.id, 'unclassified'
  FROM bank_transactions bt
  WHERE bt.side = 'debit'
    AND NOT EXISTS (SELECT 1 FROM expenses e WHERE e.transaction_id = bt.id)
  ON CONFLICT (transaction_id) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour matcher les expenses par IBAN
CREATE OR REPLACE FUNCTION match_expenses_by_iban()
RETURNS INTEGER AS $$
DECLARE
  matched_count INTEGER;
BEGIN
  UPDATE expenses e
  SET
    counterparty_id = cba.counterparty_id,
    status = CASE
      WHEN e.status = 'unclassified' THEN 'classified'
      ELSE e.status
    END,
    classified_at = NOW()
  FROM bank_transactions bt
  JOIN counterparty_bank_accounts cba ON bt.counterparty_iban = cba.iban
  WHERE e.transaction_id = bt.id
    AND e.counterparty_id IS NULL
    AND bt.counterparty_iban IS NOT NULL;

  GET DIAGNOSTICS matched_count = ROW_COUNT;
  RETURN matched_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour appliquer une règle à l'historique
CREATE OR REPLACE FUNCTION apply_matching_rule_to_history(rule_id UUID)
RETURNS INTEGER AS $$
DECLARE
  rule_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Récupérer la règle
  SELECT * INTO rule_record FROM matching_rules WHERE id = rule_id AND enabled = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Appliquer selon le type de matching
  IF rule_record.match_type = 'iban' THEN
    UPDATE expenses e
    SET
      counterparty_id = rule_record.counterparty_id,
      category = COALESCE(rule_record.default_category, e.category),
      role_type = COALESCE(rule_record.default_role_type, e.role_type),
      status = 'classified',
      classified_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND bt.counterparty_iban = rule_record.match_value
      AND e.counterparty_id IS NULL;

  ELSIF rule_record.match_type = 'label_contains' THEN
    UPDATE expenses e
    SET
      counterparty_id = rule_record.counterparty_id,
      category = COALESCE(rule_record.default_category, e.category),
      role_type = COALESCE(rule_record.default_role_type, e.role_type),
      status = 'classified',
      classified_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND bt.label ILIKE '%' || rule_record.match_value || '%'
      AND e.counterparty_id IS NULL;

  ELSIF rule_record.match_type = 'name_exact' THEN
    UPDATE expenses e
    SET
      counterparty_id = rule_record.counterparty_id,
      category = COALESCE(rule_record.default_category, e.category),
      role_type = COALESCE(rule_record.default_role_type, e.role_type),
      status = 'classified',
      classified_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND normalize_name(bt.counterparty_name) = normalize_name(rule_record.match_value)
      AND e.counterparty_id IS NULL;

  ELSIF rule_record.match_type = 'label_regex' THEN
    UPDATE expenses e
    SET
      counterparty_id = rule_record.counterparty_id,
      category = COALESCE(rule_record.default_category, e.category),
      role_type = COALESCE(rule_record.default_role_type, e.role_type),
      status = 'classified',
      classified_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND bt.label ~ rule_record.match_value
      AND e.counterparty_id IS NULL;
  END IF;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 8. VIEW FOR EXPENSES WITH TRANSACTION DETAILS
-- =============================================================================
CREATE OR REPLACE VIEW v_expenses_with_details AS
SELECT
  e.id,
  e.transaction_id,
  e.counterparty_id,
  e.organisation_id,
  e.category,
  e.status,
  e.role_type,
  e.notes,
  e.classified_at,
  e.classified_by,
  e.created_at,
  e.updated_at,
  -- Transaction details
  bt.amount,
  bt.currency,
  bt.label,
  bt.counterparty_name AS transaction_counterparty_name,
  bt.counterparty_iban AS transaction_iban,
  bt.side,
  bt.emitted_at,
  bt.settled_at,
  bt.raw_data,
  -- Counterparty details
  cp.display_name AS counterparty_display_name,
  cp.name_normalized AS counterparty_name_normalized,
  -- Organisation details (if linked)
  org.legal_name AS organisation_name,
  org.type AS organisation_type,
  -- Has attachment?
  (bt.raw_data->'attachments') IS NOT NULL
    AND jsonb_array_length(bt.raw_data->'attachments') > 0 AS has_attachment
FROM expenses e
JOIN bank_transactions bt ON e.transaction_id = bt.id
LEFT JOIN counterparties cp ON e.counterparty_id = cp.id
LEFT JOIN organisations org ON e.organisation_id = org.id;

-- Grant access to view
GRANT SELECT ON v_expenses_with_details TO authenticated;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
