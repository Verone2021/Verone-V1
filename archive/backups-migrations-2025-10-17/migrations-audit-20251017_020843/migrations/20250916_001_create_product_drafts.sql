-- Migration: Création table product_drafts pour wizard de création produits
-- Date: 2025-09-16
-- Description: Support des brouillons avec sauvegarde progressive

-- Table pour les brouillons de produits avec toutes les étapes du wizard
CREATE TABLE IF NOT EXISTS product_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Métadonnées wizard
  wizard_step_completed INTEGER DEFAULT 0,

  -- Étape 1: Informations générales
  name TEXT,
  description TEXT,
  sku TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),

  -- Étape 2: Catégorisation
  family_id UUID REFERENCES families(id),
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  product_group_id UUID REFERENCES product_groups(id),

  -- Étape 3: Caractéristiques
  color TEXT,
  material TEXT,
  dimensions JSONB DEFAULT '{}',
  weight DECIMAL(10,3),

  -- Étape 4: Tarification (CORRECTION des champs)
  supplier_price DECIMAL(10,2), -- Prix d'achat fournisseur (sera mappé vers cost_price)
  selling_price DECIMAL(10,2),  -- Prix de vente Vérone (sera mappé vers price_ht)
  tax_rate DECIMAL(5,2) DEFAULT 20.00,

  -- Champs de compatibilité pour transition
  cost_price DECIMAL(10,2),     -- Compatibility field
  price_ht DECIMAL(10,2),       -- Compatibility field

  -- Étape 5: Stock et statut
  condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'refurbished', 'used')),
  stock_quantity INTEGER,
  min_stock_level INTEGER,
  supplier_reference TEXT,
  gtin TEXT,

  -- Étape 6: Images
  primary_image_url TEXT,
  gallery_images JSONB DEFAULT '[]',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Index pour performance
  CONSTRAINT unique_draft_sku_per_user UNIQUE (sku, created_by)
);

-- RLS pour les brouillons (utilisateur peut voir seulement ses brouillons)
ALTER TABLE product_drafts ENABLE ROW LEVEL SECURITY;

-- Politique: Utilisateurs peuvent voir/éditer seulement leurs brouillons
CREATE POLICY "users_own_drafts" ON product_drafts
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Index pour performance sur les requêtes fréquentes
CREATE INDEX idx_product_drafts_user ON product_drafts(created_by);
CREATE INDEX idx_product_drafts_updated ON product_drafts(updated_at DESC);
CREATE INDEX idx_product_drafts_wizard_step ON product_drafts(wizard_step_completed);

-- Trigger pour mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_product_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_drafts_updated_at
  BEFORE UPDATE ON product_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_product_drafts_updated_at();

-- Fonction pour nettoyer les anciens brouillons (>30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_product_drafts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM product_drafts
  WHERE updated_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE product_drafts IS 'Brouillons de produits pour wizard de création avec sauvegarde progressive';
COMMENT ON COLUMN product_drafts.wizard_step_completed IS 'Dernière étape complétée du wizard (1-7)';
COMMENT ON COLUMN product_drafts.supplier_price IS 'Prix d''achat fournisseur (sera mappé vers cost_price lors création finale)';
COMMENT ON COLUMN product_drafts.selling_price IS 'Prix de vente Vérone (sera mappé vers price_ht lors création finale)';
COMMENT ON FUNCTION cleanup_old_product_drafts() IS 'Nettoie les brouillons non modifiés depuis 30 jours';