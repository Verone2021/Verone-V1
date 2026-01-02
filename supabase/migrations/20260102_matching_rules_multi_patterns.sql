-- =====================================================================
-- Migration: Multi-patterns pour les règles de matching
-- Date: 2026-01-02
-- Description: Permet de matcher plusieurs patterns différents vers la même règle
--              Ex: ["AMÉRICO", "AMERICO", "Tavares Martins"]
-- =====================================================================

-- 1. Ajouter la colonne match_patterns (tableau de texte)
ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS match_patterns TEXT[];

-- 2. Migrer les données existantes: copier match_value dans match_patterns
UPDATE matching_rules
SET match_patterns = ARRAY[match_value]
WHERE match_patterns IS NULL AND match_value IS NOT NULL;

-- 3. Mettre à jour le trigger pour supporter multi-patterns
CREATE OR REPLACE FUNCTION auto_classify_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
  v_org_id UUID;
  v_pattern TEXT;
  v_matched BOOLEAN;
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
    END IF;
  END IF;

  -- 2. Matching par règles (avec support multi-patterns)
  IF NEW.side = 'debit' AND (NEW.matching_status IS NULL OR NEW.matching_status = 'unmatched' OR NEW.matching_status = 'auto_matched_iban') THEN
    FOR v_rule IN
      SELECT id, match_type, match_value, match_patterns, default_category, organisation_id, default_vat_rate
      FROM matching_rules
      WHERE is_active = true AND enabled = true
      ORDER BY priority ASC
    LOOP
      v_matched := FALSE;

      -- Si match_patterns existe, boucler dessus
      IF v_rule.match_patterns IS NOT NULL AND array_length(v_rule.match_patterns, 1) > 0 THEN
        FOREACH v_pattern IN ARRAY v_rule.match_patterns LOOP
          -- Appliquer le type de matching sur chaque pattern
          IF v_rule.match_type = 'label_contains' AND NEW.label ILIKE '%' || v_pattern || '%' THEN
            v_matched := TRUE;
            EXIT;
          END IF;
          IF v_rule.match_type = 'label_exact' AND LOWER(NEW.label) = LOWER(v_pattern) THEN
            v_matched := TRUE;
            EXIT;
          END IF;
          IF v_rule.match_type = 'label_regex' AND NEW.label ~* v_pattern THEN
            v_matched := TRUE;
            EXIT;
          END IF;
        END LOOP;
      ELSE
        -- Fallback: utiliser match_value (rétrocompatibilité)
        IF v_rule.match_type = 'label_contains' AND NEW.label ILIKE '%' || v_rule.match_value || '%' THEN
          v_matched := TRUE;
        END IF;
        IF v_rule.match_type = 'label_exact' AND LOWER(NEW.label) = LOWER(v_rule.match_value) THEN
          v_matched := TRUE;
        END IF;
        IF v_rule.match_type = 'label_regex' AND NEW.label ~* v_rule.match_value THEN
          v_matched := TRUE;
        END IF;
      END IF;

      -- Si match trouvé, appliquer la règle
      IF v_matched THEN
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

-- 4. Mettre à jour la vue v_matching_rules_with_org
DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE OR REPLACE VIEW v_matching_rules_with_org AS
SELECT
  r.*,
  o.legal_name AS organisation_name,
  o.type AS organisation_type,
  COALESCE(cnt.count, 0)::INTEGER AS matched_expenses_count
FROM matching_rules r
LEFT JOIN organisations o ON o.id = r.organisation_id
LEFT JOIN (
  SELECT applied_rule_id, COUNT(*) as count
  FROM bank_transactions
  WHERE applied_rule_id IS NOT NULL
  GROUP BY applied_rule_id
) cnt ON cnt.applied_rule_id = r.id
ORDER BY r.priority ASC;

-- Grant access
GRANT SELECT ON v_matching_rules_with_org TO authenticated;

COMMENT ON COLUMN matching_rules.match_patterns IS
'Tableau de patterns pour matcher. Ex: ["AMÉRICO", "AMERICO", "TAVARES"]. Si NULL, utilise match_value.';
