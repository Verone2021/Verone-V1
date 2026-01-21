-- ============================================================================
-- Migration: Preparation scalabilite contacts (Phase 8.2)
-- Date: 2026-01-22
-- Contexte: Support futur pour comptes utilisateurs et multi-affiliations
-- ============================================================================

-- 1. Ajouter user_id FK pour lier contact <-> utilisateur (optionnel)
-- Permet de creer un compte utilisateur pour un contact existant
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index unique (un user = un contact max, mais un contact peut ne pas avoir de user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_id
  ON contacts(user_id)
  WHERE user_id IS NOT NULL;

-- 2. Ajouter contact_type pour distinguer owner/manager/employee/network_admin
-- Ne change pas le comportement actuel, juste ajout colonne pour classification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'contact_type'
  ) THEN
    ALTER TABLE contacts
    ADD COLUMN contact_type VARCHAR(50)
      CHECK (contact_type IN ('owner', 'manager', 'employee', 'network_admin', 'supplier', 'other'));
  END IF;
END $$;

-- 3. Ajouter commentaires pour documentation
COMMENT ON COLUMN contacts.user_id IS
'UUID de l utilisateur auth.users si ce contact a un compte. NULL si pas de compte cree.';

COMMENT ON COLUMN contacts.contact_type IS
'Type de contact: owner (proprietaire), manager (responsable), employee, network_admin (animateur reseau), supplier, other';

-- 4. Backfill contact_type base sur flags existants (heuristique)
-- Cette mise a jour ne touche pas les contacts qui ont deja un contact_type defini
UPDATE contacts SET contact_type =
  CASE
    WHEN is_primary_contact = true THEN 'owner'
    WHEN is_billing_contact = true THEN 'manager'
    WHEN is_commercial_contact = true THEN 'manager'
    WHEN is_technical_contact = true THEN 'employee'
    WHEN enseigne_id IS NOT NULL AND organisation_id IS NULL THEN 'network_admin'
    ELSE 'employee'
  END
WHERE contact_type IS NULL;

-- 5. Index sur contact_type pour queries futures
CREATE INDEX IF NOT EXISTS idx_contacts_contact_type
  ON contacts(contact_type)
  WHERE contact_type IS NOT NULL;

-- ============================================================================
-- NOTE: Table contact_affiliations pour scalabilite complete
-- A implementer dans une phase ulterieure si necessaire
-- ============================================================================
-- CREATE TABLE contact_affiliations (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
--   organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
--   enseigne_id UUID REFERENCES enseignes(id) ON DELETE CASCADE,
--   permission_level VARCHAR CHECK (permission_level IN ('full_owner', 'manager', 'readonly')),
--   can_create_orders BOOLEAN DEFAULT false,
--   can_manage_invoices BOOLEAN DEFAULT false,
--   can_manage_team BOOLEAN DEFAULT false,
--   created_at TIMESTAMP DEFAULT NOW(),
--   created_by UUID REFERENCES auth.users(id),
--   UNIQUE(contact_id, organisation_id, enseigne_id)
-- );
-- ============================================================================
