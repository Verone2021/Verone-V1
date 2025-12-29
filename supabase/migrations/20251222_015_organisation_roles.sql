-- =====================================================================
-- Migration: Multi-rôle Organisations
-- Date: 2025-12-22
-- Description: Implémente le multi-rôle proprement via table de jointure
--              au lieu d'un enum "both" fragile
-- =====================================================================

-- =====================================================================
-- ENUM: organisation_role_type
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE organisation_role_type AS ENUM (
    'customer',           -- Client final (achète des produits)
    'supplier_goods',     -- Fournisseur de marchandises
    'supplier_services',  -- Fournisseur de services (prestataires)
    'affiliate_partner'   -- Partenaire affilié (LinkMe)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- TABLE: organisation_roles
-- Une organisation peut avoir PLUSIEURS rôles (ex: client ET fournisseur)
-- =====================================================================

CREATE TABLE IF NOT EXISTS organisation_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role organisation_role_type NOT NULL,

  -- Métadonnées du rôle
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,

  -- Dates
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Une organisation ne peut avoir qu'une seule entrée par rôle
  CONSTRAINT unique_organisation_role UNIQUE (organisation_id, role)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_organisation_roles_org_id ON organisation_roles(organisation_id);
CREATE INDEX IF NOT EXISTS idx_organisation_roles_role ON organisation_roles(role);
CREATE INDEX IF NOT EXISTS idx_organisation_roles_active ON organisation_roles(active) WHERE active = TRUE;

-- =====================================================================
-- CLEANUP: Supprimer l'ancien champ partner_role si existant
-- (ajouté dans migration précédente avec enum "both" fragile)
-- =====================================================================

-- Supprimer la colonne si elle existe
DO $$ BEGIN
  ALTER TABLE organisations DROP COLUMN IF EXISTS partner_role;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Supprimer l'ancien type enum si existant
DROP TYPE IF EXISTS partner_role CASCADE;

-- =====================================================================
-- ALTER TABLE: financial_documents
-- Remplacer partner_id + partner_type par partner_organisation_id
-- =====================================================================

-- Ajouter la nouvelle colonne
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS partner_organisation_id UUID REFERENCES organisations(id);

-- Migrer les données existantes (si partner_id existe et pointe vers organisations)
DO $$ BEGIN
  UPDATE financial_documents
  SET partner_organisation_id = partner_id
  WHERE partner_id IS NOT NULL AND partner_organisation_id IS NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- Index sur la nouvelle colonne
CREATE INDEX IF NOT EXISTS idx_financial_documents_partner_org
ON financial_documents(partner_organisation_id);

-- Note: On garde partner_id et partner_type pour compatibilité,
-- mais on utilisera partner_organisation_id pour les nouvelles données

-- =====================================================================
-- ALTER TABLE: bank_transactions
-- Ajouter lien optionnel vers organisation (counterparty)
-- =====================================================================

-- Quand on match une contrepartie avec une organisation connue
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS counterparty_organisation_id UUID REFERENCES organisations(id);

-- Index
CREATE INDEX IF NOT EXISTS idx_bank_transactions_counterparty_org
ON bank_transactions(counterparty_organisation_id);

-- =====================================================================
-- FUNCTIONS: Helpers pour les rôles
-- =====================================================================

-- Fonction pour vérifier si une organisation a un rôle spécifique
CREATE OR REPLACE FUNCTION organisation_has_role(
  org_id UUID,
  check_role organisation_role_type
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organisation_roles
    WHERE organisation_id = org_id
      AND role = check_role
      AND active = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Fonction pour obtenir tous les rôles d'une organisation
CREATE OR REPLACE FUNCTION get_organisation_roles(org_id UUID)
RETURNS organisation_role_type[] AS $$
  SELECT ARRAY_AGG(role)
  FROM organisation_roles
  WHERE organisation_id = org_id AND active = TRUE;
$$ LANGUAGE sql STABLE;

-- Fonction pour ajouter un rôle à une organisation
CREATE OR REPLACE FUNCTION add_organisation_role(
  org_id UUID,
  new_role organisation_role_type,
  role_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  role_id UUID;
BEGIN
  INSERT INTO organisation_roles (organisation_id, role, notes)
  VALUES (org_id, new_role, role_notes)
  ON CONFLICT (organisation_id, role)
  DO UPDATE SET active = TRUE, updated_at = NOW()
  RETURNING id INTO role_id;

  RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- VIEW: organisations_with_roles
-- Vue pratique pour récupérer les organisations avec leurs rôles
-- =====================================================================

CREATE OR REPLACE VIEW organisations_with_roles AS
SELECT
  o.*,
  COALESCE(get_organisation_roles(o.id), '{}') AS roles,
  organisation_has_role(o.id, 'customer') AS is_customer,
  organisation_has_role(o.id, 'supplier_goods') AS is_supplier_goods,
  organisation_has_role(o.id, 'supplier_services') AS is_supplier_services,
  organisation_has_role(o.id, 'affiliate_partner') AS is_affiliate_partner
FROM organisations o;

-- =====================================================================
-- RLS POLICIES pour organisation_roles
-- =====================================================================

ALTER TABLE organisation_roles ENABLE ROW LEVEL SECURITY;

-- Lecture pour utilisateurs authentifiés
CREATE POLICY "organisation_roles_select_authenticated"
ON organisation_roles FOR SELECT
TO authenticated
USING (TRUE);

-- Insert/Update pour utilisateurs avec accès à l'organisation
CREATE POLICY "organisation_roles_insert_authenticated"
ON organisation_roles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organisations
    WHERE id = organisation_id
  )
);

CREATE POLICY "organisation_roles_update_authenticated"
ON organisation_roles FOR UPDATE
TO authenticated
USING (TRUE);

CREATE POLICY "organisation_roles_delete_authenticated"
ON organisation_roles FOR DELETE
TO authenticated
USING (TRUE);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE organisation_roles IS
  'Table de jointure pour les rôles multi-valués des organisations. '
  'Une organisation peut avoir plusieurs rôles (ex: client + fournisseur).';

COMMENT ON COLUMN organisation_roles.role IS
  'Type de rôle: customer, supplier_goods, supplier_services, affiliate_partner';

COMMENT ON COLUMN bank_transactions.counterparty_organisation_id IS
  'Lien optionnel vers l''organisation correspondant à la contrepartie. '
  'Renseigné manuellement ou par matching automatique.';

COMMENT ON COLUMN financial_documents.partner_organisation_id IS
  'Organisation partenaire (client ou fournisseur). '
  'Le rôle est déterminé par organisation_roles, pas par un champ séparé.';

COMMENT ON FUNCTION organisation_has_role IS
  'Vérifie si une organisation a un rôle spécifique actif';

COMMENT ON FUNCTION get_organisation_roles IS
  'Retourne la liste des rôles actifs d''une organisation';

COMMENT ON FUNCTION add_organisation_role IS
  'Ajoute un rôle à une organisation (ou réactive si existant)';
