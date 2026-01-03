-- Migration: Mise à jour vue v_matching_rules_with_org
-- Date: 2025-12-30
-- Description: Ajouter les colonnes individual_customer_id et counterparty_type
--              manquantes après la migration 20251228
-- Status: APPLIQUÉE ✅

-- =====================================================
-- Supprimer l'ancienne vue (ordre des colonnes incompatible)
-- =====================================================

DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

-- =====================================================
-- Recréer la vue avec les nouvelles colonnes
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
  mr.individual_customer_id,    -- AJOUTÉ: Support clients particuliers
  mr.counterparty_type,         -- AJOUTÉ: Type de contrepartie
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
-- Grant permissions
-- =====================================================

GRANT SELECT ON v_matching_rules_with_org TO authenticated;
GRANT SELECT ON v_matching_rules_with_org TO service_role;
