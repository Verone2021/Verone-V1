-- Add 'archive' to propriete_statut enum
-- This is necessary for the archive/unarchive functionality to work

-- Add the new value to the enum type
ALTER TYPE propriete_statut ADD VALUE IF NOT EXISTS 'archive' AFTER 'vendue';

-- Verify the enum values
SELECT enumlabel FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'propriete_statut' 
ORDER BY enumsortorder;