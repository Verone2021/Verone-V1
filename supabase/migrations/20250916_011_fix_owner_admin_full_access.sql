/**
 * 🔧 Migration: Fix Owner/Admin Full Access Rights
 *
 * Corrige les règles RLS pour respecter les business rules:
 * - Owner (Vérone by Romeo) : Accès complet à tout ("*")
 * - Admin : Accès complet à toutes les organisations
 * - Supprime les restrictions qui bloquent l'accès aux détails
 */

-- Supprimer les politiques RLS restrictives existantes pour les organisations
DROP POLICY IF EXISTS "users_can_view_organisations" ON organisations;
DROP POLICY IF EXISTS "owners_can_create_organisations" ON organisations;
DROP POLICY IF EXISTS "admins_can_update_organisation" ON organisations;
DROP POLICY IF EXISTS "Anyone can read supplier organisations" ON organisations;

-- Politique principale : Owner et Admin ont accès complet à toutes les organisations
CREATE POLICY "owner_admin_full_access" ON organisations
  FOR ALL
  USING (
    get_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_role() IN ('owner', 'admin')
  );

-- Politique pour les autres rôles : accès en lecture aux organisations actives
CREATE POLICY "users_read_active_organisations" ON organisations
  FOR SELECT
  USING (
    is_active = true AND
    get_user_role() IN ('catalog_manager', 'sales', 'purchasing', 'viewer')
  );

-- Politique pour les collections publiques (partage externe)
CREATE POLICY "public_read_shared_organisations" ON organisations
  FOR SELECT
  USING (
    -- Accès pour les liens publics partagés (si implémenté plus tard)
    is_active = true
  );

-- Vérifier que la fonction get_user_role existe et fonctionne
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_type AS $$
BEGIN
  -- Retourner le rôle de l'utilisateur authentifié
  RETURN (
    SELECT role
    FROM user_profiles
    WHERE user_id = auth.uid()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner NULL (pas d'accès)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'assurer que le type user_role_type existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
    CREATE TYPE user_role_type AS ENUM (
      'owner',
      'admin',
      'catalog_manager',
      'sales',
      'purchasing',
      'ops_warehouse',
      'accountant',
      'marketing_ops',
      'support_cs',
      'viewer'
    );
  END IF;
END $$;

-- Politique simplifiée pour les produits (owner/admin accès complet)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;

CREATE POLICY "owner_admin_full_products_access" ON products
  FOR ALL
  USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  )
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Politique simplifiée pour les images produits
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON product_images;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON product_images;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_images;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON product_images;

CREATE POLICY "owner_admin_full_images_access" ON product_images
  FOR ALL
  USING (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  )
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'catalog_manager')
  );

-- Politique pour les collections (si la table existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
    EXECUTE 'DROP POLICY IF EXISTS "collections_access_v1" ON collections';
    EXECUTE 'CREATE POLICY "owner_admin_full_collections_access" ON collections
      FOR ALL
      USING (
        created_by = auth.uid() OR
        get_user_role() IN (''owner'', ''admin'')
      )
      WITH CHECK (
        created_by = auth.uid() OR
        get_user_role() IN (''owner'', ''admin'')
      )';
  END IF;
END $$;

-- Logs pour debug
INSERT INTO migration_logs (name, description, status)
VALUES (
  '20250916_011_fix_owner_admin_full_access',
  'Correction des règles RLS pour accès complet Owner/Admin selon business rules',
  'completed'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Commentaires pour documentation
COMMENT ON POLICY "owner_admin_full_access" ON organisations IS
'Owner et Admin ont accès complet à toutes les organisations selon business rules V1';

COMMENT ON FUNCTION get_user_role() IS
'Retourne le rôle de l utilisateur authentifié depuis user_profiles';