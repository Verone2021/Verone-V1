# Database Schema Complete — Index

_Generated: 2026-04-10 17:18 — 106 tables, 0 FK, 0 RLS, 0 triggers_

## Domaines

| Domaine                     | Tables | Fichier                                                  |
| --------------------------- | ------ | -------------------------------------------------------- |
| Organisations & Contacts    | 8      | [schema/01-organisations.md](schema/01-organisations.md) |
| Produits & Catalogue        | 17     | [schema/02-produits.md](schema/02-produits.md)           |
| Commandes & Consultations   | 17     | [schema/03-commandes.md](schema/03-commandes.md)         |
| Stock & Stockage            | 9      | [schema/04-stock.md](schema/04-stock.md)                 |
| Finance & Comptabilite      | 13     | [schema/05-finance.md](schema/05-finance.md)             |
| LinkMe & Affiliation        | 10     | [schema/06-linkme.md](schema/06-linkme.md)               |
| Notifications & Formulaires | 9      | [schema/07-notifications.md](schema/07-notifications.md) |
| Utilisateurs & Securite     | 8      | [schema/08-utilisateurs.md](schema/08-utilisateurs.md)   |
| Autres                      | 15     | [schema/09-autres.md](schema/09-autres.md)               |

## Toutes les Tables (ordre alphabetique)

| Table                                                                                         | Domaine                     | Colonnes | FK  | RLS | Triggers |
| --------------------------------------------------------------------------------------------- | --------------------------- | -------- | --- | --- | -------- |
| [addresses](schema/01-organisations.md#addresses)                                             | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [affiliate_archive_requests](schema/04-stock.md#affiliate-archive-requests)                   | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [affiliate_storage_allocations](schema/04-stock.md#affiliate-storage-allocations)             | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [affiliate_storage_requests](schema/04-stock.md#affiliate-storage-requests)                   | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [app_settings](schema/08-utilisateurs.md#app-settings)                                        | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [audit_logs](schema/08-utilisateurs.md#audit-logs)                                            | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [bank_transactions](schema/05-finance.md#bank-transactions)                                   | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [bank_transactions_enrichment_audit](schema/05-finance.md#bank-transactions-enrichment-audit) | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [categories](schema/02-produits.md#categories)                                                | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [channel_price_lists](schema/09-autres.md#channel-price-lists)                                | Autres                      | 0        | 0   | 0   | 0        |
| [channel_pricing](schema/09-autres.md#channel-pricing)                                        | Autres                      | 0        | 0   | 0   | 0        |
| [channel_pricing_history](schema/09-autres.md#channel-pricing-history)                        | Autres                      | 0        | 0   | 0   | 0        |
| [channel_product_metadata](schema/09-autres.md#channel-product-metadata)                      | Autres                      | 0        | 0   | 0   | 0        |
| [client_consultations](schema/03-commandes.md#client-consultations)                           | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [collection_images](schema/02-produits.md#collection-images)                                  | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [collection_products](schema/02-produits.md#collection-products)                              | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [collection_shares](schema/02-produits.md#collection-shares)                                  | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [collections](schema/02-produits.md#collections)                                              | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [consultation_emails](schema/03-commandes.md#consultation-emails)                             | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [consultation_images](schema/03-commandes.md#consultation-images)                             | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [consultation_products](schema/03-commandes.md#consultation-products)                         | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [contacts](schema/01-organisations.md#contacts)                                               | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [counterparty_bank_accounts](schema/01-organisations.md#counterparty-bank-accounts)           | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [customer_addresses](schema/01-organisations.md#customer-addresses)                           | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [customer_groups](schema/09-autres.md#customer-groups)                                        | Autres                      | 0        | 0   | 0   | 0        |
| [customer_pricing](schema/09-autres.md#customer-pricing)                                      | Autres                      | 0        | 0   | 0   | 0        |
| [email_templates](schema/07-notifications.md#email-templates)                                 | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [enseignes](schema/01-organisations.md#enseignes)                                             | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [families](schema/02-produits.md#families)                                                    | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [feed_configs](schema/09-autres.md#feed-configs)                                              | Autres                      | 0        | 0   | 0   | 0        |
| [finance_settings](schema/05-finance.md#finance-settings)                                     | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [financial_document_items](schema/05-finance.md#financial-document-items)                     | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [financial_documents](schema/05-finance.md#financial-documents)                               | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [fiscal_obligations_done](schema/05-finance.md#fiscal-obligations-done)                       | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [fixed_asset_depreciations](schema/05-finance.md#fixed-asset-depreciations)                   | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [fixed_assets](schema/05-finance.md#fixed-assets)                                             | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [form_submission_messages](schema/07-notifications.md#form-submission-messages)               | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [form_submissions](schema/07-notifications.md#form-submissions)                               | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [form_types](schema/07-notifications.md#form-types)                                           | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [google_merchant_syncs](schema/09-autres.md#google-merchant-syncs)                            | Autres                      | 0        | 0   | 0   | 0        |
| [group_price_lists](schema/09-autres.md#group-price-lists)                                    | Autres                      | 0        | 0   | 0   | 0        |
| [individual_customers](schema/01-organisations.md#individual-customers)                       | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [linkme_affiliates](schema/06-linkme.md#linkme-affiliates)                                    | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_channel_suppliers](schema/06-linkme.md#linkme-channel-suppliers)                      | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_commissions](schema/06-linkme.md#linkme-commissions)                                  | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_info_requests](schema/06-linkme.md#linkme-info-requests)                              | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_onboarding_progress](schema/06-linkme.md#linkme-onboarding-progress)                  | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_page_configurations](schema/06-linkme.md#linkme-page-configurations)                  | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_payment_request_items](schema/06-linkme.md#linkme-payment-request-items)              | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_payment_requests](schema/06-linkme.md#linkme-payment-requests)                        | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_selection_items](schema/06-linkme.md#linkme-selection-items)                          | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [linkme_selections](schema/06-linkme.md#linkme-selections)                                    | LinkMe & Affiliation        | 0        | 0   | 0   | 0        |
| [matching_rules](schema/05-finance.md#matching-rules)                                         | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [mcp_resolution_queue](schema/05-finance.md#mcp-resolution-queue)                             | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [mcp_resolution_strategies](schema/05-finance.md#mcp-resolution-strategies)                   | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [meta_commerce_syncs](schema/09-autres.md#meta-commerce-syncs)                                | Autres                      | 0        | 0   | 0   | 0        |
| [newsletter_subscribers](schema/07-notifications.md#newsletter-subscribers)                   | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [notifications](schema/07-notifications.md#notifications)                                     | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [order_discounts](schema/03-commandes.md#order-discounts)                                     | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [order_payments](schema/03-commandes.md#order-payments)                                       | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [organisation_families](schema/01-organisations.md#organisation-families)                     | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [organisations](schema/01-organisations.md#organisations)                                     | Organisations & Contacts    | 0        | 0   | 0   | 0        |
| [pcg_categories](schema/05-finance.md#pcg-categories)                                         | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [price_list_history](schema/09-autres.md#price-list-history)                                  | Autres                      | 0        | 0   | 0   | 0        |
| [price_list_items](schema/09-autres.md#price-list-items)                                      | Autres                      | 0        | 0   | 0   | 0        |
| [price_lists](schema/09-autres.md#price-lists)                                                | Autres                      | 0        | 0   | 0   | 0        |
| [product_colors](schema/02-produits.md#product-colors)                                        | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_commission_history](schema/02-produits.md#product-commission-history)                | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_group_members](schema/02-produits.md#product-group-members)                          | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_groups](schema/02-produits.md#product-groups)                                        | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_images](schema/02-produits.md#product-images)                                        | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_packages](schema/02-produits.md#product-packages)                                    | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_purchase_history](schema/02-produits.md#product-purchase-history)                    | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [product_reviews](schema/02-produits.md#product-reviews)                                      | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [products](schema/02-produits.md#products)                                                    | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [purchase_order_items](schema/03-commandes.md#purchase-order-items)                           | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [purchase_order_receptions](schema/03-commandes.md#purchase-order-receptions)                 | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [purchase_orders](schema/03-commandes.md#purchase-orders)                                     | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sales_channels](schema/09-autres.md#sales-channels)                                          | Autres                      | 0        | 0   | 0   | 0        |
| [sales_order_events](schema/03-commandes.md#sales-order-events)                               | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sales_order_items](schema/03-commandes.md#sales-order-items)                                 | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sales_order_linkme_details](schema/03-commandes.md#sales-order-linkme-details)               | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sales_order_shipments](schema/03-commandes.md#sales-order-shipments)                         | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sales_orders](schema/03-commandes.md#sales-orders)                                           | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sample_order_items](schema/03-commandes.md#sample-order-items)                               | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [sample_orders](schema/03-commandes.md#sample-orders)                                         | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [shopping_carts](schema/03-commandes.md#shopping-carts)                                       | Commandes & Consultations   | 0        | 0   | 0   | 0        |
| [site_contact_messages](schema/07-notifications.md#site-contact-messages)                     | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [site_content](schema/07-notifications.md#site-content)                                       | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [stock_alert_tracking](schema/04-stock.md#stock-alert-tracking)                               | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [stock_movements](schema/04-stock.md#stock-movements)                                         | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [stock_reservations](schema/04-stock.md#stock-reservations)                                   | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [storage_allocations](schema/04-stock.md#storage-allocations)                                 | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [storage_billing_events](schema/04-stock.md#storage-billing-events)                           | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [storage_pricing_tiers](schema/04-stock.md#storage-pricing-tiers)                             | Stock & Stockage            | 0        | 0   | 0   | 0        |
| [subcategories](schema/02-produits.md#subcategories)                                          | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [sync_runs](schema/09-autres.md#sync-runs)                                                    | Autres                      | 0        | 0   | 0   | 0        |
| [transaction_document_links](schema/05-finance.md#transaction-document-links)                 | Finance & Comptabilite      | 0        | 0   | 0   | 0        |
| [user_activity_logs](schema/08-utilisateurs.md#user-activity-logs)                            | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [user_app_roles](schema/08-utilisateurs.md#user-app-roles)                                    | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [user_notification_preferences](schema/07-notifications.md#user-notification-preferences)     | Notifications & Formulaires | 0        | 0   | 0   | 0        |
| [user_profiles](schema/08-utilisateurs.md#user-profiles)                                      | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [user_sessions](schema/08-utilisateurs.md#user-sessions)                                      | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [variant_groups](schema/02-produits.md#variant-groups)                                        | Produits & Catalogue        | 0        | 0   | 0   | 0        |
| [webhook_configs](schema/08-utilisateurs.md#webhook-configs)                                  | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
| [webhook_logs](schema/08-utilisateurs.md#webhook-logs)                                        | Utilisateurs & Securite     | 0        | 0   | 0   | 0        |
