-- =====================================================================
-- Migration: Système Pricing Multi-Canaux & Clients - Phase 1
-- =====================================================================
-- Date: 2025-10-10
-- Auteur: Claude Code - Vérone Back Office
-- Version: 1.0.0
--
-- Description:
-- Implémentation complète système de pricing flexible avec support:
-- - Canaux de vente (retail, wholesale, ecommerce, b2b)
-- - Prix par canal (channel_pricing)
-- - Prix par client (customer_pricing avec contrats)
-- - Remises RFA sur commande totale (order_discounts)
-- - Fonction calcul prix intelligent avec waterfall priorités
--
-- Architecture Pricing Waterfall (ordre de priorité):
-- 1. customer_pricing (prix client spécifique) → PRIORITÉ MAX
-- 2. channel_pricing (prix par canal de vente)
-- 3. product_packages (conditionnements avec discounts)
-- 4. products.price_ht (prix de base) → FALLBACK
--
-- Best Practices Supabase:
-- - Index composés pour performance (customer_id + product_id)
-- - RLS policies granulaires par rôle
-- - Triggers updated_at automatiques
-- - SECURITY DEFINER pour fonction pricing
-- - Relations polymorphiques optimisées (customer_id)
-- =====================================================================

-- =====================================================================
-- 1. TABLE SALES_CHANNELS - Définition Canaux de Vente
-- =====================================================================

CREATE TABLE sales_channels (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🏷️ Identification
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'retail', 'wholesale', 'ecommerce', 'b2b'
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- 💰 Configuration tarifaire par défaut
  default_discount_rate DECIMAL(4,3)  -- 0.150 = 15% discount par défaut
    CONSTRAINT default_discount_valid CHECK (
      default_discount_rate IS NULL OR
      (default_discount_rate >= 0 AND default_discount_rate <= 0.50)
    ),

  -- ⚙️ Configuration métier
  is_active BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,  -- Besoin validation pour accès canal
  min_order_value DECIMAL(10,2)           -- Minimum commande pour ce canal
    CONSTRAINT min_order_value_positive CHECK (min_order_value IS NULL OR min_order_value > 0),

  -- 🎨 Display UI
  display_order INTEGER DEFAULT 0,
  icon_name VARCHAR(50),  -- Pour UI (ex: 'Store', 'ShoppingCart', 'Building')

  -- 📊 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 📈 Index performance
CREATE INDEX idx_sales_channels_code ON sales_channels(code);
CREATE INDEX idx_sales_channels_active ON sales_channels(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_sales_channels_display_order ON sales_channels(display_order);

-- ⚡ Trigger updated_at automatique
CREATE TRIGGER sales_channels_updated_at
  BEFORE UPDATE ON sales_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE sales_channels IS
  'Définition des canaux de vente avec configuration tarifaire par défaut';
COMMENT ON COLUMN sales_channels.code IS
  'Code unique canal: retail, wholesale, ecommerce, b2b';
COMMENT ON COLUMN sales_channels.default_discount_rate IS
  'Remise par défaut appliquée à ce canal (ex: 0.15 = 15%)';

-- =====================================================================
-- 2. TABLE CHANNEL_PRICING - Prix Produits par Canal
-- =====================================================================

CREATE TABLE channel_pricing (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🔗 Relations
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES sales_channels(id) ON DELETE CASCADE,

  -- 💰 Configuration tarifaire (modes exclusifs)
  custom_price_ht DECIMAL(10,2)
    CONSTRAINT custom_price_positive CHECK (custom_price_ht IS NULL OR custom_price_ht > 0),
  discount_rate DECIMAL(4,3)
    CONSTRAINT discount_valid CHECK (
      discount_rate IS NULL OR
      (discount_rate >= 0 AND discount_rate <= 0.50)
    ),
  markup_rate DECIMAL(4,3)
    CONSTRAINT markup_valid CHECK (
      markup_rate IS NULL OR
      (markup_rate >= 0 AND markup_rate <= 2.00)  -- Max 200% markup
    ),

  -- 📦 Quantités conditionnelles (pricing tiers)
  min_quantity INTEGER DEFAULT 1
    CONSTRAINT min_quantity_positive CHECK (min_quantity > 0),

  -- 📅 Validité temporelle
  valid_from DATE,
  valid_until DATE,

  -- ⚙️ Métadonnées
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- 📊 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes business
  CONSTRAINT pricing_mode_exclusive CHECK (
    -- Exactement UN mode actif (ou inherit base price)
    (custom_price_ht IS NOT NULL AND discount_rate IS NULL AND markup_rate IS NULL) OR
    (custom_price_ht IS NULL AND discount_rate IS NOT NULL AND markup_rate IS NULL) OR
    (custom_price_ht IS NULL AND discount_rate IS NULL AND markup_rate IS NOT NULL) OR
    (custom_price_ht IS NULL AND discount_rate IS NULL AND markup_rate IS NULL)  -- Inherit base
  ),
  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until >= valid_from),

  -- Contrainte unicité : un pricing par produit/canal/quantité
  UNIQUE(product_id, channel_id, min_quantity)
);

-- 📈 Index performance critiques
CREATE INDEX idx_channel_pricing_product ON channel_pricing(product_id);
CREATE INDEX idx_channel_pricing_channel ON channel_pricing(channel_id);
CREATE INDEX idx_channel_pricing_active ON channel_pricing(product_id, channel_id, is_active)
  WHERE is_active = TRUE;
CREATE INDEX idx_channel_pricing_validity ON channel_pricing(valid_from, valid_until)
  WHERE is_active = TRUE;
CREATE INDEX idx_channel_pricing_lookup ON channel_pricing(product_id, channel_id, min_quantity, is_active)
  WHERE is_active = TRUE;

-- ⚡ Trigger updated_at
CREATE TRIGGER channel_pricing_updated_at
  BEFORE UPDATE ON channel_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE channel_pricing IS
  'Prix produits différenciés par canal de vente avec support tiers quantités';
COMMENT ON COLUMN channel_pricing.custom_price_ht IS
  'Prix fixe spécifique pour ce canal (exclusif avec discount/markup)';
COMMENT ON COLUMN channel_pricing.discount_rate IS
  'Remise appliquée au prix base (ex: 0.20 = 20% discount)';
COMMENT ON COLUMN channel_pricing.markup_rate IS
  'Majoration appliquée au prix base (ex: 0.30 = +30%)';

-- =====================================================================
-- 3. TABLE CUSTOMER_PRICING - Prix par Client (Contrats)
-- =====================================================================

CREATE TABLE customer_pricing (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🔗 Relations (polymorphic customer support)
  customer_id UUID NOT NULL,  -- Points vers organisations OU individual_customers
  customer_type VARCHAR(20) NOT NULL
    CONSTRAINT customer_type_valid CHECK (customer_type IN ('organization', 'individual')),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- 💰 Configuration tarifaire (modes exclusifs)
  custom_price_ht DECIMAL(10,2)
    CONSTRAINT custom_price_positive CHECK (custom_price_ht IS NULL OR custom_price_ht > 0),
  discount_rate DECIMAL(4,3)
    CONSTRAINT discount_valid CHECK (
      discount_rate IS NULL OR
      (discount_rate >= 0 AND discount_rate <= 0.50)
    ),

  -- 📋 Contexte contrat client
  contract_reference VARCHAR(100),  -- Référence contrat cadre

  -- 📦 Quantités conditionnelles
  min_quantity INTEGER DEFAULT 1
    CONSTRAINT min_quantity_positive CHECK (min_quantity > 0),

  -- 📅 Validité temporelle (contrats)
  valid_from DATE NOT NULL,
  valid_until DATE,

  -- ⚙️ Métadonnées
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  approval_status VARCHAR(20) DEFAULT 'pending'
    CONSTRAINT approval_status_valid CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,

  -- 📊 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes business
  CONSTRAINT pricing_mode_exclusive CHECK (
    -- Discount OU prix fixe (pas les deux)
    (custom_price_ht IS NOT NULL AND discount_rate IS NULL) OR
    (custom_price_ht IS NULL AND discount_rate IS NOT NULL)
  ),
  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- 📈 Index performance critiques (relations polymorphiques)
CREATE INDEX idx_customer_pricing_customer ON customer_pricing(customer_id, customer_type);
CREATE INDEX idx_customer_pricing_product ON customer_pricing(product_id);
CREATE INDEX idx_customer_pricing_active ON customer_pricing(customer_id, product_id, is_active)
  WHERE is_active = TRUE;
CREATE INDEX idx_customer_pricing_validity ON customer_pricing(valid_from, valid_until)
  WHERE is_active = TRUE;
CREATE INDEX idx_customer_pricing_approval ON customer_pricing(approval_status)
  WHERE approval_status = 'approved';
CREATE INDEX idx_customer_pricing_lookup ON customer_pricing(
  customer_id, customer_type, product_id, approval_status, is_active
) WHERE approval_status = 'approved' AND is_active = TRUE;

-- ⚡ Trigger updated_at
CREATE TRIGGER customer_pricing_updated_at
  BEFORE UPDATE ON customer_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE customer_pricing IS
  'Prix spécifiques par client avec support contrats et validation';
COMMENT ON COLUMN customer_pricing.customer_id IS
  'ID client (polymorphic: organisations OU individual_customers)';
COMMENT ON COLUMN customer_pricing.approval_status IS
  'Statut validation contrat: pending, approved, rejected';
COMMENT ON COLUMN customer_pricing.contract_reference IS
  'Référence contrat cadre client';

-- =====================================================================
-- 4. TABLE ORDER_DISCOUNTS - Remises RFA Commande Totale
-- =====================================================================

CREATE TABLE order_discounts (
  -- 🔑 Clé primaire
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 🏷️ Identification
  code VARCHAR(50) UNIQUE NOT NULL,  -- 'RFA-2025-Q1', 'WINTER-SALE'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL
    CONSTRAINT discount_type_valid CHECK (discount_type IN ('percentage', 'fixed_amount')),

  -- 💰 Valeur remise
  discount_value DECIMAL(10,2) NOT NULL
    CONSTRAINT discount_value_positive CHECK (discount_value > 0),

  -- 📋 Conditions application
  min_order_amount DECIMAL(10,2)  -- Montant minimum commande
    CONSTRAINT min_order_positive CHECK (min_order_amount IS NULL OR min_order_amount > 0),
  max_discount_amount DECIMAL(10,2)  -- Plafond remise
    CONSTRAINT max_discount_positive CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),

  -- 🎯 Éligibilité
  applicable_channels UUID[],  -- Array channel IDs (NULL = tous)
  applicable_customer_types VARCHAR(20)[],  -- ['organization', 'individual']

  -- 📅 Validité temporelle
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,

  -- 🔢 Usage limits
  max_uses_total INTEGER
    CONSTRAINT max_uses_positive CHECK (max_uses_total IS NULL OR max_uses_total > 0),
  max_uses_per_customer INTEGER DEFAULT 1
    CONSTRAINT max_per_customer_positive CHECK (max_uses_per_customer > 0),
  current_uses INTEGER DEFAULT 0
    CONSTRAINT current_uses_non_negative CHECK (current_uses >= 0),

  -- ⚙️ Configuration
  is_active BOOLEAN DEFAULT TRUE,
  requires_code BOOLEAN DEFAULT FALSE,  -- True si code promo à saisir
  is_combinable BOOLEAN DEFAULT FALSE,  -- Cumulable avec autres remises?

  -- 📊 Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- ✅ Contraintes
  CONSTRAINT valid_date_range CHECK (valid_until >= valid_from),
  CONSTRAINT max_uses_logical CHECK (max_uses_total IS NULL OR max_uses_total >= current_uses)
);

-- 📈 Index performance
CREATE INDEX idx_order_discounts_code ON order_discounts(code);
CREATE INDEX idx_order_discounts_active ON order_discounts(is_active, valid_from, valid_until)
  WHERE is_active = TRUE;
CREATE INDEX idx_order_discounts_validity ON order_discounts(valid_from, valid_until);
CREATE INDEX idx_order_discounts_usage ON order_discounts(current_uses, max_uses_total)
  WHERE is_active = TRUE;

-- ⚡ Trigger updated_at
CREATE TRIGGER order_discounts_updated_at
  BEFORE UPDATE ON order_discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE order_discounts IS
  'Remises RFA et promotions sur commande totale (codes promo, campagnes)';
COMMENT ON COLUMN order_discounts.code IS
  'Code remise unique (ex: RFA-2025-Q1, WINTER-SALE)';
COMMENT ON COLUMN order_discounts.discount_type IS
  'Type remise: percentage (10% = 10.00) ou fixed_amount (50€ = 50.00)';
COMMENT ON COLUMN order_discounts.is_combinable IS
  'Si true, cumulable avec autres remises actives';

-- =====================================================================
-- 5. MODIFICATIONS TABLES EXISTANTES
-- =====================================================================

-- 🔧 Table organisations: Ajouter canal par défaut
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organisations' AND column_name = 'default_channel_id'
  ) THEN
    ALTER TABLE organisations
    ADD COLUMN default_channel_id UUID REFERENCES sales_channels(id);

    CREATE INDEX idx_organisations_default_channel ON organisations(default_channel_id);

    COMMENT ON COLUMN organisations.default_channel_id IS
      'Canal de vente par défaut pour ce client (retail, wholesale, ecommerce, b2b)';
  END IF;
END $$;

-- 🔧 Table sales_orders: Ajouter canal + remises
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_orders' AND column_name = 'channel_id'
  ) THEN
    ALTER TABLE sales_orders
    ADD COLUMN channel_id UUID REFERENCES sales_channels(id),
    ADD COLUMN applied_discount_codes TEXT[],  -- Array codes remises appliquées
    ADD COLUMN total_discount_amount DECIMAL(12,2) DEFAULT 0
      CONSTRAINT total_discount_non_negative CHECK (total_discount_amount >= 0);

    CREATE INDEX idx_sales_orders_channel ON sales_orders(channel_id);

    COMMENT ON COLUMN sales_orders.channel_id IS
      'Canal de vente utilisé pour cette commande (détermine pricing)';
    COMMENT ON COLUMN sales_orders.applied_discount_codes IS
      'Codes remises RFA appliqués à cette commande (array)';
    COMMENT ON COLUMN sales_orders.total_discount_amount IS
      'Montant total remises appliquées en euros';
  END IF;
END $$;

-- =====================================================================
-- 6. FONCTION CALCUL PRIX INTELLIGENT (Waterfall Pricing)
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_product_price(
  p_product_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR(20) DEFAULT 'organization',
  p_channel_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  final_price_ht DECIMAL(10,2),
  pricing_source VARCHAR(50),  -- 'customer_pricing', 'channel_pricing', 'package', 'base'
  discount_applied DECIMAL(4,3),
  original_price_ht DECIMAL(10,2)
) AS $$
DECLARE
  v_base_price DECIMAL(10,2);
  v_customer_price DECIMAL(10,2);
  v_customer_discount DECIMAL(4,3);
  v_channel_price DECIMAL(10,2);
  v_channel_discount DECIMAL(4,3);
  v_channel_markup DECIMAL(4,3);
  v_package_price DECIMAL(10,2);
  v_package_discount DECIMAL(4,3);
BEGIN
  -- 🔍 1. Récupérer prix de base produit
  SELECT price_ht INTO v_base_price
  FROM products
  WHERE id = p_product_id AND status IN ('active', 'in_stock', 'preorder');

  IF v_base_price IS NULL THEN
    RAISE EXCEPTION 'Product % not found or not available', p_product_id;
  END IF;

  -- 🥇 2. PRIORITÉ 1: Prix client spécifique (si existe et valide)
  IF p_customer_id IS NOT NULL THEN
    SELECT
      custom_price_ht,
      discount_rate
    INTO v_customer_price, v_customer_discount
    FROM customer_pricing
    WHERE product_id = p_product_id
      AND customer_id = p_customer_id
      AND customer_type = p_customer_type
      AND is_active = TRUE
      AND approval_status = 'approved'
      AND p_date >= valid_from
      AND (valid_until IS NULL OR p_date <= valid_until)
      AND p_quantity >= min_quantity
    ORDER BY min_quantity DESC  -- Plus grande quantité éligible
    LIMIT 1;

    IF v_customer_price IS NOT NULL THEN
      RETURN QUERY SELECT
        v_customer_price,
        'customer_pricing'::VARCHAR(50),
        0::DECIMAL(4,3),
        v_base_price;
      RETURN;
    ELSIF v_customer_discount IS NOT NULL THEN
      RETURN QUERY SELECT
        ROUND(v_base_price * (1 - v_customer_discount), 2),
        'customer_pricing'::VARCHAR(50),
        v_customer_discount,
        v_base_price;
      RETURN;
    END IF;
  END IF;

  -- 🥈 3. PRIORITÉ 2: Prix canal (si pas de prix client)
  IF p_channel_id IS NOT NULL THEN
    SELECT
      custom_price_ht,
      discount_rate,
      markup_rate
    INTO v_channel_price, v_channel_discount, v_channel_markup
    FROM channel_pricing
    WHERE product_id = p_product_id
      AND channel_id = p_channel_id
      AND is_active = TRUE
      AND (valid_from IS NULL OR p_date >= valid_from)
      AND (valid_until IS NULL OR p_date <= valid_until)
      AND p_quantity >= min_quantity
    ORDER BY min_quantity DESC
    LIMIT 1;

    IF v_channel_price IS NOT NULL THEN
      RETURN QUERY SELECT
        v_channel_price,
        'channel_pricing'::VARCHAR(50),
        0::DECIMAL(4,3),
        v_base_price;
      RETURN;
    ELSIF v_channel_discount IS NOT NULL THEN
      RETURN QUERY SELECT
        ROUND(v_base_price * (1 - v_channel_discount), 2),
        'channel_pricing'::VARCHAR(50),
        v_channel_discount,
        v_base_price;
      RETURN;
    ELSIF v_channel_markup IS NOT NULL THEN
      RETURN QUERY SELECT
        ROUND(v_base_price * (1 + v_channel_markup), 2),
        'channel_pricing'::VARCHAR(50),
        -v_channel_markup,  -- Négatif pour markup
        v_base_price;
      RETURN;
    END IF;
  END IF;

  -- 🥉 4. PRIORITÉ 3: Prix package (si quantité éligible)
  SELECT
    CASE
      WHEN unit_price_ht IS NOT NULL THEN unit_price_ht
      WHEN discount_rate IS NOT NULL THEN ROUND(v_base_price * (1 - discount_rate), 2)
      ELSE v_base_price
    END,
    COALESCE(discount_rate, 0)
  INTO v_package_price, v_package_discount
  FROM product_packages
  WHERE product_id = p_product_id
    AND is_active = TRUE
    AND p_quantity >= base_quantity
  ORDER BY base_quantity DESC
  LIMIT 1;

  IF v_package_price IS NOT NULL AND v_package_price != v_base_price THEN
    RETURN QUERY SELECT
      v_package_price,
      'package'::VARCHAR(50),
      v_package_discount,
      v_base_price;
    RETURN;
  END IF;

  -- 🏁 5. FALLBACK: Prix de base
  RETURN QUERY SELECT
    v_base_price,
    'base'::VARCHAR(50),
    0::DECIMAL(4,3),
    v_base_price;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION calculate_product_price IS
  'Calcul prix intelligent avec priorités waterfall: customer > channel > package > base. Retourne prix final + source + discount appliqué.';

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- 🔒 RLS sales_channels
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_channels_select_authenticated" ON sales_channels
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "sales_channels_manage_admin" ON sales_channels
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- 🔒 RLS channel_pricing
ALTER TABLE channel_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_pricing_select_authenticated" ON channel_pricing
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "channel_pricing_manage_admin" ON channel_pricing
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin', 'catalog_manager'))
  WITH CHECK (get_user_role() IN ('owner', 'admin', 'catalog_manager'));

-- 🔒 RLS customer_pricing
ALTER TABLE customer_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_pricing_select_authenticated" ON customer_pricing
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "customer_pricing_manage_admin" ON customer_pricing
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- 🔒 RLS order_discounts
ALTER TABLE order_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_discounts_select_authenticated" ON order_discounts
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "order_discounts_manage_admin" ON order_discounts
  FOR ALL TO authenticated
  USING (get_user_role() IN ('owner', 'admin'))
  WITH CHECK (get_user_role() IN ('owner', 'admin'));

-- =====================================================================
-- 8. SEED DATA - Canaux de Vente par Défaut
-- =====================================================================

INSERT INTO sales_channels (code, name, description, default_discount_rate, display_order, icon_name, is_active) VALUES
  ('retail', 'Vente Détail', 'Magasin physique et showroom Vérone', NULL, 1, 'Store', TRUE),
  ('wholesale', 'Vente en Gros', 'Prix professionnels pour quantités importantes (MOQ élevé)', 0.200, 2, 'Warehouse', TRUE),
  ('ecommerce', 'E-Commerce B2C', 'Boutique en ligne pour clients particuliers', NULL, 3, 'ShoppingCart', TRUE),
  ('b2b', 'Plateforme B2B', 'Espace professionnel en ligne avec tarifs négociés', 0.150, 4, 'Building', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- 9. VALIDATION & RAPPORTS
-- =====================================================================

-- ✅ Rapport création tables
DO $$
DECLARE
  v_tables_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('sales_channels', 'channel_pricing', 'customer_pricing', 'order_discounts');

  RAISE NOTICE '✅ Migration 20251010_001 terminée avec succès';
  RAISE NOTICE '📊 Tables créées: %', v_tables_created;
  RAISE NOTICE '🔧 Fonction calculate_product_price() créée';
  RAISE NOTICE '🔒 RLS policies activées sur toutes tables';
  RAISE NOTICE '📈 Index performance optimisés';
  RAISE NOTICE '🌱 Seed data: 4 canaux de vente par défaut';
END $$;
