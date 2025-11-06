-- Migration: Extensions Google Merchant - Métadonnées & Pricing Custom par Canal
-- Date: 2025-11-06
-- Description: Tables et RPCs pour métadonnées custom (titre/description) et prix custom par canal
-- Référence: docs/business-rules/13-canaux-vente/google-merchant/

-- =====================================================
-- PARTIE 1: Table channel_product_metadata
-- =====================================================

-- Métadonnées custom par canal (titre, description optimisés pour chaque canal)
CREATE TABLE IF NOT EXISTS channel_product_metadata (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('google_merchant', 'meta_catalog', 'amazon', 'manual')),

  -- Métadonnées custom
  custom_title TEXT, -- Titre optimisé pour le canal (max 150 chars Google)
  custom_description TEXT, -- Description optimisée pour le canal (max 5000 chars Google)

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte unicité: 1 seule métadonnée par (product_id, channel)
  UNIQUE(product_id, channel)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_channel_product_metadata_product_id
ON channel_product_metadata(product_id);

CREATE INDEX IF NOT EXISTS idx_channel_product_metadata_channel
ON channel_product_metadata(channel);

-- Trigger updated_at
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

-- RLS Policies
ALTER TABLE channel_product_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY channel_product_metadata_select_policy
ON channel_product_metadata FOR SELECT TO authenticated USING (true);

CREATE POLICY channel_product_metadata_insert_policy
ON channel_product_metadata FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY channel_product_metadata_update_policy
ON channel_product_metadata FOR UPDATE TO authenticated USING (true);

CREATE POLICY channel_product_metadata_delete_policy
ON channel_product_metadata FOR DELETE TO authenticated USING (true);

-- =====================================================
-- PARTIE 2: Table channel_product_pricing
-- =====================================================

-- Prix custom par canal (prix HT en centimes, TTC calculé dynamiquement)
CREATE TABLE IF NOT EXISTS channel_product_pricing (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Références
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('google_merchant', 'meta_catalog', 'amazon', 'manual')),

  -- Prix custom HT (en centimes pour éviter erreurs arrondis)
  price_ht_cents INTEGER NOT NULL CHECK (price_ht_cents >= 0),
  tva_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00 CHECK (tva_rate >= 0 AND tva_rate <= 100),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte unicité: 1 seul prix par (product_id, channel)
  UNIQUE(product_id, channel)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_channel_product_pricing_product_id
ON channel_product_pricing(product_id);

CREATE INDEX IF NOT EXISTS idx_channel_product_pricing_channel
ON channel_product_pricing(channel);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_channel_product_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_channel_product_pricing_updated_at ON channel_product_pricing;
CREATE TRIGGER trigger_channel_product_pricing_updated_at
  BEFORE UPDATE ON channel_product_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_product_pricing_updated_at();

-- RLS Policies
ALTER TABLE channel_product_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY channel_product_pricing_select_policy
ON channel_product_pricing FOR SELECT TO authenticated USING (true);

CREATE POLICY channel_product_pricing_insert_policy
ON channel_product_pricing FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY channel_product_pricing_update_policy
ON channel_product_pricing FOR UPDATE TO authenticated USING (true);

CREATE POLICY channel_product_pricing_delete_policy
ON channel_product_pricing FOR DELETE TO authenticated USING (true);

-- =====================================================
-- PARTIE 3: Fonction helper - Calcul TTC dynamique
-- =====================================================

-- Fonction pure: Calculer prix TTC depuis HT (centimes)
CREATE OR REPLACE FUNCTION calculate_price_ttc_cents(
  price_ht_cents INTEGER,
  tva_rate DECIMAL
)
RETURNS INTEGER AS $$
BEGIN
  -- TTC = HT * (1 + TVA/100)
  RETURN ROUND(price_ht_cents * (1 + tva_rate / 100));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PARTIE 4: RPC - Produits éligibles Google Merchant
-- =====================================================

-- RPC: Récupérer produits éligibles pour Google Merchant (non encore synchronisés)
-- Critères: product_status = 'active', avec images, sans sync Google
CREATE OR REPLACE FUNCTION get_google_merchant_eligible_products()
RETURNS TABLE (
  id UUID,
  sku TEXT,
  name TEXT,
  description TEXT,
  price_ht_cents INTEGER,
  price_ttc_cents INTEGER,
  tva_rate DECIMAL,
  image_url TEXT,
  stock_status TEXT,
  product_status TEXT,
  gtin TEXT,
  brand TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.sku,
    p.name,
    p.description,

    -- Prix depuis price_list_items (prix B2C par défaut)
    COALESCE(pli.unit_price_ht_cents, 0) AS price_ht_cents,
    COALESCE(calculate_price_ttc_cents(pli.unit_price_ht_cents, pli.tva_rate), 0) AS price_ttc_cents,
    COALESCE(pli.tva_rate, 20.00) AS tva_rate,

    -- Image primaire
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id
        AND pi.is_primary = true
      LIMIT 1
    ) AS image_url,

    p.stock_status,
    p.product_status,
    p.gtin,
    p.brand

  FROM products p
  LEFT JOIN price_list_items pli ON pli.product_id = p.id
    AND pli.price_list_id = (
      SELECT id FROM price_lists WHERE name = 'Prix B2C' LIMIT 1
    )

  -- Filtres éligibilité
  WHERE p.product_status = 'active'
    AND p.stock_status IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM product_images pi2
      WHERE pi2.product_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM google_merchant_syncs gms
      WHERE gms.product_id = p.id
    )

  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 5: RPC - Batch Add Produits Google Merchant
-- =====================================================

-- RPC: Ajouter batch de produits à Google Merchant
CREATE OR REPLACE FUNCTION batch_add_google_merchant_products(
  product_ids UUID[],
  merchant_id TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  product_id UUID,
  google_product_id TEXT,
  error TEXT
) AS $$
DECLARE
  p_id UUID;
  g_product_id TEXT;
BEGIN
  FOREACH p_id IN ARRAY product_ids
  LOOP
    BEGIN
      -- Vérifier produit existe
      IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_id) THEN
        RETURN QUERY SELECT false, p_id, NULL::TEXT, 'Product not found';
        CONTINUE;
      END IF;

      -- Vérifier pas déjà synchronisé
      IF EXISTS (SELECT 1 FROM google_merchant_syncs WHERE product_id = p_id) THEN
        RETURN QUERY SELECT false, p_id, NULL::TEXT, 'Already synced';
        CONTINUE;
      END IF;

      -- Construire google_product_id: online:fr:FR:SKU
      SELECT 'online:fr:FR:' || p.sku INTO g_product_id
      FROM products p
      WHERE p.id = p_id;

      -- Insérer dans google_merchant_syncs (statut pending)
      INSERT INTO google_merchant_syncs (
        product_id,
        google_product_id,
        merchant_id,
        sync_status,
        sync_operation,
        google_status
      ) VALUES (
        p_id,
        g_product_id,
        merchant_id,
        'pending',
        'insert',
        'not_synced'
      );

      RETURN QUERY SELECT true, p_id, g_product_id, NULL::TEXT;

    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT false, p_id, NULL::TEXT, SQLERRM;
    END;
  END LOOP;

  -- Refresh stats après batch
  PERFORM refresh_google_merchant_stats();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 6: RPC - Update Prix Custom Google Merchant
-- =====================================================

-- RPC: Mettre à jour prix HT custom pour Google Merchant
CREATE OR REPLACE FUNCTION update_google_merchant_price(
  p_product_id UUID,
  p_price_ht_cents INTEGER,
  p_tva_rate DECIMAL DEFAULT 20.00
)
RETURNS TABLE (
  success BOOLEAN,
  error TEXT
) AS $$
BEGIN
  -- Vérifier produit synchronisé
  IF NOT EXISTS (SELECT 1 FROM google_merchant_syncs WHERE product_id = p_product_id) THEN
    RETURN QUERY SELECT false, 'Product not synced to Google Merchant';
    RETURN;
  END IF;

  -- Upsert prix custom
  INSERT INTO channel_product_pricing (product_id, channel, price_ht_cents, tva_rate)
  VALUES (p_product_id, 'google_merchant', p_price_ht_cents, p_tva_rate)
  ON CONFLICT (product_id, channel)
  DO UPDATE SET
    price_ht_cents = EXCLUDED.price_ht_cents,
    tva_rate = EXCLUDED.tva_rate,
    updated_at = NOW();

  -- Marquer produit pour re-sync (update operation)
  UPDATE google_merchant_syncs
  SET
    sync_status = 'pending',
    sync_operation = 'update',
    updated_at = NOW()
  WHERE product_id = p_product_id;

  RETURN QUERY SELECT true, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 7: RPC - Update Métadonnées Custom
-- =====================================================

-- RPC: Mettre à jour titre/description custom pour Google Merchant
CREATE OR REPLACE FUNCTION update_google_merchant_metadata(
  p_product_id UUID,
  p_custom_title TEXT,
  p_custom_description TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  error TEXT
) AS $$
BEGIN
  -- Vérifier produit synchronisé
  IF NOT EXISTS (SELECT 1 FROM google_merchant_syncs WHERE product_id = p_product_id) THEN
    RETURN QUERY SELECT false, 'Product not synced to Google Merchant';
    RETURN;
  END IF;

  -- Upsert métadonnées custom
  INSERT INTO channel_product_metadata (product_id, channel, custom_title, custom_description)
  VALUES (p_product_id, 'google_merchant', p_custom_title, p_custom_description)
  ON CONFLICT (product_id, channel)
  DO UPDATE SET
    custom_title = EXCLUDED.custom_title,
    custom_description = EXCLUDED.custom_description,
    updated_at = NOW();

  -- Marquer produit pour re-sync (update operation)
  UPDATE google_merchant_syncs
  SET
    sync_status = 'pending',
    sync_operation = 'update',
    updated_at = NOW()
  WHERE product_id = p_product_id;

  RETURN QUERY SELECT true, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 8: RPC - Toggle Visibilité Google Merchant
-- =====================================================

-- RPC: Masquer/afficher produit sur Google Merchant (soft delete via sync_status)
CREATE OR REPLACE FUNCTION toggle_google_merchant_visibility(
  p_product_id UUID,
  p_visible BOOLEAN
)
RETURNS TABLE (
  success BOOLEAN,
  error TEXT
) AS $$
BEGIN
  -- Vérifier produit synchronisé
  IF NOT EXISTS (SELECT 1 FROM google_merchant_syncs WHERE product_id = p_product_id) THEN
    RETURN QUERY SELECT false, 'Product not synced to Google Merchant';
    RETURN;
  END IF;

  -- Si visible = false → Marquer pour deletion
  -- Si visible = true → Marquer pour re-insertion
  UPDATE google_merchant_syncs
  SET
    sync_status = 'pending',
    sync_operation = CASE WHEN p_visible THEN 'insert' ELSE 'delete' END,
    updated_at = NOW()
  WHERE product_id = p_product_id;

  RETURN QUERY SELECT true, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 9: RPC - Remove Produit Google Merchant
-- =====================================================

-- RPC: Retirer produit de Google Merchant (soft delete + historique préservé)
CREATE OR REPLACE FUNCTION remove_from_google_merchant(
  p_product_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error TEXT
) AS $$
BEGIN
  -- Vérifier produit synchronisé
  IF NOT EXISTS (SELECT 1 FROM google_merchant_syncs WHERE product_id = p_product_id) THEN
    RETURN QUERY SELECT false, 'Product not synced to Google Merchant';
    RETURN;
  END IF;

  -- Marquer pour deletion (garde historique)
  UPDATE google_merchant_syncs
  SET
    sync_status = 'pending',
    sync_operation = 'delete',
    google_status = 'not_synced',
    updated_at = NOW()
  WHERE product_id = p_product_id;

  RETURN QUERY SELECT true, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 10: RPC - Poll Statuts Google Merchant
-- =====================================================

-- RPC: Mettre à jour statuts Google pour batch de produits (appelé par cron)
CREATE OR REPLACE FUNCTION poll_google_merchant_statuses(
  product_ids UUID[],
  statuses_data JSONB -- Format: [{"product_id": "uuid", "google_status": "approved", "detail": {...}}]
)
RETURNS TABLE (
  success BOOLEAN,
  updated_count INTEGER,
  error TEXT
) AS $$
DECLARE
  status_item JSONB;
  p_id UUID;
  g_status TEXT;
  g_detail JSONB;
  updated INT := 0;
BEGIN
  -- Itérer sur statuses_data
  FOR status_item IN SELECT * FROM jsonb_array_elements(statuses_data)
  LOOP
    BEGIN
      p_id := (status_item->>'product_id')::UUID;
      g_status := status_item->>'google_status';
      g_detail := status_item->'google_status_detail';

      -- Mettre à jour statut Google
      UPDATE google_merchant_syncs
      SET
        google_status = g_status,
        google_status_detail = g_detail,
        google_status_checked_at = NOW(),
        updated_at = NOW()
      WHERE product_id = p_id;

      IF FOUND THEN
        updated := updated + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Log erreur mais continue (ne pas bloquer batch)
      RAISE WARNING 'Error updating product %: %', p_id, SQLERRM;
    END;
  END LOOP;

  -- Refresh stats après poll
  PERFORM refresh_google_merchant_stats();

  RETURN QUERY SELECT true, updated, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT false, 0, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTIE 11: Commentaires documentation
-- =====================================================

COMMENT ON TABLE channel_product_metadata IS 'Métadonnées custom par canal (titre, description optimisés pour Google Merchant, Meta, etc.)';
COMMENT ON TABLE channel_product_pricing IS 'Prix custom par canal (HT en centimes, TTC calculé dynamiquement)';
COMMENT ON FUNCTION calculate_price_ttc_cents IS 'Calcule prix TTC depuis HT en centimes avec taux TVA';
COMMENT ON FUNCTION get_google_merchant_eligible_products IS 'Produits éligibles Google Merchant (actifs, avec images, non synchronisés)';
COMMENT ON FUNCTION batch_add_google_merchant_products IS 'Ajoute batch de produits à Google Merchant (statut pending)';
COMMENT ON FUNCTION update_google_merchant_price IS 'Met à jour prix HT custom pour Google Merchant';
COMMENT ON FUNCTION update_google_merchant_metadata IS 'Met à jour titre/description custom pour Google Merchant';
COMMENT ON FUNCTION toggle_google_merchant_visibility IS 'Masque/affiche produit sur Google Merchant';
COMMENT ON FUNCTION remove_from_google_merchant IS 'Retire produit de Google Merchant (soft delete + historique)';
COMMENT ON FUNCTION poll_google_merchant_statuses IS 'Met à jour statuts Google polled depuis API (appelé par cron)';

-- =====================================================
-- PARTIE 12: Vérifications finales
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 118 terminée: Google Merchant Channel Extensions';
  RAISE NOTICE '  - 2 tables créées: channel_product_metadata, channel_product_pricing';
  RAISE NOTICE '  - 7 RPCs créés: get_eligible, batch_add, update_price, update_metadata, toggle_visibility, remove, poll_statuses';
  RAISE NOTICE '  - Fonction helper: calculate_price_ttc_cents()';
  RAISE NOTICE '  - Prix HT stockés en centimes, TTC calculé dynamiquement (France 20%% TVA)';
  RAISE NOTICE '  - Soft delete préservant historique pour remove/toggle';
END $$;
