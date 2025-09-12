-- Simple Organization Assignment Trigger
-- This creates only the auto-assignment trigger needed for country-based organization assignment

BEGIN;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trg_assign_organisation ON proprietes;
DROP FUNCTION IF EXISTS assign_organisation_by_pays();

-- Create the function for auto-assignment by country
CREATE OR REPLACE FUNCTION assign_organisation_by_pays()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
BEGIN
    -- If organisation_id is not provided, auto-assign based on country
    IF NEW.organisation_id IS NULL THEN
        -- Find active organization for this country
        SELECT id INTO org_id
        FROM organisations
        WHERE pays = NEW.pays
        AND is_active = true
        ORDER BY created_at ASC -- Take the oldest if multiple exist
        LIMIT 1;
        
        IF org_id IS NULL THEN
            RAISE EXCEPTION 'Aucune organisation active trouvée pour le pays: %. Veuillez créer une organisation pour ce pays.', NEW.pays;
        END IF;
        
        NEW.organisation_id = org_id;
        
        RAISE NOTICE 'Organisation % assignée automatiquement pour le pays %', org_id, NEW.pays;
    END IF;
    
    -- Verify consistency between country and organization
    IF EXISTS (
        SELECT 1 FROM organisations 
        WHERE id = NEW.organisation_id 
        AND pays != NEW.pays
    ) THEN
        RAISE WARNING 'Attention: La propriété est dans le pays % mais l''organisation est pour un autre pays', NEW.pays;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trg_assign_organisation
    BEFORE INSERT OR UPDATE OF pays, organisation_id ON proprietes
    FOR EACH ROW
    EXECUTE FUNCTION assign_organisation_by_pays();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'proprietes'
AND trigger_name = 'trg_assign_organisation';

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Organization assignment trigger created successfully!';
    RAISE NOTICE '📋 Functionality:';
    RAISE NOTICE '   - Auto-assigns organization_id based on pays (country)';
    RAISE NOTICE '   - Triggers on INSERT and UPDATE of pays or organisation_id';
    RAISE NOTICE '   - Validates country/organization consistency';
    RAISE NOTICE '';
END $$;