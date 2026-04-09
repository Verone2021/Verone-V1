# Tables PostgreSQL par Domaine (99 tables)

## Catalogue Produits (16 tables)

- `products` : produits centraux (id, name, sku, status, category_id, supplier_id, purchase_price_ht, selling_price_ht)
- `product_images` : images produits (product_id, url, position)
- `product_colors` : variantes couleur
- `product_packages` : conditionnement/emballage
- `product_drafts` : brouillons produits
- `product_status_changes` : historique changements statut
- `product_commission_history` : historique commissions
- `product_groups` : groupes de produits
- `product_group_members` : membres des groupes
- `variant_groups` : groupes de variantes
- `categories` : categories principales
- `category_translations` : traductions categories
- `subcategories` : sous-categories
- `families` : familles produit
- `collections` : collections visuelles
- `collection_products` : produits dans collections
- `collection_images` : images collections
- `collection_translations` : traductions collections
- `collection_shares` : partage collections (LinkMe)

## Commandes Ventes (6 tables)

- `sales_orders` : commandes clients (id, status, customer_id, channel_id, total_ht, total_ttc)
- `sales_order_items` : lignes de commande (order_id, product_id, quantity, unit_price)
- `sales_order_shipments` : expeditions
- `sales_order_linkme_details` : details specifiques LinkMe
- `sample_orders` : commandes echantillons
- `sample_order_items` : lignes echantillons

## Commandes Achats (3 tables)

- `purchase_orders` : commandes fournisseurs (id, status, supplier_id, total_ht)
- `purchase_order_items` : lignes commande achat
- `purchase_order_receptions` : receptions marchandise

## Finance / Facturation (12 tables)

- `financial_documents` : factures, avoirs, devis (id, type, status, organisation_id, total_ht, total_ttc)
- `financial_document_lines` : lignes documents
- `financial_payments` : paiements sur documents
- `invoices` : **DONNEES LEGACY** - 23 records historiques. PAS de factures generees par l'app. Facturation via Qonto (outil externe). NE JAMAIS utiliser comme KPI.
- `invoice_status_history` : historique statuts factures
- `payments` : paiements generaux
- `bank_transactions` : transactions bancaires (Qonto)
- `bank_transactions_enrichment_audit` : audit enrichissement
- `transaction_document_links` : lien transaction <-> document
- `counterparty_bank_accounts` : comptes bancaires tiers
- `pcg_categories` : plan comptable general
- `finance_settings` : parametres finance
- `matching_rules` : regles rapprochement auto

## Stock (5 tables)

- `stock_movements` : mouvements stock (product_id, type, quantity, warehouse)
- `stock_reservations` : reservations stock (order_id, product_id, quantity)
- `stock_alert_tracking` : alertes stock
- `storage_allocations` : allocations stockage
- `storage_billing_events` : facturation stockage
- `storage_pricing_tiers` : grilles tarifaires stockage

## Organisations / Contacts (5 tables)

- `organisations` : fournisseurs, clients, enseignes (id, name, type, status)
- `addresses` : adresses (polymorphique, addressable_type + addressable_id)
- `contacts` : contacts associes aux organisations
- `individual_customers` : clients particuliers
- `enseignes` : enseignes LinkMe (regroupe organisations)

## LinkMe (10 tables)

- `linkme_affiliates` : affilies (id, enseigne_id XOR organisation_id, status)
- `linkme_selections` : selections produits par affilie
- `linkme_selection_items` : produits dans selections
- `linkme_commissions` : commissions affilies
- `linkme_payment_requests` : demandes paiement
- `linkme_payment_request_items` : lignes demandes paiement
- `linkme_tracking` : tracking commandes
- `linkme_channel_suppliers` : fournisseurs par canal
- `linkme_page_configurations` : config pages affilies
- `affiliate_archive_requests` : demandes archivage
- `affiliate_storage_allocations` : allocations stockage affilies

## Canaux / Pricing (8 tables)

- `sales_channels` : canaux de vente (B2B, B2C, LinkMe...)
- `channel_pricing` : prix par canal
- `channel_pricing_history` : historique prix canal
- `channel_price_lists` : listes de prix canal
- `channel_product_pricing` : prix produit par canal
- `channel_product_metadata` : metadata produit par canal
- `price_lists` : listes de prix
- `price_list_items` : items liste de prix
- `price_list_history` : historique listes
- `customer_pricing` : prix par client
- `customer_price_lists` : listes prix client
- `customer_groups` : groupes clients
- `customer_group_members` : membres groupes
- `group_price_lists` : listes prix groupe

## Utilisateurs (4 tables)

- `user_profiles` : profils (id, email, full_name, app_source) - PAS de colonne role/app
- `user_app_roles` : roles par app (user_id, app, role, enseigne_id, organisation_id, is_active)
- `user_sessions` : sessions
- `user_activity_logs` : logs activite

## Notifications / Audit (3 tables)

- `notifications` : notifications in-app
- `audit_logs` : logs audit
- `order_discounts` : remises sur commandes

## Config / Systeme (5 tables)

- `app_settings` : parametres application
- `email_templates` : templates email
- `webhook_configs` : configuration webhooks
- `webhook_logs` : logs webhooks
- `sync_runs` : logs synchronisations

## Integrations (5 tables)

- `feed_configs` : config flux produits
- `feed_exports` : exports flux
- `feed_performance_metrics` : metriques performance flux
- `google_merchant_syncs` : synchro Google Merchant
- `mcp_resolution_queue` : queue resolution MCP
- `mcp_resolution_strategies` : strategies resolution

## Consultations (3 tables)

- `client_consultations` : consultations clients
- `consultation_images` : images consultations
- `consultation_products` : produits en consultation

## Formulaires (3 tables)

- `form_submissions` : soumissions formulaires (site-internet)
- `form_submission_messages` : messages dans soumissions
- `form_types` : types de formulaires

## Relations cles

- `products.category_id` -> `categories.id`
- `products.supplier_id` -> `organisations.id` (type='supplier')
- `sales_order_items.product_id` -> `products.id`
- `linkme_affiliates.enseigne_id` -> `enseignes.id` (XOR organisation_id)
- `user_app_roles.user_id` -> `auth.users.id`
- `financial_documents.organisation_id` -> `organisations.id`

## PIEGES CRITIQUES (ne JAMAIS oublier)

1. `sales_orders.customer_type = 'organization'` avec Z (US spelling), PAS 'organisation' avec S
2. `invoices` = donnees legacy, PAS des factures generees par l'app. Facturation via Qonto. NE JAMAIS compter comme KPI.
3. `organisations` = multi-role (client + fournisseur + membre enseigne)
4. Pas de table `product_variants` — variantes = `products` avec `variant_group_id`
5. `user_profiles` n'a PAS de colonne `app` ni `role` — utiliser `user_app_roles`
6. `raw_user_meta_data` est OBSOLETE pour les roles
7. `price_lists` : 5 listes existent mais 0 items (pas utilise)
8. `collections` : 2 collections mais 0 produits lies (pas utilise)

## Documentation complete

Voir `docs/current/back-office-entities-index.md` pour l'index complet avec schemas relationnels.
