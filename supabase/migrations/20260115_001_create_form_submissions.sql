-- Table centrale pour TOUS les types de formulaires de contact
-- Architecture extensible supportant N types de formulaires sans migration
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type de formulaire (extensible via form_types table)
  form_type TEXT NOT NULL, -- 'selection_inquiry', 'account_request', 'sav_request', etc.

  -- Source multi-canal
  source TEXT NOT NULL CHECK (source IN ('linkme', 'website', 'backoffice', 'other')),
  source_reference_id UUID, -- ID contextuel : selection_id, order_id, product_id, etc.
  source_reference_name TEXT, -- Nom lisible : nom sélection, numéro commande, etc.

  -- Informations contact
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT, -- Optionnel
  role TEXT, -- Optionnel

  -- Contenu
  subject TEXT, -- Sujet (optionnel selon le type de formulaire)
  message TEXT NOT NULL,

  -- Catégorisation (extensible)
  primary_category TEXT, -- 'order', 'product_info', 'account', 'support', 'sav', etc.
  tags TEXT[], -- Tags multiples : ['urgent', 'wholesale', 'custom_product', ...]

  -- Workflow
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'open', 'pending', 'replied', 'closed', 'spam')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- SLA (Service Level Agreement)
  sla_deadline TIMESTAMPTZ, -- Calculé automatiquement selon primary_category

  -- Notes internes
  internal_notes TEXT,

  -- Conversion (polymorphique)
  converted_to_type TEXT CHECK (converted_to_type IN ('consultation', 'order', 'sourcing', 'contact', 'lead', null)),
  converted_to_id UUID, -- ID de la ressource créée
  converted_at TIMESTAMPTZ,

  -- Métadonnées JSON (flexible pour chaque type de formulaire)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  first_reply_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_form_submissions_form_type ON form_submissions(form_type);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_source ON form_submissions(source);
CREATE INDEX idx_form_submissions_category ON form_submissions(primary_category);
CREATE INDEX idx_form_submissions_priority ON form_submissions(priority);
CREATE INDEX idx_form_submissions_assigned ON form_submissions(assigned_to);
CREATE INDEX idx_form_submissions_created ON form_submissions(created_at DESC);
CREATE INDEX idx_form_submissions_email ON form_submissions(email);
CREATE INDEX idx_form_submissions_tags ON form_submissions USING GIN(tags);
CREATE INDEX idx_form_submissions_metadata ON form_submissions USING GIN(metadata);

COMMENT ON TABLE form_submissions IS 'Extensible table for all types of contact forms (Selection, Account Request, SAV, etc.)';
COMMENT ON COLUMN form_submissions.form_type IS 'Type code from form_types table';
COMMENT ON COLUMN form_submissions.source IS 'Origin of the submission: linkme, website, backoffice, other';
COMMENT ON COLUMN form_submissions.source_reference_id IS 'Context ID: selection_id, order_id, product_id, etc.';
COMMENT ON COLUMN form_submissions.source_reference_name IS 'Human-readable context: selection name, order number, etc.';
COMMENT ON COLUMN form_submissions.metadata IS 'Flexible JSON data specific to each form type (user_agent, ip, custom fields, etc.)';
COMMENT ON COLUMN form_submissions.converted_to_type IS 'Type of resource created from this submission';
COMMENT ON COLUMN form_submissions.converted_to_id IS 'ID of the created resource (consultation, order, sourcing, etc.)';
