-- Migration V3: Auto-classification des depenses via trigger
-- Applique automatiquement les regles de matching lors de l'insertion d'une depense

-- =====================================================
-- PHASE 1: Ajouter customer_id pour clients particuliers
-- =====================================================

-- Ajouter colonne pour associer les transactions aux clients particuliers
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS individual_customer_id UUID REFERENCES individual_customers(id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_expenses_individual_customer ON expenses(individual_customer_id);

-- =====================================================
-- PHASE 2: Fonction de trigger auto-classification
-- =====================================================

CREATE OR REPLACE FUNCTION auto_classify_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
  v_label TEXT;
BEGIN
  -- Ne pas re-classifier si deja classifie
  IF NEW.status = 'classified' THEN
    RETURN NEW;
  END IF;

  -- Recuperer le label de la transaction bancaire
  SELECT label INTO v_label
  FROM bank_transactions
  WHERE id = NEW.transaction_id;

  -- Si pas de label, on ne peut pas matcher
  IF v_label IS NULL OR v_label = '' THEN
    RETURN NEW;
  END IF;

  -- Chercher une regle correspondante (par priorite)
  FOR v_rule IN
    SELECT * FROM matching_rules
    WHERE enabled = true
    ORDER BY priority ASC
  LOOP
    -- Verifier le match selon le type
    IF (v_rule.match_type = 'label_contains' AND v_label ILIKE '%' || v_rule.match_value || '%')
       OR (v_rule.match_type = 'label_exact' AND LOWER(TRIM(v_label)) = LOWER(TRIM(v_rule.match_value)))
    THEN
      -- Appliquer la regle
      NEW.organisation_id := v_rule.organisation_id;
      NEW.category := v_rule.default_category;
      NEW.role_type := v_rule.default_role_type;
      NEW.status := 'classified';
      NEW.classified_at := NOW();

      -- Premiere regle matchee gagne, on sort de la boucle
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PHASE 3: Creer le trigger
-- =====================================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_auto_classify_expense ON expenses;

-- Creer le trigger BEFORE INSERT
-- Il s'executera avant chaque insertion dans la table expenses
CREATE TRIGGER trg_auto_classify_expense
  BEFORE INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_expense();

-- =====================================================
-- PHASE 4: Commentaires et documentation
-- =====================================================

COMMENT ON FUNCTION auto_classify_expense() IS
'Trigger function that automatically classifies new expenses based on matching rules.
Looks up the label from bank_transactions and matches against enabled rules ordered by priority.
The first matching rule wins and sets organisation_id, category, role_type, and status.';

COMMENT ON TRIGGER trg_auto_classify_expense ON expenses IS
'Automatically classifies expenses on insert using matching rules.
Triggered before insert to set classification fields before the row is created.';

-- =====================================================
-- PHASE 5: Vue mise a jour pour inclure customer_id
-- =====================================================

CREATE OR REPLACE VIEW v_expenses_with_details AS
SELECT
  e.id,
  e.transaction_id,
  e.organisation_id,
  e.individual_customer_id,
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
  -- Individual customer details (clients particuliers)
  ic.first_name AS customer_first_name,
  ic.last_name AS customer_last_name,
  CONCAT(ic.first_name, ' ', ic.last_name) AS customer_full_name,
  -- Computed
  CASE
    WHEN bt.raw_data->'attachments' IS NOT NULL
         AND jsonb_array_length(bt.raw_data->'attachments') > 0
    THEN true
    ELSE false
  END AS has_attachment
FROM expenses e
JOIN bank_transactions bt ON e.transaction_id = bt.id
LEFT JOIN organisations o ON e.organisation_id = o.id
LEFT JOIN individual_customers ic ON e.individual_customer_id = ic.id;
