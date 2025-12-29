-- =====================================================
-- MIGRATION CONSOLIDEE : Produits Affilies LinkMe
-- Date: 2025-12-20
-- Description: Enum, colonnes, bucket, RPC et RLS pour produits affilies
-- =====================================================

-- =====================================================
-- PARTIE 1: Enum pour le statut d'approbation
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'affiliate_product_approval_status') THEN
    CREATE TYPE affiliate_product_approval_status AS ENUM
      ('draft', 'pending_approval', 'approved', 'rejected');
  END IF;
END$$;

-- =====================================================
-- PARTIE 2: Colonnes pour produits affilies
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_approval_status affiliate_product_approval_status DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_payout_ht NUMERIC(10,2) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_commission_rate NUMERIC(5,2) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_approved_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_approved_by UUID REFERENCES auth.users(id) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  created_by_affiliate UUID REFERENCES linkme_affiliates(id) DEFAULT NULL;

ALTER TABLE products ADD COLUMN IF NOT EXISTS
  affiliate_rejection_reason TEXT DEFAULT NULL;

-- Index pour la queue d'approbation
CREATE INDEX IF NOT EXISTS idx_products_affiliate_pending_approval
  ON products(affiliate_approval_status, created_at DESC)
  WHERE affiliate_approval_status = 'pending_approval';

-- Index pour les produits d'un affilie
CREATE INDEX IF NOT EXISTS idx_products_created_by_affiliate
  ON products(created_by_affiliate)
  WHERE created_by_affiliate IS NOT NULL;

-- Contraintes (avec gestion des doublons)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_affiliate_product_payout') THEN
    ALTER TABLE products ADD CONSTRAINT chk_affiliate_product_payout
      CHECK (
        (created_by_affiliate IS NULL) OR
        (created_by_affiliate IS NOT NULL AND affiliate_payout_ht IS NOT NULL AND affiliate_payout_ht > 0)
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_affiliate_commission_rate_range') THEN
    ALTER TABLE products ADD CONSTRAINT chk_affiliate_commission_rate_range
      CHECK (
        affiliate_commission_rate IS NULL OR
        (affiliate_commission_rate >= 0 AND affiliate_commission_rate <= 100)
      );
  END IF;
END$$;

-- =====================================================
-- PARTIE 3: Bucket Storage pour images affilies
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'affiliate-products',
  'affiliate-products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policies pour le bucket
DROP POLICY IF EXISTS "Affiliate upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public read affiliate images" ON storage.objects;

CREATE POLICY "Affiliate upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'affiliate-products'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public read affiliate images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'affiliate-products');

-- =====================================================
-- PARTIE 4: RPC pour calcul de prix
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_affiliate_product_price(
  p_product_id UUID,
  p_margin_rate NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  base_price_ht NUMERIC,
  margin_rate NUMERIC,
  commission_rate NUMERIC,
  affiliate_earning NUMERIC,
  platform_earning NUMERIC,
  final_price_ht NUMERIC,
  pricing_model TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product products;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.created_by_affiliate IS NOT NULL THEN
    -- Modele 2 : Commission inversee (produit affilie)
    RETURN QUERY SELECT
      v_product.affiliate_payout_ht,
      0::NUMERIC,
      COALESCE(v_product.affiliate_commission_rate, 15),
      v_product.affiliate_payout_ht,
      v_product.affiliate_payout_ht * COALESCE(v_product.affiliate_commission_rate, 15) / 100,
      v_product.affiliate_payout_ht * (1 + COALESCE(v_product.affiliate_commission_rate, 15) / 100),
      'affiliate_created'::TEXT;
  ELSE
    -- Modele 1 : Commission classique (produit catalogue)
    RETURN QUERY
    SELECT
      cp.custom_price_ht,
      COALESCE(p_margin_rate, cp.suggested_margin_rate, 0),
      COALESCE(cp.channel_commission_rate, 5),
      cp.custom_price_ht * COALESCE(p_margin_rate, cp.suggested_margin_rate, 0) / 100,
      cp.custom_price_ht * COALESCE(cp.channel_commission_rate, 5) / 100,
      cp.custom_price_ht * (1 + COALESCE(cp.channel_commission_rate, 5) / 100
                             + COALESCE(p_margin_rate, cp.suggested_margin_rate, 0) / 100),
      'classic'::TEXT
    FROM channel_pricing cp
    WHERE cp.product_id = p_product_id
      AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_affiliate_product_price(UUID, NUMERIC) TO authenticated;

-- =====================================================
-- PARTIE 5: RLS Policies pour produits affilies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Affiliate view own created products" ON products;
DROP POLICY IF EXISTS "Affiliate create products" ON products;
DROP POLICY IF EXISTS "Affiliate update draft products" ON products;

-- Policy 1: Affilie peut voir ses propres produits
CREATE POLICY "Affiliate view own created products"
  ON products FOR SELECT
  USING (
    created_by_affiliate IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.enseigne_id = la.enseigne_id
      WHERE la.id = products.created_by_affiliate
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy 2: Affilie peut creer des produits (draft)
CREATE POLICY "Affiliate create products"
  ON products FOR INSERT
  WITH CHECK (
    affiliate_approval_status = 'draft'
    AND enseigne_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id = products.enseigne_id
        AND uar.role IN ('enseigne_admin', 'org_independante')
    )
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      WHERE la.id = products.created_by_affiliate
        AND la.enseigne_id = products.enseigne_id
    )
  );

-- Policy 3: Affilie peut modifier ses produits draft
CREATE POLICY "Affiliate update draft products"
  ON products FOR UPDATE
  USING (
    affiliate_approval_status IN ('draft', 'rejected')
    AND created_by_affiliate IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.enseigne_id = la.enseigne_id
      WHERE la.id = products.created_by_affiliate
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  )
  WITH CHECK (
    (affiliate_approval_status IN ('draft', 'pending_approval'))
    AND enseigne_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM linkme_affiliates la
      JOIN user_app_roles uar ON uar.enseigne_id = la.enseigne_id
      WHERE la.id = products.created_by_affiliate
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- =====================================================
-- PARTIE 6: RPC pour workflow d'approbation
-- =====================================================

-- RPC: Soumettre pour approbation
CREATE OR REPLACE FUNCTION submit_affiliate_product_for_approval(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
BEGIN
  SELECT p.*, la.enseigne_id AS affiliate_enseigne_id
  INTO v_product
  FROM products p
  JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
  WHERE p.id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found or not an affiliate product';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'linkme'
      AND uar.is_active = true
      AND uar.enseigne_id = v_product.affiliate_enseigne_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF v_product.affiliate_approval_status NOT IN ('draft', 'rejected') THEN
    RAISE EXCEPTION 'Product must be in draft or rejected status';
  END IF;

  IF v_product.name IS NULL OR v_product.name = '' THEN
    RAISE EXCEPTION 'Product name is required';
  END IF;

  IF v_product.affiliate_payout_ht IS NULL OR v_product.affiliate_payout_ht <= 0 THEN
    RAISE EXCEPTION 'Payout price must be greater than 0';
  END IF;

  UPDATE products
  SET
    affiliate_approval_status = 'pending_approval',
    affiliate_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_affiliate_product_for_approval(UUID) TO authenticated;

-- RPC: Approuver produit (admin)
CREATE OR REPLACE FUNCTION approve_affiliate_product(p_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.affiliate_approval_status != 'pending_approval' THEN
    RAISE EXCEPTION 'Product must be pending approval';
  END IF;

  UPDATE products
  SET
    affiliate_approval_status = 'approved',
    affiliate_approved_at = NOW(),
    affiliate_approved_by = auth.uid(),
    affiliate_rejection_reason = NULL,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_affiliate_product(UUID) TO authenticated;

-- RPC: Rejeter produit (admin)
CREATE OR REPLACE FUNCTION reject_affiliate_product(
  p_product_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_reason IS NULL OR p_reason = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF v_product.affiliate_approval_status != 'pending_approval' THEN
    RAISE EXCEPTION 'Product must be pending approval';
  END IF;

  UPDATE products
  SET
    affiliate_approval_status = 'rejected',
    affiliate_rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION reject_affiliate_product(UUID, TEXT) TO authenticated;

-- RPC: Compter les approbations en attente
CREATE OR REPLACE FUNCTION get_pending_approvals_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM products
  WHERE affiliate_approval_status = 'pending_approval';
$$;

GRANT EXECUTE ON FUNCTION get_pending_approvals_count() TO authenticated;

-- RPC: Recuperer produits affilies pour une enseigne
CREATE OR REPLACE FUNCTION get_affiliate_products_for_enseigne(p_enseigne_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  affiliate_payout_ht NUMERIC,
  affiliate_commission_rate NUMERIC,
  affiliate_approval_status affiliate_product_approval_status,
  affiliate_rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  dimensions JSONB,
  description TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.sku,
    p.affiliate_payout_ht,
    p.affiliate_commission_rate,
    p.affiliate_approval_status,
    p.affiliate_rejection_reason,
    p.created_at,
    p.updated_at,
    p.dimensions::JSONB,
    p.description
  FROM products p
  JOIN linkme_affiliates la ON la.id = p.created_by_affiliate
  WHERE la.enseigne_id = p_enseigne_id
    AND p.created_by_affiliate IS NOT NULL
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_affiliate_products_for_enseigne(UUID) TO authenticated;

-- =====================================================
-- PARTIE 7: Fix trigger auto_add_sourcing_product_to_linkme
-- =====================================================

-- Le trigger doit utiliser SECURITY DEFINER pour pouvoir inserer dans channel_pricing
-- malgre RLS
CREATE OR REPLACE FUNCTION auto_add_sourcing_product_to_linkme()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.enseigne_id IS NOT NULL OR NEW.assigned_client_id IS NOT NULL THEN
    INSERT INTO channel_pricing (
      id, channel_id, product_id, is_active, is_featured, is_public_showcase,
      display_order, min_margin_rate, max_margin_rate, suggested_margin_rate,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      '93c68db1-5a30-4168-89ec-6383152be405',
      NEW.id, true, false, false, 0, 0.00, 20.00, 10.00, NOW(), NOW()
    )
    ON CONFLICT (channel_id, product_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Contrainte unique necessaire pour ON CONFLICT
ALTER TABLE channel_pricing
ADD CONSTRAINT IF NOT EXISTS uq_channel_pricing_channel_product
UNIQUE (channel_id, product_id);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
