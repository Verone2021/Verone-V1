/**
 * 📁 Collections System - Migration Vérone
 *
 * Système de collections produits pour catalogues partagés
 * Business Rules: Catalogue Partageable MVP
 */

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
    shared_link_token VARCHAR(50) UNIQUE,
    product_count INTEGER DEFAULT 0,
    shared_count INTEGER DEFAULT 0,
    last_shared TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Collection products junction table
CREATE TABLE IF NOT EXISTS collection_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    UNIQUE(collection_id, product_id)
);

-- Collection shares tracking
CREATE TABLE IF NOT EXISTS collection_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    shared_by UUID REFERENCES auth.users(id),
    share_type VARCHAR(20) DEFAULT 'link' CHECK (share_type IN ('link', 'email', 'pdf')),
    recipient_email VARCHAR(255),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_visibility ON collections(visibility);
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_created_by ON collections(created_by);
CREATE INDEX IF NOT EXISTS idx_collections_shared_token ON collections(shared_link_token);

CREATE INDEX IF NOT EXISTS idx_collection_products_collection ON collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product ON collection_products(product_id);

CREATE INDEX IF NOT EXISTS idx_collection_shares_collection ON collection_shares(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_shares_shared_at ON collection_shares(shared_at);

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_shares ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "collections_select_policy" ON collections
    FOR SELECT USING (
        -- Public collections visible to all authenticated users
        (visibility = 'public' AND auth.role() = 'authenticated')
        OR
        -- Private collections visible only to creator
        (visibility = 'private' AND created_by = auth.uid())
        OR
        -- Admin/Staff can see all
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'staff')
        )
    );

CREATE POLICY "collections_insert_policy" ON collections
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND created_by = auth.uid()
    );

CREATE POLICY "collections_update_policy" ON collections
    FOR UPDATE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "collections_delete_policy" ON collections
    FOR DELETE USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Collection products policies
CREATE POLICY "collection_products_select_policy" ON collection_products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id
            AND (
                (c.visibility = 'public' AND auth.role() = 'authenticated')
                OR (c.visibility = 'private' AND c.created_by = auth.uid())
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid()
                    AND role IN ('owner', 'admin', 'staff')
                )
            )
        )
    );

CREATE POLICY "collection_products_insert_policy" ON collection_products
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id
            AND (
                c.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid()
                    AND role IN ('owner', 'admin')
                )
            )
        )
    );

CREATE POLICY "collection_products_delete_policy" ON collection_products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id
            AND (
                c.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid()
                    AND role IN ('owner', 'admin')
                )
            )
        )
    );

-- Collection shares policies (more permissive for tracking)
CREATE POLICY "collection_shares_select_policy" ON collection_shares
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id
            AND (
                c.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM user_profiles
                    WHERE user_id = auth.uid()
                    AND role IN ('owner', 'admin', 'staff')
                )
            )
        )
    );

CREATE POLICY "collection_shares_insert_policy" ON collection_shares
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = collection_id
            AND c.created_by = auth.uid()
        )
    );

-- Functions to update counters
CREATE OR REPLACE FUNCTION update_collection_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE collections
        SET product_count = (
            SELECT COUNT(*) FROM collection_products
            WHERE collection_id = NEW.collection_id
        ),
        updated_at = NOW()
        WHERE id = NEW.collection_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE collections
        SET product_count = (
            SELECT COUNT(*) FROM collection_products
            WHERE collection_id = OLD.collection_id
        ),
        updated_at = NOW()
        WHERE id = OLD.collection_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_collection_share_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE collections
    SET shared_count = shared_count + 1,
        last_shared = NEW.shared_at,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trigger_update_collection_product_count ON collection_products;
CREATE TRIGGER trigger_update_collection_product_count
    AFTER INSERT OR DELETE ON collection_products
    FOR EACH ROW EXECUTE FUNCTION update_collection_product_count();

DROP TRIGGER IF EXISTS trigger_update_collection_share_count ON collection_shares;
CREATE TRIGGER trigger_update_collection_share_count
    AFTER INSERT ON collection_shares
    FOR EACH ROW EXECUTE FUNCTION update_collection_share_count();

-- Function to generate unique share tokens
CREATE OR REPLACE FUNCTION generate_share_token(collection_name TEXT)
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate token based on collection name + random string
        token := LOWER(
            REGEXP_REPLACE(
                SUBSTRING(collection_name FROM 1 FOR 20),
                '[^a-zA-Z0-9]',
                '',
                'g'
            )
        ) || '_' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);

        -- Check if token already exists
        IF NOT EXISTS (SELECT 1 FROM collections WHERE shared_link_token = token) THEN
            RETURN token;
        END IF;

        counter := counter + 1;
        IF counter > 100 THEN
            -- Fallback to pure UUID if we can't generate unique token
            RETURN 'col_' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 12);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;