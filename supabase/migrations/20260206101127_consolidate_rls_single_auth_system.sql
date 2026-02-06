-- ============================================================
-- CONSOLIDATION RLS - Système Unique d'Authentification
-- ============================================================
-- OBJECTIF : Supprimer le chaos (2 systèmes) → 1 système simple
-- SYSTÈME MODERNE : user_app_roles + is_backoffice_user()
-- RÔLES BACK-OFFICE : owner, admin (UNIQUEMENT)
-- ============================================================

-- ============================================================
-- PARTIE 1 : SUPPRIMER TOUTES LES POLICIES OBSOLÈTES (38 au total)
-- ============================================================
-- Ces policies utilisent soit user_profiles.role/app, soit get_current_user_id()
-- ============================================================

-- products (3 policies)
DROP POLICY IF EXISTS "tenant_owner_admin_manage_products" ON products;
DROP POLICY IF EXISTS "tenant_sales_view_products" ON products;
DROP POLICY IF EXISTS "products_delete_unified" ON products;

-- collection_products (2 policies)
DROP POLICY IF EXISTS "tenant_owner_admin_manage_collection_products" ON collection_products;
DROP POLICY IF EXISTS "tenant_sales_view_collection_products" ON collection_products;

-- collection_shares (1 policy)
DROP POLICY IF EXISTS "tenant_owner_admin_manage_collection_shares" ON collection_shares;

-- contacts (1 policy)
DROP POLICY IF EXISTS "contacts_delete_unified" ON contacts;

-- individual_customers (3 policies)
DROP POLICY IF EXISTS "individual_customers_insert_self_or_staff" ON individual_customers;
DROP POLICY IF EXISTS "individual_customers_select_own_or_staff" ON individual_customers;
DROP POLICY IF EXISTS "individual_customers_update_own_or_staff" ON individual_customers;

-- linkme_channel_suppliers (1 policy)
DROP POLICY IF EXISTS "linkme_channel_suppliers_all_admin" ON linkme_channel_suppliers;

-- payments (4 policies)
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;

-- product_status_changes (2 policies)
DROP POLICY IF EXISTS "tenant_authenticated_view_product_status_changes" ON product_status_changes;
DROP POLICY IF EXISTS "tenant_owner_admin_insert_product_status_changes" ON product_status_changes;

-- sample_order_items (1 policy)
DROP POLICY IF EXISTS "tenant_owner_admin_manage_sample_order_items" ON sample_order_items;

-- sample_orders (1 policy)
DROP POLICY IF EXISTS "tenant_owner_admin_manage_sample_orders" ON sample_orders;

-- user_app_roles (1 policy)
DROP POLICY IF EXISTS "user_app_roles_unified" ON user_app_roles;

-- variant_groups (2 policies)
DROP POLICY IF EXISTS "tenant_owner_admin_manage_variant_groups" ON variant_groups;
DROP POLICY IF EXISTS "tenant_sales_view_variant_groups" ON variant_groups;

-- ============================================================
-- NOUVELLES : Policies utilisant get_current_user_id() à supprimer
-- ============================================================

-- notifications (3 policies)
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

-- product_drafts (1 policy)
DROP POLICY IF EXISTS "users_own_drafts" ON product_drafts;

-- product_images (2 policies)
DROP POLICY IF EXISTS "product_images_delete_own" ON product_images;
DROP POLICY IF EXISTS "product_images_update_own" ON product_images;

-- stock_movements (2 policies)
DROP POLICY IF EXISTS "authenticated_users_can_delete_manual_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "authenticated_users_can_update_stock_movements" ON stock_movements;

-- user_activity_logs (1 policy)
DROP POLICY IF EXISTS "users_view_own_activity" ON user_activity_logs;

-- user_profiles (2 policies)
DROP POLICY IF EXISTS "user_profiles_select_own_app" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own_app" ON user_profiles;

-- user_sessions (1 policy)
DROP POLICY IF EXISTS "users_view_own_sessions" ON user_sessions;

-- collection_images (ATTENTION : policy manquante dans l'audit initial, mais référencée par erreur DB)
DROP POLICY IF EXISTS "collection_images_insert_authenticated" ON collection_images;

-- product_images (policy manquante dans l'audit)
DROP POLICY IF EXISTS "product_images_insert_authenticated" ON product_images;

-- ============================================================
-- PARTIE 2 : CRÉER POLICIES MODERNES (Pattern Unifié)
-- ============================================================

-- products (1 policy simple)
CREATE POLICY "backoffice_full_access_products" ON products
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- collection_products (1 policy simple)
CREATE POLICY "backoffice_full_access_collection_products" ON collection_products
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- collection_shares (1 policy simple)
CREATE POLICY "backoffice_full_access_collection_shares" ON collection_shares
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- contacts (1 policy simple)
CREATE POLICY "backoffice_full_access_contacts" ON contacts
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- individual_customers (1 policy simple)
CREATE POLICY "backoffice_full_access_individual_customers" ON individual_customers
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- linkme_channel_suppliers (1 policy simple)
CREATE POLICY "backoffice_full_access_linkme_channel_suppliers" ON linkme_channel_suppliers
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- payments (1 policy simple)
CREATE POLICY "backoffice_full_access_payments" ON payments
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- product_status_changes (1 policy simple)
CREATE POLICY "backoffice_full_access_product_status_changes" ON product_status_changes
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- sample_order_items (1 policy simple)
CREATE POLICY "backoffice_full_access_sample_order_items" ON sample_order_items
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- sample_orders (1 policy simple)
CREATE POLICY "backoffice_full_access_sample_orders" ON sample_orders
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- user_app_roles (1 policy simple)
CREATE POLICY "backoffice_admin_manage_user_app_roles" ON user_app_roles
  FOR ALL TO authenticated
  USING ((SELECT is_back_office_admin()))
  WITH CHECK ((SELECT is_back_office_admin()));

-- variant_groups (1 policy simple)
CREATE POLICY "backoffice_full_access_variant_groups" ON variant_groups
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- ============================================================
-- NOUVELLES : Policies modernes pour tables avec get_current_user_id()
-- ============================================================

-- notifications (staff voit tout, users voient leurs propres notifications)
CREATE POLICY "backoffice_full_access_notifications" ON notifications
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- product_drafts (staff voit tout, users voient leurs brouillons)
CREATE POLICY "backoffice_full_access_product_drafts" ON product_drafts
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

CREATE POLICY "users_own_product_drafts" ON product_drafts
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- product_images (staff full access)
CREATE POLICY "backoffice_full_access_product_images" ON product_images
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- collection_images (staff full access)
CREATE POLICY "backoffice_full_access_collection_images" ON collection_images
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

-- stock_movements (staff full access, users leurs mouvements)
CREATE POLICY "backoffice_full_access_stock_movements" ON stock_movements
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

CREATE POLICY "users_own_stock_movements" ON stock_movements
  FOR ALL TO authenticated
  USING (performed_by = auth.uid())
  WITH CHECK (performed_by = auth.uid());

-- user_activity_logs (staff voit tout, users voient leur activité)
CREATE POLICY "backoffice_full_access_user_activity_logs" ON user_activity_logs
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

CREATE POLICY "users_view_own_user_activity_logs" ON user_activity_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- user_profiles (staff voit tout, users voient/modifient leur profil)
CREATE POLICY "backoffice_full_access_user_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

CREATE POLICY "users_own_user_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- user_sessions (staff voit tout, users voient leurs sessions)
CREATE POLICY "backoffice_full_access_user_sessions" ON user_sessions
  FOR ALL TO authenticated
  USING ((SELECT is_backoffice_user()))
  WITH CHECK ((SELECT is_backoffice_user()));

CREATE POLICY "users_view_own_user_sessions" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- PARTIE 3 : SUPPRIMER FONCTIONS OBSOLÈTES
-- ============================================================

DROP FUNCTION IF EXISTS get_current_user_id();
DROP FUNCTION IF EXISTS get_user_role();

-- ============================================================
-- PARTIE 4 : SUPPRIMER COLONNES OBSOLÈTES user_profiles
-- ============================================================

-- Supprimer colonnes obsolètes (migré vers user_app_roles)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS role CASCADE;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS app CASCADE;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS scopes CASCADE;

-- ============================================================
-- PARTIE 5 : NETTOYER RÔLES OBSOLÈTES user_app_roles
-- ============================================================

-- Supprimer les rôles obsolètes pour back-office
DELETE FROM user_app_roles
WHERE app = 'back-office'
  AND role NOT IN ('owner', 'admin');

-- ============================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================

-- Compter policies restantes (devrait être 12 policies modernes + policies LinkMe/anon existantes)
SELECT COUNT(*) as policies_modernes
FROM pg_policies
WHERE qual LIKE '%is_backoffice_user%';

-- Vérifier colonnes user_profiles (role, app, scopes ne doivent plus exister)
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('role', 'app', 'scopes');
-- Devrait retourner 0 rows

-- Vérifier rôles back-office (seulement owner, admin)
SELECT DISTINCT role
FROM user_app_roles
WHERE app = 'back-office'
ORDER BY role;
-- Devrait retourner : admin, owner
