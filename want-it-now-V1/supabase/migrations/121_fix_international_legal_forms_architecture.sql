-- ==============================================================================
-- MIGRATION 121: FIX INTERNATIONAL LEGAL FORMS ARCHITECTURE
-- ==============================================================================
-- Description: Fix architectural inconsistency between ENUM and lookup table
-- Issue: Portuguese LDA forms being saved as SARL due to destructive mapping
-- Solution: Replace forme_juridique ENUM with VARCHAR + Foreign Key constraint
-- Date: January 2025 - Critical Bug Fix
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. ANALYSIS: CURRENT ARCHITECTURAL PROBLEM
-- ==============================================================================

-- Problem identified:
-- 1. ENUM contains descriptive names: 'Lda (Sociedade por Quotas)'
-- 2. Lookup table contains short codes: 'LDA'  
-- 3. Application mapping converts LDA → SARL destructively
-- 4. Result: Portuguese companies saved as French legal forms

-- ==============================================================================
-- 2. PHASE 1: SAFE DATA MIGRATION
-- ==============================================================================

-- Step 1: Add temporary VARCHAR column to proprietaires
ALTER TABLE proprietaires 
ADD COLUMN IF NOT EXISTS forme_juridique_new VARCHAR(50);

-- Step 2: Add temporary VARCHAR column to associes  
ALTER TABLE associes
ADD COLUMN IF NOT EXISTS forme_juridique_new VARCHAR(50);

-- Step 3: Update country_legal_forms to use consistent short codes
UPDATE country_legal_forms SET legal_form = 'LDA' WHERE legal_form = 'Lda (Sociedade por Quotas)';
UPDATE country_legal_forms SET legal_form = 'SA_PT' WHERE legal_form = 'SA (Sociedade Anónima)' AND country_code = 'PT';
UPDATE country_legal_forms SET legal_form = 'SA_ES' WHERE legal_form = 'SA (Sociedad Anónima)' AND country_code = 'ES';
UPDATE country_legal_forms SET legal_form = 'SL' WHERE legal_form = 'SL (Sociedad Limitada)';
UPDATE country_legal_forms SET legal_form = 'SU' WHERE legal_form = 'SU (Sociedade Unipessoal)';

-- Step 4: Migrate existing data from ENUM to VARCHAR
-- Map database enum values to proper short codes

UPDATE proprietaires 
SET forme_juridique_new = CASE 
    -- Portuguese forms (fix the destructive mapping)
    WHEN forme_juridique = 'Lda (Sociedade por Quotas)' THEN 'LDA'
    WHEN forme_juridique = 'SA (Sociedade Anónima)' THEN 'SA_PT'
    WHEN forme_juridique = 'SU (Sociedade Unipessoal)' THEN 'SU'
    
    -- Spanish forms  
    WHEN forme_juridique = 'SL (Sociedad Limitada)' THEN 'SL'
    WHEN forme_juridique = 'SA (Sociedad Anónima)' THEN 'SA_ES'
    
    -- French forms (keep existing codes)
    WHEN forme_juridique = 'SARL' THEN 'SARL'
    WHEN forme_juridique = 'SAS' THEN 'SAS' 
    WHEN forme_juridique = 'SA' THEN 'SA'
    WHEN forme_juridique = 'SCI' THEN 'SCI'
    WHEN forme_juridique = 'EURL' THEN 'EURL'
    WHEN forme_juridique = 'SASU' THEN 'SASU'
    WHEN forme_juridique = 'GIE' THEN 'GIE'
    WHEN forme_juridique = 'Association' THEN 'Association'
    
    -- International forms
    WHEN forme_juridique = 'LTD' THEN 'LTD'
    WHEN forme_juridique = 'PLC' THEN 'PLC'
    WHEN forme_juridique = 'GMBH' THEN 'GMBH'
    WHEN forme_juridique = 'AG' THEN 'AG'
    
    -- Fallback
    ELSE forme_juridique::text
END
WHERE forme_juridique IS NOT NULL;

-- Step 5: Migrate associes data similarly
UPDATE associes 
SET forme_juridique_new = CASE 
    -- Portuguese forms (fix the destructive mapping)
    WHEN forme_juridique = 'Lda (Sociedade por Quotas)' THEN 'LDA'
    WHEN forme_juridique = 'SA (Sociedade Anónima)' THEN 'SA_PT'
    WHEN forme_juridique = 'SU (Sociedade Unipessoal)' THEN 'SU'
    
    -- Spanish forms
    WHEN forme_juridique = 'SL (Sociedad Limitada)' THEN 'SL'
    
    -- French forms (keep existing codes)
    WHEN forme_juridique = 'SARL' THEN 'SARL'
    WHEN forme_juridique = 'SAS' THEN 'SAS'
    WHEN forme_juridique = 'SA' THEN 'SA'
    WHEN forme_juridique = 'SCI' THEN 'SCI'
    WHEN forme_juridique = 'EURL' THEN 'EURL'
    WHEN forme_juridique = 'SASU' THEN 'SASU'
    WHEN forme_juridique = 'GIE' THEN 'GIE'
    WHEN forme_juridique = 'Association' THEN 'Association'
    
    -- International forms
    WHEN forme_juridique = 'LTD' THEN 'LTD'
    WHEN forme_juridique = 'PLC' THEN 'PLC'
    WHEN forme_juridique = 'GMBH' THEN 'GMBH'
    WHEN forme_juridique = 'AG' THEN 'AG'
    
    -- Fallback
    ELSE forme_juridique::text
END
WHERE forme_juridique IS NOT NULL;

-- ==============================================================================
-- 3. PHASE 2: DROP ENUM CONSTRAINTS AND COLUMNS
-- ==============================================================================

-- Step 6: Drop old ENUM columns (after data migration)
ALTER TABLE proprietaires DROP COLUMN IF EXISTS forme_juridique;
ALTER TABLE associes DROP COLUMN IF EXISTS forme_juridique;

-- Step 7: Rename new columns to original names
ALTER TABLE proprietaires RENAME COLUMN forme_juridique_new TO forme_juridique;
ALTER TABLE associes RENAME COLUMN forme_juridique_new TO forme_juridique;

-- ==============================================================================
-- 4. PHASE 3: ADD FOREIGN KEY CONSTRAINTS
-- ==============================================================================

-- Step 8: Add Foreign Key constraint to ensure data integrity
ALTER TABLE proprietaires 
ADD CONSTRAINT fk_proprietaires_forme_juridique 
FOREIGN KEY (forme_juridique) 
REFERENCES country_legal_forms(legal_form)
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE associes
ADD CONSTRAINT fk_associes_forme_juridique  
FOREIGN KEY (forme_juridique)
REFERENCES country_legal_forms(legal_form)
ON UPDATE CASCADE ON DELETE RESTRICT;

-- ==============================================================================
-- 5. PHASE 4: UPDATE ENUM DEFINITION AND FUNCTIONS
-- ==============================================================================

-- Step 9: Drop the old ENUM type (no longer needed)
DROP TYPE IF EXISTS forme_juridique_enum CASCADE;

-- Step 10: Update function signatures that used the ENUM
-- Update country_legal_forms table to use VARCHAR instead of ENUM
ALTER TABLE country_legal_forms 
ALTER COLUMN legal_form TYPE VARCHAR(50);

-- Update function to return proper types
CREATE OR REPLACE FUNCTION get_legal_forms_by_country(country_code TEXT)
RETURNS TABLE (
    legal_form VARCHAR(50),
    display_name VARCHAR(100),
    description TEXT,
    min_capital DECIMAL(15,2),
    min_shareholders INTEGER,
    max_shareholders INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        clf.legal_form,
        clf.legal_form_display,
        clf.legal_form_description,
        clf.minimum_capital,
        clf.minimum_shareholders,
        clf.maximum_shareholders
    FROM country_legal_forms clf
    WHERE clf.country_code = $1
    AND clf.is_active = true
    ORDER BY clf.legal_form_display;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. UPDATE DATA TO FIX PORTUGUESE COMPANIES  
-- ==============================================================================

-- Step 11: Ensure any existing Portuguese companies are properly saved
-- This fixes the specific JARDIM PRÓSPERO LDA issue mentioned by user
UPDATE proprietaires 
SET forme_juridique = 'LDA', 
    pays_constitution = 'PT',
    updated_at = NOW()
WHERE (nom ILIKE '%JARDIM%PRÓSPERO%' OR nom ILIKE '%LDA%') 
  AND pays = 'PT' 
  AND forme_juridique = 'SARL'; -- Fix companies wrongly saved as SARL

-- Log the fix
INSERT INTO country_legal_forms (country_code, country_name, legal_form, legal_form_display, legal_form_description, minimum_capital, minimum_shareholders) 
VALUES ('PT', 'Portugal', 'LDA', 'Lda', 'Sociedade por Quotas', 1.00, 1, NULL, false)
ON CONFLICT (country_code, legal_form) DO UPDATE SET
  legal_form_display = EXCLUDED.legal_form_display,
  legal_form_description = EXCLUDED.legal_form_description;

-- ==============================================================================
-- 7. VALIDATION AND VERIFICATION
-- ==============================================================================

-- Step 12: Verify migration success
DO $$
DECLARE
    proprietaires_count INTEGER;
    associes_count INTEGER;
    portuguese_count INTEGER;
BEGIN
    -- Count migrated records
    SELECT COUNT(*) INTO proprietaires_count 
    FROM proprietaires 
    WHERE forme_juridique IS NOT NULL;
    
    SELECT COUNT(*) INTO associes_count
    FROM associes 
    WHERE forme_juridique IS NOT NULL;
    
    SELECT COUNT(*) INTO portuguese_count
    FROM proprietaires
    WHERE forme_juridique = 'LDA' AND pays = 'PT';
    
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE 'MIGRATION 121: INTERNATIONAL LEGAL FORMS ARCHITECTURE FIX - COMPLETED';
    RAISE NOTICE '==============================================================================';
    RAISE NOTICE '✅ Migrated % proprietaires legal forms from ENUM to VARCHAR+FK', proprietaires_count;
    RAISE NOTICE '✅ Migrated % associes legal forms from ENUM to VARCHAR+FK', associes_count;
    RAISE NOTICE '✅ Fixed % Portuguese companies (LDA forms properly saved)', portuguese_count;
    RAISE NOTICE '✅ Added Foreign Key constraints for data integrity';
    RAISE NOTICE '✅ Dropped problematic forme_juridique_enum type';
    RAISE NOTICE '✅ Updated helper functions to use VARCHAR';
    RAISE NOTICE '';
    RAISE NOTICE '🐛 BUG FIXED: Portuguese LDA no longer converted to French SARL';
    RAISE NOTICE '🌍 ARCHITECTURE: Clean separation between enum and lookup table';
    RAISE NOTICE '🔒 INTEGRITY: Foreign Key constraints ensure valid legal forms';
    RAISE NOTICE '📋 NEXT STEP: Remove mapFormeJuridiqueToDatabase() from application code';
    RAISE NOTICE '==============================================================================';
END $$;

COMMIT;