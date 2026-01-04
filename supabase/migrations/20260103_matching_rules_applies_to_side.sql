-- Migration: Add applies_to_side column to matching_rules
-- This allows rules to be specific to transaction types:
-- - 'debit': Only applies to expenses (sorties d'argent)
-- - 'credit': Only applies to income (entrées d'argent)
-- - 'both': Applies to both types (default)

-- Step 1: Create the enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_side_filter') THEN
    CREATE TYPE transaction_side_filter AS ENUM ('debit', 'credit', 'both');
  END IF;
END $$;

-- Step 2: Add the column with default 'both' (backward compatible)
ALTER TABLE matching_rules
  ADD COLUMN IF NOT EXISTS applies_to_side transaction_side_filter NOT NULL DEFAULT 'both';

-- Step 3: Add comment for documentation
COMMENT ON COLUMN matching_rules.applies_to_side IS
  'Specifies which transaction types this rule applies to: debit (expenses), credit (income), or both';

-- Step 4: Update the auto-classification function to consider applies_to_side
CREATE OR REPLACE FUNCTION auto_classify_bank_transactions()
RETURNS TRIGGER AS $$
DECLARE
  _rule RECORD;
  _counterparty_id UUID;
  _org_id UUID;
BEGIN
  -- Skip if already classified
  IF NEW.matching_status IN ('manual_matched', 'auto_matched') THEN
    RETURN NEW;
  END IF;

  -- Find matching rule (ordered by priority, considering applies_to_side)
  SELECT * INTO _rule
  FROM matching_rules
  WHERE is_active = TRUE
    AND (
      (match_type = 'label_contains' AND NEW.label ILIKE '%' || match_value || '%')
      OR (match_type = 'iban_exact' AND NEW.counterparty_iban = match_value)
    )
    AND (
      applies_to_side = 'both'
      OR applies_to_side::text = NEW.side::text
    )
  ORDER BY priority DESC, created_at ASC
  LIMIT 1;

  IF _rule IS NOT NULL THEN
    -- Apply rule
    NEW.category_pcg := COALESCE(_rule.default_category, NEW.category_pcg);
    NEW.matching_status := 'auto_matched';
    NEW.applied_rule_id := _rule.id;

    -- Link to organisation if specified
    IF _rule.organisation_id IS NOT NULL THEN
      -- Get or create counterparty
      SELECT id INTO _counterparty_id
      FROM counterparties
      WHERE name_normalized = LOWER(TRIM(NEW.counterparty_name))
      LIMIT 1;

      IF _counterparty_id IS NOT NULL THEN
        -- Update counterparty with organisation link
        UPDATE counterparties
        SET organisation_id = _rule.organisation_id
        WHERE id = _counterparty_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Update the RPC apply_rule_simple to consider applies_to_side
CREATE OR REPLACE FUNCTION apply_rule_simple(
  p_rule_id UUID,
  p_selected_labels TEXT[]
)
RETURNS JSON AS $$
DECLARE
  v_rule RECORD;
  v_result JSON;
  v_count INTEGER := 0;
  v_ids UUID[] := ARRAY[]::UUID[];
  v_label TEXT;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule
  FROM matching_rules
  WHERE id = p_rule_id;

  IF v_rule IS NULL THEN
    RETURN json_build_object(
      'nb_updated', 0,
      'updated_ids', '[]'::json,
      'error', 'Rule not found'
    );
  END IF;

  -- Update transactions for each selected label (considering applies_to_side)
  FOREACH v_label IN ARRAY p_selected_labels
  LOOP
    WITH updated AS (
      UPDATE bank_transactions
      SET
        category_pcg = COALESCE(v_rule.default_category, category_pcg),
        matching_status = 'auto_matched',
        applied_rule_id = v_rule.id,
        updated_at = NOW()
      WHERE label ILIKE v_label
        AND matching_status NOT IN ('manual_matched')
        AND (
          v_rule.applies_to_side = 'both'
          OR v_rule.applies_to_side::text = side::text
        )
      RETURNING id
    )
    SELECT
      v_count + COUNT(*),
      v_ids || ARRAY_AGG(id)
    INTO v_count, v_ids
    FROM updated;
  END LOOP;

  RETURN json_build_object(
    'nb_updated', v_count,
    'updated_ids', to_json(v_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update the v_matching_rules_with_org view to include applies_to_side
DROP VIEW IF EXISTS v_matching_rules_with_org;
CREATE VIEW v_matching_rules_with_org AS
SELECT
  r.id,
  r.match_type,
  r.match_value,
  r.match_patterns,
  r.display_label,
  r.default_category,
  r.default_role_type,
  r.organisation_id,
  r.counterparty_type,
  r.is_active,
  r.priority,
  r.allow_multiple_categories,
  r.applies_to_side,
  r.created_at,
  COALESCE(o.trade_name, o.legal_name) AS organisation_name,
  o.type AS organisation_type,
  pcg.label AS category_label
FROM matching_rules r
LEFT JOIN organisations o ON r.organisation_id = o.id
LEFT JOIN (
  SELECT DISTINCT code, label
  FROM (VALUES
    ('6256', 'Hôtel & Repas'),
    ('651', 'Logiciels SaaS'),
    ('6278', 'Frais Bancaires'),
    ('623', 'Marketing & Pub'),
    ('6226', 'Honoraires'),
    ('616', 'Assurances'),
    ('6262', 'Télécom & Internet'),
    ('6251', 'Transport'),
    ('607', 'Achats Marchandises'),
    ('6132', 'Loyer Bureaux'),
    ('706', 'Prestations Services'),
    ('707', 'Ventes Marchandises'),
    ('708', 'Activités Annexes'),
    ('758', 'Produits Divers'),
    ('768', 'Produits Financiers')
  ) AS t(code, label)
) pcg ON r.default_category = pcg.code;
