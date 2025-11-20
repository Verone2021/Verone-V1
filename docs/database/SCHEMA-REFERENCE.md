# 🗄️ SCHÉMA DATABASE VÉRONE - SOURCE DE VÉRITÉ UNIQUE

⚠️ **RÈGLE ABSOLUE** : Consulter CE fichier AVANT toute modification database

**Dernière mise à jour** : 30 octobre 2025
**Database** : PostgreSQL via Supabase
**Projet** : aorroydfjsrygmosnzrl

---

## 📊 Vue d'Ensemble

| Élément           | Nombre | Documentation                          |
| ----------------- | ------ | -------------------------------------- |
| **Tables**        | 77     | Ce fichier                             |
| **Colonnes**      | 1342   | Ce fichier                             |
| **Triggers**      | 159    | [triggers.md](./triggers.md)           |
| **RLS Policies**  | 226    | [rls-policies.md](./rls-policies.md)   |
| **Fonctions RPC** | 256    | [functions-rpc.md](./functions-rpc.md) |
| **Foreign Keys**  | 143    | [foreign-keys.md](./foreign-keys.md)   |
| **Enums**         | 34     | [enums.md](./enums.md)                 |

---

## 🚨 TABLES CRITIQUES - ANTI-HALLUCINATION

### ❌ INTERDIT : Créer table `suppliers`

**Table existante** : `organisations`
**Champs** : 50 colonnes incluant `type` enum
**Utiliser** : `organisations WHERE type IN ('supplier', 'manufacturer')`

**Historique hallucination** :

- Octobre 2025 : Agent a créé table `suppliers` en doublon
- Impact : Incohérence données, migration douloureuse
- Fix : Migration 20251017_002_drop_obsolete_suppliers_table.sql

### ❌ INTERDIT : Créer table `customers`

**Tables existantes** :

1. `organisations` (50 colonnes) - Clients B2B (WHERE type='customer')
2. `individual_customers` (27 colonnes) - Clients B2C particuliers

**Ne JAMAIS** créer nouvelle table customers.

### ❌ INTERDIT : Ajouter champ `cost_price` dans `products`

**Système existant** : `price_lists` + `price_list_items`
**Historique hallucination** :

- Octobre 2025 : Agent a ajouté products.cost_price
- Existe : Système pricing via price_lists
- Fix : Migration 20251017_003_remove_cost_price_column.sql

### ❌ INTERDIT : Modifier triggers `stock_*` sans consultation

**Système complexe** : 12 triggers interdépendants gèrent cohérence stock
**Tables liées** :

- products (stock_quantity, stock_real, stock_forecasted_in/out)
- stock_movements
- purchase_orders / purchase_order_items
- sales_orders / sales_order_items

**Règle** : TOUJOURS lire triggers.md AVANT modification

---

## 📋 TABLES PAR MODULE (77 Total)

⚠️ **Note** : La table `product_drafts` a été supprimée le 17 octobre 2025 (migration 20251017_006). Workflow actuel : création directe dans `products` + modification via page détail.

### Module Facturation & Abby API (7 tables)

#### 1. **abby_sync_queue** (13 colonnes)

Queue synchronisation vers Abby API facturation

- **Colonnes clés** : id, operation, entity_type, entity_id, abby_payload, status, retry_count
- **Triggers** : 2 (calculate_next_retry, mark_sync_operation_success)
- **Usage** : Facturation asynchrone Abby

#### 2. **abby_webhook_events** (6 colonnes)

Events webhooks reçus depuis Abby

- **Colonnes clés** : id, event_id, event_type, event_data, expires_at
- **Triggers** : 1 (set_webhook_event_expiry)

#### 3. **financial_documents** (31 colonnes)

Documents financiers (factures, devis, avoirs)

- **Colonnes clés** : id, document_type, partner_id, document_number, total_ht, total_ttc
- **Relations** : → organisations (partner), sales_orders, purchase_orders

#### 4. **financial_document_lines** (11 colonnes)

Lignes détail documents financiers

- **Colonnes clés** : id, document_id, product_id, quantity, unit_price_ht, total_ht
- **Relations** : → financial_documents, products, expense_categories

#### 5. **financial_payments** (12 colonnes)

Paiements liés documents

- **Colonnes clés** : id, document_id, amount_paid, payment_date, bank_transaction_id
- **Relations** : → financial_documents, bank_transactions

#### 6. **invoices** (18 colonnes)

Factures clients (simplifié)

- **Colonnes clés** : id, sales_order_id, abby_invoice_id, status, total_ttc
- **Triggers** : 2 (check_invoice_overdue, log_invoice_status_change)
- **Relations** : → sales_orders

#### 7. **payments** (11 colonnes)

Paiements factures

- **Colonnes clés** : id, invoice_id, abby_payment_id, amount_paid, payment_date
- **Relations** : → invoices

### Module Banking (1 table)

#### 8. **bank_transactions** (22 colonnes)

Transactions bancaires (Qonto, Revolut)

- **Colonnes clés** : id, transaction_id, bank_provider, amount, side, label
- **Relations** : → financial_documents (matched_document_id)

### Module Catalogue (18 tables)

#### 9. **products** ⭐ TABLE CENTRALE (46 colonnes)

Produits catalogue principal

- **Colonnes clés** : id, sku, name, slug, **product_status** (manuel), supplier_id, category_id, stock_real, stock_forecasted_in, stock_forecasted_out
- **Statut produit (product_status)** :
  - `product_status` (ENUM): Modifiable manuellement - statut commercial du produit
    - Valeurs: 'active', 'preorder', 'discontinued', 'draft'
  - **Ancien champ**: `status` renommé en `status_deprecated` (conservation pour rollback)
- **RLS** : 12 policies
- **Relations** : → organisations (supplier), categories, families
- **❌ INTERDIT** : Ajouter cost_price, price_ht, ou base_price (utiliser price_list_items)
- **⚠️ NOTE PRIX** : La table products ne contient AUCUN champ prix. Tous les prix sont dans price_list_items (cost_price, price_ht, suggested_retail_price). Voir [pricing-architecture.md](./pricing-architecture.md) pour détails architecture multi-canal

#### 10. **product_images** (15 colonnes)

Images produits (plusieurs par produit)

- **Colonnes clés** : id, product_id, public_url, is_primary, display_order
- **Relations** : → products
- **Triggers** : 1 (ensure_single_primary_image)

#### 11. **product_colors** (6 colonnes)

Couleurs produits standardisées

- **Colonnes clés** : id, name, hex_code, is_predefined

#### 12. **product_packages** (14 colonnes)

Conditionnements produits (lot, carton, palette)

- **Colonnes clés** : id, product_id, type, base_quantity, discount_rate
- **Relations** : → products

#### 13. **product_groups** (9 colonnes)

Groupes produits (variantes)

- **Colonnes clés** : id, name, item_group_id, group_type, primary_product_id

#### 14. **product_group_members** (6 colonnes)

Membres groupes produits

- **Relations** : → products, product_groups

#### 15. **product_status_changes** (6 colonnes)

Historique changements statut produits

- **Relations** : → products

#### 16. **categories** (13 colonnes)

Catégories produits (arbre hiérarchique)

- **Colonnes clés** : id, name, slug, level, family_id
- **Relations** : → families
- **RLS** : 10 policies

#### 17. **category_translations** (6 colonnes)

Traductions catégories multilingues

- **Relations** : → categories

#### 18. **subcategories** (12 colonnes)

Sous-catégories

- **Relations** : → categories

#### 19. **families** (12 colonnes)

Familles produits (niveau supérieur)

- **Colonnes clés** : id, name, slug, is_active

#### 20. **variant_groups** (20 colonnes)

Groupes variantes produits

- **Relations** : → subcategories, organisations (supplier)

#### 21. **collections** (22 colonnes)

Collections marketing

- **Colonnes clés** : id, name, description, is_featured
- **RLS** : 5 policies

#### 22. **collection_products** (6 colonnes)

Produits dans collections

- **Relations** : → collections, products

#### 23. **collection_images** (15 colonnes)

Images collections

- **Relations** : → collections

#### 24. **collection_shares** (6 colonnes)

Partages collections

- **Relations** : → collections

#### 25. **collection_translations** (6 colonnes)

Traductions collections

- **Relations** : → collections

### Module Pricing (9 tables)

#### 26. **sales_channels** (13 colonnes)

Canaux de vente (B2B, B2C, Marketplace)

- **Colonnes clés** : id, code, name, default_discount_rate

#### 27. **price_lists** (18 colonnes)

Listes de prix

- **Colonnes clés** : id, code, name, list_type, currency

#### 28. **price_list_items** (21 colonnes)

Items listes prix (prix par produit)

- **Colonnes clés** : id, price_list_id, product_id, price_ht
- **Relations** : → price_lists, products

#### 29. **price_list_history** (15 colonnes)

Historique modifications prix

- **Relations** : → price_list_items

#### 30. **channel_price_lists** (17 colonnes)

Association canaux ↔ listes prix

- **Relations** : → sales_channels, price_lists

#### 31. **channel_pricing** (14 colonnes)

Pricing custom par canal

- **Relations** : → products, sales_channels

#### 32. **customer_price_lists** (16 colonnes)

Listes prix clients spécifiques

- **Relations** : → organisations / individual_customers, price_lists

#### 33. **customer_pricing** (19 colonnes)

Pricing custom par client

- **Colonnes clés** : id, customer_id, product_id, price_ht, retrocession_rate
- **🆕 Ristourne B2B** (2025-10-25) : `retrocession_rate` NUMERIC(5,2) - Taux commission % (0-100)
- **Relations** : → products, organisations / individual_customers

#### 34. **group_price_lists** (9 colonnes)

Listes prix groupes clients

- **Relations** : → customer_groups, price_lists

### Module Clients & Contacts (7 tables)

#### 35. **organisations** ⭐ TABLE CENTRALE (53 colonnes)

Organisations (fournisseurs, clients B2B, partenaires)

**Identité & Conformité Légale** (Migration 20251022_001):

- `legal_name` VARCHAR(255) NOT NULL - Dénomination sociale officielle enregistrée au RCS
- `trade_name` VARCHAR(255) NULL - Nom commercial utilisé publiquement (si différent)
- `has_different_trade_name` BOOLEAN DEFAULT FALSE - Indicateur nom commercial différent
- `siren` VARCHAR(9) NULL - Numéro SIREN (9 chiffres) - Obligatoire factures depuis juillet 2024
- `siret` VARCHAR(14) NULL - Numéro SIRET (14 chiffres) - SIREN + numéro établissement

**Colonnes clés** : id, legal_name, trade_name, type (enum), email, country, is_active
**Type enum** : 'supplier', 'manufacturer', 'customer', 'partner'
**❌ INTERDIT** : Créer tables suppliers/customers séparées
**Utiliser** : WHERE type='supplier' OU type='customer'

**Contraintes de validation**:

- `check_siren_format` - SIREN doit être NULL ou exactement 9 chiffres
- `check_siret_format` - SIRET doit être NULL ou exactement 14 chiffres
- `check_trade_name_consistency` - Si has_different_trade_name=TRUE alors trade_name NOT NULL

**Indexes de performance**:

- `idx_organisations_legal_name` - Index sur legal_name (recherche par dénomination)
- `idx_organisations_siren` - Index partiel sur siren (WHERE siren IS NOT NULL)
- `idx_organisations_siret` - Index partiel sur siret (WHERE siret IS NOT NULL)
- `idx_organisations_display_name` - Index composite (legal_name, trade_name) pour recherche

**Fonctions helper**:

- `get_organisation_display_name(org organisations)` - Retourne trade_name si défini, sinon legal_name

#### 36. **individual_customers** (27 colonnes)

Clients particuliers B2C

- **Colonnes clés** : id, first_name, last_name, email, phone, address_line1

#### 37. **contacts** (25 colonnes)

Contacts au sein organisations

- **Colonnes clés** : id, organisation_id, first_name, last_name, email
- **Relations** : → organisations

#### 38. **customer_groups** (13 colonnes)

Groupes clients (segmentation)

- **Colonnes clés** : id, code, name, group_type, auto_assignment_rules

#### 39. **customer_group_members** (10 colonnes)

Membres groupes clients

- **Relations** : → customer_groups, organisations / individual_customers

#### 40. **client_consultations** (18 colonnes)

Consultations clients (demandes projet)

- **Colonnes clés** : id, organisation_name, client_email, status, assigned_to

#### 41. **consultation_products** (11 colonnes)

Produits proposés consultations

- **Relations** : → client_consultations, products

#### 42. **consultation_images** (15 colonnes)

Images consultations

- **Relations** : → client_consultations

### Module Commandes Vente (5 tables)

#### 43. **sales_orders** (35 colonnes)

Commandes vente clients

- **Colonnes clés** : id, order_number, customer_id, status, total_ht, total_ttc
- **Triggers** : 8+ (gestion stock automatique)
- **Relations** : → organisations / individual_customers
- **❌ ATTENTION** : Triggers stock complexes

#### 44. **sales_order_items** (15 colonnes)

Lignes commandes vente

- **Colonnes clés** : id, sales_order_id, product_id, quantity, unit_price_ht, retrocession_rate, retrocession_amount
- **📦 Gestion Expéditions** : `quantity_shipped` INTEGER NOT NULL DEFAULT 0 - Quantité expédiée (expéditions partielles)
  - **Calcul différentiel** : `quantity_remaining = quantity - quantity_shipped`
  - **Workflow** : Incrémentation lors création shipments (voir table `shipments`)
  - **Trigger** : Déclenche `handle_sales_order_stock()` lors UPDATE
- **🆕 Ristourne B2B** (2025-10-25) :
  - `retrocession_rate` NUMERIC(5,2) - Taux commission % (snapshot depuis customer_pricing)
  - `retrocession_amount` NUMERIC(10,2) - Montant commission EUR (calculé auto via trigger)
  - **Trigger** : `trg_calculate_retrocession` - Calcule retrocession_amount = total_ht × (rate / 100)
  - **RPC** : `get_order_total_retrocession(order_id)` - Commission totale commande
- **Relations** : → sales_orders, products

#### 45. **order_discounts** (21 colonnes)

Remises applicables commandes

- **Colonnes clés** : id, code, name, discount_type, discount_value

#### 46. **shipments** (32 colonnes)

Expéditions commandes clients - Multi-transporteur (Packlink, Mondial Relay, Chronotruck)

**Colonnes principales** :

- `id` UUID - Identifiant unique (PK)
- `sales_order_id` UUID NOT NULL - Référence commande client (FK → sales_orders)
- `shipping_method` shipping_method_type NOT NULL - Méthode ('packlink', 'mondial_relay', 'chronotruck', 'manual')
- `shipment_type` shipment_type NOT NULL DEFAULT 'parcel' - Type de colis ('parcel', 'pallet')

**Suivi & Transporteur** :

- `carrier_name` TEXT - Nom transporteur
- `service_name` TEXT - Service utilisé (ex: Colissimo, Chronopost)
- `tracking_number` TEXT - Numéro suivi
- `tracking_url` TEXT - URL tracking
- `cost_paid_eur` NUMERIC(10,2) DEFAULT 0 - Coût payé transporteur
- `cost_charged_eur` NUMERIC(10,2) DEFAULT 0 - Coût facturé client

**Dates & Timeline** :

- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now() - Date création
- `shipped_at` TIMESTAMPTZ - Date expédition
- `delivered_at` TIMESTAMPTZ - Date livraison
- `estimated_delivery_at` TIMESTAMPTZ - Livraison estimée
- `updated_at` TIMESTAMPTZ DEFAULT now() - Dernière modification

**Adresse** :

- `shipping_address` JSONB - Adresse complète expédition

**Packlink Integration** :

- `packlink_shipment_id` TEXT - ID expédition Packlink
- `packlink_label_url` TEXT - URL étiquette
- `packlink_service_id` INTEGER - ID service Packlink
- `packlink_response` JSONB - Réponse API complète

**Mondial Relay Integration** :

- `mondial_relay_point_id` TEXT - ID point relais
- `mondial_relay_point_name` TEXT - Nom point relais
- `mondial_relay_point_address` TEXT - Adresse point relais
- `mondial_relay_label_url` TEXT - URL étiquette
- `mondial_relay_response` JSONB - Réponse API complète

**Chronotruck Integration** :

- `chronotruck_reference` TEXT - Référence transport
- `chronotruck_palette_count` INTEGER - Nombre palettes
- `chronotruck_url` TEXT - URL suivi
- `chronotruck_data` JSONB - Données transport

**Métadonnées** :

- `notes` TEXT - Notes internes
- `metadata` JSONB DEFAULT '{}' - Données additionnelles
- `created_by` UUID - Créateur (⚠️ Non contrainte, pas de FK user_profiles)

**Relations** :

- → sales_orders (1-N : une commande peut avoir plusieurs expéditions partielles)

**Index** :

- PRIMARY KEY (id)
- idx_shipments_sales_order (sales_order_id) - Recherche par commande
- idx_shipments_method (shipping_method) - Filtres transporteur
- idx_shipments_type (shipment_type) - Filtres type colis
- idx_shipments_tracking (tracking_number WHERE tracking_number IS NOT NULL) - Index partiel

**Triggers** : Aucun trigger direct (gestion via sales_orders)

**RLS Policies** : 3 policies (⚠️ VULNÉRABILITÉS détectées - voir rapport audit)

- ⚠️ Policies trop permissives (authenticated vs Owner/Admin/Sales)
- ⚠️ Aucune validation organisation
- ⚠️ Migration SQL recommandée (voir docs/database/rls-policies.md)

**Workflow** :

1. Commande confirmée (sales_orders.status = 'confirmed')
2. Préparation expédition → Création shipment
3. Saisie infos transporteur + numéro tracking
4. Update sales_order_items.quantity_shipped (différentiel)
5. Trigger handle_sales_order_stock() → Création mouvements stock OUT
6. Update sales_orders.status ('partially_shipped' ou 'shipped')

**⚠️ IMPORTANT** : Pas de table `shipment_items` - Traçabilité via `sales_order_items.quantity_shipped` directement

#### 47. **shipping_parcels** (10 colonnes)

Colis expéditions

- **Colonnes clés** : id, shipment_id, parcel_number, weight_kg
- **Relations** : → shipments

#### 48. **parcel_items** (5 colonnes)

Items colis

- **Relations** : → shipping_parcels, sales_order_items

### Module Commandes Achat (5 tables)

#### 49. **purchase_orders** (22 colonnes)

Commandes achat fournisseurs

- **Colonnes clés** : id, po_number, supplier_id, status, total_ht
- **Relations** : → organisations (supplier)
- **Triggers** : Gestion forecast stock

#### 50. **purchase_order_items** (12 colonnes)

Lignes commandes achat

- **Colonnes clés** : id, purchase_order_id, product_id, quantity, unit_price_ht
- **📦 Gestion Réceptions** : `quantity_received` INTEGER NOT NULL DEFAULT 0 - Quantité reçue (réceptions partielles)
  - **Calcul différentiel** : `quantity_remaining = quantity - quantity_received`
  - **Workflow Simplifié** : Incrémentation directe via API `/api/purchase-receptions/validate`
  - **Workflow Avancé** : Via table `purchase_order_receptions` (avec lots, batch_number)
  - **Trigger** : Déclenche `handle_purchase_order_forecast()` lors UPDATE
  - **Algorithme Idempotent** : Compare avec SUM mouvements stock déjà créés (évite duplications)
- **Relations** : → purchase_orders, products

#### 51. **purchase_order_receptions** (10 colonnes)

Réceptions marchandises

- **Relations** : → purchase_orders, products

#### 52. **sample_orders** (17 colonnes)

Commandes échantillons fournisseurs

- **Colonnes clés** : id, order_number, supplier_id, status
- **Relations** : → organisations (supplier)

#### 53. **sample_order_items** (12 colonnes)

Items commandes échantillons

- **Relations** : → sample_orders

### Module Stocks (2 tables)

#### 54. **stock_movements** (19 colonnes)

Mouvements stock (entrées/sorties)

- **Colonnes clés** : id, product_id, movement_type, quantity_change, reference_type, channel_id
- **🆕 Traçabilité Canal** (2025-10-31) : `channel_id UUID NULL` - Canal vente (b2b, ecommerce, retail, wholesale)
  - **Scope** : UNIQUEMENT mouvements OUT ventes clients (sales_orders)
  - **NULL pour** : IN (réceptions), ADJUST (ajustements), TRANSFER (transferts), achats fournisseurs
  - **Usage** : Analytics/filtres uniquement - Stock reste GLOBAL (pas séparé par canal)
  - **Propagation** : Automatique via trigger `handle_sales_order_stock()` depuis `sales_orders.channel_id`
- **Relations** : → products, sales_channels (channel_id)
- **Triggers** : 12+ triggers interdépendants ⚠️
- **❌ CRITIQUE** : NE PAS modifier sans lire triggers.md
- **Documentation** : `docs/database/migrations/20251031_channel_tracking_stocks.md`

#### 55. **stock_reservations** (13 colonnes)

Réservations stock temporaires

- **Relations** : → products

### Module Google Merchant & Feeds (3 tables)

#### 56. **feed_configs** (16 colonnes)

Configurations feeds export

- **Colonnes clés** : id, name, platform (Google/Facebook), schedule_frequency

#### 57. **feed_exports** (15 colonnes)

Historique exports feeds

- **Relations** : → feed_configs

#### 58. **feed_performance_metrics** (13 colonnes)

Métriques performance feeds

- **Relations** : → feed_configs

### Module Utilisateurs & Activité (5 tables)

#### 59. **user_profiles** (17 colonnes)

Profils utilisateurs (liés auth.users Supabase)

- **Colonnes clés** : user_id, role, user_type, scopes, partner_id, first_name, last_name, phone, job_title
- **Nouveautés 2025-10-30** (migration 20251030_001) :
  - `first_name` (TEXT, null) - Prénom utilisateur (max 50 chars)
  - `last_name` (TEXT, null) - Nom de famille (max 50 chars)
  - `phone` (TEXT, null) - Téléphone français validé
  - `job_title` (TEXT, null) - Poste/Fonction (max 100 chars)

#### 60. **user_sessions** (15 colonnes)

Sessions utilisateurs tracking

- **Relations** : → user_profiles, organisations

#### 61. **user_activity_logs** (15 colonnes)

Logs activité utilisateurs

- **Relations** : → user_profiles, organisations

#### 62. **audit_logs** (11 colonnes)

Logs audit système

- **Colonnes clés** : id, user_id, action, table_name, record_id

#### 63. **notifications** (11 colonnes)

Notifications utilisateurs

- **Colonnes clés** : id, type, severity, title, message, user_id

#### 64. **notifications_backup_20251014** (11 colonnes)

Backup notifications (obsolète, peut être supprimée)

### Module Tests & QA (5 tables)

#### 65. **manual_tests_progress** (14 colonnes)

Progression tests manuels

#### 66. **test_sections_lock** (16 colonnes)

Verrouillage sections tests

#### 67. **test_validation_state** (14 colonnes)

État validation tests

#### 68. **test_error_reports** (14 colonnes)

Rapports erreurs tests

#### 69. **bug_reports** (20 colonnes)

Rapports bugs utilisateurs

### Module Errors & MCP (4 tables)

#### 70. **error_reports_v2** (32 colonnes)

Rapports erreurs système V2

- **Colonnes clés** : id, error_type, severity, module, message, stack_trace

#### 71. **error_notifications_queue** (11 colonnes)

Queue notifications erreurs

- **Relations** : → error_reports_v2

#### 72. **error_resolution_history** (11 colonnes)

Historique résolutions erreurs

- **Relations** : → error_reports_v2

#### 73. **mcp_resolution_queue** (16 colonnes)

Queue résolutions MCP automatiques

- **Relations** : → error_reports_v2

#### 74. **mcp_resolution_strategies** (11 colonnes)

Stratégies résolution MCP

### Module Divers (3 tables)

#### 75. **expense_categories** (10 colonnes)

Catégories dépenses comptabilité

- **Colonnes clés** : id, name, account_code, parent_category_id

#### 76. **supplier_categories** (10 colonnes)

Catégories fournisseurs (taxonomie)

- **Colonnes clés** : id, code, label_fr, label_en

#### 77. **audit_log_summary** (Vue matérialisée)

Vue synthèse logs audit

---

## 🎯 WORKFLOW ANTI-HALLUCINATION

### Avant TOUTE modification database :

#### 1. RECHERCHE (OBLIGATOIRE - 5 min)

```bash
# Lire cette source de vérité
cat docs/database/SCHEMA-REFERENCE.md

# Chercher table concernée (CTRL+F)
grep -i "nom_table" docs/database/SCHEMA-REFERENCE.md

# Vérifier module
# Exemple: "supplier" → Module Clients (table organisations)
```

#### 2. VALIDATION CHECKLIST

- [ ] Table existe déjà ? → **Réutiliser, NE PAS recréer**
- [ ] Relations similaires ? → **Suivre pattern existant**
- [ ] Triggers impactés ? → **Lire triggers.md**
- [ ] RLS policies ? → **Lire rls-policies.md**
- [ ] Organisation/Client/Supplier ? → **Utiliser table organisations**

#### 3. CONFIRMATION UTILISATEUR (OBLIGATOIRE)

**Template message** :

```
Je vais [CRÉER/MODIFIER] [TABLE/CHAMP]. J'ai vérifié :

✅ Pas de duplicata avec : [TABLE_EXISTANTE]
✅ Relations cohérentes avec : [FK_LIST]
✅ Triggers compatibles : [TRIGGER_LIST]
✅ RLS policies alignées : [POLICY_LIST]

Confirmes-tu cette modification ?
```

#### 4. EXÉCUTION (après confirmation)

- Créer migration `supabase/migrations/YYYYMMDD_NNN_description.sql`
- Tester localement
- Valider 0 console errors
- Déployer

---

## 📚 DOCUMENTATION TECHNIQUE COMPLÈTE

| Document                                 | Contenu                          | Quand Consulter                              |
| ---------------------------------------- | -------------------------------- | -------------------------------------------- |
| [triggers.md](./triggers.md)             | 158 triggers détaillés           | Avant modifier triggers/tables avec triggers |
| [rls-policies.md](./rls-policies.md)     | 217 RLS policies                 | Avant modifier sécurité/permissions          |
| [functions-rpc.md](./functions-rpc.md)   | 254 fonctions RPC                | Avant créer/modifier fonctions               |
| [foreign-keys.md](./foreign-keys.md)     | 100+ relations FK                | Comprendre relations inter-tables            |
| [enums.md](./enums.md)                   | 15+ enums types                  | Avant utiliser/créer enum                    |
| [best-practices.md](./best-practices.md) | Guide complet anti-hallucination | TOUJOURS lire en premier                     |

---

## 🚫 ERREURS HISTORIQUES À NE PLUS RÉPÉTER

### Hallucination #1 - Table `suppliers` (Oct 2025)

- **Créé** : Table suppliers en doublon
- **Existe** : organisations WHERE type='supplier'
- **Impact** : Migration douloureuse, incohérence données
- **Fix** : Migration 20251017_002_drop_obsolete_suppliers_table.sql

### Hallucination #2 - Champ `products.cost_price` (Oct 2025)

- **Ajouté** : products.cost_price
- **Existe** : Système price_lists complet
- **Impact** : Incohérence pricing, confusion
- **Fix** : Migration 20251017_003_remove_cost_price_column.sql

### Hallucination #3 - Champ `products.price_ht` (Oct 2025)

- **Erreur** : Code TypeScript référence `products.price_ht` qui n'existe pas
- **Réalité** : Table products ne contient AUCUN champ prix
- **Existe** : price_list_items.price_ht (système centralisé)
- **Impact** : Queries qui échouent, erreurs runtime
- **Fix Requis** : Supprimer toute référence à `products.price_ht` dans hooks/components

### Hallucination #4 - Triggers stock modifiés sans analyse (Oct 2025)

- **Modifié** : Triggers stock sans comprendre interdépendances
- **Impact** : 12 triggers cassés, stock incohérent
- **Fix** : 8 migrations successives debug

---

## ⚙️ CONNEXION DATABASE

```bash
# Session Pooler (Priorité 1)
PGPASSWORD="ADFVKDJCJDNC934" psql \
  -h aws-1-eu-west-3.pooler.supabase.com \
  -p 5432 \
  -U postgres.aorroydfjsrygmosnzrl \
  -d postgres

# Direct Connection (Fallback)
PGPASSWORD="ADFVKDJCJDNC934" psql \
  -h aws-1-eu-west-3.pooler.supabase.com \
  -p 6543 \
  -U postgres \
  -d postgres
```

**Variables .env.local** :

```
DATABASE_URL=postgresql://postgres.aorroydfjsrygmosnzrl:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

---

## 📊 STATISTIQUES DATABASE

| Métrique                   | Valeur |
| -------------------------- | ------ |
| **Tables**                 | 78     |
| **Colonnes totales**       | 1365   |
| **Moyenne colonnes/table** | 17.5   |
| **Triggers**               | 158    |
| **RLS Policies**           | 239    |
| **Fonctions RPC**          | 254    |
| **Foreign Keys**           | 143    |
| **Enums**                  | 34     |
| **Indexes**                | 200+   |

---

## 🎓 RÈGLES D'OR

1. **UNE source de vérité** : Ce fichier
2. **TOUJOURS chercher avant créer** : CTRL+F dans ce fichier
3. **Réutiliser > Recréer** : Tables existantes ont triggers/RLS
4. **Demander si doute** : NE JAMAIS deviner
5. **organisations pour tout** : Supplier/Customer/Partner
6. **Consulter triggers.md** : Avant toucher products/stock
7. **Documenter immédiatement** : Update docs après migration
8. **Tester localement** : AVANT déployer production

---

**🎉 Source de Vérité Database Vérone**

_Généré le 17 octobre 2025 - Database aorroydfjsrygmosnzrl_
_78 tables | 1365 colonnes | 158 triggers | 217 RLS policies | 254 fonctions_
