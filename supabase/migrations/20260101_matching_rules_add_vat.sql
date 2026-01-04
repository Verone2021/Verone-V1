-- =====================================================================
-- Migration: Ajouter colonnes TVA à matching_rules
-- Date: 2026-01-01
-- Description: Permet de stocker le taux TVA par défaut dans chaque règle
--              de classification, évitant la re-saisie à chaque classification.
--              Support du multi-taux (ex: restaurant 10% + 20%).
-- =====================================================================

-- Étape 1: Ajouter les colonnes TVA
ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS default_vat_rate NUMERIC(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS vat_breakdown JSONB DEFAULT NULL;

-- Étape 2: Commentaires
COMMENT ON COLUMN matching_rules.default_vat_rate IS
'Taux TVA unique appliqué par défaut (0, 5.5, 10, 20). NULL si vat_breakdown est utilisé pour multi-taux.';

COMMENT ON COLUMN matching_rules.vat_breakdown IS
'Ventilation TVA multi-taux pour cas complexes (ex: restaurant).
Format: [{"tva_rate": 10, "percent": 50}, {"tva_rate": 20, "percent": 50}]
où percent = pourcentage du montant HT à ce taux.';

-- Étape 3: Mettre à jour la vue v_matching_rules_with_org pour inclure les nouvelles colonnes
DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE VIEW v_matching_rules_with_org AS
SELECT
    mr.id,
    mr.priority,
    mr.enabled,
    mr.match_type,
    mr.match_value,
    mr.default_category,
    mr.default_role_type,
    mr.organisation_id,
    mr.display_label,
    mr.allow_multiple_categories,
    mr.default_vat_rate,
    mr.vat_breakdown,
    mr.created_at,
    mr.updated_at,
    org.legal_name AS organisation_name,
    org.type AS organisation_type
FROM matching_rules mr
LEFT JOIN organisations org ON mr.organisation_id = org.id
ORDER BY mr.priority ASC, mr.created_at DESC;

-- Grant
GRANT SELECT ON v_matching_rules_with_org TO authenticated;

COMMENT ON VIEW v_matching_rules_with_org IS
'Vue des règles de matching avec organisation liée et colonnes TVA.';
