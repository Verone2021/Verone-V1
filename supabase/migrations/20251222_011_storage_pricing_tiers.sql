-- =====================================================
-- Migration: Grille tarifaire stockage (pricing tiers)
-- Date: 2025-12-22
-- Description: Table pour gérer les tranches de prix au m³
-- =====================================================

-- Table des tranches tarifaires stockage
CREATE TABLE IF NOT EXISTS storage_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    min_volume_m3 DECIMAL(10,3) NOT NULL DEFAULT 0,
    max_volume_m3 DECIMAL(10,3), -- NULL = illimité
    price_per_m3 DECIMAL(10,2) NOT NULL DEFAULT 0,
    label VARCHAR(100), -- Ex: "0 à 1 m³", "1 à 5 m³"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche par volume
CREATE INDEX IF NOT EXISTS idx_storage_pricing_volume
ON storage_pricing_tiers(min_volume_m3, max_volume_m3);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_storage_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_storage_pricing_updated_at ON storage_pricing_tiers;
CREATE TRIGGER trigger_storage_pricing_updated_at
    BEFORE UPDATE ON storage_pricing_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_storage_pricing_updated_at();

-- RLS
ALTER TABLE storage_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: lecture pour tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "storage_pricing_select" ON storage_pricing_tiers;
CREATE POLICY "storage_pricing_select" ON storage_pricing_tiers
    FOR SELECT TO authenticated USING (true);

-- Policy: modification pour admins seulement
DROP POLICY IF EXISTS "storage_pricing_admin" ON storage_pricing_tiers;
CREATE POLICY "storage_pricing_admin" ON storage_pricing_tiers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Données initiales (tranches par défaut)
INSERT INTO storage_pricing_tiers (min_volume_m3, max_volume_m3, price_per_m3, label) VALUES
    (0, 1, 25.00, '0 à 1 m³'),
    (1, 5, 20.00, '1 à 5 m³'),
    (5, 10, 15.00, '5 à 10 m³'),
    (10, NULL, 10.00, 'Plus de 10 m³')
ON CONFLICT DO NOTHING;

-- Fonction RPC pour calculer le prix selon le volume
CREATE OR REPLACE FUNCTION calculate_storage_price(volume_m3 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    tier_price DECIMAL;
BEGIN
    SELECT price_per_m3 INTO tier_price
    FROM storage_pricing_tiers
    WHERE is_active = true
      AND min_volume_m3 <= volume_m3
      AND (max_volume_m3 IS NULL OR max_volume_m3 >= volume_m3)
    ORDER BY min_volume_m3 DESC
    LIMIT 1;

    RETURN COALESCE(tier_price, 0) * volume_m3;
END;
$$ LANGUAGE plpgsql STABLE;

-- Commentaires
COMMENT ON TABLE storage_pricing_tiers IS 'Grille tarifaire stockage par tranches de volume';
COMMENT ON COLUMN storage_pricing_tiers.min_volume_m3 IS 'Volume minimum de la tranche (inclus)';
COMMENT ON COLUMN storage_pricing_tiers.max_volume_m3 IS 'Volume maximum de la tranche (inclus), NULL = illimité';
COMMENT ON COLUMN storage_pricing_tiers.price_per_m3 IS 'Prix par mètre cube pour cette tranche';
