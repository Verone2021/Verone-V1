-- Migration V2: Simplification des dépenses - Style Penny Lane
-- Remplace l'approche counterparties par lien direct vers organisations

-- =====================================================
-- PHASE 1: Modifier table expenses
-- =====================================================

-- Supprimer les anciennes colonnes counterparty
ALTER TABLE expenses DROP COLUMN IF EXISTS counterparty_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS role_record_id;

-- Ajouter organisation_id (FK vers organisations existantes)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_expenses_organisation ON expenses(organisation_id);

-- =====================================================
-- PHASE 2: Modifier table matching_rules
-- =====================================================

-- Supprimer counterparty_id si existe
ALTER TABLE matching_rules DROP COLUMN IF EXISTS counterparty_id;

-- Ajouter organisation_id
ALTER TABLE matching_rules ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id);

-- Ajouter colonne pour le nom affiché (label formaté)
ALTER TABLE matching_rules ADD COLUMN IF NOT EXISTS display_label TEXT;

-- Index
CREATE INDEX IF NOT EXISTS idx_matching_rules_organisation ON matching_rules(organisation_id);

-- Ajouter type label_exact si pas déjà dans le check constraint
-- D'abord, supprimer l'ancienne contrainte si elle existe
ALTER TABLE matching_rules DROP CONSTRAINT IF EXISTS matching_rules_match_type_check;

-- Recréer avec les bons types
ALTER TABLE matching_rules ADD CONSTRAINT matching_rules_match_type_check
  CHECK (match_type IN ('iban', 'name_exact', 'label_contains', 'label_exact', 'label_regex'));

-- =====================================================
-- PHASE 3: Vue des libellés uniques non classés
-- =====================================================

CREATE OR REPLACE VIEW v_unique_unclassified_labels AS
SELECT
  bt.counterparty_name AS label,
  COUNT(*) AS transaction_count,
  SUM(ABS(bt.amount)) AS total_amount,
  MIN(bt.emitted_at) AS first_seen,
  MAX(bt.emitted_at) AS last_seen,
  ARRAY_AGG(DISTINCT e.id) AS expense_ids
FROM expenses e
JOIN bank_transactions bt ON e.transaction_id = bt.id
WHERE e.status = 'unclassified'
  AND bt.counterparty_name IS NOT NULL
  AND bt.counterparty_name != ''
GROUP BY bt.counterparty_name
ORDER BY COUNT(*) DESC;

-- =====================================================
-- PHASE 4: Vue des expenses avec détails (mise à jour)
-- =====================================================

CREATE OR REPLACE VIEW v_expenses_with_details AS
SELECT
  e.id,
  e.transaction_id,
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
  -- Organisation details
  o.legal_name AS organisation_name,
  o.type AS organisation_type,
  -- Computed
  CASE
    WHEN bt.raw_data->'attachments' IS NOT NULL
         AND jsonb_array_length(bt.raw_data->'attachments') > 0
    THEN true
    ELSE false
  END AS has_attachment
FROM expenses e
JOIN bank_transactions bt ON e.transaction_id = bt.id
LEFT JOIN organisations o ON e.organisation_id = o.id;

-- =====================================================
-- PHASE 5: Fonction d'application d'une règle spécifique
-- =====================================================

CREATE OR REPLACE FUNCTION apply_matching_rule(
  p_rule_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_rule RECORD;
  v_classified_count INTEGER := 0;
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id AND enabled = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Appliquer selon le type de matching
  IF v_rule.match_type = 'label_contains' THEN
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = 'classified',
      classified_at = NOW(),
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND bt.counterparty_name ILIKE '%' || v_rule.match_value || '%';

  ELSIF v_rule.match_type = 'label_exact' THEN
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = 'classified',
      classified_at = NOW(),
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(v_rule.match_value));
  END IF;

  GET DIAGNOSTICS v_classified_count = ROW_COUNT;
  RETURN v_classified_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 6: Fonction d'application de TOUTES les règles
-- =====================================================

CREATE OR REPLACE FUNCTION apply_all_matching_rules()
RETURNS TABLE(rules_applied INTEGER, expenses_classified INTEGER) AS $$
DECLARE
  v_rule RECORD;
  v_total_classified INTEGER := 0;
  v_rules_count INTEGER := 0;
  v_rule_classified INTEGER;
BEGIN
  FOR v_rule IN
    SELECT * FROM matching_rules
    WHERE enabled = true
    ORDER BY priority ASC
  LOOP
    v_rules_count := v_rules_count + 1;

    -- Appliquer la règle
    SELECT apply_matching_rule(v_rule.id) INTO v_rule_classified;
    v_total_classified := v_total_classified + COALESCE(v_rule_classified, 0);
  END LOOP;

  RETURN QUERY SELECT v_rules_count, v_total_classified;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 7: Vue des règles avec organisation jointe
-- =====================================================

CREATE OR REPLACE VIEW v_matching_rules_with_org AS
SELECT
  mr.id,
  mr.priority,
  mr.enabled,
  mr.match_type,
  mr.match_value,
  mr.display_label,
  mr.organisation_id,
  mr.default_category,
  mr.default_role_type,
  mr.created_at,
  mr.created_by,
  o.legal_name AS organisation_name,
  o.type AS organisation_type,
  -- Compter combien de dépenses cette règle a classées
  (SELECT COUNT(*) FROM expenses e
   JOIN bank_transactions bt ON e.transaction_id = bt.id
   WHERE e.organisation_id = mr.organisation_id
     AND e.status = 'classified'
     AND (
       (mr.match_type = 'label_contains' AND bt.counterparty_name ILIKE '%' || mr.match_value || '%')
       OR (mr.match_type = 'label_exact' AND LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(mr.match_value)))
     )
  ) AS matched_expenses_count
FROM matching_rules mr
LEFT JOIN organisations o ON mr.organisation_id = o.id
ORDER BY mr.priority ASC, mr.created_at DESC;

-- =====================================================
-- PHASE 8: RLS pour les nouvelles vues
-- =====================================================

-- Note: Les vues héritent des politiques des tables sous-jacentes
-- Pas besoin de RLS spécifique sur les vues

-- =====================================================
-- PHASE 9: Nettoyage des tables counterparties (optionnel)
-- =====================================================

-- On garde les tables counterparties pour l'instant au cas où
-- Mais on peut les supprimer plus tard si pas utilisées ailleurs

COMMENT ON TABLE counterparties IS 'DEPRECATED: Utiliser organisations à la place. Conservé pour rétro-compatibilité.';
COMMENT ON TABLE counterparty_bank_accounts IS 'DEPRECATED: Utiliser organisations à la place. Conservé pour rétro-compatibilité.';
