# = Foreign Keys - V�rone Database

**Documentation compl�te des relations entre tables** (contraintes d'int�grit� r�f�rentielle).

---

## =� STATISTIQUES GLOBALES

- **Total Foreign Keys** : 85 contraintes
- **Tables Sources** : 52 tables
- **Tables R�f�renc�es** : 27 tables
- **Date Extraction** : 2025-10-17
- **Project** : aorroydfjsrygmosnzrl

---

## =� INDEX PAR TABLE SOURCE

### Tables avec plus de 5 FK (Principales)

1. **financial_documents** (5 FK) � organisations, purchase_orders, sales_orders, expense_categories
2. **financial_document_lines** (4 FK) � financial_documents, expense_categories, products
3. **products** (4 FK) � subcategories, organisations (supplier, assigned_client), variant_groups
4. **price_list_items** (2 FK) � price_lists, products
5. **sales_order_items** (2 FK) � sales_orders, products
6. **purchase_order_items** (2 FK) � purchase_orders, products

### Tables Centrales (Hub)

**Tables les PLUS r�f�renc�es** :

- `products` (16 FK entrants)
- `organisations` (10 FK entrants)
- `sales_orders` (6 FK entrants)
- `purchase_orders` (4 FK entrants)
- `categories` (3 FK entrants)
- `subcategories` (3 FK entrants)

---

## =

FOREIGN KEYS PAR MODULE

### Module Produits & Catalogue

#### Table: **bank_transactions**

| Contrainte                                   | Colonne             | � Table             | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------------- | ------------------- | ------------------- | --------- | --------- | --------- |
| `bank_transactions_matched_document_id_fkey` | matched_document_id | financial_documents | id        | NO ACTION | SET NULL  |

#### Table: **categories**

| Contrainte                  | Colonne   | � Table  | � Colonne | ON UPDATE | ON DELETE |
| --------------------------- | --------- | -------- | --------- | --------- | --------- |
| `categories_family_id_fkey` | family_id | families | id        | NO ACTION | NO ACTION |

� **NO ACTION/NO ACTION** : Emp�che suppression famille si cat�gories li�es

#### Table: **category_translations**

| Contrainte                               | Colonne     | � Table    | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | ----------- | ---------- | --------- | --------- | --------- |
| `category_translations_category_id_fkey` | category_id | categories | id        | NO ACTION | CASCADE   |

 **CASCADE** : Suppression cat�gorie � supprime traductions

#### Table: **collection_images**

| Contrainte                             | Colonne       | � Table     | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------- | ------------- | ----------- | --------- | --------- | --------- |
| `collection_images_collection_id_fkey` | collection_id | collections | id        | NO ACTION | CASCADE   |

#### Table: **collection_products**

| Contrainte                               | Colonne       | � Table     | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | ------------- | ----------- | --------- | --------- | --------- |
| `collection_products_collection_id_fkey` | collection_id | collections | id        | NO ACTION | CASCADE   |
| `collection_products_product_id_fkey`    | product_id    | products    | id        | NO ACTION | CASCADE   |

#### Table: **collection_shares**

| Contrainte                             | Colonne       | � Table     | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------- | ------------- | ----------- | --------- | --------- | --------- |
| `collection_shares_collection_id_fkey` | collection_id | collections | id        | NO ACTION | CASCADE   |

#### Table: **collection_translations**

| Contrainte                                   | Colonne       | � Table     | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------------- | ------------- | ----------- | --------- | --------- | --------- |
| `collection_translations_collection_id_fkey` | collection_id | collections | id        | NO ACTION | CASCADE   |

#### Table: **product_drafts**

| Contrainte                           | Colonne        | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------------ | -------------- | ------------- | --------- | --------- | --------- |
| `product_drafts_category_id_fkey`    | category_id    | categories    | id        | NO ACTION | NO ACTION |
| `product_drafts_family_id_fkey`      | family_id      | families      | id        | NO ACTION | NO ACTION |
| `product_drafts_subcategory_id_fkey` | subcategory_id | subcategories | id        | NO ACTION | NO ACTION |
| `product_drafts_supplier_id_fkey`    | supplier_id    | organisations | id        | NO ACTION | SET NULL  |

� **SET NULL** : Suppression fournisseur � supplier_id devient NULL (orphelin)

#### Table: **product_group_members**

| Contrainte                              | Colonne    | � Table        | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------- | ---------- | -------------- | --------- | --------- | --------- |
| `product_group_members_group_id_fkey`   | group_id   | product_groups | id        | NO ACTION | CASCADE   |
| `product_group_members_product_id_fkey` | product_id | products       | id        | NO ACTION | CASCADE   |

#### Table: **product_groups**

| Contrainte                               | Colonne            | � Table  | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | ------------------ | -------- | --------- | --------- | --------- |
| `product_groups_primary_product_id_fkey` | primary_product_id | products | id        | NO ACTION | SET NULL  |

#### Table: **product_images**

| Contrainte                       | Colonne    | � Table  | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------- | ---------- | -------- | --------- | --------- | --------- |
| `product_images_product_id_fkey` | product_id | products | id        | NO ACTION | CASCADE   |

 **CASCADE** : Suppression produit � supprime toutes images

#### Table: **product_packages**

| Contrainte                         | Colonne    | � Table  | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------- | ---------- | -------- | --------- | --------- | --------- |
| `product_packages_product_id_fkey` | product_id | products | id        | NO ACTION | CASCADE   |

#### Table: **product_status_changes**

| Contrainte                               | Colonne    | � Table  | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | ---------- | -------- | --------- | --------- | --------- |
| `product_status_changes_product_id_fkey` | product_id | products | id        | NO ACTION | CASCADE   |

#### Table: **products** (4 FK)

| Contrainte                         | Colonne            | � Table        | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------- | ------------------ | -------------- | --------- | --------- | --------- |
| `products_assigned_client_id_fkey` | assigned_client_id | organisations  | id        | NO ACTION | SET NULL  |
| `products_subcategory_id_fkey`     | subcategory_id     | subcategories  | id        | NO ACTION | NO ACTION |
| `products_supplier_id_fkey`        | supplier_id        | organisations  | id        | NO ACTION | NO ACTION |
| `fk_products_variant_group`        | variant_group_id   | variant_groups | id        | NO ACTION | SET NULL  |

� **CRITIQUE** :

- Suppression fournisseur BLOQU�E si produits li�s (NO ACTION)
- Suppression subcategory BLOQU�E si produits li�s (NO ACTION)
- assigned_client_id devient NULL si client supprim�

#### Table: **subcategories**

| Contrainte                       | Colonne     | � Table    | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------- | ----------- | ---------- | --------- | --------- | --------- |
| `subcategories_category_id_fkey` | category_id | categories | id        | NO ACTION | CASCADE   |

#### Table: **variant_groups**

| Contrainte                           | Colonne        | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------------ | -------------- | ------------- | --------- | --------- | --------- |
| `variant_groups_subcategory_id_fkey` | subcategory_id | subcategories | id        | NO ACTION | RESTRICT  |
| `variant_groups_supplier_id_fkey`    | supplier_id    | organisations | id        | NO ACTION | SET NULL  |

---

### Module Consultations Clients

#### Table: **consultation_images**

| Contrainte                                 | Colonne         | � Table              | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------------------ | --------------- | -------------------- | --------- | --------- | --------- |
| `consultation_images_consultation_id_fkey` | consultation_id | client_consultations | id        | NO ACTION | CASCADE   |

#### Table: **consultation_products**

| Contrainte                                   | Colonne         | � Table              | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------------- | --------------- | -------------------- | --------- | --------- | --------- |
| `consultation_products_consultation_id_fkey` | consultation_id | client_consultations | id        | NO ACTION | CASCADE   |
| `consultation_products_product_id_fkey`      | product_id      | products             | id        | NO ACTION | CASCADE   |

---

### Module Organisations & Contacts

#### Table: **contacts**

| Contrainte                      | Colonne         | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------- | --------------- | ------------- | --------- | --------- | --------- |
| `contacts_organisation_id_fkey` | organisation_id | organisations | id        | NO ACTION | CASCADE   |

 **CASCADE** : Suppression organisation � supprime tous contacts

#### Table: **organisations**

| Contrainte                              | Colonne            | � Table        | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------- | ------------------ | -------------- | --------- | --------- | --------- |
| `organisations_default_channel_id_fkey` | default_channel_id | sales_channels | id        | NO ACTION | NO ACTION |

---

### Module Pricing & Price Lists

#### Table: **channel_price_lists**

| Contrainte                               | Colonne       | � Table        | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | ------------- | -------------- | --------- | --------- | --------- |
| `channel_price_lists_channel_id_fkey`    | channel_id    | sales_channels | id        | NO ACTION | CASCADE   |
| `channel_price_lists_price_list_id_fkey` | price_list_id | price_lists    | id        | NO ACTION | CASCADE   |

#### Table: **channel_pricing**

| Contrainte                        | Colonne    | � Table        | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------- | ---------- | -------------- | --------- | --------- | --------- |
| `channel_pricing_channel_id_fkey` | channel_id | sales_channels | id        | NO ACTION | CASCADE   |
| `channel_pricing_product_id_fkey` | product_id | products       | id        | NO ACTION | CASCADE   |

#### Table: **customer_group_members**

| Contrainte                             | Colonne  | � Table         | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------- | -------- | --------------- | --------- | --------- | --------- |
| `customer_group_members_group_id_fkey` | group_id | customer_groups | id        | NO ACTION | CASCADE   |

#### Table: **customer_price_lists**

| Contrainte                                | Colonne       | � Table     | � Colonne | ON UPDATE | ON DELETE |
| ----------------------------------------- | ------------- | ----------- | --------- | --------- | --------- |
| `customer_price_lists_price_list_id_fkey` | price_list_id | price_lists | id        | NO ACTION | CASCADE   |

#### Table: **customer_pricing**

| Contrainte                         | Colonne    | � Table  | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------- | ---------- | -------- | --------- | --------- | --------- |
| `customer_pricing_product_id_fkey` | product_id | products | id        | NO ACTION | CASCADE   |

#### Table: **group_price_lists**

| Contrainte                             | Colonne       | � Table         | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------- | ------------- | --------------- | --------- | --------- | --------- |
| `group_price_lists_group_id_fkey`      | group_id      | customer_groups | id        | NO ACTION | CASCADE   |
| `group_price_lists_price_list_id_fkey` | price_list_id | price_lists     | id        | NO ACTION | CASCADE   |

#### Table: **price_list_history**

| Contrainte                                   | Colonne            | � Table          | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------------- | ------------------ | ---------------- | --------- | --------- | --------- |
| `price_list_history_price_list_item_id_fkey` | price_list_item_id | price_list_items | id        | NO ACTION | SET NULL  |

#### Table: **price_list_items**

| Contrainte                            | Colonne       | � Table     | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------------- | ------------- | ----------- | --------- | --------- | --------- |
| `price_list_items_price_list_id_fkey` | price_list_id | price_lists | id        | NO ACTION | CASCADE   |
| `price_list_items_product_id_fkey`    | product_id    | products    | id        | NO ACTION | CASCADE   |

 **CASCADE** : Suppression price_list � supprime tous items

� **ANTI-HALLUCINATION** :

- Prix produit stock�s dans `price_list_items` (PAS dans products.cost_price L)
- Utiliser fonction RPC `calculate_product_price_v2()`

---

### Module Commandes Ventes

#### Table: **invoices**

| Contrainte                     | Colonne        | � Table      | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------ | -------------- | ------------ | --------- | --------- | --------- |
| `invoices_sales_order_id_fkey` | sales_order_id | sales_orders | id        | NO ACTION | RESTRICT  |

� **RESTRICT** : Impossible supprimer sales_order si facture existe

#### Table: **invoice_status_history**

| Contrainte                               | Colonne    | � Table  | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | ---------- | -------- | --------- | --------- | --------- |
| `invoice_status_history_invoice_id_fkey` | invoice_id | invoices | id        | NO ACTION | CASCADE   |

#### Table: **payments**

| Contrainte                 | Colonne    | � Table  | � Colonne | ON UPDATE | ON DELETE |
| -------------------------- | ---------- | -------- | --------- | --------- | --------- |
| `payments_invoice_id_fkey` | invoice_id | invoices | id        | NO ACTION | CASCADE   |

#### Table: **sales_order_items**

| Contrainte                              | Colonne        | � Table      | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------- | -------------- | ------------ | --------- | --------- | --------- |
| `sales_order_items_product_id_fkey`     | product_id     | products     | id        | NO ACTION | CASCADE   |
| `sales_order_items_sales_order_id_fkey` | sales_order_id | sales_orders | id        | NO ACTION | CASCADE   |

#### Table: **sales_orders**

| Contrainte                     | Colonne    | � Table        | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------ | ---------- | -------------- | --------- | --------- | --------- |
| `sales_orders_channel_id_fkey` | channel_id | sales_channels | id        | NO ACTION | NO ACTION |

---

### Module Commandes Achats

#### Table: **purchase_order_items**

| Contrainte                                    | Colonne           | � Table         | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------------- | ----------------- | --------------- | --------- | --------- | --------- |
| `purchase_order_items_product_id_fkey`        | product_id        | products        | id        | NO ACTION | CASCADE   |
| `purchase_order_items_purchase_order_id_fkey` | purchase_order_id | purchase_orders | id        | NO ACTION | CASCADE   |

#### Table: **purchase_order_receptions**

| Contrainte                                         | Colonne           | � Table         | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------------------- | ----------------- | --------------- | --------- | --------- | --------- |
| `purchase_order_receptions_product_id_fkey`        | product_id        | products        | id        | NO ACTION | NO ACTION |
| `purchase_order_receptions_purchase_order_id_fkey` | purchase_order_id | purchase_orders | id        | NO ACTION | CASCADE   |

#### Table: **purchase_orders**

| Contrainte                         | Colonne     | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------- | ----------- | ------------- | --------- | --------- | --------- |
| `purchase_orders_supplier_id_fkey` | supplier_id | organisations | id        | NO ACTION | NO ACTION |

---

### Module �chantillons (Samples)

#### Table: **sample_order_items**

| Contrainte                                | Colonne         | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ----------------------------------------- | --------------- | ------------- | --------- | --------- | --------- |
| `sample_order_items_sample_order_id_fkey` | sample_order_id | sample_orders | id        | NO ACTION | CASCADE   |

#### Table: **sample_orders**

| Contrainte                       | Colonne     | � Table       | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------- | ----------- | ------------- | --------- | --------- | --------- |
| `sample_orders_supplier_id_fkey` | supplier_id | organisations | id        | NO ACTION | SET NULL  |

---

### Module Stock & Logistique

#### Table: **stock_movements**

| Contrainte                        | Colonne      | � Table       | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------- | ------------ | ------------- | --------- | --------- | --------- |
| `fk_stock_movements_performed_by` | performed_by | user_profiles | user_id   | NO ACTION | SET NULL  |
| `fk_stock_movements_product_id`   | product_id   | products      | id        | NO ACTION | CASCADE   |

� **CRITIQUE** :

- Suppression produit � supprime historique stock (CASCADE) �
- Suppression user � performed_by devient NULL (tra�abilit� perdue)

#### Table: **shipments**

| Contrainte                      | Colonne        | � Table      | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------- | -------------- | ------------ | --------- | --------- | --------- |
| `shipments_sales_order_id_fkey` | sales_order_id | sales_orders | id        | NO ACTION | CASCADE   |

#### Table: **shipping_parcels**

| Contrainte                          | Colonne     | � Table   | � Colonne | ON UPDATE | ON DELETE |
| ----------------------------------- | ----------- | --------- | --------- | --------- | --------- |
| `shipping_parcels_shipment_id_fkey` | shipment_id | shipments | id        | NO ACTION | CASCADE   |

#### Table: **parcel_items**

| Contrainte                              | Colonne             | � Table           | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------- | ------------------- | ----------------- | --------- | --------- | --------- |
| `parcel_items_parcel_id_fkey`           | parcel_id           | shipping_parcels  | id        | NO ACTION | CASCADE   |
| `parcel_items_sales_order_item_id_fkey` | sales_order_item_id | sales_order_items | id        | NO ACTION | CASCADE   |

---

### Module Finance & Comptabilit�

#### Table: **financial_documents** (5 FK)

| Contrainte                                     | Colonne             | � Table            | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------------- | ------------------- | ------------------ | --------- | --------- | --------- |
| `financial_documents_expense_category_id_fkey` | expense_category_id | expense_categories | id        | NO ACTION | SET NULL  |
| `financial_documents_partner_id_fkey`          | partner_id          | organisations      | id        | NO ACTION | RESTRICT  |
| `financial_documents_purchase_order_id_fkey`   | purchase_order_id   | purchase_orders    | id        | NO ACTION | RESTRICT  |
| `financial_documents_sales_order_id_fkey`      | sales_order_id      | sales_orders       | id        | NO ACTION | RESTRICT  |

� **RESTRICT** : Impossible supprimer commande/partenaire si document financier existe

#### Table: **financial_document_lines** (4 FK)

| Contrainte                                          | Colonne             | � Table             | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------------------- | ------------------- | ------------------- | --------- | --------- | --------- |
| `financial_document_lines_document_id_fkey`         | document_id         | financial_documents | id        | NO ACTION | CASCADE   |
| `financial_document_lines_expense_category_id_fkey` | expense_category_id | expense_categories  | id        | NO ACTION | SET NULL  |
| `financial_document_lines_product_id_fkey`          | product_id          | products            | id        | NO ACTION | SET NULL  |

#### Table: **financial_payments**

| Contrainte                                    | Colonne             | � Table             | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------------------- | ------------------- | ------------------- | --------- | --------- | --------- |
| `financial_payments_bank_transaction_id_fkey` | bank_transaction_id | bank_transactions   | id        | NO ACTION | SET NULL  |
| `financial_payments_document_id_fkey`         | document_id         | financial_documents | id        | NO ACTION | CASCADE   |

#### Table: **expense_categories**

| Contrainte                                   | Colonne            | � Table            | � Colonne | ON UPDATE | ON DELETE |
| -------------------------------------------- | ------------------ | ------------------ | --------- | --------- | --------- |
| `expense_categories_parent_category_id_fkey` | parent_category_id | expense_categories | id        | NO ACTION | SET NULL  |

 **Hi�rarchie r�cursive** : Cat�gories de d�penses avec parent/enfant

---

### Module Feeds & Exports

#### Table: **feed_configs**

Aucune FK

#### Table: **feed_exports**

| Contrainte                         | Colonne        | � Table      | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------- | -------------- | ------------ | --------- | --------- | --------- |
| `feed_exports_feed_config_id_fkey` | feed_config_id | feed_configs | id        | NO ACTION | CASCADE   |

#### Table: **feed_performance_metrics**

| Contrainte                                     | Colonne        | � Table      | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------------- | -------------- | ------------ | --------- | --------- | --------- |
| `feed_performance_metrics_feed_config_id_fkey` | feed_config_id | feed_configs | id        | NO ACTION | CASCADE   |

---

### Module Erreurs & Tests

#### Table: **error_notifications_queue**

| Contrainte                                | Colonne  | � Table          | � Colonne | ON UPDATE | ON DELETE |
| ----------------------------------------- | -------- | ---------------- | --------- | --------- | --------- |
| `error_notifications_queue_error_id_fkey` | error_id | error_reports_v2 | id        | NO ACTION | CASCADE   |

#### Table: **error_reports_v2**

| Contrainte                      | Colonne | � Table               | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------- | ------- | --------------------- | --------- | --------- | --------- |
| `error_reports_v2_test_id_fkey` | test_id | manual_tests_progress | id        | NO ACTION | SET NULL  |

#### Table: **error_resolution_history**

| Contrainte                               | Colonne  | � Table          | � Colonne | ON UPDATE | ON DELETE |
| ---------------------------------------- | -------- | ---------------- | --------- | --------- | --------- |
| `error_resolution_history_error_id_fkey` | error_id | error_reports_v2 | id        | NO ACTION | CASCADE   |

#### Table: **mcp_resolution_queue**

| Contrainte                                  | Colonne         | � Table          | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------------------- | --------------- | ---------------- | --------- | --------- | --------- |
| `mcp_resolution_queue_error_report_id_fkey` | error_report_id | error_reports_v2 | id        | NO ACTION | CASCADE   |

#### Table: **test_error_reports**

| Contrainte                        | Colonne | � Table               | � Colonne | ON UPDATE | ON DELETE |
| --------------------------------- | ------- | --------------------- | --------- | --------- | --------- |
| `test_error_reports_test_id_fkey` | test_id | manual_tests_progress | test_id   | NO ACTION | CASCADE   |

---

### Module Utilisateurs & Activit�

#### Table: **user_activity_logs**

| Contrainte                                | Colonne         | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ----------------------------------------- | --------------- | ------------- | --------- | --------- | --------- |
| `user_activity_logs_organisation_id_fkey` | organisation_id | organisations | id        | NO ACTION | SET NULL  |
| `user_activity_logs_user_id_fkey`         | user_id         | user_profiles | user_id   | NO ACTION | CASCADE   |

#### Table: **user_sessions**

| Contrainte                           | Colonne         | � Table       | � Colonne | ON UPDATE | ON DELETE |
| ------------------------------------ | --------------- | ------------- | --------- | --------- | --------- |
| `user_sessions_organisation_id_fkey` | organisation_id | organisations | id        | NO ACTION | SET NULL  |
| `user_sessions_user_id_fkey`         | user_id         | user_profiles | user_id   | NO ACTION | CASCADE   |

---

## =� DIAGRAMME RELATIONS PRINCIPALES

### Hi�rarchie Catalogue

```
families
  � (CASCADE)
categories
  � (CASCADE)
subcategories
  � (NO ACTION - prot�g�)
products
  � (CASCADE)
product_images, product_packages, product_status_changes
```

### Workflow Commande Vente

```
sales_channels
  �
sales_orders (NO ACTION - prot�g�)
  � (CASCADE)
sales_order_items
  � (CASCADE)
shipments � shipping_parcels � parcel_items
  � (RESTRICT - bloqu�)
invoices
  � (CASCADE)
invoice_status_history, payments
```

### Workflow Commande Achat

```
organisations (type='supplier')
  � (NO ACTION - prot�g�)
purchase_orders
  � (CASCADE)
purchase_order_items
  � (CASCADE)
purchase_order_receptions
  � (RESTRICT - bloqu�)
financial_documents (type='supplier_invoice')
```

### Syst�me Pricing (Multi-Canal)

```
products
  � (CASCADE)
price_list_items
  �
price_lists
  � (CASCADE)
channel_price_lists, customer_price_lists, group_price_lists
```

### Stock & Mouvements

```
products
  � (CASCADE)
stock_movements
  � (trigger)
products.stock_real, stock_forecasted_in, stock_forecasted_out
```

---

## � POINTS CRITIQUES & PI�GES

### =� CASCADE DESTRUCTEURS

**Suppressions en cascade** � surveiller :

1. **products � stock_movements** (CASCADE)
   - � Supprimer produit = perte historique stock complet
   -  Utiliser soft delete (is_active=false) � la place

2. **financial_documents � financial_document_lines** (CASCADE)
   - � Supprimer document = perte lignes comptables
   -  Soft delete obligatoire

3. **collections � collection_products** (CASCADE)
   - � Supprimer collection = perte associations produits
   -  Archive recommand�e

### = RESTRICT/NO ACTION BLOQUANTS

**Suppressions IMPOSSIBLES** si enfants existent :

1. **sales_orders** RESTRICT si :
   - `invoices` existe
   - `financial_documents` existe

2. **purchase_orders** RESTRICT si :
   - `financial_documents` existe

3. **organisations (supplier)** NO ACTION si :
   - `products.supplier_id` r�f�rence
   - `purchase_orders` existe

4. **subcategories** NO ACTION si :
   - `products` existe
   - `variant_groups` existe (RESTRICT)

### � SET NULL DANGEREUX

**Perte de tra�abilit�** :

1. **stock_movements.performed_by** � NULL si user supprim�
   - � Impossible savoir qui a fait le mouvement
   -  Conserver user_profiles en soft delete

2. **products.assigned_client_id** � NULL si client supprim�
   - � Perte affectation client
   -  Archive client recommand�e

3. **financial_documents.expense_category_id** � NULL
   - � Perte cat�gorisation comptable
   -  Soft delete category obligatoire

---

## =� BEST PRACTICES

###  Suppression S�curis�e

**TOUJOURS utiliser soft delete** pour :

- `products` (is_active=false)
- `organisations` (is_active=false)
- `sales_orders`, `purchase_orders` (status='cancelled')
- `financial_documents` (status='cancelled')
- `user_profiles` (is_active=false)

###  V�rification Avant Suppression

```sql
-- Exemple: V�rifier si organisation peut �tre supprim�e
SELECT
  COUNT(*) AS blocking_products
FROM products
WHERE supplier_id = 'org_uuid_here';

SELECT
  COUNT(*) AS blocking_purchase_orders
FROM purchase_orders
WHERE supplier_id = 'org_uuid_here';

-- Si COUNT > 0 � Bloquer suppression
```

###  Migration Orphelins

```sql
-- Exemple: Nettoyer orphelins avant ajout FK
-- 1. Identifier orphelins
SELECT id, supplier_id
FROM products
WHERE supplier_id NOT IN (SELECT id FROM organisations);

-- 2. D�cision: SET NULL ou DELETE
UPDATE products SET supplier_id = NULL WHERE supplier_id NOT IN (...);

-- 3. Ajouter FK
ALTER TABLE products
ADD CONSTRAINT products_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES organisations(id)
ON DELETE NO ACTION;
```

---

## =� TEMPLATE AJOUT FK

```sql
-- Migration: 20251017_001_add_fk_constraint.sql

-- �tape 1: Nettoyer donn�es orphelines
UPDATE child_table
SET parent_id = NULL
WHERE parent_id NOT IN (SELECT id FROM parent_table);

-- �tape 2: Ajouter contrainte
ALTER TABLE child_table
ADD CONSTRAINT child_table_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES parent_table(id)
ON UPDATE NO ACTION      -- Ou CASCADE si propagation update souhait�e
ON DELETE SET NULL;      -- Ou CASCADE, RESTRICT, NO ACTION selon besoin

-- �tape 3: Cr�er index pour performance
CREATE INDEX idx_child_table_parent_id ON child_table(parent_id);

-- �tape 4: Valider
SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'child_table';
```

---

## = LIENS CONNEXES

- **Tables** : [SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md)
- **Enums** : [enums.md](./enums.md)
- **Triggers** : [triggers.md](./triggers.md)
- **RLS Policies** : [rls-policies.md](./rls-policies.md)
- **Functions** : [functions-rpc.md](./functions-rpc.md)

---

**Documentation g�n�r�e** : 2025-10-17
**Source** : PostgreSQL Database `aorroydfjsrygmosnzrl`
**Extraction** : MCP Supabase + Bash PostgreSQL
**V�rone Back Office** - Database Documentation v2.0
