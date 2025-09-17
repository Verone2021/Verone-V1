/**
 * 🏠 Migration: Add Billing & Shipping Addresses
 *
 * Ajoute la distinction entre adresses de facturation et de livraison
 * pour tous les fournisseurs, clients professionnels et particuliers.
 *
 * Business Logic:
 * - Adresse de facturation: obligatoire (billing_*)
 * - Adresse de livraison: optionnelle si différente (shipping_*)
 * - Flag has_different_shipping_address pour UX
 */

-- =========================
-- 1. AJOUTER LES CHAMPS D'ADRESSE DE FACTURATION
-- =========================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS billing_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS billing_address_line2 TEXT,
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR,
ADD COLUMN IF NOT EXISTS billing_city VARCHAR,
ADD COLUMN IF NOT EXISTS billing_region VARCHAR,
ADD COLUMN IF NOT EXISTS billing_country VARCHAR DEFAULT 'FR';

-- =========================
-- 2. AJOUTER LES CHAMPS D'ADRESSE DE LIVRAISON
-- =========================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS shipping_address_line1 TEXT,
ADD COLUMN IF NOT EXISTS shipping_address_line2 TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR,
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR,
ADD COLUMN IF NOT EXISTS shipping_region VARCHAR,
ADD COLUMN IF NOT EXISTS shipping_country VARCHAR DEFAULT 'FR';

-- =========================
-- 3. AJOUTER LE FLAG DE DIFFÉRENCIATION
-- =========================

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS has_different_shipping_address BOOLEAN DEFAULT FALSE;

-- =========================
-- 4. MIGRATION DES DONNÉES EXISTANTES
-- =========================

-- Migrer les adresses actuelles vers billing_address
-- (On considère que l'adresse actuelle est l'adresse de facturation)
UPDATE organisations
SET
  billing_address_line1 = address_line1,
  billing_address_line2 = address_line2,
  billing_postal_code = postal_code,
  billing_city = city,
  billing_region = region,
  billing_country = COALESCE(country, 'FR'),
  has_different_shipping_address = FALSE
WHERE
  billing_address_line1 IS NULL  -- Éviter de réécraser si déjà migré
  AND (address_line1 IS NOT NULL OR city IS NOT NULL); -- Seulement si on a des données

-- =========================
-- 5. COMMENTAIRES ET DOCUMENTATION
-- =========================

COMMENT ON COLUMN organisations.billing_address_line1 IS 'Adresse de facturation - Ligne 1 (obligatoire si organisation a une adresse)';
COMMENT ON COLUMN organisations.billing_address_line2 IS 'Adresse de facturation - Ligne 2 (optionnelle)';
COMMENT ON COLUMN organisations.billing_postal_code IS 'Code postal de facturation';
COMMENT ON COLUMN organisations.billing_city IS 'Ville de facturation';
COMMENT ON COLUMN organisations.billing_region IS 'Région/Département de facturation';
COMMENT ON COLUMN organisations.billing_country IS 'Pays de facturation (défaut: FR)';

COMMENT ON COLUMN organisations.shipping_address_line1 IS 'Adresse de livraison - Ligne 1 (optionnelle si différente de facturation)';
COMMENT ON COLUMN organisations.shipping_address_line2 IS 'Adresse de livraison - Ligne 2 (optionnelle)';
COMMENT ON COLUMN organisations.shipping_postal_code IS 'Code postal de livraison';
COMMENT ON COLUMN organisations.shipping_city IS 'Ville de livraison';
COMMENT ON COLUMN organisations.shipping_region IS 'Région/Département de livraison';
COMMENT ON COLUMN organisations.shipping_country IS 'Pays de livraison (défaut: FR)';

COMMENT ON COLUMN organisations.has_different_shipping_address IS 'Indique si adresse de livraison différente de facturation';

-- =========================
-- 6. INDEXES POUR PERFORMANCE
-- =========================

-- Index pour recherches par ville de facturation
CREATE INDEX IF NOT EXISTS idx_organisations_billing_city
ON organisations(billing_city)
WHERE billing_city IS NOT NULL;

-- Index pour recherches par ville de livraison
CREATE INDEX IF NOT EXISTS idx_organisations_shipping_city
ON organisations(shipping_city)
WHERE shipping_city IS NOT NULL;

-- Index pour organisations avec adresses de livraison différentes
CREATE INDEX IF NOT EXISTS idx_organisations_different_shipping
ON organisations(has_different_shipping_address)
WHERE has_different_shipping_address = TRUE;

-- =========================
-- 7. VALIDATION ET CONTRAINTES
-- =========================

-- Contrainte: Si has_different_shipping_address = TRUE, alors shipping_address doit être renseignée
-- Note: On implémente cette logique côté application pour plus de flexibilité

-- =========================
-- 8. LOGS POUR AUDIT
-- =========================

-- Compter les organisations migrées
DO $$
DECLARE
    migrated_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Compter les organisations qui avaient une adresse et qui ont été migrées
    SELECT COUNT(*) INTO migrated_count
    FROM organisations
    WHERE billing_address_line1 IS NOT NULL OR billing_city IS NOT NULL;

    -- Compter le total d'organisations
    SELECT COUNT(*) INTO total_count
    FROM organisations;

    -- Log du résultat
    RAISE NOTICE '✅ Migration billing/shipping addresses completed:';
    RAISE NOTICE '   - Total organisations: %', total_count;
    RAISE NOTICE '   - Organisations avec adresse migrée: %', migrated_count;
    RAISE NOTICE '   - Organisations sans adresse: %', (total_count - migrated_count);
END $$;

-- Message de confirmation
SELECT
    '🏠 Billing/Shipping addresses migration completed successfully' as status,
    COUNT(*) as total_organisations,
    COUNT(*) FILTER (WHERE billing_city IS NOT NULL) as organisations_with_billing,
    COUNT(*) FILTER (WHERE has_different_shipping_address = TRUE) as organisations_with_different_shipping
FROM organisations;