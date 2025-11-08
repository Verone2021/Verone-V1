-- Migration: Google Merchant Channel - Metadata & Pricing Functions
-- Date: 2025-11-06
-- Description: Table channel_product_metadata + Canal google_merchant + Fonctions éligibilité/pricing
-- Référence: docs/business-rules/13-canaux-vente/google-merchant/README.md

-- =====================================================
-- PARTIE 1: Table channel_product_metadata
-- =====================================================

-- Table pour stocker métadonnées custom par canal (titre/description optimisés)
CREATE TABLE IF NOT EXISTS channel_product_metadata (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références (UNIQUE constraint pour 1 metadata par produit/canal)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES sales_channels(id) ON DELETE CASCADE,

  -- Métadonnées custom canal
  custom_title TEXT CHECK (LENGTH(custom_title) <= 150),
  custom_description TEXT CHECK (LENGTH(custom_description) <= 5000),

  -- Metadata extensible (JSON pour futurs champs)
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Contrainte unicité: 1 seule metadata par produit/canal
  CONSTRAINT unique_product_channel_metadata UNIQUE (product_id, channel_id)
);

-- Indexes performance
CREATE INDEX IF NOT EXISTS idx_channel_product_metadata_product_id
ON channel_product_metadata(product_id);

CREATE INDEX IF NOT EXISTS idx_channel_product_metadata_channel_id
ON channel_product_metadata(channel_id);

CREATE INDEX IF NOT EXISTS idx_channel_product_metadata_lookup
ON channel_product_metadata(product_id, channel_id);

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION update_channel_product_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_channel_product_metadata_updated_at ON channel_product_metadata;
CREATE TRIGGER trigger_channel_product_metadata_updated_at
  BEFORE UPDATE ON channel_product_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_product_metadata_updated_at();

-- Commentaires documentation
COMMENT ON TABLE channel_product_metadata IS 'Métadonnées custom par canal (titre/description optimisés pour SEO, marketplace, etc.)';
COMMENT ON COLUMN channel_product_metadata.custom_title IS 'Titre custom max 150 caractères (ex: optimisé Google Shopping)';
COMMENT ON COLUMN channel_product_metadata.custom_description IS 'Description custom max 5000 caractères (ex: adaptée canal vente)';
COMMENT ON COLUMN channel_product_metadata.metadata IS 'Champs extensibles JSON pour futurs attributs canal';

-- =====================================================
-- PARTIE 2: INSERT canal google_merchant
-- =====================================================

-- Insertion idempotente canal Google Merchant (ON CONFLICT DO NOTHING)
INSERT INTO sales_channels (
  code,
  name,
  description,
  is_active,
  display_order,
  icon_name
)
VALUES (
  'google_merchant',
  'Google Shopping',
  'Canal Google Merchant Center pour flux produits Google Shopping',
  true,
  10,
  'ShoppingBag'
)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- PARTIE 3: Fonction get_google_merchant_eligible_products()
-- =====================================================

-- RPC: Récupérer produits éligibles Google Merchant avec métadonnées complètes
CREATE OR REPLACE FUNCTION get_google_merchant_eligible_products()
RETURNS TABLE (
  -- Identifiant produit
  product_id UUID,
  sku TEXT,
  name TEXT,
  status TEXT,

  -- Métadonnées custom canal
  custom_title TEXT,
  custom_description TEXT,
  metadata JSONB,

  -- Prix (base + custom canal)
  price_ht NUMERIC,
  price_ttc NUMERIC,
  price_source TEXT,

  -- Images
  primary_image_url TEXT,
  image_urls TEXT[],

  -- Éligibilité
  is_eligible BOOLEAN,
  ineligibility_reasons TEXT[],

  -- Statut synchronisation
  sync_status TEXT,
  google_status TEXT,
  last_synced_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Identifiant produit
    p.id AS product_id,
    p.sku,
    p.name,
    p.status,

    -- Métadonnées custom (fallback sur titre/description produit si NULL)
    COALESCE(cpm.custom_title, p.name) AS custom_title,
    COALESCE(cpm.custom_description, p.description) AS custom_description,
    COALESCE(cpm.metadata, '{}'::JSONB) AS metadata,

    -- Prix HT (waterfall: channel_pricing > base price_list_items)
    COALESCE(
      cp.custom_price_ht,
      (
        SELECT pli.price_ht
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = p.id
          AND pli.is_active = true
          AND pl.is_active = true
          AND pl.list_type = 'base'
        ORDER BY pl.priority ASC
        LIMIT 1
      )
    ) AS price_ht,

    -- Prix TTC (TVA FR 20% par défaut - calculé dynamiquement)
    COALESCE(
      cp.custom_price_ht,
      (
        SELECT pli.price_ht
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = p.id
          AND pli.is_active = true
          AND pl.is_active = true
          AND pl.list_type = 'base'
        ORDER BY pl.priority ASC
        LIMIT 1
      )
    ) * 1.20 AS price_ttc,

    -- Source prix
    CASE
      WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing'
      ELSE 'base_price'
    END AS price_source,

    -- Image principale (première image dans ordre display_order)
    (
      SELECT pi.url
      FROM product_images pi
      WHERE pi.product_id = p.id
        AND pi.is_primary = true
      ORDER BY pi.display_order ASC
      LIMIT 1
    ) AS primary_image_url,

    -- Toutes images (array)
    ARRAY(
      SELECT pi.url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.display_order ASC
    ) AS image_urls,

    -- Éligibilité (produit actif + prix > 0 + au moins 1 image)
    (
      p.status = 'active'
      AND COALESCE(
        cp.custom_price_ht,
        (
          SELECT pli.price_ht
          FROM price_list_items pli
          JOIN price_lists pl ON pl.id = pli.price_list_id
          WHERE pli.product_id = p.id
            AND pli.is_active = true
            AND pl.is_active = true
            AND pl.list_type = 'base'
          ORDER BY pl.priority ASC
          LIMIT 1
        )
      ) > 0
      AND EXISTS (
        SELECT 1
        FROM product_images pi
        WHERE pi.product_id = p.id
      )
    ) AS is_eligible,

    -- Raisons inéligibilité (array de textes)
    ARRAY(
      SELECT reason
      FROM (
        SELECT 'Produit inactif' AS reason WHERE p.status != 'active'
        UNION ALL
        SELECT 'Prix manquant ou invalide' WHERE COALESCE(
          cp.custom_price_ht,
          (
            SELECT pli.price_ht
            FROM price_list_items pli
            JOIN price_lists pl ON pl.id = pli.price_list_id
            WHERE pli.product_id = p.id
              AND pli.is_active = true
              AND pl.is_active = true
              AND pl.list_type = 'base'
            ORDER BY pl.priority ASC
            LIMIT 1
          )
        ) IS NULL OR COALESCE(
          cp.custom_price_ht,
          (
            SELECT pli.price_ht
            FROM price_list_items pli
            JOIN price_lists pl ON pl.id = pli.price_list_id
            WHERE pli.product_id = p.id
              AND pli.is_active = true
              AND pl.is_active = true
              AND pl.list_type = 'base'
            ORDER BY pl.priority ASC
            LIMIT 1
          )
        ) <= 0
        UNION ALL
        SELECT 'Aucune image' WHERE NOT EXISTS (
          SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
        )
      ) reasons
    ) AS ineligibility_reasons,

    -- Statut synchronisation (depuis google_merchant_syncs si existe)
    gms.sync_status,
    gms.google_status,
    gms.synced_at AS last_synced_at

  FROM products p

  -- JOIN channel_product_metadata (LEFT pour inclure produits sans metadata custom)
  LEFT JOIN channel_product_metadata cpm
    ON cpm.product_id = p.id
    AND cpm.channel_id = (SELECT id FROM sales_channels WHERE code = 'google_merchant')

  -- JOIN channel_pricing (LEFT pour inclure produits sans prix custom canal)
  LEFT JOIN channel_pricing cp
    ON cp.product_id = p.id
    AND cp.channel_id = (SELECT id FROM sales_channels WHERE code = 'google_merchant')
    AND cp.is_active = true

  -- JOIN google_merchant_syncs (LEFT pour inclure produits jamais synchronisés)
  LEFT JOIN google_merchant_syncs gms
    ON gms.product_id = p.id

  ORDER BY p.name ASC;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 4: Fonction get_google_merchant_product_price()
-- =====================================================

-- RPC: Récupérer prix produit avec TVA dynamique par pays (waterfall pricing)
CREATE OR REPLACE FUNCTION get_google_merchant_product_price(
  p_product_id UUID,
  p_country_code TEXT DEFAULT 'FR'
)
RETURNS TABLE (
  price_ht NUMERIC,
  tva_rate NUMERIC,
  price_ttc NUMERIC,
  price_source TEXT,
  currency TEXT
) AS $$
DECLARE
  v_channel_id UUID;
  v_price_ht NUMERIC;
  v_tva_rate NUMERIC;
  v_price_source TEXT;
BEGIN
  -- Récupérer ID canal google_merchant
  SELECT id INTO v_channel_id
  FROM sales_channels
  WHERE code = 'google_merchant';

  -- Waterfall pricing: channel_pricing > base price
  SELECT
    COALESCE(
      cp.custom_price_ht,
      (
        SELECT pli.price_ht
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = p_product_id
          AND pli.is_active = true
          AND pl.is_active = true
          AND pl.list_type = 'base'
        ORDER BY pl.priority ASC
        LIMIT 1
      )
    ),
    CASE
      WHEN cp.custom_price_ht IS NOT NULL THEN 'channel_pricing'
      ELSE 'base_price'
    END
  INTO v_price_ht, v_price_source
  FROM products p
  LEFT JOIN channel_pricing cp
    ON cp.product_id = p.id
    AND cp.channel_id = v_channel_id
    AND cp.is_active = true
  WHERE p.id = p_product_id;

  -- TVA dynamique par pays
  v_tva_rate := CASE p_country_code
    WHEN 'FR' THEN 0.20  -- France 20%
    WHEN 'DE' THEN 0.19  -- Allemagne 19%
    WHEN 'BE' THEN 0.21  -- Belgique 21%
    WHEN 'ES' THEN 0.21  -- Espagne 21%
    WHEN 'IT' THEN 0.22  -- Italie 22%
    ELSE 0.20            -- Défaut 20%
  END;

  -- Retourner résultat
  RETURN QUERY
  SELECT
    v_price_ht AS price_ht,
    v_tva_rate AS tva_rate,
    ROUND(v_price_ht * (1 + v_tva_rate), 2) AS price_ttc,
    v_price_source AS price_source,
    'EUR'::TEXT AS currency;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 5: RLS Policies - channel_product_metadata
-- =====================================================

ALTER TABLE channel_product_metadata ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Tous users authentifiés peuvent voir
CREATE POLICY channel_product_metadata_select_policy
ON channel_product_metadata
FOR SELECT
TO authenticated
USING (true);

-- Policy INSERT: Seulement service_role
CREATE POLICY channel_product_metadata_insert_policy
ON channel_product_metadata
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy UPDATE: Seulement service_role
CREATE POLICY channel_product_metadata_update_policy
ON channel_product_metadata
FOR UPDATE
TO service_role
USING (true);

-- Policy DELETE: Seulement service_role
CREATE POLICY channel_product_metadata_delete_policy
ON channel_product_metadata
FOR DELETE
TO service_role
USING (true);

-- =====================================================
-- FONCTION 3: get_google_merchant_products
-- Récupère tous les produits synchronisés avec Google Merchant
-- Utilisé par useGoogleMerchantProducts() hook
-- =====================================================

-- Drop existing function if structure changed
DROP FUNCTION IF EXISTS get_google_merchant_products() CASCADE;

CREATE OR REPLACE FUNCTION get_google_merchant_products()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  sku TEXT,
  product_name TEXT,
  google_product_id TEXT,
  sync_status TEXT,
  google_status TEXT,
  google_status_detail JSONB,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  revenue_ht DECIMAL,
  synced_at TIMESTAMPTZ,
  google_status_checked_at TIMESTAMPTZ,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gms.id,
    gms.product_id,
    p.sku,
    p.name AS product_name,
    gms.google_product_id,
    gms.sync_status,
    gms.google_status,
    gms.google_status_detail,
    gms.impressions,
    gms.clicks,
    gms.conversions,
    gms.revenue_ht,
    gms.synced_at,
    gms.google_status_checked_at,
    gms.error_message
  FROM google_merchant_syncs gms
  INNER JOIN products p ON p.id = gms.product_id
  WHERE gms.sync_status != 'deleted' -- Exclure produits soft-deleted
  ORDER BY gms.synced_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_google_merchant_products IS 'Récupère tous les produits synchronisés avec Google Merchant (excluant soft-deleted)';

-- =====================================================
-- FONCTION 4: get_google_merchant_stats
-- Calcule statistiques pour dashboard Google Merchant
-- Utilisé par useGoogleMerchantStats() hook
-- =====================================================

-- Drop existing function if structure changed
DROP FUNCTION IF EXISTS get_google_merchant_stats() CASCADE;

CREATE OR REPLACE FUNCTION get_google_merchant_stats()
RETURNS TABLE (
  total_products BIGINT,
  approved_products BIGINT,
  pending_products BIGINT,
  rejected_products BIGINT,
  error_products BIGINT,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions BIGINT,
  total_revenue_ht DECIMAL,
  conversion_rate DECIMAL,
  last_sync_at TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_products,
    COUNT(*) FILTER (WHERE google_status = 'approved') AS approved_products,
    COUNT(*) FILTER (WHERE google_status = 'pending') AS pending_products,
    COUNT(*) FILTER (WHERE google_status = 'rejected') AS rejected_products,
    COUNT(*) FILTER (WHERE sync_status = 'error') AS error_products,
    COALESCE(SUM(impressions), 0) AS total_impressions,
    COALESCE(SUM(clicks), 0) AS total_clicks,
    COALESCE(SUM(conversions), 0) AS total_conversions,
    COALESCE(SUM(revenue_ht), 0) AS total_revenue_ht,
    CASE
      WHEN SUM(clicks) > 0 THEN ROUND((SUM(conversions)::DECIMAL / SUM(clicks)::DECIMAL) * 100, 2)
      ELSE 0
    END AS conversion_rate,
    MAX(synced_at) AS last_sync_at,
    NOW() AS refreshed_at
  FROM google_merchant_syncs
  WHERE sync_status != 'deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_google_merchant_stats IS 'Calcule statistiques dashboard Google Merchant en temps réel';

-- =====================================================
-- PARTIE 6: Vérifications finales
-- =====================================================

DO $$
DECLARE
  v_channel_exists BOOLEAN;
  v_metadata_count INTEGER;
BEGIN
  -- Vérifier canal google_merchant créé
  SELECT EXISTS (
    SELECT 1 FROM sales_channels WHERE code = 'google_merchant'
  ) INTO v_channel_exists;

  -- Compter métadonnées existantes
  SELECT COUNT(*) INTO v_metadata_count FROM channel_product_metadata;

  RAISE NOTICE '✅ Migration 118 terminée: Google Merchant Channel Metadata';
  RAISE NOTICE '  - Table channel_product_metadata créée (4 colonnes métiers + audit)';
  RAISE NOTICE '  - Canal google_merchant: %', CASE WHEN v_channel_exists THEN 'CRÉÉ' ELSE 'ERREUR' END;
  RAISE NOTICE '  - 3 indexes performance créés';
  RAISE NOTICE '  - Trigger updated_at configuré';
  RAISE NOTICE '  - RLS policies configurées (service_role write, authenticated read)';
  RAISE NOTICE '  - Fonction 1: get_google_merchant_eligible_products() - Produits éligibles';
  RAISE NOTICE '  - Fonction 2: get_google_merchant_product_price() - Calcul prix HT/TTC';
  RAISE NOTICE '  - Fonction 3: get_google_merchant_products() - Produits synchronisés';
  RAISE NOTICE '  - Fonction 4: get_google_merchant_stats() - Statistiques dashboard';
  RAISE NOTICE '  - Métadonnées existantes: %', v_metadata_count;
END $$;
