-- Migration spécifique : Ajout des champs bancaires SEPA
-- Description: Ajouter les colonnes bancaires manquantes à la table proprietaires
-- Date: 9 septembre 2025

BEGIN;

-- Ajouter les colonnes bancaires SEPA si elles n'existent pas
DO $$
BEGIN
    -- IBAN international (OBLIGATOIRE)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'proprietaires' 
                   AND column_name = 'iban') THEN
        ALTER TABLE proprietaires ADD COLUMN iban VARCHAR(34);
        RAISE NOTICE 'Colonne iban ajoutée';
    ELSE
        RAISE NOTICE 'Colonne iban existe déjà';
    END IF;

    -- Nom titulaire compte (OBLIGATOIRE)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'proprietaires' 
                   AND column_name = 'account_holder_name') THEN
        ALTER TABLE proprietaires ADD COLUMN account_holder_name VARCHAR(255);
        RAISE NOTICE 'Colonne account_holder_name ajoutée';
    ELSE
        RAISE NOTICE 'Colonne account_holder_name existe déjà';
    END IF;

    -- Nom banque (RECOMMANDÉ)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'proprietaires' 
                   AND column_name = 'bank_name') THEN
        ALTER TABLE proprietaires ADD COLUMN bank_name VARCHAR(255);
        RAISE NOTICE 'Colonne bank_name ajoutée';
    ELSE
        RAISE NOTICE 'Colonne bank_name existe déjà';
    END IF;

    -- Code BIC/SWIFT (OPTIONNEL)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'proprietaires' 
                   AND column_name = 'swift_bic') THEN
        ALTER TABLE proprietaires ADD COLUMN swift_bic VARCHAR(11);
        RAISE NOTICE 'Colonne swift_bic ajoutée';
    ELSE
        RAISE NOTICE 'Colonne swift_bic existe déjà';
    END IF;
END $$;

-- Ajouter les contraintes bancaires selon standards SEPA 2025
DO $$
BEGIN
    -- Contrainte IBAN format
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'proprietaires_iban_format') THEN
        ALTER TABLE proprietaires 
        ADD CONSTRAINT proprietaires_iban_format 
        CHECK (iban IS NULL OR (LENGTH(iban) >= 15 AND LENGTH(iban) <= 34 AND iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]+$'));
        RAISE NOTICE 'Contrainte IBAN format ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte IBAN format existe déjà';
    END IF;

    -- Contrainte titulaire compte obligatoire si IBAN fourni
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'proprietaires_account_holder_required') THEN
        ALTER TABLE proprietaires 
        ADD CONSTRAINT proprietaires_account_holder_required
        CHECK (iban IS NULL OR (account_holder_name IS NOT NULL AND LENGTH(TRIM(account_holder_name)) > 0));
        RAISE NOTICE 'Contrainte titulaire compte ajoutée';
    ELSE
        RAISE NOTICE 'Contrainte titulaire compte existe déjà';
    END IF;
END $$;

-- Ajouter index pour performance sur IBAN
CREATE INDEX IF NOT EXISTS idx_proprietaires_iban 
ON proprietaires(iban) 
WHERE iban IS NOT NULL;

-- Vérification finale
DO $$
DECLARE
    iban_exists BOOLEAN;
    account_holder_exists BOOLEAN; 
    bank_name_exists BOOLEAN;
    swift_bic_exists BOOLEAN;
BEGIN
    -- Vérifier la présence des colonnes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proprietaires' AND column_name = 'iban'
    ) INTO iban_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proprietaires' AND column_name = 'account_holder_name'
    ) INTO account_holder_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proprietaires' AND column_name = 'bank_name'
    ) INTO bank_name_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proprietaires' AND column_name = 'swift_bic'
    ) INTO swift_bic_exists;

    RAISE NOTICE '';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'Migration champs bancaires SEPA - RÉSULTAT';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ IBAN : %', CASE WHEN iban_exists THEN 'CRÉÉ' ELSE 'ÉCHEC' END;
    RAISE NOTICE '✅ Nom titulaire : %', CASE WHEN account_holder_exists THEN 'CRÉÉ' ELSE 'ÉCHEC' END;
    RAISE NOTICE '✅ Nom banque : %', CASE WHEN bank_name_exists THEN 'CRÉÉ' ELSE 'ÉCHEC' END;
    RAISE NOTICE '✅ Code BIC/SWIFT : %', CASE WHEN swift_bic_exists THEN 'CRÉÉ' ELSE 'ÉCHEC' END;
    RAISE NOTICE '';
    
    IF iban_exists AND account_holder_exists AND bank_name_exists AND swift_bic_exists THEN
        RAISE NOTICE '🎯 SUCCÈS: Tous les champs bancaires SEPA ont été créés';
        RAISE NOTICE '🏦 PRÊT: Intégration bancaire opérationnelle';
    ELSE
        RAISE NOTICE '⚠️  ATTENTION: Certains champs bancaires manquent';
    END IF;
    
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;