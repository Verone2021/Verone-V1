-- =====================================================================
-- [BO-SEC-005] Retirer à `anon` les droits de table inutiles — lot 5 (56 tables)
-- =====================================================================
-- PRÉPARÉ, NON APPLIQUÉ — attend l'accord écrit de Roméo (« OK lot sécu 5 »).
--
-- Constat (P9, 2026-09-13) : ~120 tables et 25 vues de `public` accordent TOUS les
-- droits de table à `anon` (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
-- TRIGGER) ; seule la RLS protège. Une erreur de RLS, ou une vue sans
-- security_invoker (cas corrigé en urgence par BO-SEC-006), suffit alors à exposer
-- les données au public.
--
-- Périmètre de ce lot : tables où le retrait est SANS EFFET pour le public, car
--   1. aucune policy ne vise `anon` ni `public` (la RLS renvoie déjà 0 ligne) ;
--   2. aucun appel `anon` dans pg_stat_statements ;
--   3. aucune référence dans apps/site-internet ni apps/linkme (grep du 2026-09-13).
-- + `client_consultations` (cité par le programme ; 16 appels anon = compteurs du
--   back-office lancés avant l'ouverture de session, qui recevront une erreur au lieu
--   de 0 ligne).
--
-- Hors lot (à instruire séparément) :
--   - 17 tables sans policy anon mais utilisées par le site ou LinkMe (newsletter,
--     contact, ambassadeurs, promotions, livraison, stockage affiliés…) ;
--   - 23 tables sans policy anon mais appelées par anon (sales_orders, financial_documents,
--     bank_transactions…) : comprendre l'appelant avant de retirer ;
--   - 37 tables avec policy publique (catalogue, pages, sélections…) : à garder ;
--   - 22 vues (déjà en security_invoker).
--
-- `authenticated` et `service_role` gardent leurs droits (aucun écran connecté ni
-- route serveur touchés). Aucune fonction, aucun déclencheur modifié.
-- Retour arrière : GRANT ALL … TO anon sur la même liste (en fin de fichier).
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

REVOKE ALL ON
  public.ai_generation_logs,
  public.bank_transactions_enrichment_audit,
  public.channel_price_lists,
  public.channel_pricing_history,
  public.channel_product_metadata,
  public.channel_stats_snapshots,
  public.client_consultations,
  public.collection_shares,
  public.consultation_emails,
  public.consultation_images,
  public.consultation_products,
  public.customer_groups,
  public.customer_pricing,
  public.document_emails,
  public.email_templates,
  public.feed_configs,
  public.finance_settings,
  public.fiscal_obligations_done,
  public.fixed_asset_depreciations,
  public.fixed_assets,
  public.gmail_watch_state,
  public.google_merchant_syncs,
  public.group_price_lists,
  public.linkme_channel_suppliers,
  public.matching_rules,
  public.mcp_resolution_queue,
  public.mcp_resolution_strategies,
  public.media_asset_analytics,
  public.media_asset_publications,
  public.meta_commerce_syncs,
  public.order_payments,
  public.organisation_families,
  public.pinterest_pin_syncs,
  public.price_list_history,
  public.price_list_items,
  public.price_lists,
  public.product_colors,
  public.product_commission_history,
  public.product_packages,
  public.product_purchase_history,
  public.purchase_order_receptions,
  public.sample_order_items,
  public.sample_orders,
  public.scheduled_publications,
  public.sourcing_candidate_suppliers,
  public.sourcing_communications,
  public.sourcing_photos,
  public.sourcing_price_history,
  public.sourcing_urls,
  public.stock_reservations,
  public.storage_allocations,
  public.sync_runs,
  public.transaction_document_links,
  public.user_notification_preferences,
  public.webhook_configs,
  public.webhook_logs
FROM anon;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (sur décision de Roméo) : même liste, GRANT ALL … TO anon.
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- GRANT ALL ON public.ai_generation_logs, public.bank_transactions_enrichment_audit,
--   public.channel_price_lists, public.channel_pricing_history, public.channel_product_metadata,
--   public.channel_stats_snapshots, public.client_consultations, public.collection_shares,
--   public.consultation_emails, public.consultation_images, public.consultation_products,
--   public.customer_groups, public.customer_pricing, public.document_emails, public.email_templates,
--   public.feed_configs, public.finance_settings, public.fiscal_obligations_done,
--   public.fixed_asset_depreciations, public.fixed_assets, public.gmail_watch_state,
--   public.google_merchant_syncs, public.group_price_lists, public.linkme_channel_suppliers,
--   public.matching_rules, public.mcp_resolution_queue, public.mcp_resolution_strategies,
--   public.media_asset_analytics, public.media_asset_publications, public.meta_commerce_syncs,
--   public.order_payments, public.organisation_families, public.pinterest_pin_syncs,
--   public.price_list_history, public.price_list_items, public.price_lists, public.product_colors,
--   public.product_commission_history, public.product_packages, public.product_purchase_history,
--   public.purchase_order_receptions, public.sample_order_items, public.sample_orders,
--   public.scheduled_publications, public.sourcing_candidate_suppliers, public.sourcing_communications,
--   public.sourcing_photos, public.sourcing_price_history, public.sourcing_urls,
--   public.stock_reservations, public.storage_allocations, public.sync_runs,
--   public.transaction_document_links, public.user_notification_preferences,
--   public.webhook_configs, public.webhook_logs
-- TO anon;
-- COMMIT;
