-- Table de configuration des types de formulaires (extensible sans migration)
-- Permet d'ajouter de nouveaux types de formulaires via INSERT sans modifier le schema
CREATE TABLE form_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  code TEXT UNIQUE NOT NULL, -- 'selection_inquiry', 'account_request', etc.
  label TEXT NOT NULL, -- 'Contact Sélection', 'Demande de Compte', etc.
  description TEXT,

  -- Configuration
  enabled BOOLEAN DEFAULT true,
  icon TEXT, -- Nom d'icône Lucide : 'ShoppingCart', 'UserPlus', 'Wrench', etc.
  color TEXT, -- Couleur badge : 'blue', 'green', 'orange', etc.

  -- Workflow par défaut
  default_category TEXT, -- Catégorie primaire par défaut
  default_priority TEXT CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
  sla_hours INTEGER, -- SLA en heures (24h, 48h, 1h, etc.)

  -- Configuration des champs (JSON flexible)
  required_fields JSONB DEFAULT '["first_name", "last_name", "email", "phone", "message"]'::jsonb,
  optional_fields JSONB DEFAULT '["company", "role", "subject"]'::jsonb,

  -- Règles de routage (JSON flexible)
  routing_rules JSONB DEFAULT '{}'::jsonb, -- Règles d'assignation automatique

  -- Auto-conversions (JSON flexible)
  conversion_config JSONB DEFAULT '{}'::jsonb, -- Configuration des conversions possibles

  -- Métadonnées
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_form_types_code ON form_types(code);
CREATE INDEX idx_form_types_enabled ON form_types(enabled) WHERE enabled = true;

COMMENT ON TABLE form_types IS 'Configuration table for extensible form types - add new types without migrations';
COMMENT ON COLUMN form_types.code IS 'Unique identifier used in form components (e.g., "selection_inquiry")';
COMMENT ON COLUMN form_types.routing_rules IS 'JSON config for auto-assignment: {territory, product_category, budget_threshold, etc.}';
COMMENT ON COLUMN form_types.conversion_config IS 'JSON config for available conversions: {allow_consultation: true, allow_order: false, ...}';

-- Seed des types de formulaires initiaux (MVP = selection_inquiry)
INSERT INTO form_types (code, label, description, default_category, default_priority, sla_hours, icon, color, conversion_config) VALUES
(
  'selection_inquiry',
  'Contact Sélection',
  'Demande concernant une sélection de produits LinkMe (commande, question produit)',
  'order',
  'high',
  24,
  'ShoppingCart',
  'blue',
  '{"allow_order": true, "allow_consultation": true, "allow_sourcing": true}'::jsonb
),
(
  'account_request',
  'Demande de Compte',
  'Demande d''ouverture de compte client/affilié (onboarding assisté)',
  'account',
  'high',
  48,
  'UserPlus',
  'green',
  '{"allow_contact": true, "allow_lead": true}'::jsonb
),
(
  'sav_request',
  'SAV / Réclamation',
  'Service après-vente, retour, réclamation produit',
  'sav',
  'urgent',
  4,
  'AlertTriangle',
  'red',
  '{}'::jsonb
),
(
  'product_inquiry',
  'Question Produit',
  'Demande d''information sur un produit (disponibilité, caractéristiques)',
  'product_info',
  'medium',
  48,
  'Package',
  'purple',
  '{"allow_consultation": true}'::jsonb
),
(
  'consultation_request',
  'Demande de Consultation',
  'Demande de devis ou consultation projet',
  'consultation',
  'high',
  24,
  'FileText',
  'orange',
  '{"allow_consultation": true}'::jsonb
),
(
  'technical_support',
  'Support Technique',
  'Problème technique, bug, aide utilisation',
  'support',
  'medium',
  24,
  'Wrench',
  'gray',
  '{}'::jsonb
),
(
  'general_inquiry',
  'Demande Générale',
  'Autre demande ou feedback',
  'general',
  'low',
  72,
  'Mail',
  'slate',
  '{}'::jsonb
);
