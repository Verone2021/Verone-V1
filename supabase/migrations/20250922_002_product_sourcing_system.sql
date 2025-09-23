-- Migration: Système de Sourcing et Différenciation Produits
-- Date: 2025-01-22
-- Description: Ajout des champs pour le workflow sourcing et produits sur-mesure

-- =============================================================================
-- 1. EXTENSION TABLE product_drafts
-- =============================================================================

-- Différenciation type de produit
ALTER TABLE product_drafts
ADD COLUMN product_type VARCHAR(20) DEFAULT 'standard'
CHECK (product_type IN ('standard', 'custom'));

-- Attribution client pour produits sur-mesure
ALTER TABLE product_drafts
ADD COLUMN assigned_client_id UUID REFERENCES organisations(id) ON DELETE SET NULL;

-- Mode de création (sourcing vs complet)
ALTER TABLE product_drafts
ADD COLUMN creation_mode VARCHAR(20) DEFAULT 'complete'
CHECK (creation_mode IN ('sourcing', 'complete'));

-- URL page fournisseur (obligatoire pour sourcing)
ALTER TABLE product_drafts
ADD COLUMN supplier_page_url TEXT;

-- Index sur assigned_client_id pour performance
CREATE INDEX idx_product_drafts_assigned_client ON product_drafts(assigned_client_id);

-- Index sur product_type pour filtrage
CREATE INDEX idx_product_drafts_product_type ON product_drafts(product_type);

-- Index sur creation_mode pour filtrage
CREATE INDEX idx_product_drafts_creation_mode ON product_drafts(creation_mode);

-- =============================================================================
-- 2. EXTENSION TABLE products (cohérence lors finalisation)
-- =============================================================================

-- Différenciation type de produit
ALTER TABLE products
ADD COLUMN product_type VARCHAR(20) DEFAULT 'standard'
CHECK (product_type IN ('standard', 'custom'));

-- Attribution client pour produits sur-mesure
ALTER TABLE products
ADD COLUMN assigned_client_id UUID REFERENCES organisations(id) ON DELETE SET NULL;

-- Mode de création (sourcing vs complet)
ALTER TABLE products
ADD COLUMN creation_mode VARCHAR(20) DEFAULT 'complete'
CHECK (creation_mode IN ('sourcing', 'complete'));

-- Index sur assigned_client_id pour performance
CREATE INDEX idx_products_assigned_client ON products(assigned_client_id);

-- Index sur product_type pour filtrage
CREATE INDEX idx_products_product_type ON products(product_type);

-- =============================================================================
-- 3. TRIGGERS ET VALIDATIONS BUSINESS RULES
-- =============================================================================

-- Validation : produits sur-mesure doivent avoir un client assigné lors de la finalisation
CREATE OR REPLACE FUNCTION validate_custom_product_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Validation uniquement pour les produits finalisés (table products)
    IF TG_TABLE_NAME = 'products' AND NEW.product_type = 'custom' AND NEW.assigned_client_id IS NULL THEN
        RAISE EXCEPTION 'Un produit sur-mesure doit avoir un client assigné';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les insertions/mises à jour
CREATE TRIGGER trigger_validate_custom_product_assignment
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_custom_product_assignment();

-- =============================================================================
-- 4. RLS POLICIES POUR PRODUITS SUR-MESURE
-- =============================================================================

-- Policy : les produits sur-mesure ne sont visibles que par le client assigné et les admins
CREATE POLICY "Custom products visibility" ON products
    FOR SELECT
    USING (
        -- Produits standard : visibles par tous
        product_type = 'standard'
        OR
        -- Produits sur-mesure : visibles par le client assigné ou les admins
        (product_type = 'custom' AND (
            assigned_client_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_id = auth.uid()
                AND role IN ('admin', 'catalogue_manager')
            )
        ))
    );

-- Policy similaire pour product_drafts
CREATE POLICY "Custom draft products visibility" ON product_drafts
    FOR SELECT
    USING (
        -- Créé par l'utilisateur actuel
        created_by = auth.uid()
        OR
        -- Produits standard : visibles par tous les gestionnaires
        (product_type = 'standard' AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'catalogue_manager')
        ))
        OR
        -- Produits sur-mesure : visibles par le client assigné ou les admins
        (product_type = 'custom' AND (
            assigned_client_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_id = auth.uid()
                AND role IN ('admin', 'catalogue_manager')
            )
        ))
    );

-- =============================================================================
-- 5. COMMENTAIRES DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN product_drafts.product_type IS 'Type de produit : standard (catalogue général) ou custom (sur-mesure pour client spécifique)';
COMMENT ON COLUMN product_drafts.assigned_client_id IS 'Client assigné pour les produits sur-mesure (obligatoire si product_type = custom)';
COMMENT ON COLUMN product_drafts.creation_mode IS 'Mode de création : sourcing (3 champs obligatoires) ou complete (formulaire complet)';
COMMENT ON COLUMN product_drafts.supplier_page_url IS 'URL de la page fournisseur (obligatoire pour création en mode sourcing)';

COMMENT ON COLUMN products.product_type IS 'Type de produit : standard (catalogue général) ou custom (sur-mesure pour client spécifique)';
COMMENT ON COLUMN products.assigned_client_id IS 'Client assigné pour les produits sur-mesure (obligatoire si product_type = custom)';
COMMENT ON COLUMN products.creation_mode IS 'Mode de création original : sourcing ou complete (pour traçabilité)';