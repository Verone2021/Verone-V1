# Index Back-Office Verone — Reference Metier

CRM/ERP pour decoration et mobilier haut de gamme. 134 pages, 20 sections.

## 3 Domaines Fonctionnels

### A. Pilotage Canaux de Vente

| Section                         | But                                                                                    | Pilote                  |
| ------------------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| `/canaux-vente/linkme`          | Hub LinkMe : commissions, selections, utilisateurs, analytique, stockage, approbations | LinkMe (B2B2C affilies) |
| `/canaux-vente/site-internet`   | Produits publies, collections, configuration e-commerce                                | Site-internet (B2C)     |
| `/canaux-vente/google-merchant` | Sync produits Google Shopping, pricing, visibilite                                     | Google Merchant         |

### B. Operations Internes

| Section                   | But                                                                                                           | Tables DB principales                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/produits`               | Catalogue master : CRUD produits, variantes, categories, collections, images, pricing multi-canal, sourcing   | `products`, `product_images`, `product_variants`, `channel_pricing`, `categories` |
| `/commandes/clients`      | Commandes vente (Sales Orders) : workflow draft → validated → shipped → delivered                             | `sales_orders`, `sales_order_items`, `sales_order_shipments`                      |
| `/commandes/fournisseurs` | Commandes achat (Purchase Orders) : workflow draft → sent → received                                          | `purchase_orders`, `purchase_order_items`, `purchase_order_receptions`            |
| `/stocks`                 | Inventaire complet : mouvements, receptions, expeditions (Packlink), alertes, previsionnel, analytics ABC/XYZ | `stock_movements`, `stock_alert_tracking`, `products` (stock_quantity)            |
| `/consultations`          | Demandes clients avant conversion en commande : photos, budget, priorite                                      | `client_consultations`, `consultation_images`                                     |
| `/contacts-organisations` | Hub relationnel : fournisseurs, clients B2B, enseignes, partenaires, contacts, clients particuliers           | `organisations`, `contacts`, `enseignes`, `individual_customers`                  |
| `/livraisons`             | Suivi bons de livraison, tracking Packlink                                                                    | `sales_order_shipments`                                                           |
| `/messages`               | Inbox unifiee : notifications systeme, demandes infos LinkMe, formulaires site-internet                       | `notifications`, `linkme_info_requests`, `form_submissions`                       |

### C. Finance & Administration

| Section       | But                                                                                                       | Tables DB principales                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/finance`    | Comptabilite complete : Qonto sync, tresorerie, TVA, grand livre, rapprochement bancaire, bilan, depenses | `bank_transactions`, `financial_documents`, `pcg_categories`, `transaction_document_links` |
| `/factures`   | Gestion documentaire : factures + devis + avoirs, integration Qonto, reconciliation                       | `financial_documents`                                                                      |
| `/admin`      | Gestion utilisateurs back-office, roles (owner/admin/sales/catalog_manager), audit activite               | `user_profiles`, `user_app_roles`, `user_activity_logs`                                    |
| `/parametres` | Configuration : templates email, webhooks, preferences notifications                                      | `email_templates`, `webhook_configs`                                                       |
| `/dashboard`  | Cockpit dirigeant : KPIs (commandes en attente, stock critique, CA, alertes), feuille de route            | Agregation multi-tables                                                                    |
| `/ventes`     | Tableau de bord commercial : consultations + commandes + CA                                               | Agregation `client_consultations` + `sales_orders`                                         |

## Pages Redirections (alias)

| Route                                     | Redirige vers                            | Raison                |
| ----------------------------------------- | ---------------------------------------- | --------------------- |
| `/avoirs`                                 | `/factures` (onglet avoirs)              | Integre dans factures |
| `/devis`                                  | `/factures` (onglet devis)               | Integre dans factures |
| `/notifications`                          | `/messages?onglet=systeme`               | Inbox unifiee         |
| `/prises-contact`                         | `/messages?onglet=formulaires`           | Inbox unifiee         |
| `/organisation`                           | `/contacts-organisations`                | Alias                 |
| `/canaux-vente/linkme/organisations/[id]` | `/contacts-organisations/[id]`           | Pas de page doublon   |
| `/canaux-vente/linkme/enseignes/[id]`     | `/contacts-organisations/enseignes/[id]` | Pas de page doublon   |

## Relations Canaux de Vente

Le back-office est la **source de verite** pour :

- **Produits** → publies vers LinkMe, site-internet, Google Merchant via `channel_pricing`
- **Organisations** → clients/fournisseurs partages entre tous les canaux
- **Stock** → disponibilite partagee, alertes automatiques
- **Commandes** → toutes les commandes (tous canaux) transitent par `sales_orders`
- **Factures** → generees depuis les commandes validees
- **Commissions LinkMe** → calculees a la validation de commande

## Roles Staff

| Role              | Droits                               |
| ----------------- | ------------------------------------ |
| `owner`           | Acces complet + gestion utilisateurs |
| `admin`           | Acces complet                        |
| `sales`           | Commandes, clients, consultations    |
| `catalog_manager` | Produits, categories, collections    |

RLS via `is_backoffice_user()` et `is_back_office_admin()`.

## Packages Partages Principaux

- `@verone/orders` — Hooks commandes (useSalesOrders, usePurchaseOrders, useLinkMeOrders)
- `@verone/products` — Hooks produits (useProducts, useVariantGroups, useProductImages)
- `@verone/organisations` — Hooks orgs (useOrganisations, useContacts, useEnseignes)
- `@verone/stock` — Hooks stock (useStock, useStockAlerts, useStockMovements)
- `@verone/finance` — Hooks finance (useFinancialDocuments, useBankReconciliation)
- `@verone/notifications` — Hooks notifications (sidebar counts, dropdowns)
- `@verone/ui` — 62 composants shadcn/ui
- `@verone/common` — Hooks utilitaires (useSupabaseQuery, useInlineEdit, useImageUpload)
