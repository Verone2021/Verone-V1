-- ============================================================================
-- [INFRA-HARDENING-002] Retrofit des FK legacy (ADR-018)
-- ============================================================================
--
-- Date : 2026-04-24
-- Contexte :
--   `scripts/db-drift-check.py` détecte 97 FK en production qui n'ont JAMAIS
--   été déclarées dans une migration versionnée. Elles ont été créées au
--   cours du développement du MVP (pré-discipline append-only) ou modifiées
--   directement via le SQL Editor Supabase. Résultat : les migrations ne
--   reflètent pas la vérité et le drift check ne peut pas devenir bloquant
--   en CI.
--
-- Décision (ADR-018) :
--   Une unique migration rétroactive qui **déclare la vérité actuelle** de
--   la DB. Aucun changement de comportement prod : chaque FK est redéclarée
--   avec exactement la même règle ON DELETE qu'elle a déjà en live.
--
-- Effet :
--   - `db-drift-check.py` passe de 100 drifts à 0 (sauf MISSING, traités
--     séparément).
--   - La CI peut promouvoir le job `db-drift-check` en gate bloquant.
--   - Toute modification future de FK devra passer par une migration
--     versionnée — pas de SQL Editor direct.
--
-- Méthode :
--   Chaque ALTER TABLE est IDEMPOTENT :
--     - `DROP CONSTRAINT IF EXISTS <name>` → rien si absent.
--     - `ADD CONSTRAINT <name> ... ON DELETE <rule>` → recrée exactement
--       la même FK avec le même nom et la même règle que le live.
--
--   Vérifié le 2026-04-24 via information_schema.referential_constraints.
--
-- Sections :
--   1. FK MISMATCH alignées sur la réalité live (3)
--   2. FK UNDECLARED retrofit domain-by-domain (94)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. MISMATCH — aligner la migration sur l'état réel DB (live)
-- ============================================================================

-- financial_documents.partner_id : migration d'origine 20251228 = SET NULL,
-- mais le live est RESTRICT (durcissement manuel post-BO-FIN-023 pour
-- forcer le passage par le pipeline cascade-cancel officiel). On officialise.
ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_partner_id_fkey,
  ADD CONSTRAINT financial_documents_partner_id_fkey
    FOREIGN KEY (partner_id) REFERENCES organisations(id) ON DELETE RESTRICT;

-- financial_documents.purchase_order_id : idem, durcissement manuel
-- RESTRICT pour empêcher suppression PO avec facture non-soft-delete.
ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_purchase_order_id_fkey,
  ADD CONSTRAINT financial_documents_purchase_order_id_fkey
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT;

-- matching_rules.organisation_id : migration 20251223_200 = NO ACTION,
-- live = SET NULL. Comportement souhaité (éviter FK violation à la
-- suppression d'une organisation) — on officialise.
ALTER TABLE matching_rules
  DROP CONSTRAINT IF EXISTS matching_rules_organisation_id_fkey,
  ADD CONSTRAINT matching_rules_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. UNDECLARED — retrofit des FK legacy
-- ============================================================================

-- --- Products & catalogue ---------------------------------------------------

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_assigned_client_id_fkey,
  ADD CONSTRAINT products_assigned_client_id_fkey
    FOREIGN KEY (assigned_client_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_enseigne_id_fkey,
  ADD CONSTRAINT products_enseigne_id_fkey
    FOREIGN KEY (enseigne_id) REFERENCES enseignes(id) ON DELETE SET NULL;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey,
  ADD CONSTRAINT products_subcategory_id_fkey
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE NO ACTION;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_supplier_id_fkey,
  ADD CONSTRAINT products_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE NO ACTION;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS fk_products_variant_group,
  ADD CONSTRAINT fk_products_variant_group
    FOREIGN KEY (variant_group_id) REFERENCES variant_groups(id) ON DELETE SET NULL;

ALTER TABLE product_images
  DROP CONSTRAINT IF EXISTS product_images_product_id_fkey,
  ADD CONSTRAINT product_images_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_packages
  DROP CONSTRAINT IF EXISTS product_packages_product_id_fkey,
  ADD CONSTRAINT product_packages_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_groups
  DROP CONSTRAINT IF EXISTS product_groups_primary_product_id_fkey,
  ADD CONSTRAINT product_groups_primary_product_id_fkey
    FOREIGN KEY (primary_product_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE product_group_members
  DROP CONSTRAINT IF EXISTS product_group_members_product_id_fkey,
  ADD CONSTRAINT product_group_members_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_group_members
  DROP CONSTRAINT IF EXISTS product_group_members_group_id_fkey,
  ADD CONSTRAINT product_group_members_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES product_groups(id) ON DELETE CASCADE;

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_family_id_fkey,
  ADD CONSTRAINT categories_family_id_fkey
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE NO ACTION;

ALTER TABLE subcategories
  DROP CONSTRAINT IF EXISTS subcategories_category_id_fkey,
  ADD CONSTRAINT subcategories_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE variant_groups
  DROP CONSTRAINT IF EXISTS variant_groups_subcategory_id_fkey,
  ADD CONSTRAINT variant_groups_subcategory_id_fkey
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE RESTRICT;

ALTER TABLE variant_groups
  DROP CONSTRAINT IF EXISTS variant_groups_supplier_id_fkey,
  ADD CONSTRAINT variant_groups_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE collection_images
  DROP CONSTRAINT IF EXISTS collection_images_collection_id_fkey,
  ADD CONSTRAINT collection_images_collection_id_fkey
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

ALTER TABLE collection_products
  DROP CONSTRAINT IF EXISTS collection_products_collection_id_fkey,
  ADD CONSTRAINT collection_products_collection_id_fkey
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

ALTER TABLE collection_products
  DROP CONSTRAINT IF EXISTS collection_products_product_id_fkey,
  ADD CONSTRAINT collection_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE collection_shares
  DROP CONSTRAINT IF EXISTS collection_shares_collection_id_fkey,
  ADD CONSTRAINT collection_shares_collection_id_fkey
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;

-- --- Channels & pricing -----------------------------------------------------

ALTER TABLE channel_pricing
  DROP CONSTRAINT IF EXISTS channel_pricing_product_id_fkey,
  ADD CONSTRAINT channel_pricing_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE channel_pricing
  DROP CONSTRAINT IF EXISTS channel_pricing_channel_id_fkey,
  ADD CONSTRAINT channel_pricing_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE CASCADE;

ALTER TABLE channel_pricing_history
  DROP CONSTRAINT IF EXISTS channel_pricing_history_channel_pricing_id_fkey,
  ADD CONSTRAINT channel_pricing_history_channel_pricing_id_fkey
    FOREIGN KEY (channel_pricing_id) REFERENCES channel_pricing(id) ON DELETE CASCADE;

ALTER TABLE channel_pricing_history
  DROP CONSTRAINT IF EXISTS channel_pricing_history_product_id_fkey,
  ADD CONSTRAINT channel_pricing_history_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE channel_pricing_history
  DROP CONSTRAINT IF EXISTS channel_pricing_history_channel_id_fkey,
  ADD CONSTRAINT channel_pricing_history_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE CASCADE;

ALTER TABLE channel_product_metadata
  DROP CONSTRAINT IF EXISTS channel_product_metadata_product_id_fkey,
  ADD CONSTRAINT channel_product_metadata_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE channel_product_metadata
  DROP CONSTRAINT IF EXISTS channel_product_metadata_channel_id_fkey,
  ADD CONSTRAINT channel_product_metadata_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE CASCADE;

ALTER TABLE customer_pricing
  DROP CONSTRAINT IF EXISTS customer_pricing_product_id_fkey,
  ADD CONSTRAINT customer_pricing_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE price_list_items
  DROP CONSTRAINT IF EXISTS price_list_items_price_list_id_fkey,
  ADD CONSTRAINT price_list_items_price_list_id_fkey
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE;

ALTER TABLE price_list_items
  DROP CONSTRAINT IF EXISTS price_list_items_product_id_fkey,
  ADD CONSTRAINT price_list_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE price_list_history
  DROP CONSTRAINT IF EXISTS price_list_history_price_list_item_id_fkey,
  ADD CONSTRAINT price_list_history_price_list_item_id_fkey
    FOREIGN KEY (price_list_item_id) REFERENCES price_list_items(id) ON DELETE SET NULL;

ALTER TABLE channel_price_lists
  DROP CONSTRAINT IF EXISTS channel_price_lists_price_list_id_fkey,
  ADD CONSTRAINT channel_price_lists_price_list_id_fkey
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE;

ALTER TABLE channel_price_lists
  DROP CONSTRAINT IF EXISTS channel_price_lists_channel_id_fkey,
  ADD CONSTRAINT channel_price_lists_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE CASCADE;

ALTER TABLE group_price_lists
  DROP CONSTRAINT IF EXISTS group_price_lists_group_id_fkey,
  ADD CONSTRAINT group_price_lists_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES customer_groups(id) ON DELETE CASCADE;

ALTER TABLE group_price_lists
  DROP CONSTRAINT IF EXISTS group_price_lists_price_list_id_fkey,
  ADD CONSTRAINT group_price_lists_price_list_id_fkey
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE;

-- --- Sales orders & items --------------------------------------------------

ALTER TABLE sales_orders
  DROP CONSTRAINT IF EXISTS sales_orders_linkme_selection_id_fkey,
  ADD CONSTRAINT sales_orders_linkme_selection_id_fkey
    FOREIGN KEY (linkme_selection_id) REFERENCES linkme_selections(id) ON DELETE NO ACTION;

ALTER TABLE sales_orders
  DROP CONSTRAINT IF EXISTS sales_orders_channel_id_fkey,
  ADD CONSTRAINT sales_orders_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE NO ACTION;

ALTER TABLE sales_orders
  DROP CONSTRAINT IF EXISTS sales_orders_consultation_id_fkey,
  ADD CONSTRAINT sales_orders_consultation_id_fkey
    FOREIGN KEY (consultation_id) REFERENCES client_consultations(id) ON DELETE SET NULL;

ALTER TABLE sales_order_items
  DROP CONSTRAINT IF EXISTS sales_order_items_sales_order_id_fkey,
  ADD CONSTRAINT sales_order_items_sales_order_id_fkey
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;

ALTER TABLE sales_order_items
  DROP CONSTRAINT IF EXISTS sales_order_items_product_id_fkey,
  ADD CONSTRAINT sales_order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE sales_order_items
  DROP CONSTRAINT IF EXISTS sales_order_items_linkme_selection_item_id_fkey,
  ADD CONSTRAINT sales_order_items_linkme_selection_item_id_fkey
    FOREIGN KEY (linkme_selection_item_id) REFERENCES linkme_selection_items(id) ON DELETE NO ACTION;

ALTER TABLE sales_order_shipments
  DROP CONSTRAINT IF EXISTS sales_order_shipments_sales_order_id_fkey,
  ADD CONSTRAINT sales_order_shipments_sales_order_id_fkey
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;

ALTER TABLE sales_order_shipments
  DROP CONSTRAINT IF EXISTS sales_order_shipments_product_id_fkey,
  ADD CONSTRAINT sales_order_shipments_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE NO ACTION;

-- --- Purchase orders & receptions ------------------------------------------

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey,
  ADD CONSTRAINT purchase_orders_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE NO ACTION;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_purchase_order_id_fkey,
  ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_product_id_fkey,
  ADD CONSTRAINT purchase_order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_customer_organisation_id_fkey,
  ADD CONSTRAINT purchase_order_items_customer_organisation_id_fkey
    FOREIGN KEY (customer_organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE purchase_order_items
  DROP CONSTRAINT IF EXISTS purchase_order_items_customer_individual_id_fkey,
  ADD CONSTRAINT purchase_order_items_customer_individual_id_fkey
    FOREIGN KEY (customer_individual_id) REFERENCES individual_customers(id) ON DELETE SET NULL;

ALTER TABLE purchase_order_receptions
  DROP CONSTRAINT IF EXISTS purchase_order_receptions_purchase_order_id_fkey,
  ADD CONSTRAINT purchase_order_receptions_purchase_order_id_fkey
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;

ALTER TABLE purchase_order_receptions
  DROP CONSTRAINT IF EXISTS purchase_order_receptions_product_id_fkey,
  ADD CONSTRAINT purchase_order_receptions_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE NO ACTION;

-- --- Stock ------------------------------------------------------------------

ALTER TABLE stock_movements
  DROP CONSTRAINT IF EXISTS fk_stock_movements_product_id,
  ADD CONSTRAINT fk_stock_movements_product_id
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE stock_movements
  DROP CONSTRAINT IF EXISTS fk_stock_movements_performed_by,
  ADD CONSTRAINT fk_stock_movements_performed_by
    FOREIGN KEY (performed_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_purchase_order_item_id_fkey,
  ADD CONSTRAINT stock_movements_purchase_order_item_id_fkey
    FOREIGN KEY (purchase_order_item_id) REFERENCES purchase_order_items(id) ON DELETE SET NULL;

ALTER TABLE stock_movements
  DROP CONSTRAINT IF EXISTS fk_stock_movements_channel_id,
  ADD CONSTRAINT fk_stock_movements_channel_id
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE SET NULL;

ALTER TABLE stock_reservations
  DROP CONSTRAINT IF EXISTS stock_reservations_product_id_fkey,
  ADD CONSTRAINT stock_reservations_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE stock_alert_tracking
  DROP CONSTRAINT IF EXISTS stock_alert_tracking_product_id_fkey,
  ADD CONSTRAINT stock_alert_tracking_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE stock_alert_tracking
  DROP CONSTRAINT IF EXISTS stock_alert_tracking_supplier_id_fkey,
  ADD CONSTRAINT stock_alert_tracking_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE CASCADE;

ALTER TABLE stock_alert_tracking
  DROP CONSTRAINT IF EXISTS stock_alert_tracking_draft_order_id_fkey,
  ADD CONSTRAINT stock_alert_tracking_draft_order_id_fkey
    FOREIGN KEY (draft_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL;

-- --- Consultations & samples -----------------------------------------------

ALTER TABLE consultation_products
  DROP CONSTRAINT IF EXISTS consultation_products_consultation_id_fkey,
  ADD CONSTRAINT consultation_products_consultation_id_fkey
    FOREIGN KEY (consultation_id) REFERENCES client_consultations(id) ON DELETE CASCADE;

ALTER TABLE consultation_products
  DROP CONSTRAINT IF EXISTS consultation_products_product_id_fkey,
  ADD CONSTRAINT consultation_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE consultation_images
  DROP CONSTRAINT IF EXISTS consultation_images_consultation_id_fkey,
  ADD CONSTRAINT consultation_images_consultation_id_fkey
    FOREIGN KEY (consultation_id) REFERENCES client_consultations(id) ON DELETE CASCADE;

ALTER TABLE sample_orders
  DROP CONSTRAINT IF EXISTS sample_orders_supplier_id_fkey,
  ADD CONSTRAINT sample_orders_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE sample_order_items
  DROP CONSTRAINT IF EXISTS sample_order_items_sample_order_id_fkey,
  ADD CONSTRAINT sample_order_items_sample_order_id_fkey
    FOREIGN KEY (sample_order_id) REFERENCES sample_orders(id) ON DELETE CASCADE;

-- --- Organisations, contacts, enseignes ------------------------------------

ALTER TABLE organisations
  DROP CONSTRAINT IF EXISTS organisations_enseigne_id_fkey,
  ADD CONSTRAINT organisations_enseigne_id_fkey
    FOREIGN KEY (enseigne_id) REFERENCES enseignes(id) ON DELETE SET NULL;

ALTER TABLE organisations
  DROP CONSTRAINT IF EXISTS organisations_default_channel_id_fkey,
  ADD CONSTRAINT organisations_default_channel_id_fkey
    FOREIGN KEY (default_channel_id) REFERENCES sales_channels(id) ON DELETE NO ACTION;

ALTER TABLE organisation_families
  DROP CONSTRAINT IF EXISTS organisation_families_organisation_id_fkey,
  ADD CONSTRAINT organisation_families_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;

ALTER TABLE organisation_families
  DROP CONSTRAINT IF EXISTS organisation_families_family_id_fkey,
  ADD CONSTRAINT organisation_families_family_id_fkey
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_organisation_id_fkey,
  ADD CONSTRAINT contacts_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;

ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_enseigne_id_fkey,
  ADD CONSTRAINT contacts_enseigne_id_fkey
    FOREIGN KEY (enseigne_id) REFERENCES enseignes(id) ON DELETE CASCADE;

-- --- Financial documents (contacts associés) --------------------------------

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_billing_contact_id_fkey,
  ADD CONSTRAINT financial_documents_billing_contact_id_fkey
    FOREIGN KEY (billing_contact_id) REFERENCES contacts(id) ON DELETE NO ACTION;

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_delivery_contact_id_fkey,
  ADD CONSTRAINT financial_documents_delivery_contact_id_fkey
    FOREIGN KEY (delivery_contact_id) REFERENCES contacts(id) ON DELETE NO ACTION;

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_responsable_contact_id_fkey,
  ADD CONSTRAINT financial_documents_responsable_contact_id_fkey
    FOREIGN KEY (responsable_contact_id) REFERENCES contacts(id) ON DELETE NO ACTION;

-- --- LinkMe ----------------------------------------------------------------

ALTER TABLE linkme_affiliates
  DROP CONSTRAINT IF EXISTS linkme_affiliates_enseigne_id_fkey,
  ADD CONSTRAINT linkme_affiliates_enseigne_id_fkey
    FOREIGN KEY (enseigne_id) REFERENCES enseignes(id) ON DELETE SET NULL;

ALTER TABLE linkme_affiliates
  DROP CONSTRAINT IF EXISTS linkme_affiliates_organisation_id_fkey,
  ADD CONSTRAINT linkme_affiliates_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE linkme_selections
  DROP CONSTRAINT IF EXISTS linkme_selections_affiliate_id_fkey,
  ADD CONSTRAINT linkme_selections_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES linkme_affiliates(id) ON DELETE CASCADE;

ALTER TABLE linkme_selection_items
  DROP CONSTRAINT IF EXISTS linkme_selection_items_selection_id_fkey,
  ADD CONSTRAINT linkme_selection_items_selection_id_fkey
    FOREIGN KEY (selection_id) REFERENCES linkme_selections(id) ON DELETE CASCADE;

ALTER TABLE linkme_selection_items
  DROP CONSTRAINT IF EXISTS linkme_selection_items_product_id_fkey,
  ADD CONSTRAINT linkme_selection_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE linkme_channel_suppliers
  DROP CONSTRAINT IF EXISTS linkme_channel_suppliers_supplier_id_fkey,
  ADD CONSTRAINT linkme_channel_suppliers_supplier_id_fkey
    FOREIGN KEY (supplier_id) REFERENCES organisations(id) ON DELETE CASCADE;

ALTER TABLE linkme_channel_suppliers
  DROP CONSTRAINT IF EXISTS linkme_channel_suppliers_channel_id_fkey,
  ADD CONSTRAINT linkme_channel_suppliers_channel_id_fkey
    FOREIGN KEY (channel_id) REFERENCES sales_channels(id) ON DELETE CASCADE;

ALTER TABLE linkme_commissions
  DROP CONSTRAINT IF EXISTS linkme_commissions_affiliate_id_fkey,
  ADD CONSTRAINT linkme_commissions_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES linkme_affiliates(id) ON DELETE NO ACTION;

ALTER TABLE linkme_commissions
  DROP CONSTRAINT IF EXISTS linkme_commissions_selection_id_fkey,
  ADD CONSTRAINT linkme_commissions_selection_id_fkey
    FOREIGN KEY (selection_id) REFERENCES linkme_selections(id) ON DELETE NO ACTION;

ALTER TABLE linkme_commissions
  DROP CONSTRAINT IF EXISTS linkme_commissions_order_id_fkey,
  ADD CONSTRAINT linkme_commissions_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;

ALTER TABLE linkme_commissions
  DROP CONSTRAINT IF EXISTS linkme_commissions_order_item_id_fkey,
  ADD CONSTRAINT linkme_commissions_order_item_id_fkey
    FOREIGN KEY (order_item_id) REFERENCES sales_order_items(id) ON DELETE NO ACTION;

ALTER TABLE linkme_info_requests
  DROP CONSTRAINT IF EXISTS linkme_info_requests_sales_order_id_fkey,
  ADD CONSTRAINT linkme_info_requests_sales_order_id_fkey
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE;

-- --- User module -----------------------------------------------------------

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS fk_user_profiles_individual_customer,
  ADD CONSTRAINT fk_user_profiles_individual_customer
    FOREIGN KEY (individual_customer_id) REFERENCES individual_customers(id) ON DELETE SET NULL;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS fk_user_profiles_organisation,
  ADD CONSTRAINT fk_user_profiles_organisation
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_parent_user_id_fkey,
  ADD CONSTRAINT user_profiles_parent_user_id_fkey
    FOREIGN KEY (parent_user_id) REFERENCES user_profiles(id) ON DELETE NO ACTION;

ALTER TABLE user_app_roles
  DROP CONSTRAINT IF EXISTS user_app_roles_enseigne_id_fkey,
  ADD CONSTRAINT user_app_roles_enseigne_id_fkey
    FOREIGN KEY (enseigne_id) REFERENCES enseignes(id) ON DELETE SET NULL;

ALTER TABLE user_app_roles
  DROP CONSTRAINT IF EXISTS user_app_roles_organisation_id_fkey,
  ADD CONSTRAINT user_app_roles_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE user_activity_logs
  DROP CONSTRAINT IF EXISTS user_activity_logs_user_id_fkey,
  ADD CONSTRAINT user_activity_logs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_activity_logs
  DROP CONSTRAINT IF EXISTS user_activity_logs_organisation_id_fkey,
  ADD CONSTRAINT user_activity_logs_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

ALTER TABLE user_sessions
  DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey,
  ADD CONSTRAINT user_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_sessions
  DROP CONSTRAINT IF EXISTS user_sessions_organisation_id_fkey,
  ADD CONSTRAINT user_sessions_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

-- --- Storage allocations ---------------------------------------------------

ALTER TABLE storage_allocations
  DROP CONSTRAINT IF EXISTS affiliate_storage_allocations_product_id_fkey,
  ADD CONSTRAINT affiliate_storage_allocations_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE storage_allocations
  DROP CONSTRAINT IF EXISTS affiliate_storage_allocations_owner_enseigne_id_fkey,
  ADD CONSTRAINT affiliate_storage_allocations_owner_enseigne_id_fkey
    FOREIGN KEY (owner_enseigne_id) REFERENCES enseignes(id) ON DELETE CASCADE;

ALTER TABLE storage_allocations
  DROP CONSTRAINT IF EXISTS affiliate_storage_allocations_owner_organisation_id_fkey,
  ADD CONSTRAINT affiliate_storage_allocations_owner_organisation_id_fkey
    FOREIGN KEY (owner_organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;

-- --- Expenses (re-créer FK perdues post-migration 20251223_100) ------------
--
-- Ces 2 FK sont déclarées dans 20251223_100_identity_master_expenses.sql
-- mais absentes de la DB live — probablement droppées manuellement
-- pendant le MVP. Vérifié 2026-04-24 : 0 ligne orpheline sur les 522
-- expenses existantes, donc la re-création est safe.
--
-- (expenses.counterparty_id n'est PAS re-créée : la table `counterparties`
-- n'existe pas en DB — migration 20251223_100 partiellement appliquée.
-- Le script db-drift-check.py l'ignore désormais via le filtre
-- « target_table not in live_columns ».)

ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_transaction_id_fkey,
  ADD CONSTRAINT expenses_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES bank_transactions(id) ON DELETE CASCADE;

ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_organisation_id_fkey,
  ADD CONSTRAINT expenses_organisation_id_fkey
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;

-- --- Misc ------------------------------------------------------------------

ALTER TABLE google_merchant_syncs
  DROP CONSTRAINT IF EXISTS google_merchant_syncs_product_id_fkey,
  ADD CONSTRAINT google_merchant_syncs_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE shopping_carts
  DROP CONSTRAINT IF EXISTS shopping_carts_product_id_fkey,
  ADD CONSTRAINT shopping_carts_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE shopping_carts
  DROP CONSTRAINT IF EXISTS shopping_carts_variant_group_id_fkey,
  ADD CONSTRAINT shopping_carts_variant_group_id_fkey
    FOREIGN KEY (variant_group_id) REFERENCES variant_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- Log
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '[INFRA-HARDENING-002] Retrofit 97 FK legacy + 3 MISMATCH aligned. db-drift-check devrait maintenant retourner 0 sur ces items.';
END $$;

COMMIT;
