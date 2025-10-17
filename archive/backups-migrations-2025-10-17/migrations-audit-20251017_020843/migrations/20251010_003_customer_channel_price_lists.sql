-- =====================================================================
-- Migration: Customer & Channel Price Lists Associations
-- =====================================================================
-- Date: 2025-10-10
-- Version: 2.0.0
-- Auteur: Claude Code - Vérone Back Office
--
-- Description:
-- Tables de jonction pour associer listes de prix aux clients et canaux
-- Support multi-listes par client/canal avec priorités
-- Best practices : normalized junction tables avec metadata
-- =====================================================================

-- =====================================================================
-- 1. TABLE CUSTOMER_PRICE_LISTS - Association Client ↔ Listes Prix
-- =====================================================================

CREATE TABLE IF NOT EXISTS customer_price_lists (
  -- 🔑 Clé composite
  customer_id UUID NOT NULL,
  customer_type VARCHAR(20) NOT NULL
    CONSTRAINT customer_type_valid CHECK (customer_type IN ('organization', 'individual')),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,

  -- 🔢 Priorité (override celle de la liste)
  priority INTEGER DEFAULT 100
    CONSTRAINT priority_positive CHECK (priority > 0),

  -- 📅 Validité spécifique client
  valid_from DATE,
  valid_until DATE,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,  -- Liste par défaut pour ce client

  -- 📋 Contexte
  assignment_reason TEXT,
  contract_reference VARCHAR(100),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- 🔧 Configuration flexible
  config JSONB DEFAULT '{}',  -- {discount_cap: 0.30, payment_terms: "NET30"}

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  PRIMARY KEY(customer_id, customer_type, price_list_id),
  CONSTRAINT valid_date_range CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  )
);

-- 📈 Index performance
CREATE INDEX idx_customer_price_lists_customer ON customer_price_lists(customer_id, customer_type);
CREATE INDEX idx_customer_price_lists_list ON customer_price_lists(price_list_id);
CREATE INDEX idx_customer_price_lists_active ON customer_price_lists(is_active, priority)
  WHERE is_active = TRUE;
CREATE INDEX idx_customer_price_lists_default ON customer_price_lists(customer_id, customer_type)
  WHERE is_default = TRUE;
CREATE INDEX idx_customer_price_lists_validity ON customer_price_lists(valid_from, valid_until)
  WHERE is_active = TRUE;

-- 💬 Comments
COMMENT ON TABLE customer_price_lists IS
  'Association clients ↔ listes de prix avec support multi-listes et priorités';
COMMENT ON COLUMN customer_price_lists.customer_id IS
  'ID client polymorphic (organisations ou individual_customers)';
COMMENT ON COLUMN customer_price_lists.is_default IS
  'Liste par défaut utilisée si aucune règle spécifique';
COMMENT ON COLUMN customer_price_lists.config IS
  'Configuration JSONB flexible (payment_terms, credit_limit, etc.)';

-- =====================================================================
-- 2. TABLE CHANNEL_PRICE_LISTS - Association Canal ↔ Listes Prix
-- =====================================================================

CREATE TABLE IF NOT EXISTS channel_price_lists (
  -- 🔑 Clé composite
  channel_id UUID NOT NULL REFERENCES sales_channels(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,

  -- 🔢 Priorité
  priority INTEGER DEFAULT 100
    CONSTRAINT priority_positive CHECK (priority > 0),

  -- 📅 Validité spécifique canal
  valid_from DATE,
  valid_until DATE,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  -- 🎯 Segments cibles (optionnel)
  target_segments TEXT[],  -- ['new_customers', 'vip', 'wholesale']
  excluded_segments TEXT[],  -- Segments exclus

  -- 🌍 Géolocalisation (optionnel)
  applicable_regions TEXT[],  -- ['FR', 'BE', 'CH']
  excluded_regions TEXT[],

  -- 💰 Règles métier
  min_order_value DECIMAL(10,2),
  max_discount_allowed DECIMAL(5,4),

  -- 🔧 Configuration
  config JSONB DEFAULT '{}',

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  PRIMARY KEY(channel_id, price_list_id),
  CONSTRAINT valid_date_range CHECK (
    valid_until IS NULL OR valid_until >= valid_from
  )
);

-- 📈 Index performance
CREATE INDEX idx_channel_price_lists_channel ON channel_price_lists(channel_id);
CREATE INDEX idx_channel_price_lists_list ON channel_price_lists(price_list_id);
CREATE INDEX idx_channel_price_lists_active ON channel_price_lists(is_active, priority)
  WHERE is_active = TRUE;
CREATE INDEX idx_channel_price_lists_default ON channel_price_lists(channel_id)
  WHERE is_default = TRUE;
CREATE INDEX idx_channel_price_lists_validity ON channel_price_lists(valid_from, valid_until)
  WHERE is_active = TRUE;

COMMENT ON TABLE channel_price_lists IS
  'Association canaux ↔ listes de prix avec règles métier par canal';
COMMENT ON COLUMN channel_price_lists.target_segments IS
  'Segments clients ciblés pour cette combinaison canal/liste';
COMMENT ON COLUMN channel_price_lists.applicable_regions IS
  'Régions où cette liste est applicable (codes ISO)';

-- =====================================================================
-- 3. TABLE CUSTOMER_GROUPS - Groupes Clients (B2B, VIP, etc.)
-- =====================================================================

CREATE TABLE IF NOT EXISTS customer_groups (
  -- 🔑 Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'B2B_GOLD', 'VIP', 'WHOLESALE'
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- 🎯 Type groupe
  group_type VARCHAR(30) NOT NULL
    CONSTRAINT group_type_valid CHECK (group_type IN (
      'tier',      -- Niveau (Bronze, Silver, Gold)
      'segment',   -- Segment marché (B2B, B2C)
      'industry',  -- Secteur activité
      'volume',    -- Volume achat
      'custom'     -- Personnalisé
    )),

  -- 📊 Critères automatiques (optionnel)
  auto_assignment_rules JSONB DEFAULT '{}',  -- Règles assignment auto
  min_annual_revenue DECIMAL(12,2),
  min_orders_per_year INTEGER,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,

  -- 🔢 Membres
  member_count INTEGER DEFAULT 0,  -- Dénormalisé pour performance

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 📈 Index
CREATE INDEX idx_customer_groups_code ON customer_groups(code);
CREATE INDEX idx_customer_groups_type ON customer_groups(group_type);
CREATE INDEX idx_customer_groups_active ON customer_groups(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE customer_groups IS
  'Groupes clients pour segmentation et pricing (B2B, VIP, etc.)';

-- =====================================================================
-- 4. TABLE CUSTOMER_GROUP_MEMBERS - Membres des Groupes
-- =====================================================================

CREATE TABLE IF NOT EXISTS customer_group_members (
  -- 🔑 Relations
  group_id UUID NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  customer_type VARCHAR(20) NOT NULL
    CONSTRAINT customer_type_valid CHECK (customer_type IN ('organization', 'individual')),

  -- 📅 Appartenance
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,

  -- 📝 Contexte
  assignment_method VARCHAR(30),  -- 'manual', 'automatic', 'import'
  notes TEXT,

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  PRIMARY KEY(group_id, customer_id, customer_type)
);

-- 📈 Index
CREATE INDEX idx_group_members_customer ON customer_group_members(customer_id, customer_type);
CREATE INDEX idx_group_members_group ON customer_group_members(group_id)
  WHERE is_active = TRUE;

-- =====================================================================
-- 5. TABLE GROUP_PRICE_LISTS - Listes Prix par Groupe
-- =====================================================================

CREATE TABLE IF NOT EXISTS group_price_lists (
  -- 🔑 Relations
  group_id UUID NOT NULL REFERENCES customer_groups(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,

  -- 🔢 Priorité
  priority INTEGER DEFAULT 100,

  -- 📅 Validité
  valid_from DATE,
  valid_until DATE,

  -- ⚙️ État
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  -- 🕐 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  PRIMARY KEY(group_id, price_list_id)
);

-- 📈 Index
CREATE INDEX idx_group_price_lists_group ON group_price_lists(group_id);
CREATE INDEX idx_group_price_lists_list ON group_price_lists(price_list_id);
CREATE INDEX idx_group_price_lists_active ON group_price_lists(is_active, priority)
  WHERE is_active = TRUE;

-- =====================================================================
-- 6. TRIGGERS - Automatisations
-- =====================================================================

-- ⚡ Trigger updated_at
CREATE TRIGGER customer_price_lists_updated_at
  BEFORE UPDATE ON customer_price_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER channel_price_lists_updated_at
  BEFORE UPDATE ON channel_price_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customer_groups_updated_at
  BEFORE UPDATE ON customer_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ⚡ Trigger unique default par customer
CREATE OR REPLACE FUNCTION ensure_single_default_customer_list()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE customer_price_lists
    SET is_default = FALSE
    WHERE customer_id = NEW.customer_id
      AND customer_type = NEW.customer_type
      AND price_list_id != NEW.price_list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_customer
  AFTER INSERT OR UPDATE ON customer_price_lists
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_customer_list();

-- ⚡ Trigger unique default par channel
CREATE OR REPLACE FUNCTION ensure_single_default_channel_list()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE channel_price_lists
    SET is_default = FALSE
    WHERE channel_id = NEW.channel_id
      AND price_list_id != NEW.price_list_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_channel
  AFTER INSERT OR UPDATE ON channel_price_lists
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_channel_list();

-- ⚡ Trigger update member_count sur customer_groups
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customer_groups
  SET member_count = (
    SELECT COUNT(*)
    FROM customer_group_members
    WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
      AND is_active = TRUE
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.group_id, OLD.group_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_count
  AFTER INSERT OR UPDATE OR DELETE ON customer_group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================

-- 🔒 Enable RLS
ALTER TABLE customer_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_price_lists ENABLE ROW LEVEL SECURITY;

-- 🔓 Policies customer_price_lists
CREATE POLICY "customer_price_lists_select" ON customer_price_lists
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "customer_price_lists_manage" ON customer_price_lists
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- 🔓 Policies channel_price_lists
CREATE POLICY "channel_price_lists_select" ON channel_price_lists
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "channel_price_lists_manage" ON channel_price_lists
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin', 'catalog_manager'))
  WITH CHECK (get_user_role() IN ('owner', 'admin', 'catalog_manager'));

-- 🔓 Policies customer_groups
CREATE POLICY "customer_groups_select" ON customer_groups
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "customer_groups_manage" ON customer_groups
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- 🔓 Policies members
CREATE POLICY "group_members_select" ON customer_group_members
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "group_members_manage" ON customer_group_members
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- 🔓 Policies group lists
CREATE POLICY "group_price_lists_select" ON group_price_lists
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "group_price_lists_manage" ON group_price_lists
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- =====================================================================
-- 8. SEED DATA - Groupes Clients par Défaut
-- =====================================================================

INSERT INTO customer_groups (code, name, description, group_type, is_active) VALUES
  ('B2B_STANDARD', 'B2B Standard', 'Clients professionnels standard', 'segment', TRUE),
  ('B2B_GOLD', 'B2B Gold', 'Clients professionnels premium', 'tier', TRUE),
  ('B2B_PLATINUM', 'B2B Platinum', 'Clients professionnels VIP', 'tier', TRUE),
  ('WHOLESALE', 'Grossistes', 'Revendeurs et grossistes', 'segment', TRUE),
  ('RETAIL', 'Détaillants', 'Boutiques et détaillants', 'segment', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 9. VALIDATION
-- =====================================================================

DO $$
DECLARE
  v_tables_created INTEGER;
  v_groups_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'customer_price_lists', 'channel_price_lists',
      'customer_groups', 'customer_group_members', 'group_price_lists'
    );

  SELECT COUNT(*) INTO v_groups_created
  FROM customer_groups;

  RAISE NOTICE '✅ Migration 20251010_003 terminée avec succès';
  RAISE NOTICE '📊 Tables créées: %', v_tables_created;
  RAISE NOTICE '👥 Groupes clients créés: %', v_groups_created;
  RAISE NOTICE '🔧 Triggers unicité et comptage créés';
  RAISE NOTICE '🔒 RLS policies activées';
  RAISE NOTICE '📈 Index performance optimisés';
END $$;