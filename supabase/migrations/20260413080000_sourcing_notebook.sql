-- [BO-PROD-SOURCING] Sourcing Notebook — 5 tables + supplier enrichment
-- Context: Verone sources products via Alibaba, salons, contacts.
-- The sourcing workflow needs tracking: communications, price negotiations,
-- multi-supplier comparison, URLs, and photos — all linked to existing products.
-- Products with creation_mode='sourcing' are sourcing items.
-- The "carnet de sourcing" enriches these products with structured data.

BEGIN;

-- ============================================================
-- 1. ENRICHIR organisations (canaux communication fournisseur)
-- ============================================================

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS preferred_comm_channel TEXT,
  ADD COLUMN IF NOT EXISTS wechat_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS alibaba_store_url TEXT,
  ADD COLUMN IF NOT EXISTS supplier_specialties TEXT[],
  ADD COLUMN IF NOT EXISTS supplier_reliability_score INTEGER CHECK (supplier_reliability_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS communication_language TEXT DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS supplier_timezone TEXT;

COMMENT ON COLUMN organisations.preferred_comm_channel IS 'Preferred channel: alibaba, wechat, whatsapp, email, phone';
COMMENT ON COLUMN organisations.supplier_reliability_score IS 'Reliability score 1-5 (manual rating)';

-- ============================================================
-- 2. sourcing_urls — URLs fournisseur par produit
-- ============================================================

CREATE TABLE IF NOT EXISTS sourcing_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('alibaba', 'global_sources', '1688', 'made_in_china', 'website', 'instagram', 'pinterest', 'other')),
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sourcing_urls_product ON sourcing_urls(product_id);

ALTER TABLE sourcing_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_sourcing_urls" ON sourcing_urls FOR ALL TO authenticated USING (is_backoffice_user());

-- ============================================================
-- 3. sourcing_photos — Photos brutes (catalogue fournisseur, échantillons)
-- ============================================================

CREATE TABLE IF NOT EXISTS sourcing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  photo_type TEXT NOT NULL CHECK (photo_type IN (
    'supplier_catalog', 'sample_received', 'sample_defect',
    'client_reference', 'salon_photo', 'screenshot'
  )),
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sourcing_photos_product ON sourcing_photos(product_id);

ALTER TABLE sourcing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_sourcing_photos" ON sourcing_photos FOR ALL TO authenticated USING (is_backoffice_user());

-- ============================================================
-- 4. sourcing_communications — Journal de communication
-- ============================================================

CREATE TABLE IF NOT EXISTS sourcing_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  -- Communication
  channel TEXT NOT NULL CHECK (channel IN (
    'alibaba', 'wechat', 'whatsapp', 'email', 'phone', 'salon', 'other'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  summary TEXT NOT NULL,
  contact_name TEXT,
  -- Attachments stored as JSONB array [{storage_path, filename, type}]
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Follow-up
  next_action TEXT,
  follow_up_date DATE,
  is_resolved BOOLEAN DEFAULT false,
  -- Meta
  communicated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sourcing_comms_product ON sourcing_communications(product_id);
CREATE INDEX idx_sourcing_comms_supplier ON sourcing_communications(supplier_id);
CREATE INDEX idx_sourcing_comms_followup ON sourcing_communications(follow_up_date) WHERE follow_up_date IS NOT NULL AND is_resolved = false;

ALTER TABLE sourcing_communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_sourcing_comms" ON sourcing_communications FOR ALL TO authenticated USING (is_backoffice_user());

-- Trigger updated_at
CREATE TRIGGER trigger_sourcing_comms_updated_at
  BEFORE UPDATE ON sourcing_communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. sourcing_price_history — Historique des prix négociés
-- ============================================================

CREATE TABLE IF NOT EXISTS sourcing_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  quantity INTEGER,
  proposed_by TEXT CHECK (proposed_by IN ('supplier', 'verone')),
  notes TEXT,
  negotiated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sourcing_prices_product ON sourcing_price_history(product_id);

ALTER TABLE sourcing_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_sourcing_prices" ON sourcing_price_history FOR ALL TO authenticated USING (is_backoffice_user());

-- ============================================================
-- 6. sourcing_candidate_suppliers — Fournisseurs candidats par produit
-- ============================================================

CREATE TABLE IF NOT EXISTS sourcing_candidate_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'identified' CHECK (status IN (
    'identified', 'contacted', 'responded', 'shortlisted', 'selected', 'rejected'
  )),
  response_date TIMESTAMPTZ,
  quoted_price NUMERIC(10,2),
  quoted_moq INTEGER,
  quoted_lead_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

CREATE INDEX idx_sourcing_candidates_product ON sourcing_candidate_suppliers(product_id);

ALTER TABLE sourcing_candidate_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_full_access_sourcing_candidates" ON sourcing_candidate_suppliers FOR ALL TO authenticated USING (is_backoffice_user());

CREATE TRIGGER trigger_sourcing_candidates_updated_at
  BEFORE UPDATE ON sourcing_candidate_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. Enrichir products avec colonnes sourcing pipeline
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sourcing_status TEXT DEFAULT 'need_identified' CHECK (sourcing_status IN (
    'need_identified', 'supplier_search', 'initial_contact',
    'evaluation', 'negotiation', 'sample_requested',
    'sample_received', 'sample_approved', 'sample_rejected',
    'order_placed', 'received', 'on_hold', 'cancelled'
  )),
  ADD COLUMN IF NOT EXISTS sourcing_priority TEXT DEFAULT 'medium' CHECK (sourcing_priority IN ('low', 'medium', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS sourcing_tags TEXT[],
  ADD COLUMN IF NOT EXISTS consultation_id UUID REFERENCES client_consultations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sourcing_notes TEXT;

CREATE INDEX idx_products_sourcing_status ON products(sourcing_status) WHERE creation_mode = 'sourcing';
CREATE INDEX idx_products_consultation ON products(consultation_id) WHERE consultation_id IS NOT NULL;

COMMENT ON COLUMN products.sourcing_status IS 'Pipeline stage for sourcing products (10-step workflow)';
COMMENT ON COLUMN products.sourcing_priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN products.sourcing_tags IS 'Free-form tags for sourcing (e.g. Maison&Objet 2026, Best-seller)';
COMMENT ON COLUMN products.consultation_id IS 'Link to client consultation if sourcing is client-driven';
COMMENT ON COLUMN products.target_price IS 'Target cost price for negotiation';

COMMIT;
