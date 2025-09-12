-- Update forme_juridique_enum to include Portuguese legal forms
-- This script updates the existing enum to match the forms sent by the wizard

-- First, add new enum values to the existing enum
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'LDA';
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'SA_PT';  
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'SU';
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'LTD';
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'GMBH';