-- =====================================================================
-- Migration: Système Price Lists Scalable - Core Tables
-- =====================================================================
-- Date: 2025-10-10
-- Version: 2.0.0
-- Auteur: Claude Code - Vérone Back Office
--
-- Description:
-- Implémentation système de listes de prix selon best practices 2024:
-- - Séparation complète products / pricing
-- - Support multi-listes par client/canal
-- - Paliers quantités natifs
-- - Priorités pour résolution prix optimal
-- - Co-location ready pour sharding futur
--
-- Best Practices Applied:
-- - Normalized structure (3NF)
-- - Composite indexes for performance
-- - Table partitioning ready
-- - JSONB for future flexibility
-- - Audit trail built-in
-- =====================================================================

-- =====================================================================
-- 1. TABLE PRICE_LISTS - Définition des Listes de Prix
-- =====================================================================

CREATE TABLE IF NOT EXISTS price_lists (
  -- 🔑 Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'CATALOG_2025', 'B2B_STANDARD', 'VIP_GOLD'

  -- 📝 Description
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- 🎯 Type et Configuration
  list_type VARCHAR(30) NOT NULL
    CONSTRAINT list_type_valid CHECK (list_type IN (
      'base',           -- Prix catalogue de référence
      'customer_group', -- Prix groupe clients (B2B, VIP, etc.)
      'channel',        -- Prix par canal (retail, wholesale, etc.)
      'promotional',    -- Prix promotionnels temporaires
      'contract'        -- Prix contractuels négociés
    )),

  -- 🔢 Priorité (1 = plus haute priorité)
  priority INTEGER NOT NULL DEFAULT 100
    CONSTRAINT priority_positive CHECK (priority > 0),

  -- 💰 Configuration Pricing
  currency VARCHAR(3) DEFAULT 'EUR'
    CONSTRAINT currency_valid CHECK (currency ~ '^[A-Z]{3}$'),
  includes_tax BOOLEAN DEFAULT FALSE,

  -- 📅 Validité temporelle
  valid_from DATE,
  valid_until DATE,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,

  -- 🔧 Configuration flexible (JSONB pour extensibilité)
  config JSONB DEFAULT '{}',  -- {min_order_value, max_discount_rate, etc.}

  -- 📊 Métriques
  product_count INTEGER DEFAULT 0,  -- Dénormalisé pour performance

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  CONSTRAINT valid_date_range CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  )
);

-- 📈 Index performance
CREATE INDEX idx_price_lists_code ON price_lists(code);
CREATE INDEX idx_price_lists_type ON price_lists(list_type);
CREATE INDEX idx_price_lists_active ON price_lists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_price_lists_priority ON price_lists(priority);
CREATE INDEX idx_price_lists_validity ON price_lists(valid_from, valid_until)
  WHERE is_active = TRUE;

-- 💬 Comments documentation
COMMENT ON TABLE price_lists IS
  'Listes de prix centralisées - Support multi-canal, multi-client avec priorités';
COMMENT ON COLUMN price_lists.code IS
  'Code unique liste (ex: CATALOG_2025, B2B_GOLD, PROMO_WINTER)';
COMMENT ON COLUMN price_lists.list_type IS
  'Type: base|customer_group|channel|promotional|contract';
COMMENT ON COLUMN price_lists.priority IS
  'Priorité résolution (1=max). Prix avec priorité haute gagne';
COMMENT ON COLUMN price_lists.config IS
  'Configuration flexible JSONB pour règles futures';

-- =====================================================================
-- 2. TABLE PRICE_LIST_ITEMS - Prix par Produit et Liste
-- =====================================================================

CREATE TABLE IF NOT EXISTS price_list_items (
  -- 🔑 Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🔗 Relations
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- 💰 Prix
  price_ht DECIMAL(12,2) NOT NULL
    CONSTRAINT price_positive CHECK (price_ht > 0),

  -- 🎯 Prix alternatifs (optionnels)
  cost_price DECIMAL(12,2)
    CONSTRAINT cost_positive CHECK (cost_price IS NULL OR cost_price > 0),
  suggested_retail_price DECIMAL(12,2)
    CONSTRAINT srp_positive CHECK (suggested_retail_price IS NULL OR suggested_retail_price > 0),

  -- 📦 Paliers quantités
  min_quantity INTEGER DEFAULT 1
    CONSTRAINT min_qty_positive CHECK (min_quantity > 0),
  max_quantity INTEGER
    CONSTRAINT max_qty_valid CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),

  -- 💱 Multi-devise (override liste)
  currency VARCHAR(3),

  -- 🏷️ Remises et marges
  discount_rate DECIMAL(5,4)
    CONSTRAINT discount_valid CHECK (
      discount_rate IS NULL OR (discount_rate >= 0 AND discount_rate <= 1)
    ),
  margin_rate DECIMAL(5,4)
    CONSTRAINT margin_valid CHECK (
      margin_rate IS NULL OR (margin_rate >= -1 AND margin_rate <= 10)
    ),

  -- 📅 Validité spécifique item (override liste)
  valid_from DATE,
  valid_until DATE,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,

  -- 📝 Métadonnées
  notes TEXT,
  tags TEXT[],

  -- 🔧 Données flexibles
  attributes JSONB DEFAULT '{}',  -- Attributs custom par item

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  CONSTRAINT unique_price_tier UNIQUE(price_list_id, product_id, min_quantity),
  CONSTRAINT valid_item_dates CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  ),
  CONSTRAINT quantity_range_valid CHECK (
    max_quantity IS NULL OR max_quantity > min_quantity
  )
);

-- 📈 Index performance critiques
CREATE INDEX idx_price_items_lookup ON price_list_items(product_id, price_list_id, min_quantity)
  WHERE is_active = TRUE;
CREATE INDEX idx_price_items_list ON price_list_items(price_list_id)
  WHERE is_active = TRUE;
CREATE INDEX idx_price_items_product ON price_list_items(product_id)
  WHERE is_active = TRUE;
CREATE INDEX idx_price_items_validity ON price_list_items(valid_from, valid_until)
  WHERE is_active = TRUE;
CREATE INDEX idx_price_items_quantity ON price_list_items(min_quantity, max_quantity);

-- Index BRIN pour historique (si table devient très large)
CREATE INDEX idx_price_items_created_brin ON price_list_items USING BRIN(created_at);

-- 💬 Comments
COMMENT ON TABLE price_list_items IS
  'Items de prix par produit et liste - Support paliers quantités et multi-devise';
COMMENT ON COLUMN price_list_items.min_quantity IS
  'Quantité minimum pour ce prix (palier)';
COMMENT ON COLUMN price_list_items.max_quantity IS
  'Quantité maximum pour ce prix (NULL = infini)';
COMMENT ON COLUMN price_list_items.attributes IS
  'Attributs JSONB flexibles (ex: {lead_time_days: 7, moq_override: 10})';

-- =====================================================================
-- 3. TABLE PRICE_LIST_HISTORY - Historique Prix (Audit Trail)
-- =====================================================================

CREATE TABLE IF NOT EXISTS price_list_history (
  -- 🔑 Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🔗 Relations
  price_list_item_id UUID REFERENCES price_list_items(id) ON DELETE SET NULL,
  price_list_id UUID NOT NULL,
  product_id UUID NOT NULL,

  -- 💰 Prix historique
  price_ht_before DECIMAL(12,2),
  price_ht_after DECIMAL(12,2) NOT NULL,

  -- 🔄 Type changement
  change_type VARCHAR(20) NOT NULL
    CONSTRAINT change_type_valid CHECK (change_type IN (
      'create', 'update', 'delete', 'import', 'bulk_update'
    )),
  change_reason TEXT,

  -- 📦 Contexte palier
  min_quantity INTEGER,
  max_quantity INTEGER,

  -- 🕐 Timestamps
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),

  -- 📊 Métadonnées
  ip_address INET,
  user_agent TEXT,
  source VARCHAR(50)  -- 'admin_ui', 'api', 'import', 'scheduled'
);

-- Index pour requêtes historique
CREATE INDEX idx_history_product ON price_list_history(product_id, changed_at DESC);
CREATE INDEX idx_history_list ON price_list_history(price_list_id, changed_at DESC);
CREATE INDEX idx_history_date ON price_list_history(changed_at DESC);

COMMENT ON TABLE price_list_history IS
  'Historique complet changements prix pour audit et analyse';

-- =====================================================================
-- 4. TRIGGERS - Automatisations
-- =====================================================================

-- ⚡ Trigger updated_at automatique
CREATE TRIGGER price_lists_updated_at
  BEFORE UPDATE ON price_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER price_list_items_updated_at
  BEFORE UPDATE ON price_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ⚡ Trigger historique prix
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO price_list_history (
      price_list_item_id, price_list_id, product_id,
      price_ht_after, change_type, min_quantity, max_quantity,
      changed_by, source
    ) VALUES (
      NEW.id, NEW.price_list_id, NEW.product_id,
      NEW.price_ht, 'create', NEW.min_quantity, NEW.max_quantity,
      NEW.created_by, 'admin_ui'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.price_ht != NEW.price_ht THEN
    INSERT INTO price_list_history (
      price_list_item_id, price_list_id, product_id,
      price_ht_before, price_ht_after, change_type,
      min_quantity, max_quantity, changed_by, source
    ) VALUES (
      NEW.id, NEW.price_list_id, NEW.product_id,
      OLD.price_ht, NEW.price_ht, 'update',
      NEW.min_quantity, NEW.max_quantity, NEW.updated_by, 'admin_ui'
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO price_list_history (
      price_list_item_id, price_list_id, product_id,
      price_ht_before, price_ht_after, change_type,
      min_quantity, max_quantity, source
    ) VALUES (
      OLD.id, OLD.price_list_id, OLD.product_id,
      OLD.price_ht, 0, 'delete',
      OLD.min_quantity, OLD.max_quantity, 'admin_ui'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_price_changes
  AFTER INSERT OR UPDATE OR DELETE ON price_list_items
  FOR EACH ROW EXECUTE FUNCTION log_price_change();

-- ⚡ Trigger update product_count sur price_lists
CREATE OR REPLACE FUNCTION update_price_list_product_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE price_lists
  SET product_count = (
    SELECT COUNT(DISTINCT product_id)
    FROM price_list_items
    WHERE price_list_id = COALESCE(NEW.price_list_id, OLD.price_list_id)
      AND is_active = TRUE
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.price_list_id, OLD.price_list_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_count
  AFTER INSERT OR UPDATE OR DELETE ON price_list_items
  FOR EACH ROW EXECUTE FUNCTION update_price_list_product_count();

-- =====================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- 🔒 Enable RLS
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_history ENABLE ROW LEVEL SECURITY;

-- 🔓 Policies price_lists
CREATE POLICY "price_lists_select_authenticated" ON price_lists
  FOR SELECT TO authenticated
  USING (TRUE);  -- Tous peuvent voir les listes

CREATE POLICY "price_lists_manage_admin" ON price_lists
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin', 'catalog_manager'))
  WITH CHECK (get_user_role() IN ('owner', 'admin', 'catalog_manager'));

-- 🔓 Policies price_list_items
CREATE POLICY "price_items_select_authenticated" ON price_list_items
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "price_items_manage_admin" ON price_list_items
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin', 'catalog_manager'))
  WITH CHECK (get_user_role() IN ('owner', 'admin', 'catalog_manager'));

-- 🔓 Policies price_list_history (lecture seule)
CREATE POLICY "price_history_select_admin" ON price_list_history
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('owner', 'admin'));

-- =====================================================================
-- 6. SEED DATA - Liste de Prix de Base
-- =====================================================================

INSERT INTO price_lists (
  code, name, description, list_type, priority, currency, is_active
) VALUES (
  'CATALOG_BASE_2025',
  'Catalogue Base 2025',
  'Prix catalogue de référence pour tous les produits Vérone',
  'base',
  1000,  -- Priorité basse (fallback)
  'EUR',
  TRUE
) ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 7. VALIDATION & REPORTING
-- =====================================================================

DO $$
DECLARE
  v_tables_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('price_lists', 'price_list_items', 'price_list_history');

  RAISE NOTICE '✅ Migration 20251010_002 terminée avec succès';
  RAISE NOTICE '📊 Tables créées: %', v_tables_created;
  RAISE NOTICE '🔧 Triggers historique et comptage créés';
  RAISE NOTICE '🔒 RLS policies activées';
  RAISE NOTICE '📈 Index performance optimisés';
  RAISE NOTICE '🌱 Liste BASE créée (CATALOG_BASE_2025)';
END $$;