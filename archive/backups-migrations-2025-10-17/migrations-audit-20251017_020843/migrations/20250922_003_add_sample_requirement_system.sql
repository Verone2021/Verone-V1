-- Migration: Système de Gestion des Échantillons
-- Date: 2025-09-22
-- Description: Ajout du champ requires_sample pour gérer les exigences d'échantillonnage

-- =============================================================================
-- 1. EXTENSION TABLE product_drafts
-- =============================================================================

-- Champ pour indiquer si le produit nécessite un échantillon
ALTER TABLE product_drafts
ADD COLUMN requires_sample BOOLEAN DEFAULT false;

-- Index sur requires_sample pour filtrage
CREATE INDEX idx_product_drafts_requires_sample ON product_drafts(requires_sample);

-- =============================================================================
-- 2. EXTENSION TABLE products (cohérence lors finalisation)
-- =============================================================================

-- Champ pour indiquer si le produit nécessite un échantillon
ALTER TABLE products
ADD COLUMN requires_sample BOOLEAN DEFAULT false;

-- Index sur requires_sample pour filtrage
CREATE INDEX idx_products_requires_sample ON products(requires_sample);

-- =============================================================================
-- 3. FONCTIONS DE GESTION DES ÉCHANTILLONS
-- =============================================================================

-- Fonction pour marquer qu'un produit nécessite un échantillon
CREATE OR REPLACE FUNCTION mark_sample_required(
    product_table TEXT, -- 'products' ou 'product_drafts'
    product_id UUID,
    requires_sample_value BOOLEAN DEFAULT true
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validation des paramètres
    IF product_table NOT IN ('products', 'product_drafts') THEN
        RAISE EXCEPTION 'Table invalide. Utilisez "products" ou "product_drafts"';
    END IF;

    -- Mise à jour selon la table
    IF product_table = 'products' THEN
        UPDATE products
        SET requires_sample = requires_sample_value,
            updated_at = NOW()
        WHERE id = product_id;
    ELSE
        UPDATE product_drafts
        SET requires_sample = requires_sample_value,
            updated_at = NOW()
        WHERE id = product_id;
    END IF;

    -- Vérifier si la mise à jour a réussi
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit avec ID % non trouvé dans la table %', product_id, product_table;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques des échantillons
CREATE OR REPLACE FUNCTION get_sample_statistics()
RETURNS TABLE (
    table_name TEXT,
    total_products BIGINT,
    requires_sample_count BIGINT,
    no_sample_count BIGINT,
    sample_percentage NUMERIC(5,2)
) AS $$
BEGIN
    -- Statistiques pour product_drafts
    RETURN QUERY
    SELECT
        'product_drafts'::TEXT,
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE pd.requires_sample = true) as requires_sample_count,
        COUNT(*) FILTER (WHERE pd.requires_sample = false) as no_sample_count,
        ROUND(
            (COUNT(*) FILTER (WHERE pd.requires_sample = true) * 100.0 / NULLIF(COUNT(*), 0)),
            2
        ) as sample_percentage
    FROM product_drafts pd;

    -- Statistiques pour products
    RETURN QUERY
    SELECT
        'products'::TEXT,
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE p.requires_sample = true) as requires_sample_count,
        COUNT(*) FILTER (WHERE p.requires_sample = false) as no_sample_count,
        ROUND(
            (COUNT(*) FILTER (WHERE p.requires_sample = true) * 100.0 / NULLIF(COUNT(*), 0)),
            2
        ) as sample_percentage
    FROM products p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. TRIGGERS POUR AUDIT ET COHÉRENCE
-- =============================================================================

-- Fonction trigger pour logguer les changements d'échantillonnage
CREATE OR REPLACE FUNCTION log_sample_requirement_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Seulement si requires_sample a changé
    IF TG_OP = 'UPDATE' AND OLD.requires_sample IS DISTINCT FROM NEW.requires_sample THEN
        RAISE LOG 'Sample requirement changed for % %: % -> %',
            TG_TABLE_NAME,
            NEW.id,
            COALESCE(OLD.requires_sample::TEXT, 'NULL'),
            COALESCE(NEW.requires_sample::TEXT, 'NULL');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux deux tables
CREATE TRIGGER trigger_log_sample_requirement_changes_drafts
    AFTER UPDATE ON product_drafts
    FOR EACH ROW
    EXECUTE FUNCTION log_sample_requirement_changes();

CREATE TRIGGER trigger_log_sample_requirement_changes_products
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_sample_requirement_changes();

-- =============================================================================
-- 5. PERMISSIONS ET SÉCURITÉ
-- =============================================================================

-- Permissions pour la fonction mark_sample_required
GRANT EXECUTE ON FUNCTION mark_sample_required(TEXT, UUID, BOOLEAN) TO authenticated;

-- Permissions pour la fonction get_sample_statistics
GRANT EXECUTE ON FUNCTION get_sample_statistics() TO authenticated;

-- =============================================================================
-- 6. COMMENTAIRES DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN product_drafts.requires_sample IS 'Indique si ce produit nécessite un échantillon avant validation/commande (false par défaut)';
COMMENT ON COLUMN products.requires_sample IS 'Indique si ce produit nécessite un échantillon avant commande (false par défaut)';

COMMENT ON FUNCTION mark_sample_required(TEXT, UUID, BOOLEAN) IS 'Marque un produit comme nécessitant un échantillon. Params: table, product_id, requires_sample';
COMMENT ON FUNCTION get_sample_statistics() IS 'Retourne les statistiques des exigences d\'échantillonnage pour products et product_drafts';

-- =============================================================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- =============================================================================

-- Exemple d'utilisation pour marquer quelques produits comme nécessitant des échantillons
-- Ces données sont optionnelles et peuvent être supprimées en production

-- Marquer quelques brouillons comme nécessitant des échantillons (si ils existent)
-- UPDATE product_drafts
-- SET requires_sample = true
-- WHERE creation_mode = 'sourcing'
-- AND name ILIKE '%échantillon%'
-- OR name ILIKE '%test%'
-- LIMIT 3;

-- Marquer quelques produits finalisés comme nécessitant des échantillons (si ils existent)
-- UPDATE products
-- SET requires_sample = true
-- WHERE cost_price > 100
-- AND name ILIKE '%design%'
-- LIMIT 2;