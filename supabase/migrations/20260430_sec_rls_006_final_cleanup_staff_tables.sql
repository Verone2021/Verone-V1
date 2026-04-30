-- =======================================================================
-- BO-SEC-RLS-006 — Final cleanup : 35 policies authenticated-true → staff
-- =======================================================================
-- Date         : 2026-04-30
-- Suite et fin de    : #846 (premier batch de 25 policies sur 9 tables)
--
-- Cible : ~35 policies authenticated USING/WITH CHECK true sur 21 tables
-- consommées EXCLUSIVEMENT par le back-office staff.
--
-- Audit grep préalable :
--   - 0 référence dans `apps/linkme/src/` ni `apps/site-internet/src/` pour
--     ces 21 tables → safe à scoper en staff-only.
--   - Les routes API server-side bypassent RLS via service_role.
--
-- Tables CONSERVÉES auth public (consommées hors BO — NE PAS scoper) :
--   - `channel_pricing` (LinkMe + site-internet feeds XML anon)
--   - `sales_channels` (site-internet shipping-config + checkout)
--   - `order_discounts`, `order_discount_targets` (site-internet checkout codes promo)
--   - `individual_customers_insert_self` (site-internet auth/checkout — création client)
--   - `categories`, `subcategories`, `site_content`, `pcg_categories`,
--     `product_images.public_read_*`, `linkme_page_configurations.public_read_*`
--     (lectures publiques légitimes)
--   - `audit_logs.audit_logs_system_insert` (triggers system multi-app — legit)
--   - `notifications_insert_system`, `service_*` (service_role bypass legit)
--
-- Hors scope définitif (déjà traité ou intentionnel) :
--   - 9 tables de PR #846 (fait)
--   - Policies anon-INSERT de PR #844 (fait)
-- =======================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- 1. stock_movements — 1 policy SELECT authenticated → staff
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS authenticated_users_can_view_stock_movements
  ON public.stock_movements;
CREATE POLICY staff_view_stock_movements
  ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 2. stock_alert_tracking — 4 policies → staff ALL
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS stock_alert_tracking_select_policy ON public.stock_alert_tracking;
DROP POLICY IF EXISTS stock_alert_tracking_insert_policy ON public.stock_alert_tracking;
DROP POLICY IF EXISTS stock_alert_tracking_update_policy ON public.stock_alert_tracking;
DROP POLICY IF EXISTS stock_alert_tracking_delete_policy ON public.stock_alert_tracking;
CREATE POLICY staff_full_access_stock_alert_tracking
  ON public.stock_alert_tracking
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 3. stock_reservations — 4 policies → staff ALL
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS stock_reservations_select_authenticated ON public.stock_reservations;
DROP POLICY IF EXISTS stock_reservations_insert_authenticated ON public.stock_reservations;
DROP POLICY IF EXISTS stock_reservations_update_authenticated ON public.stock_reservations;
DROP POLICY IF EXISTS stock_reservations_delete_authenticated ON public.stock_reservations;
CREATE POLICY staff_full_access_stock_reservations
  ON public.stock_reservations
  FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 4. Pricing tables (lecture seule authenticated → staff)
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS price_lists_select_authenticated ON public.price_lists;
CREATE POLICY staff_read_price_lists
  ON public.price_lists FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS customer_pricing_select_authenticated ON public.customer_pricing;
CREATE POLICY staff_read_customer_pricing
  ON public.customer_pricing FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS group_price_lists_select ON public.group_price_lists;
CREATE POLICY staff_read_group_price_lists
  ON public.group_price_lists FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS price_items_select_authenticated ON public.price_list_items;
CREATE POLICY staff_read_price_list_items
  ON public.price_list_items FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS customer_groups_select ON public.customer_groups;
CREATE POLICY staff_read_customer_groups
  ON public.customer_groups FOR SELECT TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 5. Variantes / colors / packages
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS variant_groups_select_authenticated ON public.variant_groups;
CREATE POLICY staff_read_variant_groups
  ON public.variant_groups FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS product_colors_select_authenticated ON public.product_colors;
DROP POLICY IF EXISTS product_colors_insert_authenticated ON public.product_colors;
CREATE POLICY staff_full_access_product_colors
  ON public.product_colors FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());

DROP POLICY IF EXISTS product_packages_select_authenticated ON public.product_packages;
DROP POLICY IF EXISTS product_packages_insert_authenticated ON public.product_packages;
DROP POLICY IF EXISTS product_packages_update_authenticated ON public.product_packages;
CREATE POLICY staff_full_access_product_packages
  ON public.product_packages FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 6. client_consultations
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS "Consultations read access" ON public.client_consultations;
CREATE POLICY staff_read_client_consultations
  ON public.client_consultations FOR SELECT TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 7. transaction_document_links — 4 policies → staff ALL
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS transaction_document_links_select ON public.transaction_document_links;
DROP POLICY IF EXISTS transaction_document_links_insert ON public.transaction_document_links;
DROP POLICY IF EXISTS transaction_document_links_update ON public.transaction_document_links;
DROP POLICY IF EXISTS transaction_document_links_delete ON public.transaction_document_links;
CREATE POLICY staff_full_access_transaction_document_links
  ON public.transaction_document_links FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 8. Channel admin tables (sauf channel_pricing qui reste ouverte)
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS channel_pricing_history_select_authenticated
  ON public.channel_pricing_history;
CREATE POLICY staff_read_channel_pricing_history
  ON public.channel_pricing_history FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

DROP POLICY IF EXISTS channel_product_metadata_select_policy ON public.channel_product_metadata;
DROP POLICY IF EXISTS channel_product_metadata_insert_policy ON public.channel_product_metadata;
DROP POLICY IF EXISTS channel_product_metadata_update_policy ON public.channel_product_metadata;
DROP POLICY IF EXISTS channel_product_metadata_delete_policy ON public.channel_product_metadata;
CREATE POLICY staff_full_access_channel_product_metadata
  ON public.channel_product_metadata FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());

DROP POLICY IF EXISTS channel_price_lists_select ON public.channel_price_lists;
CREATE POLICY staff_read_channel_price_lists
  ON public.channel_price_lists FOR SELECT TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 9. bank_transactions_enrichment_audit (finance staff)
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS bte_audit_select ON public.bank_transactions_enrichment_audit;
DROP POLICY IF EXISTS bte_audit_insert ON public.bank_transactions_enrichment_audit;
CREATE POLICY staff_full_access_bte_audit
  ON public.bank_transactions_enrichment_audit FOR ALL TO authenticated
  USING (public.is_backoffice_user())
  WITH CHECK (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 10. LinkMe admin tables
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS linkme_channel_suppliers_select_authenticated
  ON public.linkme_channel_suppliers;
CREATE POLICY staff_read_linkme_channel_suppliers
  ON public.linkme_channel_suppliers FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

-- linkme_page_configurations.public_read_* CONSERVÉE car lecture publique
-- légitime (pages config affichées à anon sur le globe LinkMe).


-- -----------------------------------------------------------------------
-- 11. storage_pricing_tiers (référentiel facturation stockage staff)
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS storage_pricing_select ON public.storage_pricing_tiers;
CREATE POLICY staff_read_storage_pricing_tiers
  ON public.storage_pricing_tiers FOR SELECT TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 12. purchase_order_receptions
-- -----------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all purchase receptions"
  ON public.purchase_order_receptions;
CREATE POLICY staff_read_purchase_order_receptions
  ON public.purchase_order_receptions FOR SELECT TO authenticated
  USING (public.is_backoffice_user());


-- -----------------------------------------------------------------------
-- 13. google_merchant_syncs SELECT policy (staff dashboard)
-- -----------------------------------------------------------------------
-- Note : les policies INSERT/UPDATE/DELETE google_merchant_syncs sont
-- déjà scopées à `service_role` (legit pour le worker sync server-side).
-- Seul le SELECT est ouvert à authenticated → restrict à staff.

DROP POLICY IF EXISTS google_merchant_syncs_select_policy ON public.google_merchant_syncs;
CREATE POLICY staff_read_google_merchant_syncs
  ON public.google_merchant_syncs FOR SELECT TO authenticated
  USING (public.is_backoffice_user());

COMMIT;
