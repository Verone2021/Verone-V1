-- Migration: Ajout traçabilité canal vente sur mouvements stock
-- Date: 2025-10-31
-- Objectif: Permettre filtrage analytics mouvements stock par canal vente (B2B, ecommerce, retail, wholesale)
-- Scope: Mouvements OUT ventes clients uniquement (pas IN/ADJUST/TRANSFER)

-- ============================================================================
-- 1. AJOUTER COLONNE channel_id à stock_movements
-- ============================================================================

-- Colonne NULLABLE pour éviter breaking changes sur données existantes
-- Les mouvements historiques restent sans canal (acceptable pour analytics)
ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS channel_id UUID NULL;

-- ============================================================================
-- 2. FOREIGN KEY CONSTRAINT
-- ============================================================================

-- Référence sales_channels(id) avec ON DELETE SET NULL
-- Rationale: Si canal supprimé, historique stock reste intact (channel_id devient NULL)
-- Alternative rejetée: ON DELETE RESTRICT bloquerait suppression canaux obsolètes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_stock_movements_channel_id'
    ) THEN
        ALTER TABLE stock_movements
        ADD CONSTRAINT fk_stock_movements_channel_id
        FOREIGN KEY (channel_id)
        REFERENCES sales_channels(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 3. INDEX PERFORMANCE
-- ============================================================================

-- Index pour filtres analytics rapides (ex: "Mouvements OUT canal B2B dernier mois")
-- Index partiel car majorité mouvements n'ont pas de canal (IN, ADJUST, TRANSFER)
CREATE INDEX IF NOT EXISTS idx_stock_movements_channel
ON stock_movements(channel_id)
WHERE channel_id IS NOT NULL;

-- Index composite pour queries fréquentes (canal + type mouvement)
CREATE INDEX IF NOT EXISTS idx_stock_movements_channel_type
ON stock_movements(channel_id, movement_type, performed_at DESC)
WHERE channel_id IS NOT NULL;

-- ============================================================================
-- 4. DOCUMENTATION INLINE
-- ============================================================================

COMMENT ON COLUMN stock_movements.channel_id IS
'Canal de vente origine du mouvement (b2b, ecommerce, retail, wholesale).

**Scope:** SEULEMENT mouvements OUT liés à ventes clients (sales_orders).

**NULL pour:**
- Mouvements IN (réceptions fournisseurs, retours clients)
- Mouvements ADJUST (ajustements inventaire)
- Mouvements TRANSFER (transferts inter-entrepôts)
- Mouvements OUT achats fournisseurs (purchase_orders)

**Usage:**
- Stock reste GLOBAL (pas de stock séparé par canal)
- Colonne utilisée uniquement pour analytics et filtres
- Permet rapports: "Stock vendu par canal" ou "Réservations B2B vs B2C"

**Propagation:**
Rempli automatiquement par trigger handle_sales_order_stock()
depuis sales_orders.channel_id lors création mouvements vente.

**Ajouté:** 2025-10-31 (Phase 1 - Traçabilité multi-canal)';

-- ============================================================================
-- 5. VALIDATION
-- ============================================================================

-- Vérifier colonne créée
DO $$
DECLARE
    v_column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'stock_movements'
        AND column_name = 'channel_id'
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
        RAISE EXCEPTION 'Migration FAILED: Column channel_id not created';
    END IF;

    RAISE NOTICE '✅ Migration 20251031_003 SUCCESS: channel_id added to stock_movements';
END $$;

-- Afficher statistiques
SELECT
    'stock_movements' as table_name,
    COUNT(*) as total_movements,
    COUNT(channel_id) as movements_with_channel,
    ROUND(100.0 * COUNT(channel_id) / NULLIF(COUNT(*), 0), 2) as percentage_with_channel
FROM stock_movements;
