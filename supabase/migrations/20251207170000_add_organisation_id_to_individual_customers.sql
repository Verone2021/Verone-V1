-- =====================================================
-- MIGRATION: Add organisation_id to individual_customers
-- Date: 2025-12-07
-- Purpose: Allow linking individual customers to organisations (for org_independante)
-- Business Rule:
--   - Enseignes: clients linked via enseigne_id
--   - Org_independante: clients linked via organisation_id
-- =====================================================

-- 1. Ajouter colonne organisation_id pour org_independante
ALTER TABLE individual_customers
ADD COLUMN IF NOT EXISTS organisation_id uuid
REFERENCES organisations(id) ON DELETE SET NULL;

-- 2. Index pour performance des queries par organisation
CREATE INDEX IF NOT EXISTS idx_individual_customers_organisation_id
ON individual_customers(organisation_id)
WHERE organisation_id IS NOT NULL;

-- 3. Commentaire explicatif
COMMENT ON COLUMN individual_customers.organisation_id IS
'Lien vers organisation (pour org_independante). Utilisé pour tracer les clients créés via LinkMe par des organisations indépendantes.';

-- 4. Note: La colonne est nullable car:
--    - Pour enseignes: utilise enseigne_id (existant)
--    - Pour org_independante: utilise organisation_id (nouveau)
--    - Un client peut avoir ni l'un ni l'autre s'il est créé manuellement

