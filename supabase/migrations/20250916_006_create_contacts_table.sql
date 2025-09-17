-- Migration 006: Création table contacts pour fournisseurs et clients professionnels
-- Date: 16 septembre 2025
-- Description: Table de contacts séparée pour les organisations B2B (fournisseurs + clients pro)

-- =============================================================================
-- 1. CRÉATION TABLE CONTACTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Informations personnelles
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  title varchar(100), -- Titre/poste (Directeur Commercial, Responsable Achats, etc.)
  department varchar(100), -- Service/département

  -- Contact principal
  email varchar(255) NOT NULL,
  phone varchar(50),
  mobile varchar(50),

  -- Contact secondaire (optionnel)
  secondary_email varchar(255),
  direct_line varchar(50), -- Ligne directe

  -- Préférences communication
  is_primary_contact boolean DEFAULT false, -- Contact principal de l'organisation
  is_billing_contact boolean DEFAULT false, -- Contact facturation
  is_technical_contact boolean DEFAULT false, -- Contact technique
  is_commercial_contact boolean DEFAULT true, -- Contact commercial (par défaut)

  -- Communication preferences
  preferred_communication_method varchar(20) DEFAULT 'email', -- email, phone, both
  accepts_marketing boolean DEFAULT true,
  accepts_notifications boolean DEFAULT true,
  language_preference varchar(5) DEFAULT 'fr', -- fr, en, es, etc.

  -- Métadonnées
  notes text, -- Notes libres sur le contact
  is_active boolean DEFAULT true,
  last_contact_date timestamptz, -- Dernière interaction

  -- Audit
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Contraintes
  CONSTRAINT contacts_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT contacts_phone_format CHECK (phone IS NULL OR phone ~ '^[+]?[0-9\s\-\.()]{8,20}$'),
  CONSTRAINT contacts_mobile_format CHECK (mobile IS NULL OR mobile ~ '^[+]?[0-9\s\-\.()]{8,20}$'),
  CONSTRAINT contacts_communication_method CHECK (preferred_communication_method IN ('email', 'phone', 'both')),
  CONSTRAINT contacts_language CHECK (language_preference IN ('fr', 'en', 'es', 'de', 'it'))
);

-- =============================================================================
-- 2. INDEX POUR PERFORMANCE
-- =============================================================================

-- Index principal organisation
CREATE INDEX idx_contacts_organisation_id ON contacts(organisation_id);

-- Index pour recherche rapide
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);
CREATE INDEX idx_contacts_active ON contacts(is_active) WHERE is_active = true;

-- Index pour les contacts principaux
CREATE INDEX idx_contacts_primary ON contacts(organisation_id, is_primary_contact) WHERE is_primary_contact = true;

-- Index pour les types de contacts
CREATE INDEX idx_contacts_roles ON contacts(organisation_id, is_billing_contact, is_technical_contact, is_commercial_contact);

-- Index pour la communication
CREATE INDEX idx_contacts_communication ON contacts(preferred_communication_method, accepts_notifications) WHERE is_active = true;

-- =============================================================================
-- 3. CONTRAINTES BUSINESS
-- =============================================================================

-- Un seul contact principal par organisation
CREATE UNIQUE INDEX idx_contacts_unique_primary
ON contacts(organisation_id)
WHERE is_primary_contact = true AND is_active = true;

-- Email unique par organisation (éviter doublons)
CREATE UNIQUE INDEX idx_contacts_unique_email_org
ON contacts(organisation_id, email)
WHERE is_active = true;

-- =============================================================================
-- 4. RLS (ROW LEVEL SECURITY)
-- =============================================================================

-- Activer RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs authentifiés peuvent voir tous les contacts (pour l'instant)
-- TODO: Adapter selon la vraie structure multi-tenant
CREATE POLICY "contacts_authenticated_access" ON contacts
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Policy : Insertion pour utilisateurs authentifiés
CREATE POLICY "contacts_authenticated_insert" ON contacts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- 5. TRIGGERS ET FONCTIONS
-- =============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur mise à jour
CREATE TRIGGER trigger_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Fonction pour valider les contraintes business
CREATE OR REPLACE FUNCTION validate_contact_constraints()
RETURNS trigger AS $$
BEGIN
  -- Vérifier que l'organisation est de type supplier ou customer business
  IF NOT EXISTS (
    SELECT 1 FROM organisations
    WHERE id = NEW.organisation_id
    AND type IN ('supplier', 'customer')
    AND (type != 'customer' OR customer_type IN ('professional', 'business'))
  ) THEN
    RAISE EXCEPTION 'Les contacts ne sont autorisés que pour les fournisseurs et clients professionnels';
  END IF;

  -- Si contact principal, s'assurer qu'il n'y en a qu'un seul actif
  IF NEW.is_primary_contact = true AND NEW.is_active = true THEN
    UPDATE contacts
    SET is_primary_contact = false
    WHERE organisation_id = NEW.organisation_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND is_primary_contact = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de validation
CREATE TRIGGER trigger_validate_contact_constraints
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contact_constraints();

-- =============================================================================
-- 6. VUES UTILITAIRES
-- =============================================================================

-- Vue pour obtenir les contacts avec informations organisation
CREATE OR REPLACE VIEW contacts_with_organisation AS
SELECT
  c.*,
  o.name as organisation_name,
  o.type as organisation_type,
  o.customer_type,
  o.is_active as organisation_active,
  -- Nom complet formaté
  CONCAT(c.first_name, ' ', c.last_name) as full_name,
  -- Email avec nom pour affichage
  CONCAT(c.first_name, ' ', c.last_name, ' <', c.email, '>') as display_email,
  -- Roles concaténés
  CASE
    WHEN c.is_primary_contact THEN 'Principal'
    ELSE ''
  END ||
  CASE
    WHEN c.is_billing_contact THEN
      CASE WHEN c.is_primary_contact THEN ', Facturation' ELSE 'Facturation' END
    ELSE ''
  END ||
  CASE
    WHEN c.is_technical_contact THEN
      CASE WHEN (c.is_primary_contact OR c.is_billing_contact) THEN ', Technique' ELSE 'Technique' END
    ELSE ''
  END ||
  CASE
    WHEN c.is_commercial_contact AND NOT (c.is_primary_contact OR c.is_billing_contact OR c.is_technical_contact) THEN 'Commercial'
    WHEN c.is_commercial_contact THEN ', Commercial'
    ELSE ''
  END as roles_display
FROM contacts c
JOIN organisations o ON c.organisation_id = o.id;

-- =============================================================================
-- 7. DONNÉES DE TEST
-- =============================================================================

-- Ajouter des contacts pour les fournisseurs existants
DO $$
DECLARE
  supplier_record RECORD;
  contact_id uuid;
BEGIN
  -- Pour chaque fournisseur, créer 1-2 contacts
  FOR supplier_record IN
    SELECT id, name FROM organisations WHERE type = 'supplier' LIMIT 3
  LOOP
    -- Contact principal
    INSERT INTO contacts (
      organisation_id, first_name, last_name, title, department,
      email, phone, mobile,
      is_primary_contact, is_commercial_contact, is_billing_contact,
      preferred_communication_method, notes
    ) VALUES (
      supplier_record.id,
      'Jean', 'Dupont', 'Directeur Commercial', 'Commercial',
      'j.dupont@' || LOWER(REPLACE(supplier_record.name, ' ', '-')) || '.fr',
      '01.42.36.85.21', '06.12.34.56.78',
      true, true, true,
      'email',
      'Contact principal - Gestion commandes et facturation'
    );

    -- Contact technique (pour certains fournisseurs)
    IF random() > 0.3 THEN
      INSERT INTO contacts (
        organisation_id, first_name, last_name, title, department,
        email, phone,
        is_primary_contact, is_technical_contact, is_commercial_contact,
        preferred_communication_method, notes
      ) VALUES (
        supplier_record.id,
        'Marie', 'Martin', 'Responsable Technique', 'Production',
        'm.martin@' || LOWER(REPLACE(supplier_record.name, ' ', '-')) || '.fr',
        '01.42.36.85.22',
        false, true, false,
        'phone',
        'Contact technique - Support produits et spécifications'
      );
    END IF;
  END LOOP;

  -- Pour les clients professionnels existants
  FOR supplier_record IN
    SELECT id, name FROM organisations
    WHERE type = 'customer' AND customer_type IN ('professional', 'business')
    LIMIT 2
  LOOP
    -- Contact principal client
    INSERT INTO contacts (
      organisation_id, first_name, last_name, title, department,
      email, phone, mobile,
      is_primary_contact, is_commercial_contact, is_billing_contact,
      preferred_communication_method, accepts_marketing, notes
    ) VALUES (
      supplier_record.id,
      'Pierre', 'Dubois', 'Responsable Achats', 'Achats',
      'achats@' || LOWER(REPLACE(supplier_record.name, ' ', '-')) || '.fr',
      '01.55.44.33.22', '06.23.45.67.89',
      true, true, true,
      'email', true,
      'Contact principal achats - Commandes mobilier'
    );
  END LOOP;
END $$;

-- =============================================================================
-- 8. FONCTIONS UTILITAIRES
-- =============================================================================

-- Fonction pour obtenir le contact principal d'une organisation
CREATE OR REPLACE FUNCTION get_primary_contact(org_id uuid)
RETURNS contacts AS $$
DECLARE
  contact_record contacts;
BEGIN
  SELECT * INTO contact_record
  FROM contacts
  WHERE organisation_id = org_id
  AND is_primary_contact = true
  AND is_active = true
  LIMIT 1;

  RETURN contact_record;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir tous les contacts d'une organisation par rôle
CREATE OR REPLACE FUNCTION get_contacts_by_role(org_id uuid, contact_role text)
RETURNS SETOF contacts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM contacts
  WHERE organisation_id = org_id
  AND is_active = true
  AND (
    (contact_role = 'primary' AND is_primary_contact = true) OR
    (contact_role = 'billing' AND is_billing_contact = true) OR
    (contact_role = 'technical' AND is_technical_contact = true) OR
    (contact_role = 'commercial' AND is_commercial_contact = true)
  )
  ORDER BY is_primary_contact DESC, last_name, first_name;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 appliquée avec succès';
  RAISE NOTICE '📝 Table contacts créée avec RLS et contraintes business';
  RAISE NOTICE '🔗 Liaison avec organisations pour fournisseurs et clients pro';
  RAISE NOTICE '📊 Données de test ajoutées pour %s contacts', (SELECT COUNT(*) FROM contacts);
END $$;