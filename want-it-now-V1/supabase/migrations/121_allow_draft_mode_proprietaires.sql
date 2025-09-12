-- ==============================================================================
-- MIGRATION 121: ALLOW DRAFT MODE FOR PROPRIETAIRES
-- ==============================================================================
-- Description: Modifier les contraintes pour permettre les brouillons
-- La validation stricte ne s'applique que quand is_brouillon = false
-- Date: 2025-01-10
-- ==============================================================================

BEGIN;

-- Supprimer l'ancienne contrainte stricte
ALTER TABLE proprietaires DROP CONSTRAINT IF EXISTS proprietaires_physique_check;

-- Ajouter nouvelle contrainte qui respecte le mode brouillon
ALTER TABLE proprietaires ADD CONSTRAINT proprietaires_physique_check CHECK (
    type != 'physique' OR is_brouillon = true OR (
        prenom IS NOT NULL AND 
        LENGTH(TRIM(prenom)) > 0 AND
        date_naissance IS NOT NULL AND
        lieu_naissance IS NOT NULL AND
        nationalite IS NOT NULL
    )
);

-- Même logique pour la contrainte personne morale
ALTER TABLE proprietaires DROP CONSTRAINT IF EXISTS proprietaires_morale_check;

ALTER TABLE proprietaires ADD CONSTRAINT proprietaires_morale_check CHECK (
    type != 'morale' OR is_brouillon = true OR (
        forme_juridique IS NOT NULL AND
        numero_identification IS NOT NULL AND
        capital_social IS NOT NULL AND
        nombre_parts_total IS NOT NULL AND
        nombre_parts_total > 0
    )
);

-- Même logique pour les associés si nécessaire
ALTER TABLE associes DROP CONSTRAINT IF EXISTS associes_physique_check;

ALTER TABLE associes ADD CONSTRAINT associes_physique_check CHECK (
    type != 'physique' OR (
        prenom IS NOT NULL AND 
        LENGTH(TRIM(prenom)) > 0 AND
        date_naissance IS NOT NULL AND
        lieu_naissance IS NOT NULL AND
        nationalite IS NOT NULL
    )
);

-- Note: Les associés n'ont pas de mode brouillon, ils restent avec validation stricte

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration 121: Mode Brouillon Propriétaires - COMPLÉTÉ';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Contrainte proprietaires_physique_check mise à jour';
    RAISE NOTICE '✅ Contrainte proprietaires_morale_check mise à jour';
    RAISE NOTICE '✅ Mode brouillon autorisé pour validation souple';
    RAISE NOTICE '✅ Validation stricte conservée pour mode normal';
    RAISE NOTICE '';
    RAISE NOTICE '📝 LOGIQUE: is_brouillon = true bypass validation stricte';
    RAISE NOTICE '🔒 SÉCURITÉ: is_brouillon = false applique validation complète';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;