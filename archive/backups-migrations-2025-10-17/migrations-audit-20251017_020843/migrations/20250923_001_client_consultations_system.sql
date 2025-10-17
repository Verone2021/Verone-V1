-- Migration: Système de Consultations Clients
-- Date: 2025-09-23
-- Description: Création du système complet de consultations clients avec liens aux produits sourcing

-- =============================================================================
-- 1. CRÉATION TABLE client_consultations
-- =============================================================================

CREATE TABLE client_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Informations organisation cliente
    organisation_name TEXT NOT NULL CHECK (length(trim(organisation_name)) > 0),
    client_email TEXT NOT NULL CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    client_phone TEXT,

    -- Détails de la consultation
    descriptif TEXT NOT NULL CHECK (length(trim(descriptif)) >= 10),
    image_url TEXT, -- URL de l'image fournie par le client
    tarif_maximum NUMERIC(10,2) CHECK (tarif_maximum > 0),

    -- Gestion interne
    status TEXT DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes_internes TEXT,

    -- Métadonnées
    priority_level INTEGER DEFAULT 2 CHECK (priority_level BETWEEN 1 AND 5), -- 1=urgent, 5=faible
    source_channel TEXT DEFAULT 'website' CHECK (source_channel IN ('website', 'email', 'phone', 'other')),
    estimated_response_date DATE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =============================================================================
-- 2. TABLE DE LIAISON consultation_products
-- =============================================================================

CREATE TABLE consultation_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES client_consultations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Informations spécifiques à la liaison
    proposed_price NUMERIC(10,2) CHECK (proposed_price > 0),
    notes TEXT,
    is_primary_proposal BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Contrainte d'unicité
    UNIQUE(consultation_id, product_id)
);

-- =============================================================================
-- 3. EXTENSION enum availability_status_type
-- =============================================================================

-- Ajout des nouveaux statuts pour le workflow sourcing
ALTER TYPE availability_status_type ADD VALUE IF NOT EXISTS 'sourcing';
ALTER TYPE availability_status_type ADD VALUE IF NOT EXISTS 'pret_a_commander';
ALTER TYPE availability_status_type ADD VALUE IF NOT EXISTS 'echantillon_a_commander';

-- =============================================================================
-- 4. AJOUT CHAMPS sourcing_type MANQUANTS
-- =============================================================================

-- Vérifier et ajouter sourcing_type dans product_drafts si pas encore fait
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'product_drafts'
        AND column_name = 'sourcing_type'
    ) THEN
        ALTER TABLE product_drafts
        ADD COLUMN sourcing_type VARCHAR(20) DEFAULT 'interne'
        CHECK (sourcing_type IN ('interne', 'client'));

        CREATE INDEX idx_product_drafts_sourcing_type ON product_drafts(sourcing_type);

        COMMENT ON COLUMN product_drafts.sourcing_type IS 'Type de sourcing: interne (catalogue général) ou client (consultation spécifique)';
    END IF;
END $$;

-- =============================================================================
-- 5. FONCTIONS BUSINESS LOGIC
-- =============================================================================

-- Fonction pour calculer automatiquement le statut d'un produit sourcing
CREATE OR REPLACE FUNCTION calculate_sourcing_product_status(p_product_id UUID)
RETURNS availability_status_type AS $$
DECLARE
    product_record products%ROWTYPE;
    has_purchase_orders BOOLEAN := false;
    has_stock BOOLEAN := false;
BEGIN
    -- Récupérer les informations du produit
    SELECT * INTO product_record FROM products WHERE id = p_product_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit avec ID % non trouvé', p_product_id;
    END IF;

    -- Si le produit n'est pas en mode sourcing, retourner son statut actuel
    IF product_record.creation_mode != 'sourcing' THEN
        RETURN product_record.status;
    END IF;

    -- Vérifier s'il y a des commandes fournisseurs
    SELECT EXISTS(
        SELECT 1 FROM purchase_order_items poi
        JOIN purchase_orders po ON poi.purchase_order_id = po.id
        WHERE poi.product_id = p_product_id
        AND po.status IN ('confirmed', 'partially_received', 'received')
    ) INTO has_purchase_orders;

    -- Vérifier s'il y a du stock
    has_stock := COALESCE(product_record.stock_real, 0) > 0;

    -- Logique de détermination du statut
    IF product_record.requires_sample THEN
        RETURN 'echantillon_a_commander'::availability_status_type;
    ELSIF NOT has_purchase_orders AND NOT has_stock THEN
        RETURN 'pret_a_commander'::availability_status_type;
    ELSIF has_purchase_orders OR has_stock THEN
        RETURN 'in_stock'::availability_status_type;
    ELSE
        RETURN 'sourcing'::availability_status_type;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les produits éligibles aux consultations (sourcing uniquement)
CREATE OR REPLACE FUNCTION get_consultation_eligible_products()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    sku VARCHAR,
    status availability_status_type,
    requires_sample BOOLEAN,
    supplier_name TEXT,
    creation_mode VARCHAR,
    sourcing_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.sku,
        p.status,
        p.requires_sample,
        o.name as supplier_name,
        p.creation_mode,
        COALESCE(
            (SELECT pd.sourcing_type FROM product_drafts pd WHERE pd.id = p.id),
            'interne'
        ) as sourcing_type
    FROM products p
    LEFT JOIN organisations o ON p.supplier_id = o.id
    WHERE p.creation_mode = 'sourcing'
    AND p.status IN ('sourcing', 'pret_a_commander', 'echantillon_a_commander')
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. TRIGGERS AUTOMATION
-- =============================================================================

-- Trigger pour mise à jour automatique du statut produit lors de réception commandes
CREATE OR REPLACE FUNCTION update_sourcing_product_status_on_reception()
RETURNS TRIGGER AS $$
DECLARE
    product_record products%ROWTYPE;
    new_status availability_status_type;
BEGIN
    -- Récupérer les informations du produit concerné
    SELECT * INTO product_record
    FROM products p
    JOIN purchase_order_items poi ON p.id = poi.product_id
    WHERE poi.purchase_order_id = NEW.id;

    -- Si le produit est en mode sourcing, recalculer son statut
    IF product_record.creation_mode = 'sourcing' THEN
        new_status := calculate_sourcing_product_status(product_record.id);

        -- Mettre à jour le statut si nécessaire
        IF new_status != product_record.status THEN
            UPDATE products
            SET status = new_status, updated_at = now()
            WHERE id = product_record.id;

            RAISE LOG 'Product % status updated from % to % due to purchase order reception',
                product_record.id, product_record.status, new_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les changements de statut des commandes fournisseurs
CREATE TRIGGER trigger_update_sourcing_status_on_po_reception
    AFTER UPDATE OF status ON purchase_orders
    FOR EACH ROW
    WHEN (NEW.status IN ('confirmed', 'partially_received', 'received')
          AND OLD.status != NEW.status)
    EXECUTE FUNCTION update_sourcing_product_status_on_reception();

-- Trigger pour mise à jour du timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_consultations_updated_at
    BEFORE UPDATE ON client_consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. INDEX POUR PERFORMANCE
-- =============================================================================

-- Index pour la table consultations
CREATE INDEX idx_consultations_status ON client_consultations(status);
CREATE INDEX idx_consultations_assigned_to ON client_consultations(assigned_to);
CREATE INDEX idx_consultations_created_at ON client_consultations(created_at);
CREATE INDEX idx_consultations_organisation_name ON client_consultations(organisation_name);
CREATE INDEX idx_consultations_email ON client_consultations(client_email);

-- Index pour la table de liaison
CREATE INDEX idx_consultation_products_consultation ON consultation_products(consultation_id);
CREATE INDEX idx_consultation_products_product ON consultation_products(product_id);
CREATE INDEX idx_consultation_products_primary ON consultation_products(is_primary_proposal) WHERE is_primary_proposal = true;

-- Index pour les produits sourcing
CREATE INDEX idx_products_creation_mode_status ON products(creation_mode, status);

-- =============================================================================
-- 8. RLS POLICIES
-- =============================================================================

-- Enable RLS sur les nouvelles tables
ALTER TABLE client_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_products ENABLE ROW LEVEL SECURITY;

-- Policy pour consultations: lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Consultations read access" ON client_consultations
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy pour consultations: modification pour admins et assignés
CREATE POLICY "Consultations update access" ON client_consultations
    FOR UPDATE
    TO authenticated
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'catalogue_manager', 'sales')
        )
    );

-- Policy pour consultations: insertion pour admins et sales
CREATE POLICY "Consultations insert access" ON client_consultations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'catalogue_manager', 'sales')
        )
    );

-- Policy pour liaison consultation-produits
CREATE POLICY "Consultation products access" ON consultation_products
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_consultations cc
            WHERE cc.id = consultation_id
            AND (
                cc.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid()
                    AND role IN ('admin', 'catalogue_manager', 'sales')
                )
            )
        )
    );

-- =============================================================================
-- 9. PERMISSIONS FONCTIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION calculate_sourcing_product_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_consultation_eligible_products() TO authenticated;

-- =============================================================================
-- 10. COMMENTAIRES DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE client_consultations IS 'Consultations clients avec demandes spécifiques - seuls les produits en sourcing peuvent être proposés';
COMMENT ON TABLE consultation_products IS 'Liaison entre consultations clients et produits proposés (sourcing uniquement)';

COMMENT ON COLUMN client_consultations.organisation_name IS 'Nom de organisation cliente (saisi manuellement)';
COMMENT ON COLUMN client_consultations.descriptif IS 'Description détaillée de ce que recherche le client (minimum 10 caractères)';
COMMENT ON COLUMN client_consultations.tarif_maximum IS 'Budget maximum du client en euros';
COMMENT ON COLUMN client_consultations.status IS 'Statut: en_attente, en_cours, terminee, annulee';
COMMENT ON COLUMN client_consultations.priority_level IS 'Niveau de priorité: 1=urgent, 5=faible';
COMMENT ON COLUMN client_consultations.source_channel IS 'Canal origine: website, email, phone, other';

COMMENT ON COLUMN consultation_products.proposed_price IS 'Prix proposé au client pour ce produit spécifique';
COMMENT ON COLUMN consultation_products.is_primary_proposal IS 'Indique si cest la proposition principale pour cette consultation';

COMMENT ON FUNCTION calculate_sourcing_product_status(UUID) IS 'Calcule automatiquement le statut un produit en mode sourcing basé sur commandes et stock';
COMMENT ON FUNCTION get_consultation_eligible_products() IS 'Retourne tous les produits éligibles aux consultations (mode sourcing uniquement)';